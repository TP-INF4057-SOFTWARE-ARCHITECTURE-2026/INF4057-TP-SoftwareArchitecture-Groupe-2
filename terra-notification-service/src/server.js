// server.js à la racine
import('./index.js').catch(err => {
  console.error('Failed to start:', err);
  process.exit(1);
});
