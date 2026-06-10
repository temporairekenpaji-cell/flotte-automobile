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
