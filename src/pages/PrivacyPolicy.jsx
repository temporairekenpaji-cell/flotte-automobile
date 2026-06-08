import { Link, useNavigate } from 'react-router-dom'
import { FiArrowLeft, FiShield } from 'react-icons/fi'

export default function PrivacyPolicy() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-10">
      {/* Header */}
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-emerald-400 transition mb-8"
        >
          <FiArrowLeft className="h-4 w-4" />
          Retour
        </button>

        <div className="flex items-center gap-3 mb-2">
          <FiShield className="h-7 w-7 text-emerald-400" />
          <p className="text-xs uppercase tracking-widest text-emerald-400">Conformité légale</p>
        </div>
        <h1 className="text-4xl font-semibold text-white mb-2">Politique de confidentialité</h1>
        <p className="text-sm text-slate-500 mb-10">Dernière mise à jour : Juin 2026</p>

        {/* Sections */}
        <div className="space-y-8 text-slate-300 leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-white mb-3 border-b border-slate-800 pb-2">
              1. Données collectées
            </h2>
            <p>
              Dans le cadre de l'utilisation de l'application de gestion de flotte, les données
              suivantes sont collectées et enregistrées :
            </p>
            <ul className="mt-3 space-y-1 list-disc list-inside text-slate-400">
              <li>Informations sur les véhicules (immatriculation, marque, modèle, état, kilométrage)</li>
              <li>Informations sur les chauffeurs (nom, prénom, téléphone, permis de conduire, statut)</li>
              <li>Documents administratifs (carte grise, assurance, visite technique, etc.)</li>
              <li>Données opérationnelles (missions, maintenances, carburant, péages, contrôles routiers)</li>
              <li>Données de connexion (adresse e-mail, mot de passe chiffré, horodatage des sessions)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3 border-b border-slate-800 pb-2">
              2. Finalité de la collecte
            </h2>
            <p>
              Les données collectées sont utilisées exclusivement dans le cadre de la gestion opérationnelle
              de la flotte automobile de l'entreprise. Aucune donnée n'est collectée à des fins
              commerciales, publicitaires ou de profilage.
            </p>
            <ul className="mt-3 space-y-1 list-disc list-inside text-slate-400">
              <li>Gestion et suivi des véhicules et de leur conformité administrative</li>
              <li>Planification et suivi des missions et des chauffeurs</li>
              <li>Gestion des coûts opérationnels (carburant, maintenance, péages)</li>
              <li>Génération d'alertes et de notifications d'expiration de documents</li>
              <li>Audit et traçabilité des actions administratives</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3 border-b border-slate-800 pb-2">
              3. Utilisation et protection des données
            </h2>
            <p>
              Les données sont stockées dans une base de données PostgreSQL hébergée sur un serveur sécurisé.
              Les mesures de sécurité suivantes sont appliquées :
            </p>
            <ul className="mt-3 space-y-1 list-disc list-inside text-slate-400">
              <li>Authentification obligatoire par identifiant et mot de passe</li>
              <li>Mots de passe chiffrés (hachage algorithmique — aucun stockage en clair)</li>
              <li>Accès à l'API sécurisé par des jetons JWT à durée limitée</li>
              <li>Communication chiffrée via HTTPS (TLS)</li>
              <li>Accès aux données limité aux seules personnes autorisées</li>
              <li>Journalisation des actions pour traçabilité et audit</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3 border-b border-slate-800 pb-2">
              4. Partage des données
            </h2>
            <p>
              Aucune donnée personnelle ou opérationnelle n'est partagée avec des tiers non autorisés.
              Les données restent strictement internes à l'entreprise et ne sont pas vendues, louées
              ou cédées à des partenaires externes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3 border-b border-slate-800 pb-2">
              5. Durée de conservation
            </h2>
            <p>
              Les données sont conservées aussi longtemps que nécessaire pour assurer la continuité
              opérationnelle de l'entreprise. Les données peuvent être supprimées manuellement par
              l'administrateur depuis l'interface de gestion. Les journaux d'audit sont conservés
              à des fins de traçabilité et de conformité interne.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3 border-b border-slate-800 pb-2">
              6. Vos droits
            </h2>
            <p>
              Conformément aux réglementations applicables en matière de protection des données,
              vous disposez des droits suivants :
            </p>
            <ul className="mt-3 space-y-1 list-disc list-inside text-slate-400">
              <li>Droit d'accès à vos données personnelles</li>
              <li>Droit de rectification en cas d'informations inexactes</li>
              <li>Droit de suppression dans les conditions prévues par la loi</li>
              <li>Droit d'opposition au traitement de vos données</li>
            </ul>
            <p className="mt-3">
              Pour exercer ces droits, veuillez contacter l'administrateur de l'application.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3 border-b border-slate-800 pb-2">
              7. Modifications
            </h2>
            <p>
              Cette politique de confidentialité peut être mise à jour à tout moment afin de
              refléter les évolutions légales ou les changements apportés à l'application.
              L'administrateur sera informé de toute modification significative.
            </p>
          </section>

        </div>

        {/* Footer links */}
        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-wrap gap-4 text-sm text-slate-500">
          <Link to="/terms-of-use" className="hover:text-emerald-400 transition">Conditions d'utilisation</Link>
          <span>·</span>
          <Link to="/login" className="hover:text-emerald-400 transition">Retour à la connexion</Link>
        </div>
      </div>
    </div>
  )
}
