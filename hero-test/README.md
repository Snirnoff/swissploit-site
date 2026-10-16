# Hero-Test 3.1 – Interactive Particle Experience

Isolierte Vorschau unter **/hero-test/**. Die produktive Homepage, öffentliche Unterseiten, Quiz-/Game-Logik und Inhaltsquellen bleiben unverändert. Die Route bleibt `noindex, nofollow`; kein Sitemap-Eintrag, kein Commit oder Push.

## Lokal ansehen

```powershell
node scripts/preview.mjs
```

Vom Repository-Stamm starten, dann http://127.0.0.1:4173/hero-test/ öffnen. Statisches HTML, CSS und JavaScript ohne neue Dependencies.

## Dateien

- `hero-test/index.html`: bestehende Struktur, vereinfachtes Play-Icon, neue Business-Texte, deklarative Morph-Zuordnungen; dekorative Link-Pfeile und Statusbadge entfernt.
- `hero-test/hero-test.css`: isolierte Layer, responsive Partikelausläufer, abgestufte Gradient-Buttons und bestehende Layout-/Motion-Regeln.
- `hero-test/hero-test.js`: zentrale delegierte Pointer-/Fokussteuerung neben den bestehenden Karussells und Dialogen.
- `assets/security-core/security-core.js` und `.css`: bestehendes, ausschliesslich von Hero-Test importiertes Canvas-Custom-Element; erweiterte Formen, lokale Partikelreaktion und transparente Ausläufer.
- `hero-test/check-browser.mjs`: Browser-Regressionen mit dem vorhandenen Chrome/CDP-Harness.
- `scripts/services.test.mjs`: prüft die ehrliche Konzeptbeschreibung im Dialog statt des entfernten Statuslabels. Die Ausnahme für den alten Security-Awareness-Claim entfällt.

## Formen und Zustandssteuerung

| Modus | Partikelform | Auslöser |
| --- | --- | --- |
| `neutral` | Originales Swissploit-S | Kein aktiver Bereich, Über Swissploit |
| `shorts` | Play-Dreieck im Kreis | Shorts-Karte, Navigation, Video-Links |
| `learn` | Aufgeschlagenes Buch | Learn-Karte, Navigation, Artikel-Links |
| `quiz` | Dokument mit Lupe | Phishing-Quiz |
| `game` | Fisch | Phishing-Game |
| `security-check` | Haken mit vier Scan-Ecken | Security Check |
| `datenschutz-care` | Dokument mit Schutzschild | Datenschutz Care |
| `incident-readiness` | Signalsirene | Incident Readiness |
| `business` | Drei Gebäude | Unternehmensnavigation, Hero-CTA, Business-Panel |
| `quiz-games` | Fragezeichen im Kreis | Quiz & Games in der Navigation |

Die originale S-Maske stammt weiterhin aus dem transparenten Markenbild. SVG-Pfade dienen ausschliesslich als Koordinatenquellen. Zielpunkte werden pro Grössenprofil vorbereitet; 460 bzw. 880 Partikel behalten bei jeder Interaktion ihre Identität. Ein 780-ms-Smoothstep interpoliert von den aktuellen Positionen zur neuen Form. Unterbrochene Morphs werden direkt übernommen, ohne Timer-Warteschlange oder Neuaufbau.

Ein delegierter Controller liest `data-core` am nächsten passenden Element. Die letzte tatsächliche Pointerbewegung oder ein sichtbarer Tastaturfokus entscheidet über genau einen Zielmodus. Dynamisch geladene Links sind automatisch einbezogen. Beim Verlassen aller Bereiche, des Browserfensters, bei Fenster-Blur oder Escape wird zum S zurückgekehrt. Ein Scrollvorgang verwirft veraltete Pointer-Zuordnungen.

## Direkter Logo-Hover und Tiefe

Die Grafik bleibt vollständig `pointer-events: none`. Passive Pointer-Ereignisse auf dem Dokument liefern der Engine die Position; es gibt kein transparentes Overlay über Links. Nur im neutralen Modus und ausserhalb von Bedienelementen wird die lokale Reaktion zugelassen.

Partikel innerhalb eines Radius von 52 Szeneneinheiten weichen maximal 15 Einheiten aus. Exponentielle Dämpfung führt sie weich zurück. Kleine Tiefenunterschiede, variierende Punktgrössen und ein begrenzter Neigungswinkel ergänzen die ruhige Eigenbewegung. Die eigentlichen Morph-Koordinaten bleiben getrennt von den lokalen Offsets.

Auf grossen Desktops ist die S-Kernform 25 Prozent grösser. Ein kleiner Teil der oberen und unteren Punkte läuft mit abnehmender Deckkraft aus. Ein transparenter Canvas-Zeichenrand hält die Spitzen innerhalb der Zeichenfläche, während sie ihre Layoutzelle überragen. Texte/Navigation und Content liegen auf bewusst gesetzten Ebenen; die visuelle Schicht fängt niemals Klicks ab. Auf kleineren Geräten reduzieren CSS-Profile Grösse und Ausläufer.

Es gibt weiterhin genau einen `requestAnimationFrame`-Loop. Ausserhalb des Viewports, in inaktiven Tabs und bei geöffneten Dialogen/Navigation pausiert er. Resize-/Theme-/Intersection-Observer und komponenteneigene Listener werden beim Entfernen des Elements abgemeldet. Reduzierte Bewegung und Touchgeräte nutzen direkte Formwechsel ohne kontinuierliche Canvas-Bewegung.

## Buttons und Business

Primäre Learn-/Business-CTAs verwenden denselben hellblauen Verlauf mit dunkler Schrift. Die runden Karussell-Buttons verwenden eine etwas zurückhaltendere helle Variante; die Service-Buttons einen abgestuften, themespezifischen Verlauf. Gemeinsame Tokens halten Farben, Hover- und Pressed-Verhalten konsistent.

Alle dekorativen CTA-Pfeile sind entfernt. Die vier funktionalen Karussell-Pfeile bleiben erhalten. Das Shorts-Kartenicon ist ein mittig ausgerichtetes Play-Dreieck.

Die Business-Karte enthält den neuen Claim und drei Nutzenpunkte ohne Statusbadge. Der CTA „Learn for Business entdecken“ öffnet die bestehende Information mit ausdrücklich als Konzept beschriebenen Funktionen und Kontaktmöglichkeit; ohne JavaScript führt er zu `/#kontakt`. Keine Konten, Dashboards, Zertifikate oder Backend-Funktionen wurden implementiert.

## Bestehende Inhalte und Fallbacks

Die Karussells verwenden unverändert maximal zehn Einträge aus `/data/youtube-shorts.json` (15 datierte Shorts) und dem generierten `/learn/`-Index (17 Artikel). Shorts sind nach `publishedAt` sortiert; der bestehende Learn-Build sortiert nach `updated || date`. Keine neue Quelle, API oder Datenbank.

Manuelle Buttons, Tastaturaktivierung und Touch-Swipes bleiben erhalten. Die Tests prüfen schnelle Wechsel ohne Höhenänderung. Videos starten ausschliesslich nach Nutzeraktion; Schliessen entfernt den Player. Fehlerhafte oder leere Inhaltsabrufe lassen statische Links und deaktivierte Pfeile stehen.

## Verifikation

```powershell
node hero-test/check-browser.mjs
npm test
npm run check:seo
npm run check:headers
node --check hero-test/hero-test.js
node --check assets/security-core/security-core.js
```

Der vollständige Build wird in einer isolierten Kopie unter `.visual-check/hero-v31/build/` ausgeführt, damit produktive Dateien und vorhandene Änderungen nicht regeneriert werden. Für dieses Vanilla-JavaScript-Projekt sind keine separaten Lint- oder Typprüfungs-Skripte eingerichtet.

Der Browsertest deckt 320–1920 Pixel und beide Themes ab, einschliesslich One-Screen bei 1440 × 900 und 1920 × 1080, sichtbarer Partikelüberlappung ohne Canvas-Clipping, direktem Logo-Hover, neun Morph-Zielformen, Navigation/Services, schnellen Wechseln, Fensterverlassen, Tastatur, Touch, Dialogen, reduziertem Motion-Modus, Links und Inhalts-Fallbacks. Screenshots: `.visual-check/hero-test/`.

Nicht abgedeckt: Safari/Firefox, physische Mobilgeräte, vollständiger Screenreader-Audit und messbare Performance auf schwacher Hardware.

