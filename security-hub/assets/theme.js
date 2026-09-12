// Read the website preference; only write to the Hub's own storage namespace.
(() => {
  let theme = 'dark';
  try {
    const own = JSON.parse(localStorage.getItem('swissploit.hub.theme') || 'null');
    const shared = localStorage.getItem('swissploit-theme');
    const value = own?.schema_version === 1 ? own.value : shared;
    if (value === 'light' || value === 'dark') theme = value;
  } catch { /* Dark remains available without storage. */ }
  document.documentElement.dataset.theme = theme;
})();
