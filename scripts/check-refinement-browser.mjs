// Retained entry point; each check has one implementation.
if (!process.argv.includes('--rotation-only')) await import('./check-premium-browser.mjs');
if (!process.argv.includes('--pages-only')) await import('./check-rotation-browser.mjs');
