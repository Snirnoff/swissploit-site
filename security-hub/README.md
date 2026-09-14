# Swissploit Security Hub – lokale Vorschau

Die Website bleibt statisch. Der Hub lädt Security Intelligence über die in `index.html` gesetzte Basis-URL:

```html
<meta name="swissploit-security-data-base" content="/security-data/">
```

Der bestehende Preview-Server stellt `/security-data/` ausschliesslich lesend aus `C:\Git\swissploit-security-data\docs` bereit. Es werden keine Daten kopiert oder verändert.

## Start

Vom Verzeichnis `C:\Git\swissploit-site`:

```powershell
node security-hub/dev/server.mjs --port 4173
```

Dann `http://127.0.0.1:4173/security-hub/` öffnen. Für einen späteren statischen Produktionsendpunkt muss nur der Inhalt des Meta-Tags auf dessen HTTPS-Basis-URL geändert werden.

Beim Start lädt der Hub `manifest.json` und – falls ein Produktprofil gespeichert ist – nur die `brief.json`-Dateien dieser Produkte. `current.json` und `known-exploited.json` werden erst nach einer ausdrücklichen Benutzeraktion geladen und während der Browser-Sitzung im Speicher wiederverwendet.
