import { useEffect, useState } from 'react'
import { FiPlus, FiSearch, FiTrash2, FiEdit2, FiDollarSign, FiTruck, FiMapPin, FiClock, FiDownload, FiPaperclip, FiX } from 'react-icons/fi'
import { getTolls, createToll, updateToll, deleteToll } from '../services/tolls'
import { useFetch } from '../hooks/useFetch'
import api from '../services/api'

const paymentStatusMap = { paye: 'Payé', en_attente: 'En attente', rembourse: 'Remboursé' }
const paymentMethodOptions = ['Espèces', 'Carte bancaire', 'Prépayé', 'Badge', 'Mobile Money', 'Autre']

export default function Tolls() {
  const [tolls, setTolls] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers] = useState([])
  const [missions, setMissions] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [message, setMessage] = useState(null)
  const [messageType, setMessageType] = useState('success')
  const { run } = useFetch()

  const [form, setForm] = useState({
    vehicule: '', chauffeur: '', mission: '', poste_peage: '', ville: '',
    montant: '', date: '', heure: '', moyen_paiement: 'Espèces',
    statut_paiement: 'paye', observation: '', justificatif: null
  })

  const fetchTolls = async () => {
    try {
      const res = await run(getTolls({ search: search || undefined, statut_paiement: statusFilter !== 'all' ? statusFilter : undefined }))
      setTolls(res.results || res)
    } catch { /* silently fail */ }
  }

  const fetchDeps = async () => {
    try {
      const [v, d, m] = await Promise.all([
        api.get('/vehicles/'), api.get('/drivers/'), api.get('/missions/')
      ])
      setVehicles(v.data.results || v.data)
      setDrivers(d.data.results || d.data)
      setMissions(m.data.results || m.data)
    } catch { /* silently fail */ }
  }

  useEffect(() => { fetchDeps() }, [])
  useEffect(() => { fetchTolls() }, [search, statusFilter])

  const showMsg = (msg, type = 'success') => { setMessage(msg); setMessageType(type); setTimeout(() => setMessage(null), 3000) }

  const openCreate = () => {
    setEditItem(null)
    setForm({ vehicule: '', chauffeur: '', mission: '', poste_peage: '', ville: '', montant: '', date: '', heure: '', moyen_paiement: 'Espèces', statut_paiement: 'paye', observation: '', justificatif: null })
    setModalOpen(true)
  }

  const openEdit = (item) => {
    setEditItem(item)
    setForm({
      vehicule: item.vehicule, chauffeur: item.chauffeur, mission: item.mission || '',
      poste_peage: item.poste_peage, ville: item.ville, montant: item.montant,
      date: item.date, heure: item.heure, moyen_paiement: item.moyen_paiement,
      statut_paiement: item.statut_paiement, observation: item.observation || '', justificatif: null
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => {
      if (k === 'justificatif') { if (v) fd.append(k, v) }
      else if (k === 'mission') { if (v) fd.append(k, v) }
      else fd.append(k, v)
    })
    try {
      if (editItem) { await run(updateToll(editItem.id, fd)) }
      else { await run(createToll(fd)) }
      showMsg(editItem ? 'Péage modifié avec succès' : 'Péage ajouté avec succès')
      setModalOpen(false); fetchTolls()
    } catch (err) { showMsg('Erreur: ' + (err?.response?.data ? JSON.stringify(err.response.data) : err.message), 'error') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce péage ?')) return
    try { await run(deleteToll(id)); showMsg('Péage supprimé'); fetchTolls() }
    catch { showMsg('Erreur de suppression', 'error') }
  }

  const totalDepenses = tolls.reduce((acc, t) => acc + parseFloat(t.montant || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Péages</h1>
          <p className="text-sm text-slate-400 mt-1">Gestion des frais de péage</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition shadow-lg shadow-emerald-600/20">
          <FiPlus className="h-4 w-4" /> Ajouter un péage
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
          <p className="text-xs uppercase tracking-wider text-slate-500">Total péages</p>
          <p className="text-2xl font-bold text-white mt-1">{tolls.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs uppercase tracking-wider text-slate-500">Dépenses totales</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{totalDepenses.toLocaleString('fr-FR')} FCFA</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs uppercase tracking-wider text-slate-500">En attente</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{tolls.filter(t => t.statut_paiement === 'en_attente').length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par poste, ville, véhicule..." className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none transition" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-white focus:border-emerald-500 focus:outline-none">
          <option value="all">Tous les statuts</option>
          <option value="paye">Payé</option>
          <option value="en_attente">En attente</option>
          <option value="rembourse">Remboursé</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                <th className="px-5 py-4">Poste</th>
                <th className="px-5 py-4">Ville</th>
                <th className="px-5 py-4">Véhicule</th>
                <th className="px-5 py-4">Chauffeur</th>
                <th className="px-5 py-4">Montant</th>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4">Statut</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {tolls.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-slate-500">Aucun péage enregistré</td></tr>
              ) : tolls.map(t => (
                <tr key={t.id} className="hover:bg-slate-800/30 transition">
                  <td className="px-5 py-4 font-medium text-white">{t.poste_peage}</td>
                  <td className="px-5 py-4 text-slate-300">{t.ville}</td>
                  <td className="px-5 py-4 text-slate-300">{t.vehicle_plate}</td>
                  <td className="px-5 py-4 text-slate-300">{t.driver_name}</td>
                  <td className="px-5 py-4 font-semibold text-emerald-400">{parseFloat(t.montant).toLocaleString('fr-FR')} FCFA</td>
                  <td className="px-5 py-4 text-slate-400">{t.date} {t.heure?.slice(0, 5)}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${t.statut_paiement === 'paye' ? 'bg-emerald-500/10 text-emerald-400' : t.statut_paiement === 'en_attente' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'}`}>
                      {paymentStatusMap[t.statut_paiement]}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(t)} className="rounded-xl p-2 hover:bg-slate-700 transition text-slate-400 hover:text-white"><FiEdit2 className="h-4 w-4" /></button>
                      {t.justificatif && <a href={t.justificatif} target="_blank" rel="noreferrer" className="rounded-xl p-2 hover:bg-slate-700 transition text-slate-400 hover:text-blue-400"><FiDownload className="h-4 w-4" /></a>}
                      <button onClick={() => handleDelete(t.id)} className="rounded-xl p-2 hover:bg-slate-700 transition text-slate-400 hover:text-rose-400"><FiTrash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-900 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">{editItem ? 'Modifier le péage' : 'Ajouter un péage'}</h2>
              <button onClick={() => setModalOpen(false)} className="rounded-xl p-2 hover:bg-slate-800 transition text-slate-400"><FiX className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Véhicule *</label>
                  <select required value={form.vehicule} onChange={e => setForm({...form, vehicule: e.target.value})} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none">
                    <option value="">Sélectionner</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.registration || v.immatriculation}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Chauffeur *</label>
                  <select required value={form.chauffeur} onChange={e => setForm({...form, chauffeur: e.target.value})} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none">
                    <option value="">Sélectionner</option>
                    {drivers.map(d => <option key={d.id} value={d.id}>{d.name || d.nom}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Mission (optionnel)</label>
                  <select value={form.mission} onChange={e => setForm({...form, mission: e.target.value})} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none">
                    <option value="">Aucune</option>
                    {missions.map(m => <option key={m.id} value={m.id}>{m.reference} - {m.destination}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Poste de péage *</label>
                  <input required value={form.poste_peage} onChange={e => setForm({...form, poste_peage: e.target.value})} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Ville *</label>
                  <input required value={form.ville} onChange={e => setForm({...form, ville: e.target.value})} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Montant (FCFA) *</label>
                  <input required type="number" step="0.01" value={form.montant} onChange={e => setForm({...form, montant: e.target.value})} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Date *</label>
                  <input required type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Heure *</label>
                  <input required type="time" value={form.heure} onChange={e => setForm({...form, heure: e.target.value})} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Moyen de paiement *</label>
                  <select required value={form.moyen_paiement} onChange={e => setForm({...form, moyen_paiement: e.target.value})} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none">
                    {paymentMethodOptions.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Statut de paiement</label>
                  <select value={form.statut_paiement} onChange={e => setForm({...form, statut_paiement: e.target.value})} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none">
                    <option value="paye">Payé</option>
                    <option value="en_attente">En attente</option>
                    <option value="rembourse">Remboursé</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Observation</label>
                <textarea rows={2} value={form.observation} onChange={e => setForm({...form, observation: e.target.value})} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none resize-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5"><FiPaperclip className="inline h-3.5 w-3.5 mr-1" />Justificatif (PDF/Image)</label>
                <input type="file" accept="image/*,.pdf" onChange={e => setForm({...form, justificatif: e.target.files[0]})} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-emerald-500" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="rounded-2xl border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition">Annuler</button>
                <button type="submit" className="rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white transition shadow-lg shadow-emerald-600/20">{editItem ? 'Modifier' : 'Ajouter'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
