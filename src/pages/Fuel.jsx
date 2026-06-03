import { useEffect, useState } from 'react'
import { FiDroplet, FiTrendingUp, FiCreditCard, FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi'
import DataTable from '../components/DataTable'
import { getFuelRecords, createFuelRecord, updateFuelRecord, deleteFuelRecord } from '../services/fuel'
import { getVehicles } from '../services/vehicles'
import { useFetch } from '../hooks/useFetch'

const initialForm = {
  vehicle_id: '',
  liters: '',
  cost: '',
  date: ''
}

export default function Fuel() {
  const [records, setRecords] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [summary, setSummary] = useState({ consumption: 0, cost: 0, refuels: 0 })

  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [message, setMessage] = useState(null)
  const [editingId, setEditingId] = useState(null)

  const { run, error, loading } = useFetch()

  const loadData = async () => {
    const response = await run(getFuelRecords({ limit: 15 }))
    const list = response.results || response
    setRecords(list)
    setSummary({
      consumption: list.reduce((sum, item) => sum + (item.liters || item.consumption || 0), 0),
      cost: list.reduce((sum, item) => sum + (item.cost || 0), 0),
      refuels: list.length,
    })

    const vResponse = await run(getVehicles({ limit: 50 }))
    setVehicles(vResponse.results || vResponse)
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((curr) => ({ ...curr, [name]: value }))
  }

  const handleEdit = (item) => {
    setForm({
      vehicle_id: item.vehicle_id || '',
      liters: item.liters || '',
      cost: item.cost || '',
      date: item.date || ''
    })
    setEditingId(item.id)
    setFormOpen(true)
    setMessage(null)
  }

  const handleDelete = async (item) => {
    if (window.confirm("Voulez-vous vraiment supprimer cet enregistrement ?")) {
      try {
        await run(deleteFuelRecord(item.id))
        setMessage('Enregistrement supprimé.')
        loadData()
      } catch (err) {
        setMessage("Erreur lors de la suppression.")
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = { ...form, liters: parseFloat(form.liters) || 0, cost: parseFloat(form.cost) || 0 }
      if (editingId) {
        await run(updateFuelRecord(editingId, payload))
        setMessage('Plein modifié avec succès.')
      } else {
        await run(createFuelRecord(payload))
        setMessage('Plein ajouté avec succès.')
      }
      setForm(initialForm)
      setFormOpen(false)
      setEditingId(null)
      loadData()
    } catch (err) {
      setMessage("Erreur lors de l'enregistrement.")
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 rounded-[2rem] border border-slate-800 bg-slate-900/95 p-6 shadow-lg shadow-slate-950/20 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Gestion Carburant</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Suivi des pleins</h2>
        </div>
        <button onClick={() => { setFormOpen((prev) => !prev); setMessage(null); setForm(initialForm); setEditingId(null); }} className="inline-flex items-center gap-2 rounded-3xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400">
          <FiPlus className="h-4 w-4" /> {formOpen ? 'Fermer le formulaire' : 'Ajouter un plein'}
        </button>
      </div>

      {message ? <div className="rounded-3xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-200">{message}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[0.65fr_0.35fr]">
        <div className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-[2rem] border border-slate-800 bg-slate-900/95 p-6 shadow-lg shadow-slate-950/20">
              <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Consommation</p>
              <p className="mt-4 text-4xl font-semibold text-white">{summary.consumption.toLocaleString('fr-FR')} L</p>
            </div>
            <div className="rounded-[2rem] border border-slate-800 bg-slate-900/95 p-6 shadow-lg shadow-slate-950/20">
              <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Dépenses</p>
              <p className="mt-4 text-4xl font-semibold text-white">{summary.cost.toLocaleString('fr-FR')} FCFA</p>
            </div>
            <div className="rounded-[2rem] border border-slate-800 bg-slate-900/95 p-6 shadow-lg shadow-slate-950/20">
              <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Pleins</p>
              <p className="mt-4 text-4xl font-semibold text-white">{summary.refuels}</p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-800 bg-slate-900/95 p-6 shadow-lg shadow-slate-950/20">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Historique carburant</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Gestion du budget carburant</h2>
              </div>
            </div>

            {loading && !records.length ? (
              <div className="rounded-3xl bg-slate-950 p-12 text-center text-slate-500">Chargement…</div>
            ) : (
              <DataTable
                columns={[
                  { key: 'vehicle_id', header: 'ID Véhicule' },
                  { key: 'date', header: 'Date' },
                  { key: 'liters', header: 'Litres' },
                  { key: 'cost', header: 'Coût', render: (item) => `${item.cost ?? 0} FCFA` },
                  {
                    key: 'actions',
                    header: 'Actions',
                    render: (item) => (
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEdit(item)} className="rounded-2xl bg-slate-800 px-3 py-2 text-xs text-slate-200 hover:bg-slate-700">
                          <FiEdit2 className="inline h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(item)} className="rounded-2xl bg-rose-600 px-3 py-2 text-xs text-white hover:bg-rose-500">
                          <FiTrash2 className="inline h-4 w-4" />
                        </button>
                      </div>
                    ),
                  },
                ]}
                data={records}
              />
            )}
          </div>
        </div>

        <div className="space-y-6">
          {formOpen ? (
            <div className="rounded-[2rem] border border-slate-800 bg-slate-900/95 p-6 shadow-lg shadow-slate-950/20">
              <div className="mb-6">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Formulaire</p>
                <h3 className="mt-2 text-xl font-semibold text-white">{editingId ? 'Modifier le plein' : 'Nouveau plein'}</h3>
              </div>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <label className="block text-sm text-slate-300">
                  Véhicule
                  <select name="vehicle_id" value={form.vehicle_id} onChange={handleChange} required className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none">
                    <option value="">Sélectionner</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.registration} ({v.brand})</option>
                    ))}
                  </select>
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm text-slate-300">
                    Litres (L)
                    <input type="number" step="0.1" name="liters" value={form.liters} onChange={handleChange} required className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none" />
                  </label>
                  <label className="block text-sm text-slate-300">
                    Coût total (FCFA)
                    <input type="number" step="0.01" name="cost" value={form.cost} onChange={handleChange} required className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none" />
                  </label>
                </div>
                <label className="block text-sm text-slate-300">
                  Date
                  <input type="date" name="date" value={form.date} onChange={handleChange} required className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none" />
                </label>
                <button className="w-full rounded-3xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400">{editingId ? 'Modifier' : 'Enregistrer'}</button>
              </form>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
