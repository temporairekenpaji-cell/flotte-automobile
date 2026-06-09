import { useEffect, useMemo, useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiActivity, FiShield, FiTruck, FiTrendingUp, FiCheckCircle, FiAlertTriangle, FiXCircle, FiBell, FiDollarSign, FiClock, FiUser } from 'react-icons/fi'
import StatCard from '../components/StatCard'
import DataTable from '../components/DataTable'
import api from '../services/api'
import { AuthContext } from '../context/AuthContext'

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [missions, setMissions] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)

  useEffect(() => {
    const cachedSummary = window.sessionStorage.getItem('fleet_dashboard_summary')
    const cachedMissions = window.sessionStorage.getItem('fleet_dashboard_missions')

    if (cachedSummary) {
      const summaryData = JSON.parse(cachedSummary)
      setSummary(summaryData)
      setAlerts((summaryData.alerts || []).slice(0, 4))
      setLoading(false)
    }
    if (cachedMissions) {
      setMissions(JSON.parse(cachedMissions))
    }

    const loadDashboard = async () => {
      setError(null)
      try {
        const [summaryResponse, missionsResponse] = await Promise.all([
          api.get('/dashboard/'),
          api.get('/missions/?recent=true&limit=6'),
        ])
        const summaryData = summaryResponse.data
        const missionsData = missionsResponse.data.results || missionsResponse.data || []
        
        setSummary(summaryData)
        setMissions(missionsData)
        setAlerts((summaryData.alerts || []).slice(0, 4))
        
        window.sessionStorage.setItem('fleet_dashboard_summary', JSON.stringify(summaryData))
        window.sessionStorage.setItem('fleet_dashboard_missions', JSON.stringify(missionsData))
      } catch (err) {
        console.error('Erreur API:', err)
        setError('Impossible de charger le tableau de bord. Vérifiez la connexion API.')
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()

    // background sync events
    const handleUpdate = (e) => {
      const summaryData = e.detail
      setSummary(summaryData)
      setAlerts((summaryData.alerts || []).slice(0, 4))
      setLoading(false)
    }

    const handleMutation = () => {
      loadDashboard()
    }

    window.addEventListener('dashboardDataUpdated', handleUpdate)
    window.addEventListener('globalDataMutation', handleMutation)
    
    return () => {
      window.removeEventListener('dashboardDataUpdated', handleUpdate)
      window.removeEventListener('globalDataMutation', handleMutation)
    }
  }, [])

  const operationalCards = useMemo(
    () => [
      { label: 'Véhicules totaux', value: summary?.total_vehicles ?? '—', icon: <FiTruck className="h-6 w-6" />, accent: 'bg-sky-600/15 text-sky-300' },
      { label: 'Actifs', value: summary?.active_vehicles ?? '—', icon: <FiActivity className="h-6 w-6" />, accent: 'bg-emerald-600/15 text-emerald-300' },
      { label: 'Maintenance', value: summary?.maintenance_vehicles ?? '—', icon: <FiShield className="h-6 w-6" />, accent: 'bg-rose-600/15 text-rose-300' },
      { label: 'Consommation carburant', value: summary?.fuel_consumption ?? '—', icon: <FiTrendingUp className="h-6 w-6" />, accent: 'bg-amber-600/15 text-amber-300' },
    ],
    [summary],
  )

  const documentCards = useMemo(
    () => [
      { label: 'Documents valides', value: summary?.valid_documents ?? '—', icon: <FiCheckCircle className="h-6 w-6" />, accent: 'bg-emerald-600/15 text-emerald-300', onClick: () => navigate('/vehicles') },
      { label: 'Expirant bientôt', value: summary?.expiring_documents ?? '—', icon: <FiAlertTriangle className="h-6 w-6" />, accent: 'bg-amber-600/15 text-amber-300', onClick: () => navigate('/vehicles') },
      { label: 'Documents expirés', value: summary?.expired_documents ?? '—', icon: <FiXCircle className="h-6 w-6" />, accent: 'bg-rose-600/15 text-rose-300', onClick: () => navigate('/vehicles') },
      { label: 'Notifications non lues', value: summary?.unread_notifications ?? '—', icon: <FiBell className="h-6 w-6" />, accent: 'bg-indigo-600/15 text-indigo-300', onClick: () => navigate('/notifications') },
    ],
    [summary, navigate],
  )

  const monthlyKpis = useMemo(
    () => [
      { label: 'Dépenses Péages (Mois)', value: summary?.tolls_month_cost != null ? `${summary.tolls_month_cost.toLocaleString('fr-FR')} F` : '0 F', icon: <FiDollarSign className="h-6 w-6" />, accent: 'bg-emerald-600/15 text-emerald-300', onClick: () => navigate('/tolls') },
      { label: 'Amendes Routières (Mois)', value: summary?.fines_month_cost != null ? `${summary.fines_month_cost.toLocaleString('fr-FR')} F` : '0 F', icon: <FiAlertTriangle className="h-6 w-6" />, accent: 'bg-rose-600/15 text-rose-300', onClick: () => navigate('/road-checks') },
      { label: 'Coût Maintenances (Mois)', value: summary ? `${((summary.maintenances_month_cost || 0) + (summary.parts_month_cost || 0)).toLocaleString('fr-FR')} F` : '0 F', icon: <FiShield className="h-6 w-6" />, accent: 'bg-indigo-600/15 text-indigo-300', onClick: () => navigate('/maintenance') },
      { label: 'Missions Retardées', value: summary?.missions_late_count ?? '0', icon: <FiClock className="h-6 w-6" />, accent: 'bg-amber-600/15 text-amber-300', onClick: () => navigate('/missions') },
    ],
    [summary, navigate],
  )

  const greeting = user?.first_name
    ? `Bonjour, ${user.first_name}`
    : user?.username
      ? `Bonjour, ${user.username}`
      : 'Bienvenue'

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <p className="text-xs sm:text-sm uppercase tracking-[0.3em] text-slate-500">Vue d'ensemble</p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-semibold text-white">{greeting}</h2>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-400">
          <FiUser className="h-3 w-3" />
          Administrateur
        </span>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-slate-400">Statistiques opérationnelles</h3>
        <section className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
          {operationalCards.map((item) => (
            <StatCard key={item.label} {...item} />
          ))}
        </section>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-slate-400">Indicateurs mensuels</h3>
        <section className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
          {monthlyKpis.map((item) => (
            <div key={item.label} onClick={item.onClick} className="cursor-pointer transition-all duration-300 hover:-translate-y-1">
              <StatCard {...item} />
            </div>
          ))}
        </section>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-slate-400">Documents & notifications</h3>
        <section className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
          {documentCards.map((item) => (
            <div key={item.label} onClick={item.onClick} className="cursor-pointer transition-all duration-300 hover:-translate-y-1">
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
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Conformité</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Documents à renouveler</h3>
              </div>
              <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] text-slate-400 font-medium">Urgent</span>
            </div>
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {summary?.urgent_documents?.length > 0 ? (
                summary.urgent_documents.map((doc) => (
                  <div key={doc.id} className="rounded-3xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-semibold text-white">{doc.document_type_display}</span>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                        doc.statut === 'expire'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {doc.statut === 'expire' ? 'Expiré' : 'Expire bientôt'}
                      </span>
                    </div>
                    {doc.vehicle_plate && (
                      <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-500">
                        <FiTruck className="h-3 w-3" />
                        <span>{doc.vehicle_plate}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-500">
                      <FiClock className="h-3.5 w-3.5" />
                      <span>Échéance : <span className={doc.statut === 'expire' ? 'text-rose-400 font-semibold' : 'text-amber-400 font-semibold'}>{doc.date_expiration}</span></span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 text-center py-4">Aucun document à renouveler.</p>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-800 bg-slate-900/95 p-6 shadow-lg shadow-slate-950/20">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Alertes maintenance</p>
            <div className="mt-4 space-y-4">
              {alerts.length > 0 ? (
                alerts.map((alert, index) => (
                  <div key={index} className="rounded-3xl border border-slate-800 bg-slate-950 p-4">
                    <p className="text-sm text-slate-400">{alert.message || alert.title}</p>
                    <p className="mt-2 text-sm text-emerald-300">{alert.details}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">Aucune alerte critique.</p>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-800 bg-slate-900/95 p-6 shadow-lg shadow-slate-950/20">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Performance</p>
            <div className="mt-5 space-y-4">
              <div className="rounded-3xl bg-slate-950 p-4">
                <p className="text-sm text-slate-400">Taux d'utilisation de la flotte</p>
                <p className="mt-3 text-3xl font-semibold text-white">{summary?.fleet_utilization ?? '—'}%</p>
              </div>
              <div className="rounded-3xl bg-slate-950 p-4">
                <p className="text-sm text-slate-400">Chauffeurs enregistrés</p>
                <p className="mt-3 text-3xl font-semibold text-white">{summary?.total_drivers ?? '—'}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
