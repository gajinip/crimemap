import type { Locale } from './locales'

/**
 * Per-locale overrides, keyed by the English source string (or a stable key for
 * domain values). English is intentionally empty: `translate` returns the key.
 *
 * Static UI strings are wrapped at the call site with `t('English text')`.
 * Domain values use namespaced keys such as `category.Theft` / `risk.High`.
 */
export type Messages = Record<string, string>

export const messages: Partial<Record<Locale, Messages>> = {
  en: {
    'prediction.predicted': 'Predicted',
    'prediction.measured': 'Measured',
  },

  ta: {
    // Domain: crime categories
    'category.Theft': 'திருட்டு',
    'category.Robbery': 'கொள்ளை',
    'category.Assault': 'தாக்குதல்',
    'category.Burglary': 'வீட்டு உட்குடையல்',
    'category.Vehicle Theft': 'வாகனத் திருட்டு',
    'category.Fraud': 'மோசடி',
    'category.Other': 'மற்றவை',

    // Domain: incident status
    'status.Reported': 'புகாரளிக்கப்பட்டது',
    'status.Under Investigation': 'விசாரணையில்',
    'status.Closed': 'முடிக்கப்பட்டது',

    // Domain: risk levels & severities
    'risk.Low': 'குறைந்த',
    'risk.Medium': 'நடுத்தர',
    'risk.High': 'உயர்',
    'risk.Critical': 'மிக உயர்',
    'severity.Low': 'குறைந்த',
    'severity.Medium': 'நடுத்தர',
    'severity.High': 'உயர்',
    'severity.Critical': 'மிக உயர்',

    // Domain: trend direction
    'trend.Rising': 'அதிகரிக்கிறது',
    'trend.Stable': 'நிலையானது',
    'trend.Declining': 'குறைகிறது',

    // Domain: hotspot status
    'hotspot.Active': 'செயலில்',
    'hotspot.Monitoring': 'கண்காணிப்பில்',
    'hotspot.Contained': 'கட்டுப்பாட்டில்',

    // Domain: patrol status
    'patrol.Standby': 'காத்திருப்பு',
    'patrol.Deploying': 'அனுப்பப்படுகிறது',
    'patrol.Patrolling': 'ரோந்து',

    // Navigation
    Dashboard: 'டாஷ்போர்டு',
    'Crime Map': 'குற்ற வரைபடம்',
    'Risk Zones': 'ஆபத்து மண்டலங்கள்',
    'Crime Trends': 'குற்றப் போக்குகள்',
    Intelligence: 'நுழைவறிவு',
    'Risk Forecast': 'ஆபத்து முன்னறிவிப்பு',
    'Patrol Simulation': 'ரோந்து உருவகப்படுத்துதல்',
    'Police Stations': 'காவல் நிலையங்கள்',
    Reports: 'அறிக்கைகள்',

    // Language switcher
    Language: 'மொழி',

    // Demo banner
    'Demo data - not real crime information': 'டெமோ தரவு - உண்மையான குற்றத் தகவல் அல்ல',
    'Synthetic sample records for interface demonstration only. No real incidents, victims or police reports are shown.':
      'இடைமுக ஆர்ப்பாட்டத்திற்கான செயற்கை மாதிரிப் பதிவுகள் மட்டுமே. உண்மையான சம்பவங்கள், பாதிக்கப்பட்டவர்கள் அல்லது காவல் அறிக்கைகள் எதுவும் காட்டப்படவில்லை.',

    // Search
    'Search incidents, areas, IDs…': 'சம்பவங்கள், பகுதிகள், ஐடிகள் தேடுங்கள்…',
    'Search incidents': 'சம்பவங்களைத் தேடு',
    'Clear search': 'தேடலை அழி',
  },

  fr: {
    // Domain: crime categories
    'category.Theft': 'Vol',
    'category.Robbery': 'Vol qualifié',
    'category.Assault': 'Agression',
    'category.Burglary': 'Cambriolage',
    'category.Vehicle Theft': 'Vol de véhicule',
    'category.Fraud': 'Fraude',
    'category.Other': 'Autre',

    // Domain: incident status
    'status.Reported': 'Signalé',
    'status.Under Investigation': "En cours d'enquête",
    'status.Closed': 'Clôturé',

    // Domain: risk levels & severities
    'risk.Low': 'Faible',
    'risk.Medium': 'Moyen',
    'risk.High': 'Élevé',
    'risk.Critical': 'Critique',
    'severity.Low': 'Faible',
    'severity.Medium': 'Moyen',
    'severity.High': 'Élevé',
    'severity.Critical': 'Critique',

    // Domain: trend direction
    'trend.Rising': 'En hausse',
    'trend.Stable': 'Stable',
    'trend.Declining': 'En baisse',

    // Domain: hotspot status
    'hotspot.Active': 'Actif',
    'hotspot.Monitoring': 'Sous surveillance',
    'hotspot.Contained': 'Contenu',

    // Domain: patrol status
    'patrol.Standby': 'En attente',
    'patrol.Deploying': 'Déploiement',
    'patrol.Patrolling': 'En patrouille',

    // Navigation
    Dashboard: 'Tableau de bord',
    'Crime Map': 'Carte des crimes',
    'Risk Zones': 'Zones à risque',
    'Crime Trends': 'Tendances criminelles',
    Intelligence: 'Renseignements',
    'Risk Forecast': 'Prévision des risques',
    'Patrol Simulation': 'Simulation de patrouille',
    'Police Stations': 'Commissariats',
    Reports: 'Rapports',

    // Language switcher
    Language: 'Langue',

    // Demo banner
    'Demo data - not real crime information':
      'Données de démonstration — informations criminelles fictives',
    'Synthetic sample records for interface demonstration only. No real incidents, victims or police reports are shown.':
      "Enregistrements synthétiques à des fins de démonstration uniquement. Aucun incident, victime ou rapport de police réel n'est affiché.",

    // Search
    'Search incidents, areas, IDs…': 'Rechercher des incidents, zones, identifiants…',
    'Search incidents': 'Rechercher des incidents',
    'Clear search': 'Effacer la recherche',
  },
}
