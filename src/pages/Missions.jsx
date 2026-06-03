import { useEffect, useState } from 'react'
import { FiPlus, FiMapPin, FiTruck, FiUser, FiCalendar, FiEdit2, FiTrash2, FiClock, FiSearch, FiX } from 'react-icons/fi'
import DataTable from '../components/DataTable'
import { getMissions, createMission, updateMission, deleteMission } from '../services/missions'
import { getDrivers } from '../services/drivers'
import { getVehicles } from '../services/vehicles'
import { useFetch } from '../hooks/useFetch'

const initialMission = {
  reference: '',
  driver: '',
  vehicle: '',
  destination: '',
  departure_date: '',
  return_date: '',
  departure_time: '',
  arrival_planned_time: '',
  arrival_actual_time: '',
  status: 'pending',
}

export default function Missions() {
  const [missions, setMissions] = useState([])
  const [drivers, setDrivers] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [form, setForm] = useState(initialMission)
  const [modalOpen, setModalOpen] = useState(false)
  const [message, setMessage] = useState(null)
  const [messageType, setMessageType] = useState('success')
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const { loading, error, run } = useFetch()

  const loadData = async () => {
    const missionResult = await run(getMissions({ limit: 100 }))
    const driverResult = await run(getDrivers({ limit: 100 }))
    const vehicleResult = await run(getVehicles({ limit: 100 }))
    setMissions(missionResult.results || missionResult)
    setDrivers(driverResult.results || driverResult)
    setVehicles(vehicleResult.results || vehicleResult)
  }

  useEffect(() => {
    loadData()
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
    setEditingId(null)
    setForm(initialMission)
    setModalOpen(true)
  }

  const openEdit = (item) => {
    setForm({
      reference: item.reference || '',
      driver: item.driver || '',
      vehicle: item.vehicle || '',
      destination: item.destination || '',
      departure_date: item.departure_date || '',
      return_date: item.return_date || '',
      departure_time: item.departure_time ? item.departure_time.slice(0, 5) : '',
      arrival_planned_time: item.arrival_planned_time ? item.arrival_planned_time.slice(0, 5) : '',
      arrival_actual_time: item.arrival_actual_time ? item.arrival_actual_time.slice(0, 5) : '',
      status: item.status || 'pending',
    })
    setEditingId(item.id)
    setModalOpen(true)
  }

  const handleDelete = async (item) => {
    if (window.confirm("Voulez-vous vraiment supprimer cette mission ?")) {
      try {
        await run(deleteMission(item.id))
        showMsg('Mission supprimée.')
        loadData()
      } catch (err) {
        showMsg("Erreur lors de la suppression.", 'error')
      }
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    try {
      const payload = {
        ...form,
        departure_date: form.departure_date || null,
        return_date: form.return_date || null,
        departure_time: form.departure_time || null,
        arrival_planned_time: form.arrival_planned_time || null,
        arrival_actual_time: form.arrival_actual_time || null,
      }
      if (editingId) {
        await run(updateMission(editingId, payload))
        showMsg('Mission modifiée avec succès.')
      } else {
        await run(createMission(payload))
        showMsg('Mission créée avec succès.')
      }
      setForm(initialMission)
      setModalOpen(false)
      setEditingId(null)
      loadData()
    } catch (err) {
      showMsg("Erreur lors de l'enregistrement de la mission.", 'error')
    }
  }

  const filteredMissions = missions.filter(m => {
    if (!search) return true
    const s = search.toLowerCase()
    return (
      (m.reference || '').toLowerCase().includes(s) ||
      (m.destination || '').toLowerCase().includes(s) ||
      (m.driver_name || '').toLowerCase().includes(s) ||
      (m.vehicle_plate || '').toLowerCase().includes(s)
    )
  })

  const activeMissions = missions.filter(m => m.status === 'in_progress' || m.status === 'en_cours').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Missions</h1>
          <p className="text-sm text-slate-400 mt-1">Planification et suivi logistique</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition shadow-lg shadow-emerald-600/20">
          <FiPlus className="h-4 w-4" /> Nouvelle mission
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
          <p className="text-xs uppercase tracking-wider text-slate-500">Total missions</p>
          <p className="text-2xl font-bold text-white mt-1">{missions.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs uppercase tracking-wider text-slate-500">Missions actives</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{activeMissions}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs uppercase tracking-wider text-slate-500">Terminées</p>
          <p className="text-2xl font-bold text-sky-400 mt-1">{missions.filter(m => m.status === 'completed' || m.status === 'terminee').length}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par référence, destination, chauffeur, véhicule..." className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none transition" />
      </div>

      {/* Table */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                <th className="px-5 py-4">Référence</th>
                <th className="px-5 py-4">Chauffeur</th>
                <th className="px-5 py-4">Véhicule</th>
                <th className="px-5 py-4">Destination</th>
                <th className="px-5 py-4">Départ</th>
                <th className="px-5 py-4">Durée</th>
                <th className="px-5 py-4">Statut</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredMissions.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-slate-500">Aucune mission enregistrée</td></tr>
              ) : filteredMissions.map(m => {
                const statusColors = {
                  pending: 'bg-amber-500/10 text-amber-400',
                  in_progress: 'bg-blue-500/10 text-blue-400',
                  en_cours: 'bg-blue-500/10 text-blue-400',
                  completed: 'bg-emerald-500/10 text-emerald-400',
                  terminee: 'bg-emerald-500/10 text-emerald-400',
                  cancelled: 'bg-rose-500/10 text-rose-400',
                }
                const statusLabels = {
                  pending: 'En attente',
                  in_progress: 'En cours',
                  en_cours: 'En cours',
                  completed: 'Terminée',
                  terminee: 'Terminée',
                  cancelled: 'Annulée',
                }
                return (
                  <tr key={m.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-5 py-4 font-medium text-white">{m.reference}</td>
                    <td className="px-5 py-4 text-slate-300">{m.driver_name || m.driver || '—'}</td>
                    <td className="px-5 py-4 text-slate-300">{m.vehicle_plate || m.vehicle || '—'}</td>
                    <td className="px-5 py-4 text-slate-300">{m.destination}</td>
                    <td className="px-5 py-4 text-slate-400">{m.departure_date}{m.departure_time ? ` ${m.departure_time.slice(0,5)}` : ''}</td>
                    <td className="px-5 py-4 text-slate-400">{m.duree_mission != null ? `${m.duree_mission}h` : '—'}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColors[m.status] || 'bg-slate-500/10 text-slate-400'}`}>
                        {statusLabels[m.status] || m.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(m)} className="rounded-xl p-2 hover:bg-slate-700 transition text-slate-400 hover:text-white"><FiEdit2 className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(m)} className="rounded-xl p-2 hover:bg-slate-700 transition text-slate-400 hover:text-rose-400"><FiTrash2 className="h-4 w-4" /></button>
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
          <div className="w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-900 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">{editingId ? 'Modifier la mission' : 'Nouvelle mission'}</h2>
              <button onClick={() => setModalOpen(false)} className="rounded-xl p-2 hover:bg-slate-800 transition text-slate-400"><FiX className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Référence *</label>
                  <input required name="reference" value={form.reference} onChange={handleChange} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Destination *</label>
                  <input required name="destination" value={form.destination} onChange={handleChange} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Chauffeur *</label>
                  <select required name="driver" value={form.driver} onChange={handleChange} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none">
                    <option value="">Sélectionner</option>
                    {drivers.map(d => <option key={d.id} value={d.id}>{d.name || d.nom}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Véhicule *</label>
                  <select required name="vehicle" value={form.vehicle} onChange={handleChange} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none">
                    <option value="">Sélectionner</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.registration || v.immatriculation}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Date de départ *</label>
                  <input required type="date" name="departure_date" value={form.departure_date} onChange={handleChange} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Heure de départ</label>
                  <input type="time" name="departure_time" value={form.departure_time} onChange={handleChange} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Date de retour prévue</label>
                  <input type="date" name="return_date" value={form.return_date} onChange={handleChange} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Heure d'arrivée prévue</label>
                  <input type="time" name="arrival_planned_time" value={form.arrival_planned_time} onChange={handleChange} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Heure d'arrivée réelle</label>
                  <input type="time" name="arrival_actual_time" value={form.arrival_actual_time} onChange={handleChange} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Statut</label>
                  <select name="status" value={form.status} onChange={handleChange} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none">
                    <option value="pending">En attente</option>
                    <option value="in_progress">En cours</option>
                    <option value="completed">Terminée</option>
                    <option value="cancelled">Annulée</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="rounded-2xl border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition">Annuler</button>
                <button type="submit" className="rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white transition shadow-lg shadow-emerald-600/20">{editingId ? 'Modifier' : 'Créer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
