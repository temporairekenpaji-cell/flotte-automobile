import { useEffect, useState } from 'react'
import { FiBell, FiCheckCircle, FiAlertTriangle, FiShield, FiPlus, FiX, FiEdit2, FiTrash2 } from 'react-icons/fi'
import DataTable from '../components/DataTable'
import { getAlerts, resolveAlert, createAlert, updateAlert, deleteAlert, getVehiclesList } from '../services/alerts'
import { useFetch } from '../hooks/useFetch'

export default function Alerts() {
  const [alerts, setAlerts] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [message, setMessage] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const initialForm = {
    vehicle_id: '',
    type_maintenance: 'Panne système',
    description: '',
    date: new Date().toISOString().split('T')[0],
    cost: '',
  }
  const [form, setForm] = useState(initialForm)

  const { loading, error, run } = useFetch()

  const loadData = async () => {
    try {
      const [alertsRes, vehiclesRes] = await Promise.all([
        run(getAlerts({ limit: 50 })),
        getVehiclesList().then(res => res.data?.results || res.data || []),
      ])
      setAlerts(alertsRes?.results || alertsRes || [])
      setVehicles(vehiclesRes)
    } catch (err) {
      console.error('Erreur chargement alertes:', err)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleResolve = async (item) => {
    if (!window.confirm(`Marquer l'alerte pour le véhicule ${item.vehicle_plate || item.vehicle_id} comme résolue ?`)) {
      return
    }
    try {
      await run(resolveAlert(item.id))
      setMessage('Alerte résolue avec succès.')
      loadData()
    } catch (err) {
      setMessage('Erreur lors de la résolution de l’alerte.')
    }
  }

  const handleEdit = (item) => {
    setForm({
      vehicle_id: item.vehicle_id || item.vehicule || '',
      type_maintenance: item.type_maintenance || item.type || 'Panne système',
      description: item.description || '',
      date: item.date || new Date().toISOString().split('T')[0],
      cost: item.cost ?? item.cout ?? '',
    })
    setEditingId(item.id)
    setFormOpen(true)
    setMessage(null)
  }

  const handleDelete = async (item) => {
    if (!window.confirm(`Voulez-vous vraiment supprimer l'alerte pour le véhicule ${item.vehicle_plate || item.vehicle_id} ?`)) {
      return
    }
    try {
      await run(deleteAlert(item.id))
      setMessage('Alerte supprimée avec succès.')
      loadData()
    } catch (err) {
      setMessage('Erreur lors de la suppression de l’alerte.')
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((curr) => ({ ...curr, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (!form.vehicle_id) {
        alert('Veuillez sélectionner un véhicule.')
        return
      }
      const payload = {
        vehicle_id: form.vehicle_id,
        type: form.type_maintenance,
        type_maintenance: form.type_maintenance,
        description: form.description || 'Signalement alerte urgente',
        date: form.date,
        cost: parseFloat(form.cost) || 0,
      }
      if (editingId) {
        await run(updateAlert(editingId, payload))
        setMessage('Alerte modifiée avec succès.')
      } else {
        await run(createAlert(payload))
        setMessage('Nouvelle alerte enregistrée avec succès.')
      }
      setForm(initialForm)
      setFormOpen(false)
      setEditingId(null)
      loadData()
    } catch (err) {
      setMessage(editingId ? "Erreur lors de la modification de l'alerte." : "Erreur lors de la création de l'alerte.")
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 rounded-[2rem] border border-slate-800 bg-slate-900/95 p-6 shadow-lg shadow-slate-950/20 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Supervision</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Alertes & Notifications</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 rounded-3xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-300">
            <FiBell className="h-4 w-4 animate-pulse" /> {alerts.length} en attente
          </div>
          <button
            onClick={() => { setForm(initialForm); setEditingId(null); setFormOpen(true); setMessage(null); }}
            className="flex items-center gap-2 rounded-3xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
          >
            <FiPlus className="h-5 w-5" /> Signaler une alerte
          </button>
        </div>
      </div>

      {message ? (
        <div className="rounded-3xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-200">
          {message}
        </div>
      ) : null}

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[2.5rem] border border-slate-800 bg-slate-900 p-8 shadow-2xl shadow-slate-950">
            <div className="flex items-center justify-between pb-6 border-b border-slate-800">
              <h3 className="text-xl font-semibold text-white">{editingId ? "Modifier l'alerte" : "Signaler une nouvelle alerte"}</h3>
              <button
                onClick={() => setFormOpen(false)}
                className="rounded-full bg-slate-800 p-2 text-slate-400 hover:text-white"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
              <div>
                <label className="mb-2 block text-sm text-slate-300">Véhicule concerné</label>
                <select
                  name="vehicle_id"
                  value={form.vehicle_id}
                  onChange={handleChange}
                  required
                  className="w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-400"
                >
                  <option value="">-- Sélectionner un véhicule --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.registration || v.immatriculation} - {v.brand || v.marque} {v.model || v.modele}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Type de problème</label>
                  <select
                    name="type_maintenance"
                    value={form.type_maintenance}
                    onChange={handleChange}
                    className="w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-400"
                  >
                    <option value="Panne moteur">Panne moteur</option>
                    <option value="Vidange urgente">Vidange urgente</option>
                    <option value="Problème de freinage">Problème de freinage</option>
                    <option value="Pneu crevé / Usure">Pneu crevé / Usure</option>
                    <option value="Anomalie électrique">Anomalie électrique</option>
                    <option value="Panne système">Panne système</option>
                    <option value="Autre alerte">Autre alerte</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Date de constatation</label>
                  <input
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={handleChange}
                    required
                    className="w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">Coût estimé (FCFA)</label>
                <input
                  type="number"
                  name="cost"
                  value={form.cost}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">Description détaillée</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Expliquez brièvement l'anomalie constatée..."
                  className="w-full rounded-3xl border border-slate-800 bg-slate-950 p-4 text-white outline-none focus:border-emerald-400"
                ></textarea>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="rounded-3xl border border-slate-800 px-5 py-3 text-sm text-slate-400 hover:text-white"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-3xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
                >
                  {editingId ? "Enregistrer les modifications" : "Enregistrer l'alerte"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:gap-6 grid-cols-1 xl:grid-cols-[0.7fr_0.3fr]">
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-800 bg-slate-900/95 p-6 shadow-lg shadow-slate-950/20">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Maintenance critique</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Interventions requises</h3>
              </div>
              <button
                onClick={loadData}
                className="rounded-3xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
              >
                Actualiser
              </button>
            </div>

            {loading && !alerts.length ? (
              <div className="rounded-3xl bg-slate-950 p-12 text-center text-slate-500">Chargement des alertes…</div>
            ) : error ? (
              <div className="rounded-3xl bg-rose-950 p-6 text-rose-300">Erreur lors de la récupération des alertes.</div>
            ) : (
              <DataTable
                columns={[
                  { key: 'vehicle_id', header: 'ID Véhicule', render: (item) => item.vehicle_plate || item.vehicle_id || '—' },
                  { key: 'type_maintenance', header: 'Type de problème', render: (item) => item.type_maintenance || item.type || '—' },
                  { key: 'cost', header: 'Coût estimé', render: (item) => `${item.cost ?? 0} FCFA` },
                  { key: 'date', header: 'Date prévue' },
                  {
                    key: 'actions',
                    header: 'Actions',
                    render: (item) => (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleResolve(item)}
                          title="Traiter / Résoudre"
                          className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500/20 px-3 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/30"
                        >
                          <FiCheckCircle className="h-4 w-4" /> Traiter
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          title="Modifier"
                          className="rounded-2xl bg-slate-800 px-3 py-2 text-xs text-slate-200 hover:bg-slate-700"
                        >
                          <FiEdit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          title="Supprimer"
                          className="rounded-2xl bg-rose-600/20 px-3 py-2 text-xs text-rose-300 hover:bg-rose-600/30"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ),
                  },
                ]}
                data={alerts}
              />
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-800 bg-slate-900/95 p-6 shadow-lg shadow-slate-950/20">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-rose-500/20 text-rose-400">
                <FiAlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Niveau de risque</p>
                <p className="text-xl font-semibold text-white">{alerts.length > 5 ? 'Élevé' : alerts.length > 0 ? 'Modéré' : 'Normal'}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-800 bg-slate-900/95 p-6 shadow-lg shadow-slate-950/20">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-emerald-500/20 text-emerald-400">
                <FiShield className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Couverture suivi</p>
                <p className="text-xl font-semibold text-white">100% Automatique</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-400">
              Toutes les anomalies et signalements génèrent automatiquement une entrée dans cette file de traitement.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
