# Learn Design System v1 – Prüfprotokoll

Stand: 2026-09-15. Lokal umgesetzt, nicht veröffentlicht.

## Änderungen

- `assets/learn-article.css`: nur auf Artikelseiten geladen, Light/Dark-Leseflächen, rem-Typografie, Callouts inklusive lokaler SVG-Masken, Prüflisten, nummerierte Schritte, Merksatz, Figuren und FAQ.
- `scripts/build-posts.mjs` und `scripts/learn-article.mjs`: gekapselte Artikelklasse, keine doppelte automatische Key-Box/Subline, stabile Überschriftenanker und aufklappbare Inhaltsnavigation, Kommentare aus veröffentlichtem Inhalt entfernt, kompakte Hochkantvideos, dateibezogene Parserfehler, deterministisch sortierte Eingabedateien. Vorhandene Metadatenstruktur und Medien-Fallbacks bleiben kompatibel.
- Nur drei redaktionell überarbeitete Quellen: `posts/phishing-mails-erkennen/de.md` (766 Wörter), `posts/gefaehrliche-links-erkennen/de.md` (637), `posts/auf-phishing-geklickt/de.md` (957). Je drei Callouts; der längere Vorfallartikel behält seine situationsabhängigen Schutzmassnahmen.
- Alle drei Piloten haben wegen substanzieller Textüberarbeitung `updated: "2026-09-15"`. Ursprüngliche Daten, Slugs, IDs, Kategorie, Titel, SEO-Texte, Video-URL, reale Bilddateien und vorhandene Linkziele bleiben erhalten. Die Alt-Texte wurden anhand der tatsächlichen Illustrationen korrigiert (unter anderem Monitor statt Smartphone).
- `docs/LEARN-AUTHORING.md`, `docs/templates/learn-article.de.md` und ein kurzer Verweis in `agents.md`.
- Tests/Vorschau: `scripts/learn-article.test.mjs`, `scripts/check-learn-browser.mjs`, `scripts/learn-browser-probe.mjs`, `scripts/preview.mjs`. Keine zusätzliche Abhängigkeit.

Generiert ausschliesslich mit dem bestehenden Build: 23 Artikelseiten unter `blog/` und `en/blog/`, reguläre Learn-Übersichten, `assets/blog-posts.js`, `sitemap.xml`. Die beiden Legacy-Indexweiterleitungen wurden regulär regeneriert und bleiben inhaltlich unverändert. 17 Artikel / 23 Sprachfassungen vor und nach der Arbeit.

## Ausgeführte Prüfungen

- `npm run build:posts` erfolgreich; anschliessender zweiter Build: alle 29 Ausgabedateien per SHA-256 bytegleich. Beim ersten Vergleich fiel eine schwankende Reihenfolge gleich datierter Beiträge auf; die Eingabedateien werden nun vor Verarbeitung sortiert.
- `node --test scripts/learn-article.test.mjs`: 10 Tests bestanden. Echte Autorenvorlage ausserhalb von `posts/`, YAML-Fehler mit Quelldatei, sechs Kategorien und Legacy-Alias, leere Medien, Legacy-Key-Takeaway, kanonisches HTML, Kommentarentfernung, Umlaute/Sonderzeichen, lange URL, doppelte Überschriftentexte, bestehende IDs, H1/TOC/Key-Eindeutigkeit, Video/SEO und reales Bildinventar.
- `git diff --check` ohne Befund. Anfangs sauberer Arbeitsstand; nur die drei erlaubten Markdown-Artikel wurden geändert. Metadaten und vorhandene Links gegen den anfänglichen Git-Stand geprüft. Keine Commits, Pushes oder Deployments.
- Installierter Chrome über CDP und nativen Node-WebSocket: letzter Gesamtlauf 83 Prüfergebnisse ohne Fehler. Drei Piloten plus unveränderter deutscher Artikel `phishing-erkennen` und englischer Artikel `onedrive-restore-deleted-files`, beide Themes bei 320, 360, 768 und 1440 CSS-Pixeln. Zusätzlich tatsächliche Textvergrösserung auf 200 % bei 320 px; Fliesstext wächst von 17 auf 34 px.
- Keine horizontal überlaufenden Artikel oder defekten Bilder in den geprüften Seiten. Keine doppelten IDs. FAQ und TOC mit Space bedient, Links mit Enter aktiviert, sichtbare Fokusse und Sprungziele unterhalb des festen Headers geprüft.
- Kontraste aus tatsächlich berechneten Text- und Hintergrundfarben inklusive getönter Callouts gemessen: Minimum im geprüften Artikeltext Dark 7,89:1, Light 5,45:1. Anforderungen 4,5:1 für normalen und 3:1 für grossen Text bestanden. Farben werden durch Labels und Icons ergänzt.
- Alle zehn Callout-Varianten sowie Checkliste, Schritte, Merksatz, echte Figur, FAQ und sehr lange URLs/Code zusätzlich als Browser-Fixture injiziert, ohne Produktionsdatei oder URL. Reduced-Motion-Prüfung: keine Animation, keine Textlinktransition.
- Vorher/Nachher-Aufnahmen des ersten Piloten auf Desktop und Mobil betrachtet; alle Piloten in beiden Themes sowie Komponentenaufnahmen visuell geprüft. Screenshots und Messdaten liegen temporär unter dem vom Browsercheck ausgegebenen Pfad, nicht im Produktionsinhalt.
- Homepage, Services-Abschnitt, Microsoft-365-Care-Seite, Learn-Übersicht, Sicherheitslage-Abschnitt und Phishing-Simulationsseite lokal betrachtet; neues Artikel-CSS wird dort nicht geladen. Globale Styles, Navigation, Homepage, Servicequellen, Simulation und Workflow sind unverändert. Learn-Übersichten enthalten lediglich regulär neu sortierte Artikeldaten/angepasste Alt-Texte.

## Grenzen und fachliche Hinweise

- Die lokalen Layoutprüfungen blockieren externe Google-Fonts und YouTube. Sie prüfen Systemschrift-Fallback, Layout und unveränderte Embed-URL, keine Video-Wiedergabe oder externe Einwilligung. Der vorhandene Artikel-Build enthält keine eigene Consent-Schaltfläche; hier wurde keine neue Logik eingeführt.
- Kein separater Security-Hub-Pfad ist in diesem Repository vorhanden. Der vorhandene Abschnitt `index.html#sicherheitslage` wurde geprüft; das separate Security-Hub-Repository wurde nicht verändert oder als getestet ausgegeben.
- Keine neue fachliche Recherche. Die Pilotquellen enthalten bisher keine externen Quellenlisten; es wurden keine Referenzen erfunden. Die Regel zum Lesen einer Domain ist weiterhin auf einfache .ch/.com-Beispiele begrenzt und kein allgemeiner Parser für alle Domain-Endungen. Die bestehende Link-Illustration zeigt ähnlich geschriebene Domains; deren farbliche Markierung ist keine Aussage über die Sicherheit realer Anbieter.
- Das ursprüngliche pauschale Löschen heruntergeladener Dateien wurde beim Vorfallartikel ausdrücklich dem privaten Gerät zugeordnet; die bestehende Unternehmensanweisung, Untersuchungsspuren nicht selbst zu löschen, bleibt erhalten.
- Kein manueller Screenreader-Test und keine Prüfung in Safari/Firefox. Browserbreiten sind emuliert, kein physischer Mobilgerätetest.

## Lokal ansehen

```sh
node scripts/preview.mjs
```

`http://127.0.0.1:4173/blog/phishing-mails-erkennen/` öffnen, Theme-Schalter verwenden. Vorschau mit Ctrl+C beenden.
