import { useEffect, useState } from 'react'
import { FiPlus, FiSearch, FiTrash2, FiEdit2, FiCalendar, FiClock, FiCheckCircle, FiAlertTriangle, FiXCircle, FiFileText, FiUser, FiInfo } from 'react-icons/fi'
import DataTable from '../components/DataTable'
import { getVehicles, createVehicle, updateVehicle, deleteVehicle } from '../services/vehicles'
import { getDocuments, createDocument, updateDocument, deleteDocument, renewDocument, getRenewalHistory } from '../services/documents'
import { getDrivers } from '../services/drivers'
import { useFetch } from '../hooks/useFetch'

const initialVehicleForm = {
  registration: '',
  brand: '',
  model: '',
  status: 'active',
  mileage: '',
  type_vehicle: 'tracteur'
}

const initialDocumentForm = {
  document_type: 'visite_technique',
  numero_document: '',
  chauffeur: '',
  date_debut: '',
  date_expiration: '',
  periode: '1_an',
  remarque: ''
}

const initialRenewForm = {
  date_debut: '',
  date_expiration: '',
  periode: '1_an',
  remarque: ''
}

const documentTypesMap = {
  visite_technique: 'Visite technique',
  carte_grise: 'Carte grise',
  assurance: 'Assurance',
  carte_bleue: 'Carte bleue',
  licence_de_transport: 'Licence de transport',
  taxe: 'Taxe',
  permis_de_conduire: 'Permis de conduire'
}

const periodeMap = {
  '3_mois': '3 mois',
  '6_mois': '6 mois',
  '1_an': '1 an',
  'autre': 'Autre'
}

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([])
  const [activeVehicle, setActiveVehicle] = useState(null)
  const [activeTab, setActiveTab] = useState('infos')
  
  // Lists
  const [documents, setDocuments] = useState([])
  const [renewalHistory, setRenewalHistory] = useState([])
  const [drivers, setDrivers] = useState([])

  // Filters
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [typeVehicle, setTypeVehicle] = useState('all')
  const [expiredDocsOnly, setExpiredDocsOnly] = useState(false)

  // Modals / Forms States
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false)
  const [selectedVehicleForEdit, setSelectedVehicleForEdit] = useState(null)
  const [vehicleForm, setVehicleForm] = useState(initialVehicleForm)

  const [documentModalOpen, setDocumentModalOpen] = useState(false)
  const [selectedDocumentForEdit, setSelectedDocumentForEdit] = useState(null)
  const [documentForm, setDocumentForm] = useState(initialDocumentForm)

  const [renewModalOpen, setRenewModalOpen] = useState(false)
  const [selectedDocumentForRenew, setSelectedDocumentForRenew] = useState(null)
  const [renewForm, setRenewForm] = useState(initialRenewForm)

  const [message, setMessage] = useState(null)
  const [messageType, setMessageType] = useState('success') // success, error
  const { run } = useFetch()

  // Fetch Vehicles list
  const fetchVehicles = async () => {
    try {
      const response = await run(
        getVehicles({
          search: search || undefined,
          status: status || undefined,
          type_vehicle: typeVehicle !== 'all' ? typeVehicle : undefined,
          expired_docs_only: expiredDocsOnly ? 'true' : undefined
        })
      )
      const data = response.results || response
      setVehicles(data)
      
      // Keep activeVehicle updated if it exists
      if (activeVehicle) {
        const updated = data.find(v => v.id === activeVehicle.id)
        if (updated) {
          setActiveVehicle(updated)
        }
      }
    } catch (err) {
      showFeedback('Erreur lors du chargement des véhicules.', 'error')
    }
  }

  // Fetch Chauffeurs list
  const fetchDrivers = async () => {
    try {
      const response = await run(getDrivers())
      setDrivers(response.results || response)
    } catch (err) {
      console.error('Erreur lors du chargement des chauffeurs.', err)
    }
  }

  // Fetch Documents for selected vehicle
  const fetchVehicleDocuments = async (vehicleId) => {
    if (!vehicleId) return
    try {
      const response = await run(getDocuments({ vehicle: vehicleId }))
      setDocuments(response.results || response)
    } catch (err) {
      showFeedback('Erreur lors du chargement des documents.', 'error')
    }
  }

  // Fetch Renewal History for selected vehicle
  const fetchVehicleRenewalHistory = async (vehicleId) => {
    if (!vehicleId) return
    try {
      const response = await run(getRenewalHistory({ vehicle: vehicleId }))
      setRenewalHistory(response.results || response)
    } catch (err) {
      showFeedback('Erreur lors du chargement de l’historique des renouvellements.', 'error')
    }
  }

  useEffect(() => {
    fetchVehicles()
    fetchDrivers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, typeVehicle, expiredDocsOnly])

  // Triggered when activeVehicle changes or activeTab changes
  useEffect(() => {
    if (activeVehicle) {
      if (activeTab === 'documents') {
        fetchVehicleDocuments(activeVehicle.id)
      } else if (activeTab === 'history') {
        fetchVehicleRenewalHistory(activeVehicle.id)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeVehicle, activeTab])

  const showFeedback = (msg, type = 'success') => {
    setMessage(msg)
    setMessageType(type)
    setTimeout(() => {
      setMessage(null)
    }, 5000)
  }

  // Vehicle Submit
  const handleVehicleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...vehicleForm,
        mileage: vehicleForm.mileage ? parseInt(vehicleForm.mileage, 10) : null
      }
      if (selectedVehicleForEdit) {
        await run(updateVehicle(selectedVehicleForEdit.id, payload))
        showFeedback('Véhicule mis à jour avec succès.')
      } else {
        await run(createVehicle(payload))
        showFeedback('Véhicule créé avec succès.')
      }
      setVehicleModalOpen(false)
      setSelectedVehicleForEdit(null)
      setVehicleForm(initialVehicleForm)
      fetchVehicles()
    } catch (err) {
      showFeedback('Erreur lors de l’enregistrement du véhicule.', 'error')
    }
  }

  const handleEditVehicle = (vehicle) => {
    setSelectedVehicleForEdit(vehicle)
    setVehicleForm({
      registration: vehicle.registration || '',
      brand: vehicle.brand || '',
      model: vehicle.model || '',
      status: vehicle.status || 'active',
      mileage: vehicle.mileage || '',
      type_vehicle: vehicle.type_vehicle || 'tracteur'
    })
    setVehicleModalOpen(true)
  }

  const handleDeleteVehicle = async (vehicle) => {
    if (!window.confirm(`Supprimer le véhicule ${vehicle.registration} ? Toutes les données associées seront perdues.`)) {
      return
    }
    try {
      await run(deleteVehicle(vehicle.id))
      showFeedback('Véhicule supprimé.')
      if (activeVehicle?.id === vehicle.id) {
        setActiveVehicle(null)
      }
      fetchVehicles()
    } catch (err) {
      showFeedback('Impossible de supprimer le véhicule.', 'error')
    }
  }

  // Document Submit (Add / Edit)
  const handleDocumentSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...documentForm,
        vehicle: activeVehicle ? activeVehicle.id : null,
        chauffeur: documentForm.chauffeur || null
      }
      if (selectedDocumentForEdit) {
        await run(updateDocument(selectedDocumentForEdit.id, payload))
        showFeedback('Document mis à jour avec succès.')
      } else {
        await run(createDocument(payload))
        showFeedback('Document ajouté avec succès.')
      }
      setDocumentModalOpen(false)
      setSelectedDocumentForEdit(null)
      setDocumentForm(initialDocumentForm)
      fetchVehicleDocuments(activeVehicle.id)
      fetchVehicles() // Refresh counts
    } catch (err) {
      showFeedback('Erreur lors de l’enregistrement du document.', 'error')
    }
  }

  const handleEditDocument = (doc) => {
    setSelectedDocumentForEdit(doc)
    setDocumentForm({
      document_type: doc.document_type || 'visite_technique',
      date_debut: doc.date_debut || '',
      date_expiration: doc.date_expiration || '',
      periode: doc.periode || '1_an',
      remarque: doc.remarque || ''
    })
    setDocumentModalOpen(true)
  }

  const handleDeleteDocument = async (doc) => {
    if (!window.confirm(`Supprimer le document "${documentTypesMap[doc.document_type]}" ?`)) {
      return
    }
    try {
      await run(deleteDocument(doc.id))
      showFeedback('Document supprimé.')
      fetchVehicleDocuments(activeVehicle.id)
      fetchVehicles()
    } catch (err) {
      showFeedback('Impossible de supprimer le document.', 'error')
    }
  }

  // Document Renew Submit
  const handleRenewSubmit = async (e) => {
    e.preventDefault()
    try {
      await run(renewDocument(selectedDocumentForRenew.id, renewForm))
      showFeedback('Document renouvelé et historique archivé avec succès.')
      setRenewModalOpen(false)
      setSelectedDocumentForRenew(null)
      setRenewForm(initialRenewForm)
      fetchVehicleDocuments(activeVehicle.id)
      if (activeTab === 'history') {
        fetchVehicleRenewalHistory(activeVehicle.id)
      }
      fetchVehicles() // Refresh count
    } catch (err) {
      showFeedback('Erreur lors du renouvellement du document.', 'error')
    }
  }

  const handleOpenRenew = (doc) => {
    setSelectedDocumentForRenew(doc)
    setRenewForm({
      date_debut: '',
      date_expiration: '',
      periode: doc.periode || '1_an',
      remarque: `Renouvellement du document ${documentTypesMap[doc.document_type]}`
    })
    setRenewModalOpen(true)
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'valide':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
            <FiCheckCircle className="h-3.5 w-3.5" /> Valide
          </span>
        )
      case 'expire_bientot':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400 border border-amber-500/20">
            <FiAlertTriangle className="h-3.5 w-3.5" /> Expire bientôt
          </span>
        )
      case 'expire':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-400 border border-rose-500/20">
            <FiXCircle className="h-3.5 w-3.5" /> Expiré
          </span>
        )
      default:
        return null
    }
  }

  const getVehicleStatusBadge = (status) => {
    switch (status) {
      case 'active':
      case 'disponible':
        return (
          <span className="inline-block rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/20">
            Actif
          </span>
        )
      case 'maintenance':
        return (
          <span className="inline-block rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400 border border-amber-500/20">
            Maintenance
          </span>
        )
      default:
        return (
          <span className="inline-block rounded-full bg-slate-500/10 px-2 py-0.5 text-xs font-medium text-slate-400 border border-slate-800">
            Inactif
          </span>
        )
    }
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 rounded-[2rem] border border-slate-800 bg-slate-900/95 p-6 shadow-lg shadow-slate-950/20 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Gestion Administrative</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Véhicules & Documents</h2>
        </div>
        <button
          onClick={() => {
            setSelectedVehicleForEdit(null)
            setVehicleForm(initialVehicleForm)
            setVehicleModalOpen(true)
          }}
          className="inline-flex items-center gap-2 rounded-3xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 shadow-lg shadow-emerald-500/10"
        >
          <FiPlus className="h-4 w-4" /> Ajouter un véhicule
        </button>
      </div>

      {/* Global feedback message */}
      {message && (
        <div className={`rounded-3xl border p-4 text-sm flex items-center gap-2 ${
          messageType === 'success' 
            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' 
            : 'border-rose-500/40 bg-rose-500/10 text-rose-300'
        }`}>
          {messageType === 'success' ? <FiCheckCircle className="h-5 w-5" /> : <FiAlertTriangle className="h-5 w-5" />}
          <span>{message}</span>
        </div>
      )}

      {/* Main Layout Grid */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 xl:grid-cols-[0.55fr_0.45fr]">
        
        {/* LEFT COLUMN: Vehicle search & list */}
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-800 bg-slate-900/95 p-6 shadow-lg shadow-slate-950/20">
            <h3 className="mb-4 text-lg font-medium text-white">Flotte Automobile</h3>
            
            {/* Filters panel */}
            <div className="mb-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              <div className="rounded-3xl border border-slate-800 bg-slate-950 p-3 flex flex-col justify-center">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 px-1">Recherche</p>
                <div className="mt-1.5 flex items-center gap-2 px-1">
                  <FiSearch className="h-3.5 w-3.5 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchVehicles()}
                    placeholder="Immatriculation..."
                    className="w-full bg-transparent text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-950 p-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 px-1">Type</p>
                <select
                  value={typeVehicle}
                  onChange={(e) => setTypeVehicle(e.target.value)}
                  className="mt-1 w-full bg-transparent text-xs text-white outline-none cursor-pointer"
                >
                  <option className="bg-slate-905 text-white" value="all">Tous types</option>
                  <option className="bg-slate-905 text-white" value="tracteur">Tracteur</option>
                  <option className="bg-slate-905 text-white" value="remorque">Remorque</option>
                </select>
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-950 p-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 px-1">État</p>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="mt-1 w-full bg-transparent text-xs text-white outline-none cursor-pointer"
                >
                  <option value="">Tous états</option>
                  <option value="active">Actif</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="inactive">Inactif</option>
                </select>
              </div>
            </div>

            {/* Expired Docs Toggle */}
            <div className="mb-6 flex items-center justify-between rounded-2xl bg-rose-500/5 border border-rose-500/10 px-4 py-3">
              <label htmlFor="expired-docs-toggle" className="text-xs text-rose-300 font-medium cursor-pointer">
                Afficher uniquement les véhicules avec documents expirés
              </label>
              <input
                id="expired-docs-toggle"
                type="checkbox"
                checked={expiredDocsOnly}
                onChange={(e) => setExpiredDocsOnly(e.target.checked)}
                className="h-4 w-4 rounded border-slate-800 bg-slate-950 text-rose-500 focus:ring-rose-500 focus:ring-offset-slate-900 cursor-pointer"
              />
            </div>

            {/* Apply button & Reset */}
            <div className="mb-6 flex gap-2">
              <button
                onClick={fetchVehicles}
                className="flex-1 rounded-3xl bg-slate-800 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-700"
              >
                Appliquer les filtres
              </button>
              <button
                onClick={() => {
                  setSearch('')
                  setStatus('')
                  setTypeVehicle('all')
                  setExpiredDocsOnly(false)
                  setTimeout(fetchVehicles, 50)
                }}
                className="rounded-3xl border border-slate-800 px-4 py-2.5 text-xs text-slate-400 hover:text-white transition"
              >
                Réinitialiser
              </button>
            </div>

            {/* Vehicles Table */}
            <DataTable
              columns={[
                { 
                  key: 'registration', 
                  header: 'Immatriculation',
                  render: (item) => (
                    <div className="flex flex-col gap-1">
                      <span className="font-mono font-medium text-white">{item.registration}</span>
                      {item.is_compliant === false && (
                        <span className="inline-flex items-center gap-0.5 rounded bg-rose-500/10 px-1.5 py-0.5 text-[9px] font-bold text-rose-400 border border-rose-500/20 w-fit">
                          Non conforme
                        </span>
                      )}
                    </div>
                  )
                },
                { 
                  key: 'type_vehicle', 
                  header: 'Type',
                  render: (item) => (
                    <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase ${
                      item.type_vehicle === 'tracteur' 
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                        : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    }`}>
                      {item.type_vehicle}
                    </span>
                  )
                },
                { 
                  key: 'brand', 
                  header: 'Marque/Modèle',
                  render: (item) => `${item.brand} ${item.model || ''}`
                },
                { 
                  key: 'status', 
                  header: 'État', 
                  render: (item) => getVehicleStatusBadge(item.status) 
                },
                {
                  key: 'actions',
                  header: '',
                  render: (item) => (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        setActiveVehicle(item)
                      }}
                      className={`rounded-2xl px-3 py-1.5 text-xs font-medium transition ${
                        activeVehicle?.id === item.id 
                          ? 'bg-emerald-500 text-slate-950 font-semibold' 
                          : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                      }`}
                    >
                      Détails
                    </button>
                  ),
                },
              ]}
              data={vehicles}
              onRowClick={(item) => setActiveVehicle(item)}
            />
          </div>
        </div>

        {/* RIGHT COLUMN: Selected vehicle details panel (Tabs) */}
        <div>
          {activeVehicle ? (
            <div className="rounded-[2rem] border border-slate-800 bg-slate-900/95 p-6 shadow-lg shadow-slate-950/20 space-y-6">
              
              {/* Header Details */}
              <div className="flex flex-col gap-3 border-b border-slate-800 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Véhicule Sélectionné</span>
                    <h3 className="text-2xl font-bold text-white mt-0.5 font-mono">{activeVehicle.registration}</h3>
                    <p className="text-sm text-slate-400 mt-1">
                      {activeVehicle.brand} {activeVehicle.model} — {activeVehicle.type_vehicle === 'tracteur' ? 'Tracteur' : 'Remorque'}
                    </p>
                  </div>
                  {getVehicleStatusBadge(activeVehicle.status)}
                </div>
                {activeVehicle.is_compliant === false && (
                  <div className="flex items-center gap-2 rounded-2xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs font-medium text-rose-400">
                    <FiAlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
                    <span>Attention : Ce véhicule est non conforme en raison de documents obligatoires expirés. Affectation aux missions bloquée.</span>
                  </div>
                )}
              </div>

              {/* Tab Navigation */}
              <div className="flex rounded-2xl bg-slate-950 p-1 border border-slate-850">
                <button
                  onClick={() => setActiveTab('infos')}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition ${
                    activeTab === 'infos' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FiInfo className="h-4 w-4" /> Infos
                </button>
                <button
                  onClick={() => setActiveTab('documents')}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition ${
                    activeTab === 'documents' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FiFileText className="h-4 w-4" /> Documents
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition ${
                    activeTab === 'history' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FiClock className="h-4 w-4" /> Historique
                </button>
              </div>

              {/* TAB 1: General Infos */}
              {activeTab === 'infos' && (
                <div className="space-y-6 animation-fade-in">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-slate-850 bg-slate-950 p-4">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500">Marque</p>
                      <p className="text-base font-semibold text-white mt-1">{activeVehicle.brand}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-850 bg-slate-950 p-4">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500">Modèle</p>
                      <p className="text-base font-semibold text-white mt-1">{activeVehicle.model || 'N/A'}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-850 bg-slate-950 p-4">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500">Type administratif</p>
                      <p className="text-base font-semibold text-white mt-1 capitalize">{activeVehicle.type_vehicle}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-850 bg-slate-950 p-4">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500">Kilométrage</p>
                      <p className="text-base font-semibold text-white mt-1">
                        {activeVehicle.mileage !== null ? `${activeVehicle.mileage.toLocaleString()} km` : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-slate-850">
                    <button
                      onClick={() => handleEditVehicle(activeVehicle)}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-800 hover:bg-slate-700 py-3 text-xs font-semibold text-white transition"
                    >
                      <FiEdit2 className="h-3.5 w-3.5" /> Modifier les informations
                    </button>
                    <button
                      onClick={() => handleDeleteVehicle(activeVehicle)}
                      className="inline-flex items-center justify-center rounded-2xl bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/20 px-4 py-3 text-xs font-semibold text-rose-400 transition"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: Documents & Expirations */}
              {activeTab === 'documents' && (
                <div className="space-y-4 animation-fade-in">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-white">Documents administratifs ({documents.length})</h4>
                    <button
                      onClick={() => {
                        setSelectedDocumentForEdit(null)
                        setDocumentForm(initialDocumentForm)
                        setDocumentModalOpen(true)
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-400 transition"
                    >
                      <FiPlus className="h-3.5 w-3.5" /> Ajouter un doc
                    </button>
                  </div>

                  {documents.length === 0 ? (
                    <div className="text-center py-12 rounded-3xl border border-dashed border-slate-800 bg-slate-950/20">
                      <FiFileText className="h-10 w-10 text-slate-600 mx-auto" />
                      <p className="mt-2 text-sm text-slate-400 font-medium">Aucun document administratif</p>
                      <p className="mt-1 text-xs text-slate-500">Ajoutez des documents d'assurance ou de visite technique.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                      {documents.map((doc) => (
                        <div key={doc.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h5 className="font-semibold text-white text-sm">
                                {documentTypesMap[doc.document_type] || doc.document_type}
                              </h5>
                              {doc.numero_document && (
                                <p className="text-xs text-slate-400 font-mono mt-0.5">N° {doc.numero_document}</p>
                              )}
                              {doc.chauffeur_name && (
                                <p className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
                                  <FiUser className="h-3.5 w-3.5" /> Chauffeur : {doc.chauffeur_name}
                                </p>
                              )}
                              <p className="text-[10px] text-slate-500 mt-0.5">Périodicité: {periodeMap[doc.periode] || doc.periode}</p>
                            </div>
                            {getStatusBadge(doc.statut)}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-xs bg-slate-900/50 rounded-xl p-2.5 border border-slate-900">
                            <div>
                              <span className="text-[10px] text-slate-500 block uppercase font-medium">Début</span>
                              <span className="text-slate-300 font-mono font-medium">{doc.date_debut}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 block uppercase font-medium">Échéance</span>
                              <span className="text-slate-300 font-mono font-medium">{doc.date_expiration}</span>
                            </div>
                          </div>

                          {doc.remarque && (
                            <p className="text-xs text-slate-400 bg-slate-900/30 p-2 rounded-lg italic">
                              "{doc.remarque}"
                            </p>
                          )}

                          <div className="flex gap-2 pt-2 border-t border-slate-900">
                            <button
                              onClick={() => handleOpenRenew(doc)}
                              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 text-slate-950 font-semibold py-2 text-xs hover:bg-emerald-400 transition"
                            >
                              <FiClock className="h-3.5 w-3.5" /> Renouveler
                            </button>
                            <button
                              onClick={() => handleEditDocument(doc)}
                              className="inline-flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 p-2 text-xs text-slate-300 transition"
                              title="Modifier"
                            >
                              <FiEdit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteDocument(doc)}
                              className="inline-flex items-center justify-center rounded-xl bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/20 p-2 text-xs text-rose-400 transition"
                              title="Supprimer"
                            >
                              <FiTrash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: Renewal History */}
              {activeTab === 'history' && (
                <div className="space-y-4 animation-fade-in">
                  <h4 className="text-sm font-semibold text-white mb-2">Historique des renouvellements</h4>
                  
                  {renewalHistory.length === 0 ? (
                    <div className="text-center py-12 rounded-3xl border border-dashed border-slate-800 bg-slate-950/20">
                      <FiClock className="h-10 w-10 text-slate-600 mx-auto" />
                      <p className="mt-2 text-sm text-slate-400 font-medium">Historique vide</p>
                      <p className="mt-1 text-xs text-slate-500">Les archives apparaîtront après le renouvellement d'un document.</p>
                    </div>
                  ) : (
                    <div className="relative border-l border-slate-800 ml-3 space-y-6 max-h-[400px] overflow-y-auto pr-1">
                      {renewalHistory.map((item) => (
                        <div key={item.id} className="relative pl-6">
                          {/* Dot indicator */}
                          <div className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full bg-emerald-500 border border-slate-900 shadow-md shadow-emerald-500/20" />
                          
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-white">
                                {documentTypesMap[item.document_type_display] || item.document_type_display}
                                {item.chauffeur_name && ` (Chauffeur: ${item.chauffeur_name})`}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {new Date(item.modified_at).toLocaleDateString()}
                              </span>
                            </div>
                            
                            <p className="text-xs text-slate-400">
                              L'échéance est passée de <span className="font-mono text-rose-400 font-medium">{item.ancienne_date_expiration}</span> à <span className="font-mono text-emerald-400 font-medium">{item.nouvelle_date_expiration}</span>.
                            </p>

                            {item.commentaire && (
                              <p className="text-xs text-slate-400 italic bg-slate-950/40 p-2 rounded-xl border border-slate-800">
                                "{item.commentaire}"
                              </p>
                            )}

                            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                              <FiUser className="h-3 w-3" /> Modifié par : <span className="text-slate-400">{item.modified_by_username}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          ) : (
            /* PLACEHOLDER: No selected vehicle */
            <div className="h-full rounded-[2rem] border border-slate-800 bg-slate-900/95 p-8 shadow-lg shadow-slate-950/20 flex flex-col items-center justify-center text-center py-20">
              <div className="rounded-full bg-slate-950 p-6 border border-slate-850 shadow-inner">
                <FiInfo className="h-10 w-10 text-emerald-500" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">Aucun véhicule sélectionné</h3>
              <p className="mt-2 text-sm text-slate-400 max-w-sm">
                Sélectionnez un véhicule dans la liste pour visualiser ses détails, gérer ses documents administratifs (Assurance, Visite technique) et consulter l'historique complet des renouvellements.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* ─── MODAL 1: ADD/EDIT VEHICLE ──────────────────────────────────────── */}
      {vehicleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-[2.5rem] border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-6">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Administration</p>
              <h3 className="text-xl font-bold text-white mt-1">
                {selectedVehicleForEdit ? 'Modifier véhicule' : 'Ajouter un véhicule'}
              </h3>
            </div>
            
            <form onSubmit={handleVehicleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Type de véhicule</label>
                <select
                  name="type_vehicle"
                  value={vehicleForm.type_vehicle}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, type_vehicle: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none cursor-pointer focus:border-emerald-500"
                >
                  <option value="tracteur">Tracteur</option>
                  <option value="remorque">Remorque</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Immatriculation</label>
                <input
                  name="registration"
                  value={vehicleForm.registration}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, registration: e.target.value })}
                  required
                  placeholder="EX: AA-123-BB"
                  className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Marque</label>
                  <input
                    name="brand"
                    value={vehicleForm.brand}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, brand: e.target.value })}
                    required
                    placeholder="EX: Volvo"
                    className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Modèle</label>
                  <input
                    name="model"
                    value={vehicleForm.model}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                    placeholder="EX: FH16"
                    className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Kilométrage</label>
                  <input
                    type="number"
                    name="mileage"
                    value={vehicleForm.mileage}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, mileage: e.target.value })}
                    placeholder="EX: 150000"
                    className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">État</label>
                  <select
                    name="status"
                    value={vehicleForm.status}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, status: e.target.value })}
                    className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none cursor-pointer focus:border-emerald-500"
                  >
                    <option value="active">Actif</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="inactive">Inactif</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setVehicleModalOpen(false)}
                  className="flex-1 rounded-2xl border border-slate-800 py-3 text-xs font-semibold text-slate-400 hover:text-white transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-2xl bg-emerald-500 hover:bg-emerald-400 py-3 text-xs font-semibold text-slate-950 transition"
                >
                  {selectedVehicleForEdit ? 'Sauvegarder' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: ADD/EDIT DOCUMENT ────────────────────────────────────── */}
      {documentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-[2.5rem] border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-6">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Documents administratifs</p>
              <h3 className="text-xl font-bold text-white mt-1">
                {selectedDocumentForEdit ? 'Modifier le document' : 'Ajouter un document'}
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-1">Véhicule : {activeVehicle.registration}</p>
            </div>
            
            <form onSubmit={handleDocumentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Type de document</label>
                <select
                  value={documentForm.document_type}
                  onChange={(e) => setDocumentForm({ ...documentForm, document_type: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none cursor-pointer focus:border-emerald-500"
                >
                  {Object.entries(documentTypesMap).map(([key, value]) => (
                    <option key={key} value={key}>{value}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Numéro du document</label>
                <input
                  type="text"
                  placeholder="EX: POL-987654"
                  value={documentForm.numero_document || ''}
                  onChange={(e) => setDocumentForm({ ...documentForm, numero_document: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Chauffeur concerné (Optionnel)</label>
                <select
                  value={documentForm.chauffeur || ''}
                  onChange={(e) => setDocumentForm({ ...documentForm, chauffeur: e.target.value || '' })}
                  className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none cursor-pointer focus:border-emerald-500"
                >
                  <option value="">-- Aucun (Lié uniquement au véhicule) --</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Date de début</label>
                  <input
                    type="date"
                    required
                    value={documentForm.date_debut}
                    onChange={(e) => setDocumentForm({ ...documentForm, date_debut: e.target.value })}
                    className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Date d'échéance</label>
                  <input
                    type="date"
                    required
                    value={documentForm.date_expiration}
                    onChange={(e) => setDocumentForm({ ...documentForm, date_expiration: e.target.value })}
                    className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Périodicité</label>
                <select
                  value={documentForm.periode}
                  onChange={(e) => setDocumentForm({ ...documentForm, periode: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none cursor-pointer focus:border-emerald-500"
                >
                  <option value="3_mois">3 mois</option>
                  <option value="6_mois">6 mois</option>
                  <option value="1_an">1 an</option>
                  <option value="autre">Autre</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Remarque (Optionnel)</label>
                <textarea
                  rows="2"
                  value={documentForm.remarque}
                  onChange={(e) => setDocumentForm({ ...documentForm, remarque: e.target.value })}
                  placeholder="Notes diverses, numéro de contrat..."
                  className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setDocumentModalOpen(false)}
                  className="flex-1 rounded-2xl border border-slate-800 py-3 text-xs font-semibold text-slate-400 hover:text-white transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-2xl bg-emerald-500 hover:bg-emerald-400 py-3 text-xs font-semibold text-slate-950 transition"
                >
                  {selectedDocumentForEdit ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: RENEW DOCUMENT ───────────────────────────────────────── */}
      {renewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-[2.5rem] border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-6">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Renouvellement administratif</p>
              <h3 className="text-xl font-bold text-white mt-1">
                Renouveler : {documentTypesMap[selectedDocumentForRenew?.document_type]}
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Immatriculation : {activeVehicle.registration} | Ancienne échéance : <span className="text-rose-400 font-semibold">{selectedDocumentForRenew?.date_expiration}</span>
              </p>
            </div>
            
            <form onSubmit={handleRenewSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Nouveau début</label>
                  <input
                    type="date"
                    required
                    value={renewForm.date_debut}
                    onChange={(e) => setRenewForm({ ...renewForm, date_debut: e.target.value })}
                    className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Nouvel échéance</label>
                  <input
                    type="date"
                    required
                    value={renewForm.date_expiration}
                    onChange={(e) => setRenewForm({ ...renewForm, date_expiration: e.target.value })}
                    className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Périodicité du contrat</label>
                <select
                  value={renewForm.periode}
                  onChange={(e) => setRenewForm({ ...renewForm, periode: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none cursor-pointer focus:border-emerald-500"
                >
                  <option value="3_mois">3 mois</option>
                  <option value="6_mois">6 mois</option>
                  <option value="1_an">1 an</option>
                  <option value="autre">Autre</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Remarque / Référence</label>
                <textarea
                  rows="2"
                  value={renewForm.remarque}
                  onChange={(e) => setRenewForm({ ...renewForm, remarque: e.target.value })}
                  placeholder="Notes sur la nouvelle prime, le fournisseur..."
                  className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setRenewModalOpen(false)}
                  className="flex-1 rounded-2xl border border-slate-800 py-3 text-xs font-semibold text-slate-400 hover:text-white transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-2xl bg-emerald-500 hover:bg-emerald-400 py-3 text-xs font-semibold text-slate-950 transition shadow-lg shadow-emerald-500/10"
                >
                  Valider le renouvellement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
