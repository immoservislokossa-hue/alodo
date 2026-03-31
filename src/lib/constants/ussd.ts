// Configuration de test pour le système USSD
// À utiliser dans l'environnement de développement

export const USSD_CONFIG = {
  // Numéros de test
  testProfiles: [
    {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Profil Test Vendeur",
      type: "vendeur",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440001",
      name: "Profil Test Prestataire",
      type: "prestataire",
    },
  ],

  // Shortcodes USSD
  shortcuts: [
    "*202#",      // Activer le service
    "*202*1#",    // Voir les opportunités
    "*202*2#",    // Voir mes candidatures
  ],

  // Messages système
  messages: {
    welcome: "📱 Bienvenue sur ALODO USSD\nComposez le numéro de votre profil",
    error: "❌ Une erreur est survenue. Veuillez réessayer",
    success: "✅ Opération réussie",
    loading: "⏳ Chargement...",
  },

  // Timeouts
  timeouts: {
    sessionTimeout: 5 * 60 * 1000,  // 5 minutes
    apiTimeout: 10000,              // 10 secondes
  },

  // Limites
  limits: {
    maxApplicationsPerDay: 10,
    maxOpportunitiesPerScreen: 10,
    maxSessionLength: 30 * 60 * 1000, // 30 minutes
  },

  // Options de debugging
  debug: {
    logMessages: false,       // Log tous les messages
    logApiCalls: false,       // Log les appels API
    verbose: false,           // Mode verbose
  },
};

// Types d'opportunités
export const OPPORTUNITY_TYPES = {
  employment: "Emploi",
  contract: "Contrat",
  internship: "Stage",
  training: "Formation",
  business: "Affaires",
};

// Statuts d'application
export const APPLICATION_STATUS = {
  pending: "En attente",
  accepted: "Acceptée",
  rejected: "Rejetée",
  interview: "Entretien",
  completed: "Complétée",
};

// Codes d'erreur USSD
export const USSD_ERROR_CODES = {
  INVALID_PROFILE: 1001,
  PROFILE_NOT_FOUND: 1002,
  NO_OPPORTUNITIES: 1003,
  OPPORTUNITY_NOT_FOUND: 1004,
  APPLICATION_FAILED: 1005,
  DUPLICATE_APPLICATION: 1006,
  SESSION_EXPIRED: 1007,
  RATE_LIMIT_EXCEEDED: 1008,
  DATABASE_ERROR: 1009,
};
