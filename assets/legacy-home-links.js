// Preserve incoming links to sections of the former homepage.
const destinations = {
  '#intro':'/', '#hero':'/unternehmen/', '#services':'/unternehmen/#services',
  '#security-check':'/leistungen/security-check/', '#datenschutz-care':'/leistungen/datenschutz-care/', '#incident-readiness':'/leistungen/incident-readiness/',
  '#ueber':'/ueber-swissploit/', '#kontakt':'/ueber-swissploit/#kontakt', '#socials':'/ueber-swissploit/#socials',
  '#sicherheitslage':'/unternehmen/#services', '#prinzip':'/ueber-swissploit/', '#learn':'/learn/'
};
function followLegacyLink() { const href = destinations[location.hash]; if(href) location.replace(href); }
window.addEventListener('hashchange', followLegacyLink);
followLegacyLink();
