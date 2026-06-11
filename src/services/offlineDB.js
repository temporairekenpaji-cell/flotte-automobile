// ─── offlineDB.js ─────────────────────────────────────────────────────────────
// Wrapper léger autour de l'API IndexedDB native du navigateur.
// Deux object stores :
//   fleet_data_cache  → données lues depuis l'API (clé = URL de l'endpoint)
//   fleet_pending_ops → file d'attente des mutations hors ligne
// ──────────────────────────────────────────────────────────────────────────────

const DB_NAME = 'fleet_offline_db'
const DB_VERSION = 1
const CACHE_STORE = 'fleet_data_cache'
const QUEUE_STORE = 'fleet_pending_ops'

let _db = null

function openDB() {
  if (_db) return Promise.resolve(_db)
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(CACHE_STORE)) {
        db.createObjectStore(CACHE_STORE, { keyPath: 'url' })
      }
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        const qs = db.createObjectStore(QUEUE_STORE, { keyPath: 'id', autoIncrement: true })
        qs.createIndex('createdAt', 'createdAt', { unique: false })
      }
    }
    req.onsuccess = (e) => { _db = e.target.result; resolve(_db) }
    req.onerror = (e) => { console.error('[OfflineDB] open error', e.target.error); reject(e.target.error) }
  })
}

// ─── Cache (données lues) ──────────────────────────────────────────────────────

export async function cacheGet(url) {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(CACHE_STORE, 'readonly')
      const req = tx.objectStore(CACHE_STORE).get(url)
      req.onsuccess = () => resolve(req.result?.data ?? null)
      req.onerror = () => reject(req.error)
    })
  } catch { return null }
}

export async function cachePut(url, data) {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(CACHE_STORE, 'readwrite')
      const req = tx.objectStore(CACHE_STORE).put({ url, data, cachedAt: Date.now() })
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  } catch (err) { console.error('[OfflineDB] cachePut error', err) }
}

// ─── Queue (mutations hors ligne) ──────────────────────────────────────────────

export async function queueAdd(operation) {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(QUEUE_STORE, 'readwrite')
      const req = tx.objectStore(QUEUE_STORE).add({ ...operation, createdAt: Date.now() })
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  } catch (err) { console.error('[OfflineDB] queueAdd error', err); return null }
}

export async function queueGetAll() {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(QUEUE_STORE, 'readonly')
      const req = tx.objectStore(QUEUE_STORE).index('createdAt').getAll()
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  } catch { return [] }
}

export async function queueDelete(id) {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(QUEUE_STORE, 'readwrite')
      const req = tx.objectStore(QUEUE_STORE).delete(id)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  } catch (err) { console.error('[OfflineDB] queueDelete error', err) }
}

export async function queueCount() {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(QUEUE_STORE, 'readonly')
      const req = tx.objectStore(QUEUE_STORE).count()
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  } catch { return 0 }
}

export async function updateCacheWithMutation(method, url, data) {
  try {
    const db = await openDB()
    const parts = url.split('/').filter(Boolean)
    if (parts.length === 0) return

    // Ignorer les actions et endpoints spéciaux
    const lastPart = parts[parts.length - 1]
    if (['renew', 'login', 'token', 'me'].includes(lastPart)) return

    let collectionPath = url
    let itemId = null

    // Déterminer l'ID de la ressource si applicable
    if (parts.length >= 2 && ['PUT', 'PATCH', 'DELETE'].includes(method)) {
      itemId = lastPart
      if (/^\d+$/.test(itemId)) {
        itemId = parseInt(itemId, 10)
      }
      collectionPath = '/' + parts.slice(0, -1).join('/') + '/'
    } else {
      collectionPath = '/' + parts.join('/') + '/'
    }

    if (!collectionPath.endsWith('/')) collectionPath += '/'
    if (!collectionPath.startsWith('/')) collectionPath = '/' + collectionPath

    const tx = db.transaction(CACHE_STORE, 'readwrite')
    const store = tx.objectStore(CACHE_STORE)

    return new Promise((resolve) => {
      const request = store.openCursor()
      request.onsuccess = (e) => {
        const cursor = e.target.result
        if (cursor) {
          const cacheKey = cursor.value.url
          // Vérifier si cette clé de cache appartient à notre collection (ex: commence par /vehicles/)
          if (cacheKey.startsWith(collectionPath)) {
            let cacheData = cursor.value.data
            let updated = false
            let list = []
            let isPaginated = false

            if (Array.isArray(cacheData)) {
              list = cacheData
            } else if (cacheData && Array.isArray(cacheData.results)) {
              list = cacheData.results
              isPaginated = true
            }

            if (method === 'POST') {
              let matchesFilters = true
              if (cacheKey.includes('?')) {
                try {
                  const qs = new URL(cacheKey, 'http://localhost').searchParams
                  for (const [key, val] of qs.entries()) {
                    if (['limit', 'offset', 'page', 'search', 'ordering'].includes(key)) continue
                    if (data && data[key] !== undefined && String(data[key]) !== String(val)) {
                      matchesFilters = false
                      break
                    }
                  }
                } catch {
                  matchesFilters = true
                }
              }

              if (matchesFilters) {
                const newId = 'temp_' + Date.now()
                const newItem = { id: newId, ...data }
                list = [newItem, ...list]
                updated = true
              }
            } else if (method === 'PUT' || method === 'PATCH') {
              const idx = list.findIndex(item => item.id === itemId)
              if (idx !== -1) {
                list[idx] = { ...list[idx], ...data }
                updated = true
              }
            } else if (method === 'DELETE') {
              const idx = list.findIndex(item => item.id === itemId)
              if (idx !== -1) {
                list.splice(idx, 1)
                updated = true
              }
            }

            if (updated) {
              const updatedCache = isPaginated
                ? {
                    ...cacheData,
                    results: list,
                    count: (cacheData.count || 0) + (method === 'POST' ? 1 : method === 'DELETE' ? -1 : 0)
                  }
                : list
              cursor.update({ url: cacheKey, data: updatedCache, cachedAt: Date.now() })
              console.log(`[OfflineDB] Cache optimiste mis à jour pour : ${cacheKey}`)
            }
          }
          cursor.continue()
        } else {
          resolve()
        }
      }
      request.onerror = () => resolve()
    })
  } catch (err) {
    console.error('[OfflineDB] updateCacheWithMutation error', err)
  }
}

