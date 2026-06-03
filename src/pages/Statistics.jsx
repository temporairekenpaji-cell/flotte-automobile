import { useEffect, useState } from 'react'
import { FiTrendingUp, FiActivity, FiDollarSign, FiPercent, FiTruck } from 'react-icons/fi'
import { getStatistics } from '../services/statistics'
import StatCard from '../components/StatCard'
import { useFetch } from '../hooks/useFetch'

export default function Statistics() {
  const [stats, setStats] = useState(null)
  const { loading, error, run } = useFetch()

  const loadStats = async () => {
    try {
      const response = await run(getStatistics())
      setStats(response)
    } catch (err) {
      console.error('Erreur chargement statistiques:', err)
    }
  }

  useEffect(() => {
    loadStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 rounded-[2rem] border border-slate-800 bg-slate-900/95 p-6 shadow-lg shadow-slate-950/20 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Rapports & KPIs</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Statistiques de Flotte</h2>
        </div>
        <button
          onClick={loadStats}
          className="rounded-3xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
        >
          Actualiser les calculs
        </button>
      </div>

      {loading ? (
        <div className="rounded-3xl bg-slate-950 p-12 text-center text-slate-500">Chargement des données analytiques…</div>
      ) : error ? (
        <div className="rounded-3xl bg-rose-950 p-6 text-rose-300">Erreur lors de la récupération des rapports.</div>
      ) : (
        <div className="space-y-8">
          <section className="grid gap-6 xl:grid-cols-4 lg:grid-cols-2">
            <StatCard
              label="Taux de disponibilité"
              value={`${stats?.fleet_utilization ?? 0}%`}
              icon={<FiPercent className="h-6 w-6" />}
              accent="bg-sky-600/15 text-sky-300"
            />
            <StatCard
              label="Missions Actives"
              value={stats?.active_missions ?? 0}
              icon={<FiActivity className="h-6 w-6" />}
              accent="bg-emerald-600/15 text-emerald-300"
            />
            <StatCard
              label="Véhicules Indisponibles"
              value={stats?.maintenance_vehicles ?? 0}
              icon={<FiTruck className="h-6 w-6" />}
              accent="bg-rose-600/15 text-rose-300"
            />
            <StatCard
              label="Dépenses Carburant"
              value={stats?.fuel_consumption ?? '0 FCFA'}
              icon={<FiTrendingUp className="h-6 w-6" />}
              accent="bg-amber-600/15 text-amber-300"
            />
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[2rem] border border-slate-800 bg-slate-900/95 p-8 shadow-lg shadow-slate-950/20">
              <h3 className="text-xl font-semibold text-white">Répartition de la flotte</h3>
              <p className="mt-1 text-sm text-slate-400">Ratios calculés en temps réel depuis la base PostgreSQL</p>
              <div className="mt-8 space-y-6">
                <div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Véhicules en service ({stats?.active_vehicles ?? 0})</span>
                    <span className="font-semibold text-emerald-400">{stats?.fleet_utilization ?? 0}%</span>
                  </div>
                  <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${stats?.fleet_utilization ?? 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Véhicules en maintenance ({stats?.maintenance_vehicles ?? 0})</span>
                    <span className="font-semibold text-rose-400">
                      {Math.max(0, 100 - (stats?.fleet_utilization ?? 0))}%
                    </span>
                  </div>
                  <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-rose-500 transition-all duration-500"
                      style={{ width: `${Math.max(0, 100 - (stats?.fleet_utilization ?? 0))}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-800 bg-slate-900/95 p-8 shadow-lg shadow-slate-950/20">
              <h3 className="text-xl font-semibold text-white">Synthèse Générale</h3>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
                  <p className="text-sm uppercase tracking-wider text-slate-500">Chauffeurs Enregistrés</p>
                  <p className="mt-3 text-4xl font-bold text-white">{stats?.total_drivers ?? 0}</p>
                </div>
                <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
                  <p className="text-sm uppercase tracking-wider text-slate-500">Missions Totales</p>
                  <p className="mt-3 text-4xl font-bold text-white">{stats?.total_missions ?? 0}</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
