import { useEffect, useState } from 'react'
import { FiPlus, FiSearch, FiTrash2, FiEdit2, FiShield, FiAlertTriangle, FiCheckCircle, FiXCircle, FiDownload, FiPaperclip, FiX } from 'react-icons/fi'
import { getRoadChecks, createRoadCheck, updateRoadCheck, deleteRoadCheck } from '../services/roadChecks'
import { useFetch } from '../hooks/useFetch'
import api from '../services/api'

const statusMap = { conforme: 'Conforme', non_conforme: 'Non conforme' }
const fineStatusMap = { non_payee: 'Non payée', payee: 'Payée', contestee: 'Contestée' }

export default function RoadChecks() {
  const [checks, setChecks] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers] = useState([])
  const [missions, setMissions] = useState([])
  const [search, setSearch] = useState('')
  const [statutFilter, setStatutFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [message, setMessage] = useState(null)
  const [messageType, setMessageType] = useState('success')
  const [missingDocs, setMissingDocs] = useState([])
  const [newMissingDoc, setNewMissingDoc] = useState('')
  const { run } = useFetch()

  const [form, setForm] = useState({
    vehicule: '', chauffeur: '', mission: '', lieu: '', date: '', heure: '',
    agent_controle: '', type_verification: '', documents_verifies: '',
    montant_amende: '0', statut: 'conforme', statut_amende: 'payee', observation: '', rapport: null
  })

  const fetchChecks = async () => {
    try {
      const res = await run(getRoadChecks({ search: search || undefined, statut: statutFilter !== 'all' ? statutFilter : undefined }))
      setChecks(res.results || res)
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
  useEffect(() => { fetchChecks() }, [search, statutFilter])

  const showMsg = (msg, type = 'success') => { setMessage(msg); setMessageType(type); setTimeout(() => setMessage(null), 3000) }

  const openCreate = () => {
    setEditItem(null); setMissingDocs([])
    setForm({ vehicule: '', chauffeur: '', mission: '', lieu: '', date: '', heure: '', agent_controle: '', type_verification: '', documents_verifies: '', montant_amende: '0', statut: 'conforme', statut_amende: 'payee', observation: '', rapport: null })
    setModalOpen(true)
  }

  const openEdit = (item) => {
    setEditItem(item); setMissingDocs(item.pieces_manquantes || [])
    setForm({
      vehicule: item.vehicule, chauffeur: item.chauffeur, mission: item.mission || '',
      lieu: item.lieu, date: item.date, heure: item.heure, agent_controle: item.agent_controle,
      type_verification: item.type_verification, documents_verifies: item.documents_verifies,
      montant_amende: item.montant_amende, statut: item.statut, statut_amende: item.statut_amende,
      observation: item.observation || '', rapport: null
    })
    setModalOpen(true)
  }

  const addMissingDoc = () => {
    if (newMissingDoc.trim()) { setMissingDocs([...missingDocs, newMissingDoc.trim()]); setNewMissingDoc('') }
  }

  const removeMissingDoc = (idx) => { setMissingDocs(missingDocs.filter((_, i) => i !== idx)) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => {
      if (k === 'rapport') { if (v) fd.append(k, v) }
      else if (k === 'mission') { if (v) fd.append(k, v) }
      else fd.append(k, v)
    })
    fd.append('pieces_manquantes', JSON.stringify(missingDocs))
    try {
      if (editItem) { await run(updateRoadCheck(editItem.id, fd)) }
      else { await run(createRoadCheck(fd)) }
      showMsg(editItem ? 'Contrôle modifié avec succès' : 'Contrôle ajouté avec succès')
      setModalOpen(false); fetchChecks()
    } catch (err) { showMsg('Erreur: ' + (err?.response?.data ? JSON.stringify(err.response.data) : err.message), 'error') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce contrôle routier ?')) return
    try { await run(deleteRoadCheck(id)); showMsg('Contrôle supprimé'); fetchChecks() }
    catch { showMsg('Erreur de suppression', 'error') }
  }

  const totalAmendes = checks.reduce((acc, c) => acc + parseFloat(c.montant_amende || 0), 0)
  const nonConformeCount = checks.filter(c => c.statut === 'non_conforme').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Prévention Routière</h1>
          <p className="text-sm text-slate-400 mt-1">Suivi des contrôles routiers et amendes</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-500 px-5 py-3 text-sm font-semibold text-white transition shadow-lg shadow-blue-600/20">
          <FiPlus className="h-4 w-4" /> Ajouter un contrôle
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
          <p className="text-xs uppercase tracking-wider text-slate-500">Total contrôles</p>
          <p className="text-2xl font-bold text-white mt-1">{checks.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs uppercase tracking-wider text-slate-500">Total amendes</p>
          <p className="text-2xl font-bold text-rose-400 mt-1">{totalAmendes.toLocaleString('fr-FR')} FCFA</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs uppercase tracking-wider text-slate-500">Non conformes</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{nonConformeCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par lieu, véhicule, chauffeur..." className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition" />
        </div>
        <select value={statutFilter} onChange={e => setStatutFilter(e.target.value)} className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-white focus:border-blue-500 focus:outline-none">
          <option value="all">Tous les statuts</option>
          <option value="conforme">Conforme</option>
          <option value="non_conforme">Non conforme</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                <th className="px-5 py-4">Lieu</th>
                <th className="px-5 py-4">Véhicule</th>
                <th className="px-5 py-4">Chauffeur</th>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4">Statut</th>
                <th className="px-5 py-4">Amende</th>
                <th className="px-5 py-4">Statut amende</th>
                <th className="px-5 py-4">Pièces manq.</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {checks.length === 0 ? (
                <tr><td colSpan={9} className="px-5 py-12 text-center text-slate-500">Aucun contrôle enregistré</td></tr>
              ) : checks.map(c => (
                <tr key={c.id} className="hover:bg-slate-800/30 transition">
                  <td className="px-5 py-4 font-medium text-white">{c.lieu}</td>
                  <td className="px-5 py-4 text-slate-300">{c.vehicle_plate}</td>
                  <td className="px-5 py-4 text-slate-300">{c.driver_name}</td>
                  <td className="px-5 py-4 text-slate-400">{c.date} {c.heure?.slice(0, 5)}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${c.statut === 'conforme' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {c.statut === 'conforme' ? <FiCheckCircle className="h-3 w-3" /> : <FiXCircle className="h-3 w-3" />}
                      {statusMap[c.statut]}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-semibold text-rose-400">{parseFloat(c.montant_amende) > 0 ? `${parseFloat(c.montant_amende).toLocaleString('fr-FR')} FCFA` : '-'}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${c.statut_amende === 'payee' ? 'bg-emerald-500/10 text-emerald-400' : c.statut_amende === 'contestee' ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {fineStatusMap[c.statut_amende]}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1">
                      {(c.pieces_manquantes || []).map((p, i) => (
                        <span key={i} className="inline-flex items-center rounded-lg bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-400 border border-rose-500/20">{p}</span>
                      ))}
                      {(!c.pieces_manquantes || c.pieces_manquantes.length === 0) && <span className="text-slate-500 text-xs">—</span>}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(c)} className="rounded-xl p-2 hover:bg-slate-700 transition text-slate-400 hover:text-white"><FiEdit2 className="h-4 w-4" /></button>
                      {c.rapport && <a href={c.rapport} target="_blank" rel="noreferrer" className="rounded-xl p-2 hover:bg-slate-700 transition text-slate-400 hover:text-blue-400"><FiDownload className="h-4 w-4" /></a>}
                      <button onClick={() => handleDelete(c.id)} className="rounded-xl p-2 hover:bg-slate-700 transition text-slate-400 hover:text-rose-400"><FiTrash2 className="h-4 w-4" /></button>
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
              <h2 className="text-lg font-bold text-white">{editItem ? 'Modifier le contrôle' : 'Ajouter un contrôle'}</h2>
              <button onClick={() => setModalOpen(false)} className="rounded-xl p-2 hover:bg-slate-800 transition text-slate-400"><FiX className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Véhicule *</label>
                  <select required value={form.vehicule} onChange={e => setForm({...form, vehicule: e.target.value})} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none">
                    <option value="">Sélectionner</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.registration || v.immatriculation}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Chauffeur *</label>
                  <select required value={form.chauffeur} onChange={e => setForm({...form, chauffeur: e.target.value})} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none">
                    <option value="">Sélectionner</option>
                    {drivers.map(d => <option key={d.id} value={d.id}>{d.name || d.nom}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Mission (optionnel)</label>
                  <select value={form.mission} onChange={e => setForm({...form, mission: e.target.value})} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none">
                    <option value="">Aucune</option>
                    {missions.map(m => <option key={m.id} value={m.id}>{m.reference} - {m.destination}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Lieu du contrôle *</label>
                  <input required value={form.lieu} onChange={e => setForm({...form, lieu: e.target.value})} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Date *</label>
                  <input required type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Heure *</label>
                  <input required type="time" value={form.heure} onChange={e => setForm({...form, heure: e.target.value})} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Agent / Service de contrôle *</label>
                  <input required value={form.agent_controle} onChange={e => setForm({...form, agent_controle: e.target.value})} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Type de vérification *</label>
                  <input required value={form.type_verification} onChange={e => setForm({...form, type_verification: e.target.value})} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Documents vérifiés *</label>
                  <textarea required rows={2} value={form.documents_verifies} onChange={e => setForm({...form, documents_verifies: e.target.value})} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Montant amende (FCFA)</label>
                  <input type="number" step="0.01" value={form.montant_amende} onChange={e => setForm({...form, montant_amende: e.target.value})} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Statut</label>
                  <select value={form.statut} onChange={e => setForm({...form, statut: e.target.value})} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none">
                    <option value="conforme">Conforme</option>
                    <option value="non_conforme">Non conforme</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Statut amende</label>
                  <select value={form.statut_amende} onChange={e => setForm({...form, statut_amende: e.target.value})} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none">
                    <option value="non_payee">Non payée</option>
                    <option value="payee">Payée</option>
                    <option value="contestee">Contestée</option>
                  </select>
                </div>
              </div>

              {/* Missing documents tags */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Pièces / Documents manquants</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {missingDocs.map((doc, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 rounded-lg bg-rose-500/10 px-3 py-1 text-xs font-medium text-rose-400 border border-rose-500/20">
                      {doc}
                      <button type="button" onClick={() => removeMissingDoc(idx)} className="hover:text-rose-300"><FiX className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={newMissingDoc} onChange={e => setNewMissingDoc(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addMissingDoc() } }} placeholder="Ajouter un document manquant..." className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-white focus:border-blue-500 focus:outline-none" />
                  <button type="button" onClick={addMissingDoc} className="rounded-xl bg-slate-700 hover:bg-slate-600 px-4 py-2 text-sm font-semibold text-white transition"><FiPlus className="h-4 w-4" /></button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Observation</label>
                <textarea rows={2} value={form.observation} onChange={e => setForm({...form, observation: e.target.value})} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none resize-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5"><FiPaperclip className="inline h-3.5 w-3.5 mr-1" />Rapport de contrôle (PDF/Image)</label>
                <input type="file" accept="image/*,.pdf" onChange={e => setForm({...form, rapport: e.target.files[0]})} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-500" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="rounded-2xl border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition">Annuler</button>
                <button type="submit" className="rounded-2xl bg-blue-600 hover:bg-blue-500 px-6 py-2.5 text-sm font-semibold text-white transition shadow-lg shadow-blue-600/20">{editItem ? 'Modifier' : 'Ajouter'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
