import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiActivity, FiShield, FiTruck, FiTrendingUp, FiCheckCircle, FiAlertTriangle, FiXCircle, FiBell, FiDollarSign, FiClock } from 'react-icons/fi'
import StatCard from '../components/StatCard'
import DataTable from '../components/DataTable'
import api from '../services/api'

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [missions, setMissions] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true)
      setError(null)
      try {
        const [summaryResponse, missionsResponse] = await Promise.all([
          api.get('/dashboard/'),
          api.get('/missions/?recent=true&limit=6'),
        ])
        setSummary(summaryResponse.data)
        setMissions(missionsResponse.data.results || missionsResponse.data || [])
        const maintenanceAlerts = (summaryResponse.data.alerts || []).slice(0, 4)
        setAlerts(maintenanceAlerts)
      } catch (err) {
        console.error('Erreur API:', err)
        setError('Impossible de charger le tableau de bord. Vérifiez la connexion API.')
        setSummary(null)
        setMissions([])
        setAlerts([])
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  const operationalCards = useMemo(
    () => [
      {
        label: 'Véhicules totaux',
        value: summary?.total_vehicles ?? '—',
        icon: <FiTruck className="h-6 w-6" />,
        accent: 'bg-sky-600/15 text-sky-300',
      },
      {
        label: 'Actifs',
        value: summary?.active_vehicles ?? '—',
        icon: <FiActivity className="h-6 w-6" />,
        accent: 'bg-emerald-600/15 text-emerald-300',
      },
      {
        label: 'Maintenance',
        value: summary?.maintenance_vehicles ?? '—',
        icon: <FiShield className="h-6 w-6" />,
        accent: 'bg-rose-600/15 text-rose-300',
      },
      {
        label: 'Consommation carburant',
        value: summary?.fuel_consumption ?? '—',
        icon: <FiTrendingUp className="h-6 w-6" />,
        accent: 'bg-amber-600/15 text-amber-300',
      },
    ],
    [summary],
  )

  const adminCards = useMemo(
    () => [
      {
        label: 'Documents valides',
        value: summary?.valid_documents ?? '—',
        icon: <FiCheckCircle className="h-6 w-6" />,
        accent: 'bg-emerald-600/15 text-emerald-300',
        onClick: () => navigate('/vehicles')
      },
      {
        label: 'Expirant bientôt',
        value: summary?.expiring_documents ?? '—',
        icon: <FiAlertTriangle className="h-6 w-6" />,
        accent: 'bg-amber-600/15 text-amber-300',
        onClick: () => navigate('/vehicles')
      },
      {
        label: 'Documents expirés',
        value: summary?.expired_documents ?? '—',
        icon: <FiXCircle className="h-6 w-6" />,
        accent: 'bg-rose-600/15 text-rose-300',
        onClick: () => navigate('/vehicles')
      },
      {
        label: 'Notifications non lues',
        value: summary?.unread_notifications ?? '—',
        icon: <FiBell className="h-6 w-6" />,
        accent: 'bg-indigo-600/15 text-indigo-300',
        onClick: () => navigate('/notifications')
      },
    ],
    [summary, navigate],
  )

  const monthlyKpis = useMemo(
    () => [
      {
        label: 'Dépenses Péages (Mois)',
        value: summary?.tolls_month_cost != null ? `${summary.tolls_month_cost.toLocaleString('fr-FR')} F` : '0 F',
        icon: <FiDollarSign className="h-6 w-6" />,
        accent: 'bg-emerald-600/15 text-emerald-300',
        onClick: () => navigate('/tolls')
      },
      {
        label: 'Amendes Routières (Mois)',
        value: summary?.fines_month_cost != null ? `${summary.fines_month_cost.toLocaleString('fr-FR')} F` : '0 F',
        icon: <FiAlertTriangle className="h-6 w-6" />,
        accent: 'bg-rose-600/15 text-rose-300',
        onClick: () => navigate('/road-checks')
      },
      {
        label: 'Coût Maintenances (Mois)',
        value: summary ? `${((summary.maintenances_month_cost || 0) + (summary.parts_month_cost || 0)).toLocaleString('fr-FR')} F` : '0 F',
        icon: <FiShield className="h-6 w-6" />,
        accent: 'bg-indigo-600/15 text-indigo-300',
        onClick: () => navigate('/maintenance')
      },
      {
        label: 'Missions Retardées (Mois)',
        value: summary?.missions_late_count ?? '0',
        icon: <FiClock className="h-6 w-6" />,
        accent: 'bg-amber-600/15 text-amber-300',
        onClick: () => navigate('/missions')
      }
    ],
    [summary, navigate]
  )

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <p className="text-xs sm:text-sm uppercase tracking-[0.3em] text-slate-500">Vue d'ensemble</p>
        <h2 className="mt-2 text-2xl sm:text-3xl font-semibold text-white">Tableau de Bord Flotte</h2>
      </div>

      {/* Operational Stats Section */}
      <div className="space-y-4">
        <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-slate-400">Statistiques Opérationnelles</h3>
        <section className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
          {operationalCards.map((item) => (
            <StatCard key={item.label} {...item} />
          ))}
        </section>
      </div>

      {/* Monthly Operations & Finances Section */}
      <div className="space-y-4">
        <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-slate-400">Indicateurs de Performance Mensuelle</h3>
        <section className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
          {monthlyKpis.map((item) => (
            <div 
              key={item.label}
              onClick={item.onClick}
              className="cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:border-slate-700"
            >
              <StatCard {...item} />
            </div>
          ))}
        </section>
      </div>

      {/* Administrative Stats Section */}
      <div className="space-y-4">
        <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-slate-400">Suivi Administratif & Documents</h3>
        <section className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
          {adminCards.map((item) => (
            <div 
              key={item.label}
              onClick={item.onClick}
              className="cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:border-slate-700"
            >
              <StatCard {...item} />
            </div>
          ))}
        </section>
      </div>

      <section className="grid gap-4 sm:gap-6 grid-cols-1 xl:grid-cols-[1.4fr_0.6fr]">
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900/95 p-6 shadow-lg shadow-slate-950/20">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Missions récentes</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Suivi des missions en cours</h3>
            </div>
            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-400">Live</span>
          </div>
          {loading ? (
            <div className="rounded-3xl bg-slate-950 p-12 text-center text-slate-500">Chargement des missions…</div>
          ) : error ? (
            <div className="rounded-3xl bg-rose-950 p-6 text-rose-300">{error}</div>
          ) : (
            <DataTable
              columns={[
                { key: 'reference', header: 'Référence' },
                { key: 'driver_name', header: 'Chauffeur' },
                { key: 'vehicle_plate', header: 'Véhicule' },
                { key: 'status', header: 'Statut' },
              ]}
              data={missions}
            />
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-800 bg-slate-900/95 p-6 shadow-lg shadow-slate-950/20">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Alertes</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Maintenance</h3>
              </div>
            </div>
            <div className="space-y-4">
              {alerts.length > 0 ? (
                alerts.map((alert, index) => (
                  <div key={index} className="rounded-3xl border border-slate-800 bg-slate-950 p-4">
                    <p className="text-sm text-slate-400">{alert.message || alert.title || 'Alerte de maintenance disponible'}</p>
                    <p className="mt-2 text-sm text-emerald-300">{alert.details || 'Vérifiez l’état du véhicule concerné.'}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">Aucune alerte critique sur les derniers véhicules.</p>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-800 bg-slate-900/95 p-6 shadow-lg shadow-slate-950/20">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Performance</p>
            <div className="mt-5 space-y-4">
              <div className="rounded-3xl bg-slate-950 p-4">
                <p className="text-sm text-slate-400">Taux de remplissage de la flotte</p>
                <p className="mt-3 text-3xl font-semibold text-white">{summary?.fleet_utilization ?? '—'}%</p>
              </div>
              <div className="rounded-3xl bg-slate-950 p-4">
                <p className="text-sm text-slate-400">Nombre de missions en cours</p>
                <p className="mt-3 text-3xl font-semibold text-white">{summary?.active_missions ?? '—'}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
