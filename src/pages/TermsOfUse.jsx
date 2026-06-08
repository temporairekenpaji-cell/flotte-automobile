import { Link, useNavigate } from 'react-router-dom'
import { FiArrowLeft, FiFileText } from 'react-icons/fi'

export default function TermsOfUse() {
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
          <FiFileText className="h-7 w-7 text-emerald-400" />
          <p className="text-xs uppercase tracking-widest text-emerald-400">Conformité légale</p>
        </div>
        <h1 className="text-4xl font-semibold text-white mb-2">Conditions d'utilisation</h1>
        <p className="text-sm text-slate-500 mb-10">Dernière mise à jour : Juin 2026</p>

        {/* Sections */}
        <div className="space-y-8 text-slate-300 leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-white mb-3 border-b border-slate-800 pb-2">
              1. Objet
            </h2>
            <p>
              Les présentes conditions d'utilisation régissent l'accès et l'utilisation de
              l'application de gestion de flotte automobile (ci-après "l'Application"). En
              accédant à l'Application et en vous y connectant, vous acceptez pleinement et
              sans réserve les présentes conditions.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3 border-b border-slate-800 pb-2">
              2. Accès et destination
            </h2>
            <p>
              L'Application est destinée exclusivement à la gestion interne de la flotte automobile
              de l'entreprise. Elle est réservée à l'administrateur désigné et ne peut être utilisée
              à d'autres fins que celles prévues par le gestionnaire de l'entreprise.
            </p>
            <ul className="mt-3 space-y-1 list-disc list-inside text-slate-400">
              <li>Accès réservé au compte administrateur autorisé</li>
              <li>Utilisation strictement professionnelle et interne</li>
              <li>Aucun accès public ou non autorisé ne sera toléré</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3 border-b border-slate-800 pb-2">
              3. Responsabilités de l'administrateur
            </h2>
            <p>L'administrateur de l'Application est seul responsable :</p>
            <ul className="mt-3 space-y-1 list-disc list-inside text-slate-400">
              <li>De l'exactitude et de la fiabilité des informations enregistrées</li>
              <li>De la sécurité de ses identifiants de connexion (email et mot de passe)</li>
              <li>Des actions réalisées depuis son compte</li>
              <li>De la gestion et de la mise à jour des données de la flotte</li>
              <li>De la conformité des données enregistrées aux réglementations en vigueur</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3 border-b border-slate-800 pb-2">
              4. Utilisations interdites
            </h2>
            <p>Il est strictement interdit de :</p>
            <ul className="mt-3 space-y-1 list-disc list-inside text-slate-400">
              <li>Partager ses identifiants de connexion avec des personnes non autorisées</li>
              <li>Utiliser l'Application à des fins personnelles, commerciales ou illicites</li>
              <li>Tenter de contourner les systèmes de sécurité de l'Application</li>
              <li>Enregistrer des données volontairement erronées, trompeuses ou malveillantes</li>
              <li>Exporter ou diffuser les données de l'Application sans autorisation</li>
              <li>Reproduire, modifier ou redistribuer l'Application sans autorisation expresse</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3 border-b border-slate-800 pb-2">
              5. Disponibilité et maintenance
            </h2>
            <p>
              L'Application est fournie en l'état. Des interruptions temporaires peuvent survenir
              pour des raisons de maintenance, de mises à jour ou de pannes techniques.
              L'éditeur ne garantit pas une disponibilité permanente et ininterrompue du service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3 border-b border-slate-800 pb-2">
              6. Propriété intellectuelle
            </h2>
            <p>
              L'Application, son interface, ses fonctionnalités et son code source sont la propriété
              exclusive de l'éditeur. Toute reproduction, représentation ou diffusion, totale ou
              partielle, sans autorisation écrite préalable est interdite.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3 border-b border-slate-800 pb-2">
              7. Limitation de responsabilité
            </h2>
            <p>
              L'éditeur ne saurait être tenu responsable des pertes de données, erreurs opérationnelles
              ou dommages directs ou indirects résultant de l'utilisation ou de l'impossibilité d'utiliser
              l'Application. L'utilisateur est seul responsable de l'utilisation qu'il fait des données
              et des informations enregistrées.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3 border-b border-slate-800 pb-2">
              8. Modifications des conditions
            </h2>
            <p>
              Ces conditions d'utilisation peuvent être modifiées à tout moment. Les modifications
              prennent effet dès leur publication dans l'Application. L'utilisation continue de
              l'Application après modification vaut acceptation des nouvelles conditions.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3 border-b border-slate-800 pb-2">
              9. Droit applicable
            </h2>
            <p>
              Les présentes conditions sont soumises au droit en vigueur dans le pays d'exploitation
              de l'entreprise. Tout litige relatif à leur interprétation ou leur exécution relève
              de la compétence des juridictions compétentes du lieu du siège de l'entreprise.
            </p>
          </section>

        </div>

        {/* Footer links */}
        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-wrap gap-4 text-sm text-slate-500">
          <Link to="/privacy-policy" className="hover:text-emerald-400 transition">Politique de confidentialité</Link>
          <span>·</span>
          <Link to="/login" className="hover:text-emerald-400 transition">Retour à la connexion</Link>
        </div>
      </div>
    </div>
  )
}
