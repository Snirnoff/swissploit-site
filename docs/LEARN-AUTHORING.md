# Swissploit Learn: Autorenvertrag v1

## Datei und Umfang

Lege `posts/<slug>/de.md` an, optional `en.md`. Weitere Metadateien sind nicht nötig. Die öffentlichen Pfade bleiben `/blog/<slug>/` und `/en/blog/<slug>/`. Die Vorlage [templates/learn-article.de.md](templates/learn-article.de.md) liegt absichtlich ausserhalb von `posts/` und wird nicht veröffentlicht.

Speichere UTF-8. Frontmatter steht zwischen zwei Zeilen `---`; YAML verwendet Leerzeichen statt Tabs. Datumswerte und Text mit Doppelpunkt immer in Anführungszeichen setzen. In doppelt zitierten YAML-Texten innere Anführungszeichen als `\"` schreiben. Arrays vorzugsweise einzeilig: `relatedArticles: [slug-a, slug-b]`. Leere optionale Texte als `""`, leere Listen als `[]`; kein sichtbares „TODO“.

## Exakt unterstützte Frontmatter-Felder

| Feld | Format und tatsächliche Verwendung |
| --- | --- |
| `date` | Veröffentlichungsdatum, `"YYYY-MM-DD"`; unverändert erhalten. |
| `updated` | Optionales Datum einer tatsächlichen redaktionellen Überarbeitung; nicht bei reinem Designwechsel setzen. Beeinflusst Sortierung und Sitemap. |
| `category` | Eine der sechs IDs unten; wird vom Build validiert. |
| `title` | Titel/H1, Fallback für SEO-Titel und Bildbeschreibung. |
| `excerpt` | Kurztext für Karten und Suche; Fallback für `shortDescription`. |
| `shortDescription` | Optionaler abweichender Karten-/Beschreibungstext; eine Subline erscheint nur, wenn kein Key-Takeaway vorhanden ist. |
| `tags` | Liste, beispielsweise `[phishing, microsoft-365]`; Tags, Suche und SEO. |
| `image` | Optionaler vorhandener Bildpfad, bevorzugt `assets/blog/...`; leere Zeichenkette erlaubt. |
| `imageAlt` | Tatsächlicher Bildinhalt, keine Werbeaussage. Bei fehlendem Text greift technisch der Titel; redaktionell immer sinnvoll ausfüllen, wenn ein Bild vorhanden ist. |
| `videoUrl` | Optionaler YouTube-watch-, shorts- oder youtu.be-Link. Andere URLs erscheinen als externer Videolink. Leer bedeutet kein Video dieser Sprachfassung, sofern kein globales Video gesetzt ist. |
| `videoType` | `"short"` für Hochkantvideo; sonst `""`. Eine YouTube-shorts-URL wird ebenfalls als Hochkant erkannt. |
| `relatedArticles` | Liste vorhandener Slugs oder bestehender IDs, maximal drei Ergebnisse. Ohne Liste werden Artikel derselben Kategorie gewählt. |
| `seoTitle` | Optionaler SEO-Titel, Fallback `title`. |
| `seoDescription` | Optionale SEO-Beschreibung; sonst `shortDescription`/`excerpt`, zuletzt Inhalt. Ausgabe auf 160 Zeichen begrenzt. |

Kompatible Bestandsfelder: `id` (sonst Ordnername), `publishedDate` (Vorrang vor `date`), `updatedDate` (Vorrang vor `updated`), `thumb` (altes Bildfeld), `keyTakeaway` (automatische Key-Box), `videoUrlGlobal`, `videoTypeGlobal`. Für neue Artikel den Grundvertrag der Vorlage verwenden. `keyTakeaway` erzeugt neben einer expliziten `article-callout--key`-Box keine zweite Zusammenfassung.

Der Build verlangt technisch eine gültige Kategorie, führt aber keine neue Pflichtfeldstruktur ein. Redaktionell gehören Datum, Titel, Kurzbeschreibung und Tags zu jedem fertigen Artikel. Fehlendes Bild/Video ist ausdrücklich zulässig. Gemeinsame Metadaten wie Datum, Kategorie, Tags, Bilder und Related-Slugs werden zuerst aus Deutsch, sonst Englisch gelesen. Texte und individuelle Video-URLs sind sprachbezogen. Bei `image: ""` kann ein bestehendes englisches Bild oder Legacy-`thumb` greifen; ohne eines davon wird kein Artikelbild ausgegeben. SEO nutzt dann das reale `/assets/swissploit-og.png`.

Genau sechs Kategorien:

- `phishing-betrug`
- `accounts-passwoerter`
- `social-engineering`
- `security-alltag`
- `privacy-datenschutz`
- `security-buero`

Der alte Alias `privatsphaere-datenschutz` wird auf `privacy-datenschutz` normalisiert, ist keine siebte Kategorie.

## Aufbau und Zuständigkeiten

Das Template liefert H1, Metadaten, Video/Bild, Inhaltsnavigation, Sprachlinks und verwandte Artikel. Kein zusätzliches H1 und keine manuelle Inhaltsnavigation im Body. Die vorhandene Videoeinbettung bleibt ohne Autoplay bestehen; kein zusätzlicher Embed- oder Trackingdienst. Der aktuelle Artikel-Build hat keine eigene Einwilligungsschaltfläche; diese Arbeit ergänzt keine neue Einwilligungslogik.

Body:

1. Kurzer, konkreter Einstieg.
2. Genau eine kompakte `--key`-Box mit einer Aussage oder zwei bis drei Punkten.
3. Aussagekräftige H2/H3, normale Erklärabsätze, gezielte Komponenten.
4. Praktischer Abschluss als Schritte, Checkliste **oder** Merksatz.
5. Passende Quellen und gegebenenfalls kontextuelle interne Links.

Kurze Artikel normalerweise etwa 500–900 Wörter; nicht künstlich strecken. Vorfallanleitungen dürfen länger sein, wenn Schutzmassnahmen es verlangen. Meist insgesamt drei bis fünf Callouts, bei sehr kurzen Artikeln weniger. Keine Box nach jedem Absatz, keine verschachtelten Callouts, keine wiederholte Zusammenfassung in Subline, TL;DR und Abschluss. Kurze Kernaussagen fett; Absätze überwiegend zwei bis vier Sätze.

Plain Markdown `## 1. Prüfe den Kontext` wird beim Build nummeriert gestaltet. Zahlen bleiben echter Überschriftentext und werden nicht doppelt erzeugt. H2/H3 erhalten stabile, eindeutige IDs, sofern keine ID vorhanden ist. Vorhandene IDs und `article-numbered-heading`-Strukturen bleiben bestehen. Doppelte Überschriftentexte erhalten `-2`, `-3` usw.; explizite IDs müssen Autoren selbst eindeutig halten. Spätere Umbenennungen verändern automatisch erzeugte IDs: Bei etablierten Ankern die alte ID ausdrücklich im HTML erhalten.

Ab fünf inhaltlichen H2 **und** 600 Wörtern erscheint eine kompakte aufklappbare Navigation. „Quellen“, „Sources“, „References“, „Related Articles“, „Weiterlernen“ und „Weiterführende Links“ gehören nicht hinein. Sprungziele haben Abstand zum festen Header. Es gibt keine mobile Overlay-Seitenleiste.

## Callouts: kanonisches HTML

HTML-Innenbereiche enthalten HTML, kein verschachteltes Markdown. Icons sind dekorativ (`aria-hidden="true"`), ihre Bedeutung steht zusätzlich im Label. Lokale CSS-SVG-Masken ersetzen die Zeichen; ohne Mask-Unterstützung bleiben Zeichen sichtbar. Statische Hinweise erhalten kein `role="alert"`.

### Zentrale Aussage – Türkis

```html
<aside class="article-callout article-callout--key">
  <div class="article-callout__heading">
    <span class="article-callout__icon" aria-hidden="true">i</span>
    <strong>Das Wichtigste</strong>
  </div>
  <div class="article-callout__content"><p>Eine kurze zentrale Aussage.</p></div>
</aside>
```

### Hintergrund – Blau

```html
<aside class="article-callout article-callout--info">
  <div class="article-callout__heading"><span class="article-callout__icon" aria-hidden="true">i</span><strong>Hintergrund</strong></div>
  <div class="article-callout__content"><p>Hier steht eine hilfreiche Einordnung.</p></div>
</aside>
```

### Schutzmassnahme – Grün, keine Sicherheitsgarantie

```html
<aside class="article-callout article-callout--tip">
  <div class="article-callout__heading"><span class="article-callout__icon" aria-hidden="true">→</span><strong>Hilfreicher Tipp</strong></div>
  <div class="article-callout__content"><p>Nutze einen bereits bekannten Kontaktweg.</p></div>
</aside>
```

### Konkrete Vorsicht – Amber

```html
<aside class="article-callout article-callout--warning">
  <div class="article-callout__heading">
    <span class="article-callout__icon" aria-hidden="true">!</span>
    <strong>Vorsicht bei unerwarteten Anmeldungen</strong>
  </div>
  <div class="article-callout__content">
    <p>Prüfe die Anfrage über einen bekannten Weg, bevor du Zugangsdaten eingibst.</p>
  </div>
</aside>
```

### Akuter Handlungsbedarf – zurückhaltendes Rot, fachlich begründen

```html
<aside class="article-callout article-callout--danger">
  <div class="article-callout__heading"><span class="article-callout__icon" aria-hidden="true">!</span><strong>Passwort eingegeben: jetzt reagieren</strong></div>
  <div class="article-callout__content"><p>Ändere das betroffene Passwort über den offiziellen Dienst.</p></div>
</aside>
```

### Beispiel – neutrale Fläche

```html
<aside class="article-callout article-callout--example">
  <div class="article-callout__heading"><span class="article-callout__icon" aria-hidden="true">i</span><strong>Beispiel</strong></div>
  <div class="article-callout__content"><p>Ein kurzes, klar als Beispiel bezeichnetes Szenario.</p></div>
</aside>
```

### Weitere Varianten in denselben Farbfamilien

```html
<aside class="article-callout article-callout--action">
  <div class="article-callout__heading"><span class="article-callout__icon" aria-hidden="true">→</span><strong>Das kannst du jetzt tun</strong></div>
  <div class="article-callout__content"><p>Eine konkrete nächste Handlung.</p></div>
</aside>

<aside class="article-callout article-callout--mistake">
  <div class="article-callout__heading"><span class="article-callout__icon" aria-hidden="true">!</span><strong>Häufiger Fehler</strong></div>
  <div class="article-callout__content"><p>Ein Fehler und die passende Korrektur.</p></div>
</aside>

<aside class="article-callout article-callout--kmu">
  <div class="article-callout__heading"><span class="article-callout__icon" aria-hidden="true">i</span><strong>Im Unternehmen</strong></div>
  <div class="article-callout__content"><p>Verwende den vorgesehenen internen Meldeweg.</p></div>
</aside>

<aside class="article-callout article-callout--summary">
  <div class="article-callout__heading"><span class="article-callout__icon" aria-hidden="true">i</span><strong>Zum Abschluss</strong></div>
  <div class="article-callout__content"><p>Nur einsetzen, wenn eine Zusammenfassung zusätzlichen Nutzen bringt.</p></div>
</aside>
```

`--action` nutzt Grün, `--mistake` Amber, `--kmu` Blau und `--summary` Türkis. Englische Autoren schreiben englische Labels; der Build übersetzt keine Inhalte. Automatische Labels werden lokalisiert.

## Weitere Bausteine

Prüfpunkte sind nicht interaktiv und nicht als erledigt markiert:

```html
<ul class="article-checklist">
  <li>Passt die Nachricht zum erwarteten Anlass?</li>
  <li>Ist die tatsächliche Absenderadresse plausibel?</li>
</ul>
```

Der alte Kommentar `<!-- article-checklist -->` unmittelbar vor einer Markdown-Liste bleibt kompatibel. Für neue Inhalte die Klasse direkt verwenden.

Schritte mit nativer Listen- und Nummerierungssemantik:

```html
<ol class="article-steps">
  <li><strong>Öffne den Dienst direkt.</strong> Verwende die bekannte App.</li>
  <li><strong>Prüfe die Anfrage.</strong> Verwende einen unabhängigen Kontaktweg.</li>
</ol>
```

```html
<p class="article-rule">Erst unabhängig prüfen, dann handeln.</p>
```

Optionale Zusatzfrage; niemals kritische Sofortmassnahmen verstecken:

```html
<details class="article-faq">
  <summary>Wo finde ich zusätzliche Informationen?</summary>
  <p>Verweise hier auf eine passende, geprüfte Quelle.</p>
</details>
```

Normale Markdown-Listen und Blockquotes bleiben möglich. URLs zur Erklärung als Inline-Code oder Codeblock zeigen; verdächtige Beispieladressen nicht anklickbar machen. Lange URLs und Code umbrechen innerhalb der Lesefläche.

## Bilder und redaktionelle Platzhalter

Ohne reales Asset `image: ""` und `imageAlt: ""` verwenden; ohne Video `videoUrl: ""` und `videoType: ""`. Kein kaputtes `img`, keine erfundene SEO-Bildadresse. Die Vorlage benötigt kein Bild.

Ein kopierbares Beispiel mit tatsächlich vorhandenem Bild (nur verwenden, wenn es inhaltlich passt):

```html
<figure class="post-figure">
  <img src="/assets/blog/gefaehrliche-links-erkennen.webp"
       alt="Browser mit einer verdächtigen Internetadresse und hervorgehobener Domain"
       loading="lazy" decoding="async">
  <figcaption>Prüfe die tatsächliche Domain statt eines bekannten Wortes im Link.</figcaption>
</figure>
```

Bilder bleiben vollständig sichtbar; Screenshots nicht zuschneiden. Alt-Text beschreibt den tatsächlichen Inhalt; die Bildunterschrift erklärt den Nutzen. Personenbezogene Angaben vor Veröffentlichung anonymisieren. Verweise im Frontmatter, HTML und SEO müssen auf passende, reale Assets zeigen.

```html
<!-- BILDPLATZHALTER: Eigenen anonymisierten Screenshot mit sichtbarer Zieladresse erstellen. Erst danach einen realen Bildpfad und passenden Alt-Text einsetzen. -->
```

HTML-Kommentare bleiben in der Quelldatei, werden aber vor Ausgabe der Artikel und `assets/blog-posts.js` entfernt. Keine sichtbaren TODO-Karten.

## Quellen, Links und Vorabprüfung

Primärquellen mit beschreibendem Linktext anführen; Quellen nicht erfinden. Bestehende Quellen und Linkziele bei Überarbeitungen bewahren. Interne Links vorzugsweise auf bestehende `/blog/<slug>/`-Pfade, keine URL-Migration. Die Phishing-Simulationsseite niemals öffentlich verlinken. Keine Sicherheitsgarantien oder unbelegten Statistiken ergänzen. Mögliche sachliche Probleme separat zur fachlichen Prüfung melden.

Vor Freigabe: Datum/Kategorie prüfen, genau ein H1 und eine Key-Box, keine TOC von Hand, keine verschachtelten Callouts, keine kritischen Schritte in FAQ, reale Bilder mit passenden Alt-Texten, eindeutige Anker, funktionierende Links, kurze Absätze und sinnvoller Abschluss. Light und Dark, Keyboard, 320/360/768/1440 CSS-Pixel und 200 % Text prüfen.

## Build und lokale Vorschau

Aus dem Repository-Stamm mit den vorhandenen Abhängigkeiten:

```sh
npm run build:posts
node --test scripts/learn-article.test.mjs
node scripts/preview.mjs
```

Dann `http://127.0.0.1:4173/blog/phishing-mails-erkennen/` öffnen. Vorschau mit Ctrl+C beenden. Generierte HTML-Dateien, `assets/blog-posts.js` und `sitemap.xml` ausschliesslich über den Build aktualisieren. Der Build regeneriert auch die Learn-Übersichten; sein Deployment-Workflow bleibt unverändert. Eine Änderung an einem Artikel-Slug ist eine URL-Änderung und gehört nicht zur normalen Gestaltung.

Optionaler Browsercheck ohne Installation: `node scripts/check-learn-browser.mjs after` mit Node 22+ (native WebSocket) und installiertem Chrome. Unter Windows wird der übliche Chrome-Pfad genutzt; alternativ `CHROME_PATH` auf die vorhandene Browserdatei setzen. Screenshots und Messdaten liegen in einem ausgegebenen temporären Ordner. Externe Fonts und YouTube werden für reproduzierbare lokale Layoutprüfungen blockiert; das testet keine Video-Wiedergabe oder externe Einwilligung.
