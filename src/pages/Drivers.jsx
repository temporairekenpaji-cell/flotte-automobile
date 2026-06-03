import { useEffect, useState } from 'react'
import { FiPlus, FiSearch, FiTrash2, FiEdit2, FiX } from 'react-icons/fi'
import DataTable from '../components/DataTable'
import { getDrivers, createDriver, updateDriver, deleteDriver } from '../services/drivers'
import { useFetch } from '../hooks/useFetch'

const initialDriver = { name: '', license_number: '', phone: '', status: 'active' }

export default function Drivers() {
  const [drivers, setDrivers] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [form, setForm] = useState(initialDriver)
  const [selectedDriver, setSelectedDriver] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [message, setMessage] = useState(null)
  const [messageType, setMessageType] = useState('success')
  const { error, run } = useFetch()

  const loadDrivers = async () => {
    const response = await run(getDrivers({ search: search || undefined }))
    setDrivers(response.results || response)
  }

  useEffect(() => {
    loadDrivers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const showMsg = (msg, type = 'success') => {
    setMessage(msg)
    setMessageType(type)
    setTimeout(() => setMessage(null), 3000)
  }

  const openCreate = () => {
    setSelectedDriver(null)
    setForm(initialDriver)
    setModalOpen(true)
  }

  const openEdit = (driver) => {
    setSelectedDriver(driver)
    setForm({
      name: driver.name || '',
      license_number: driver.license_number || '',
      phone: driver.phone || '',
      status: driver.status || 'active',
    })
    setModalOpen(true)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    try {
      const payload = {
        ...form,
        phone: form.phone || null,
      }
      if (selectedDriver) {
        await run(updateDriver(selectedDriver.id, payload))
        showMsg('Chauffeur mis à jour avec succès.')
      } else {
        await run(createDriver(payload))
        showMsg('Chauffeur ajouté avec succès.')
      }
      setForm(initialDriver)
      setSelectedDriver(null)
      setModalOpen(false)
      loadDrivers()
    } catch (_) {
      showMsg('Impossible de sauvegarder le chauffeur.', 'error')
    }
  }

  const handleDelete = async (driver) => {
    if (!window.confirm(`Supprimer ${driver.name} ?`)) {
      return
    }
    try {
      await run(deleteDriver(driver.id))
      showMsg('Chauffeur supprimé.')
      loadDrivers()
    } catch (_) {
      showMsg('Impossible de supprimer le chauffeur.', 'error')
    }
  }

  const filteredDrivers = drivers.filter(d => {
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter
    const s = search.toLowerCase()
    const matchesSearch = !search || 
      (d.name || '').toLowerCase().includes(s) ||
      (d.license_number || '').toLowerCase().includes(s) ||
      (d.phone || '').toLowerCase().includes(s)
    return matchesStatus && matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Chauffeurs</h1>
          <p className="text-sm text-slate-400 mt-1">Gestion et suivi des pilotes de votre parc</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition shadow-lg shadow-emerald-600/20">
          <FiPlus className="h-4 w-4" /> Ajouter un chauffeur
        </button>
      </div>

      {message && (
        <div className={`rounded-2xl px-5 py-3 text-sm font-medium ${messageType === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
          {message}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs uppercase tracking-wider text-slate-500">Chauffeurs totaux</p>
          <p className="text-2xl font-bold text-white mt-1">{drivers.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs uppercase tracking-wider text-slate-500">Chauffeurs actifs</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{drivers.filter(d => d.status === 'active').length}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs uppercase tracking-wider text-slate-500">Suspendus / Inactifs</p>
          <p className="text-2xl font-bold text-rose-400 mt-1">{drivers.filter(d => d.status !== 'active').length}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="relative sm:col-span-3">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par nom, numéro de permis, téléphone..." className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none transition" />
        </div>
        <div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-white focus:border-emerald-500 focus:outline-none transition">
            <option value="all">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
            <option value="suspended">Suspendu</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                <th className="px-5 py-4">Nom complet</th>
                <th className="px-5 py-4">Numéro de permis</th>
                <th className="px-5 py-4">Téléphone</th>
                <th className="px-5 py-4">Statut</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredDrivers.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-500">Aucun chauffeur trouvé</td></tr>
              ) : filteredDrivers.map(driver => {
                const statusColors = {
                  active: 'bg-emerald-500/10 text-emerald-400',
                  inactive: 'bg-slate-500/10 text-slate-400',
                  suspended: 'bg-rose-500/10 text-rose-400',
                }
                const statusLabels = {
                  active: 'Actif',
                  inactive: 'Inactif',
                  suspended: 'Suspendu',
                }
                return (
                  <tr key={driver.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-5 py-4 font-medium text-white">{driver.name}</td>
                    <td className="px-5 py-4 text-slate-300">{driver.license_number}</td>
                    <td className="px-5 py-4 text-slate-300">{driver.phone || '—'}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColors[driver.status] || 'bg-slate-500/10 text-slate-400'}`}>
                        {statusLabels[driver.status] || driver.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(driver)} className="rounded-xl p-2 hover:bg-slate-700 transition text-slate-400 hover:text-white"><FiEdit2 className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(driver)} className="rounded-xl p-2 hover:bg-slate-700 transition text-slate-400 hover:text-rose-400"><FiTrash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal — même style que Péages */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">{selectedDriver ? 'Modifier le chauffeur' : 'Nouveau chauffeur'}</h2>
              <button onClick={() => setModalOpen(false)} className="rounded-xl p-2 hover:bg-slate-800 transition text-slate-400"><FiX className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Nom complet *</label>
                <input required name="name" value={form.name} onChange={handleChange} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Numéro de permis *</label>
                <input required name="license_number" value={form.license_number} onChange={handleChange} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Téléphone</label>
                <input name="phone" value={form.phone} onChange={handleChange} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Statut</label>
                <select name="status" value={form.status} onChange={handleChange} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none">
                  <option value="active">Actif</option>
                  <option value="inactive">Inactif</option>
                  <option value="suspended">Suspendu</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="rounded-2xl border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition">Annuler</button>
                <button type="submit" className="rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white transition shadow-lg shadow-emerald-600/20">{selectedDriver ? 'Modifier' : 'Ajouter'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
