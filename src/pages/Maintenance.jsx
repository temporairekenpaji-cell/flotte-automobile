import { useEffect, useState } from 'react'
import { FiPlus, FiEdit2, FiTrash2, FiPaperclip, FiDownload, FiX, FiSearch } from 'react-icons/fi'
import { getMaintenanceRecords, createMaintenanceRecord, updateMaintenanceRecord, deleteMaintenanceRecord } from '../services/maintenance'
import { getVehicles } from '../services/vehicles'
import { createMaintenancePart, deleteMaintenancePart, updateMaintenancePart } from '../services/maintenanceParts'
import { useFetch } from '../hooks/useFetch'
import api from '../services/api'

const initialForm = {
  vehicle_id: '',
  type: '',
  description: '',
  cost: '',
  date: '',
  status: 'pending',
  facture: null
}

export default function Maintenance() {
  const [records, setRecords] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [spareParts, setSpareParts] = useState([])
  const [summary, setSummary] = useState({ total: 0, cost: 0, alerts: 0 })

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [formParts, setFormParts] = useState([])
  const [newPart, setNewPart] = useState({ spare_part: '', nom: '', quantite: '1', prix_unitaire: '', fournisseur: '', observation: '' })

  const [message, setMessage] = useState(null)
  const [messageType, setMessageType] = useState('success')
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')

  const { run, error, loading } = useFetch()

  const loadData = async () => {
    try {
      const response = await run(getMaintenanceRecords({ limit: 100 }))
      const list = response.results || response
      setRecords(list)
      setSummary({
        total: list.length,
        cost: list.reduce((sum, item) => sum + (item.cout_total_global || item.cost || 0), 0),
        alerts: list.filter((item) => item.status !== 'completed').length,
      })

      const vResponse = await run(getVehicles({ limit: 100 }))
      setVehicles(vResponse.results || vResponse)

      const spResponse = await api.get('/spare-parts/')
      setSpareParts(spResponse.data.results || spResponse.data)
    } catch { /* silently fail */ }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((curr) => ({ ...curr, [name]: value }))
  }

  const showMsg = (msg, type = 'success') => {
    setMessage(msg)
    setMessageType(type)
    setTimeout(() => setMessage(null), 3000)
  }

  const openCreate = () => {
    setEditingId(null)
    setForm(initialForm)
    setFormParts([])
    setModalOpen(true)
  }

  const openEdit = (item) => {
    setForm({
      vehicle_id: item.vehicle_id || '',
      type: item.type || '',
      description: item.description || '',
      cost: item.cost || '',
      date: item.date || '',
      status: item.status || 'pending',
      facture: null
    })
    setFormParts(item.pieces || [])
    setEditingId(item.id)
    setModalOpen(true)
  }

  const handleDelete = async (item) => {
    if (window.confirm("Voulez-vous vraiment supprimer cet enregistrement ?")) {
      try {
        await run(deleteMaintenanceRecord(item.id))
        showMsg('Enregistrement supprimé.')
        loadData()
      } catch (err) {
        showMsg("Erreur lors de la suppression.", 'error')
      }
    }
  }

  // Manage parts local state
  const handleAddPart = () => {
    if (!newPart.nom || !newPart.prix_unitaire || !newPart.quantite) {
      alert("Veuillez remplir au moins le nom, la quantité et le prix unitaire de la pièce.")
      return
    }
    const q = parseInt(newPart.quantite) || 1
    const p = parseFloat(newPart.prix_unitaire) || 0
    const part = {
      ...newPart,
      quantite: q,
      prix_unitaire: p,
      cout_total: q * p,
      _local_key: Date.now() + Math.random().toString()
    }
    setFormParts([...formParts, part])
    setNewPart({ spare_part: '', nom: '', quantite: '1', prix_unitaire: '', fournisseur: '', observation: '' })
  }

  const handleRemovePart = async (partToRemove) => {
    if (partToRemove.id && editingId) {
      if (!confirm("Voulez-vous supprimer définitivement cette pièce de cette maintenance ?")) return
      try {
        await deleteMaintenancePart(partToRemove.id)
      } catch {
        alert("Erreur de suppression du composant côté serveur")
        return
      }
    }
    setFormParts(formParts.filter(p => p.id !== partToRemove.id || p._local_key !== partToRemove._local_key))
  }

  const handleSelectSparePart = (spId) => {
    if (!spId) {
      setNewPart({ ...newPart, spare_part: '', nom: '', prix_unitaire: '' })
      return
    }
    const sp = spareParts.find(p => p.id.toString() === spId.toString())
    if (sp) {
      setNewPart({
        ...newPart,
        spare_part: sp.id,
        nom: sp.nom,
        prix_unitaire: sp.prix_unitaire_moyen || '',
        fournisseur: sp.fournisseur_principal || ''
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const fd = new FormData()
      fd.append('vehicule', form.vehicle_id)
      fd.append('type_maintenance', form.type)
      fd.append('description', form.description)
      fd.append('cout', parseFloat(form.cost) || 0)
      fd.append('date', form.date)
      fd.append('statut', form.status)
      if (form.facture) {
        fd.append('facture', form.facture)
      }

      let savedRecord
      if (editingId) {
        const response = await run(updateMaintenanceRecord(editingId, fd))
        savedRecord = response.data || response
      } else {
        const response = await run(createMaintenanceRecord(fd))
        savedRecord = response.data || response
      }

      // Save/link all the parts
      for (const part of formParts) {
        const partPayload = {
          maintenance: savedRecord.id,
          spare_part: part.spare_part || null,
          nom: part.nom,
          quantite: part.quantite,
          prix_unitaire: part.prix_unitaire,
          fournisseur: part.fournisseur || '',
          observation: part.observation || ''
        }
        if (part.id) {
          await updateMaintenancePart(part.id, partPayload)
        } else {
          await createMaintenancePart(partPayload)
        }
      }

      showMsg(editingId ? 'Intervention modifiée avec succès.' : 'Intervention ajoutée avec succès.')
      setForm(initialForm)
      setFormParts([])
      setModalOpen(false)
      setEditingId(null)
      loadData()
    } catch (err) {
      showMsg("Erreur lors de l'enregistrement.", 'error')
    }
  }

  const partsTotalCost = formParts.reduce((acc, p) => acc + parseFloat(p.cout_total || 0), 0)
  const globalTotalCost = (parseFloat(form.cost) || 0) + partsTotalCost

  const filteredRecords = records.filter(r => {
    if (!search) return true
    const s = search.toLowerCase()
    return (
      (r.vehicle_plate || '').toLowerCase().includes(s) ||
      (r.type || '').toLowerCase().includes(s) ||
      (r.description || '').toLowerCase().includes(s)
    )
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Maintenance</h1>
          <p className="text-sm text-slate-400 mt-1">Suivi des interventions et réparations</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition shadow-lg shadow-emerald-600/20">
          <FiPlus className="h-4 w-4" /> Ajouter une intervention
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
          <p className="text-xs uppercase tracking-wider text-slate-500">Interventions</p>
          <p className="text-2xl font-bold text-white mt-1">{summary.total}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs uppercase tracking-wider text-slate-500">Coûts totaux (MO + pièces)</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{summary.cost.toLocaleString('fr-FR')} FCFA</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs uppercase tracking-wider text-slate-500">En cours</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{summary.alerts}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par véhicule, type, description..." className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none transition" />
      </div>

      {/* Table */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                <th className="px-5 py-4">Véhicule</th>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4">Type</th>
                <th className="px-5 py-4">Main d'œuvre</th>
                <th className="px-5 py-4">Pièces</th>
                <th className="px-5 py-4">Total global</th>
                <th className="px-5 py-4">Statut</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredRecords.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-slate-500">Aucune intervention enregistrée</td></tr>
              ) : filteredRecords.map(item => (
                <tr key={item.id} className="hover:bg-slate-800/30 transition">
                  <td className="px-5 py-4 font-medium text-white">{item.vehicle_plate || item.vehicle_id || '—'}</td>
                  <td className="px-5 py-4 text-slate-400">{item.date}</td>
                  <td className="px-5 py-4 text-slate-300">{item.type}</td>
                  <td className="px-5 py-4 text-slate-300">{(item.cost || 0).toLocaleString('fr-FR')} FCFA</td>
                  <td className="px-5 py-4 text-slate-300">{(item.cout_pieces || 0).toLocaleString('fr-FR')} FCFA</td>
                  <td className="px-5 py-4 font-semibold text-emerald-400">{(item.cout_total_global || 0).toLocaleString('fr-FR')} FCFA</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${item.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                      {item.status === 'completed' ? 'Terminé' : 'En attente'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(item)} className="rounded-xl p-2 hover:bg-slate-700 transition text-slate-400 hover:text-white"><FiEdit2 className="h-4 w-4" /></button>
                      {item.facture && <a href={item.facture} target="_blank" rel="noreferrer" className="rounded-xl p-2 hover:bg-slate-700 transition text-slate-400 hover:text-blue-400"><FiDownload className="h-4 w-4" /></a>}
                      <button onClick={() => handleDelete(item)} className="rounded-xl p-2 hover:bg-slate-700 transition text-slate-400 hover:text-rose-400"><FiTrash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal — même style que Péages */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-900 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">{editingId ? 'Modifier l\'intervention' : 'Nouvelle intervention'}</h2>
              <button onClick={() => setModalOpen(false)} className="rounded-xl p-2 hover:bg-slate-800 transition text-slate-400"><FiX className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Véhicule *</label>
                  <select required name="vehicle_id" value={form.vehicle_id} onChange={handleChange} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none">
                    <option value="">Sélectionner</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.registration || v.immatriculation} ({v.brand})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Type d'intervention *</label>
                  <input required name="type" value={form.type} onChange={handleChange} placeholder="Ex: Révision, Moteur, Freins..." className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Description</label>
                  <input name="description" value={form.description} onChange={handleChange} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Main d'œuvre (FCFA) *</label>
                  <input required type="number" step="0.01" name="cost" value={form.cost} onChange={handleChange} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Date *</label>
                  <input required type="date" name="date" value={form.date} onChange={handleChange} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Statut</label>
                  <select name="status" value={form.status} onChange={handleChange} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none">
                    <option value="pending">En attente</option>
                    <option value="completed">Terminé</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5"><FiPaperclip className="inline h-3.5 w-3.5 mr-1" />Facture / Bon (PDF/Image)</label>
                  <input type="file" accept="image/*,.pdf" onChange={e => setForm({ ...form, facture: e.target.files[0] })} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-emerald-500" />
                </div>
              </div>

              {/* Sub-list of spare parts */}
              <div className="border-t border-slate-700 pt-4">
                <p className="text-xs uppercase tracking-wider text-slate-400 mb-3 font-semibold">Pièces utilisées</p>

                {/* Local parts list */}
                {formParts.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {formParts.map((p, idx) => (
                      <div key={p.id || p._local_key || idx} className="flex justify-between items-center bg-slate-800 px-4 py-2.5 rounded-xl text-xs">
                        <div>
                          <p className="font-semibold text-white">{p.nom}</p>
                          <p className="text-[10px] text-slate-500">Qté: {p.quantite} × {parseFloat(p.prix_unitaire).toLocaleString('fr-FR')} FCFA</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-emerald-400">{parseFloat(p.cout_total || 0).toLocaleString('fr-FR')} FCFA</span>
                          <button type="button" onClick={() => handleRemovePart(p)} className="text-rose-500 hover:text-rose-400 p-1"><FiX className="h-4 w-4" /></button>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between text-xs font-semibold px-1 py-1 border-t border-slate-700">
                      <span className="text-slate-400">Total pièces :</span>
                      <span className="text-emerald-400">{partsTotalCost.toLocaleString('fr-FR')} FCFA</span>
                    </div>
                  </div>
                )}

                {/* Add part inline form */}
                <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 space-y-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">Pièce du stock (optionnel)</label>
                    <select value={newPart.spare_part} onChange={e => handleSelectSparePart(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none">
                      <option value="">-- Autre / Nouvelle pièce --</option>
                      {spareParts.map(sp => (
                        <option key={sp.id} value={sp.id}>{sp.nom} (Ref: {sp.reference})</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input placeholder="Nom de la pièce..." value={newPart.nom} onChange={e => setNewPart({ ...newPart, nom: e.target.value })} className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none" />
                    <input placeholder="Fournisseur..." value={newPart.fournisseur} onChange={e => setNewPart({ ...newPart, fournisseur: e.target.value })} className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" placeholder="Quantité" value={newPart.quantite} onChange={e => setNewPart({ ...newPart, quantite: e.target.value })} className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none" />
                    <input type="number" placeholder="Prix unitaire (FCFA)" value={newPart.prix_unitaire} onChange={e => setNewPart({ ...newPart, prix_unitaire: e.target.value })} className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none" />
                  </div>
                  <button type="button" onClick={handleAddPart} className="w-full bg-slate-700 hover:bg-slate-600 text-white rounded-lg py-1.5 text-xs font-semibold flex items-center justify-center gap-1 transition">
                    <FiPlus className="h-3 w-3" /> Ajouter la pièce
                  </button>
                </div>
              </div>

              {/* Total dynamic display */}
              <div className="flex justify-between border-t border-slate-700 pt-3 text-sm font-semibold">
                <span className="text-slate-400">Total estimé global :</span>
                <span className="text-emerald-400">{globalTotalCost.toLocaleString('fr-FR')} FCFA</span>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="rounded-2xl border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition">Annuler</button>
                <button type="submit" className="rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white transition shadow-lg shadow-emerald-600/20">{editingId ? 'Modifier' : 'Enregistrer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
