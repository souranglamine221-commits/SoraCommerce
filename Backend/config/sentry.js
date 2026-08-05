const Sentry = require("@sentry/node");

// Ne pas initialiser Sentry en mode développement
if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "production",
    tracesSampleRate: 1.0,
    // Note: Les intégrations Http et Mongo ont été supprimées dans les versions récentes
    // Elles seront ajoutées si nécessaire avec la nouvelle API
    beforeSend(event, hint) {
      // Filter out errors in development
      if (process.env.NODE_ENV === 'development') {
        return null;
      }
      return event;
    },
  });
} else {
  console.log('🔧 Sentry désactivé en mode développement');
}

module.exports = Sentry;
