# Phishing-Quiz pflegen

Die statische Seite liegt unter `/phishing-quiz/` (auch `/phishing-quiz` wird vom lokalen Preview-Server aufgelöst). Auf dem produktiven Static-Host gilt dieselbe Ordner-/Index-Konvention wie bei `/learn/`. Es gibt keine zusätzlichen Pakete, keinen Backend-Dienst und keinen Build-Schritt für das Quiz selbst.

## Dateien und Zuständigkeiten

- `phishing-quiz/index.html`: indexierbarer Einstieg, Metadaten, gemeinsame Navigation, Footer und Fallback bei fehlendem JavaScript. Das Quiz endet als eigenständiges Lernprodukt ohne Service-CTA.
- `assets/phishing-quiz-data.js`: neun Situationen, darunter drei legitime Beispiele, Antworten, Prüfpunkte, Hinweise, Schutzmassnahmen und drei Ergebniskategorien.
- `assets/phishing-quiz.js`: bestehende Renderer (`search`, `email`, `qr`, `login`, `sms`, `business`), Fortschritt, direktes Feedback, Ergebnis und Fokusführung. E-Mail und interne Nachricht teilen sich denselben Renderer mit Absender, Avatar, Datum, Antwortadresse, Nachrichtendetails, Weiterleitungsentwurf und optionalem Anhang.
- `assets/phishing-quiz-inspector.js`: ein gemeinsames Floating-Fenster für alle Prüfelemente. Inhalte werden nur beim Elementwechsel aktualisiert. Die Mausbewegung setzt über `requestAnimationFrame` ausschliesslich die Position per `translate3d`; die Schleife stoppt nach dem Einrasten. Abmessungen werden beim Öffnen gelesen. Rechts/unten ist die bevorzugte Position; an Rändern wechselt das Fenster nach links/oben und bleibt im Viewport.
- `assets/phishing-quiz.css`: auf die Seite begrenzte Gestaltung, responsive Simulationen und kurze Einblendungen mit Reduced-Motion-Fallback. Die äussere Oberfläche nutzt bestehende Theme-Variablen; simulierte Dokumente bleiben bewusst hell.
- `scripts/build-posts.mjs`: dauerhafte Einbindung des Quiz auf der deutschen Learn-Seite und in der Sitemap. `learn/index.html` und `sitemap.xml` sind generiert.
- `scripts/check-phishing-quiz-browser.mjs`: Datenprüfung und Browserprüfung mit installiertem Chrome über den bestehenden CDP-Helfer.

## Ablauf und Interaktion

Der Zustand bleibt im Arbeitsspeicher: `intro → active → answered → nächstes Szenario/result`. Eine Entscheidung kann nur einmal abgegeben werden. Der Titel nennt die konkrete Aufgabe; der Kontext bleibt kurz. Antwortbuttons stehen neben der Frage, mobil darunter. Nach der Entscheidung öffnet sich zwischen Frage und Simulation ein Feedback mit Urteil, kurzem Grund, zwei Hinweisen und einem Schutzschritt. «Weiter» steht unter der Simulation. «Mehr erfahren» ist freiwillig. Beim Neustart werden Antworten und Markierungen zurückgesetzt. Ein Neuladen beginnt ebenfalls von vorne.

Hover zeigt eine kompakte, dunkelblaue Floating-Fläche rechts unterhalb des Mauszeigers. Sie folgt mit kurzem Nachlauf, bleibt selbst hoverbar und blendet beim Verlassen aus. Tastaturfokus und Touch verankern sie unmittelbar am Element. Der Inhalt besteht nur aus einer Bezeichnung und der tatsächlichen Adresse beziehungsweise Dateiangabe, ohne vorab hervorgehobene Domainbestandteile. `role="tooltip"` und `aria-describedby` verbinden Vorschau und Auslöser. Escape, erneuter Tap, Fokuswechsel, ein Tap ausserhalb, Scrollen oder ein Grössenwechsel schliessen sie. Reduced Motion schaltet Nachlauf, Scale und Fades ab.

Bei Suchresultaten entscheidet ein Desktop-Klick oder Enter auf dem Titel sofort. Auf Touch-Geräten öffnet der erste Tap die Info und eine explizite Aktion «Dieses Resultat öffnen» am Resultat. Ein zweiter Tap auf denselben Titel schliesst die Info, ohne eine Antwort zu werten. Alle anderen Prüfelemente bleiben reine Vorschauen; die Entscheidung erfolgt mit den Ja/Nein-Buttons bei der Frage. Nachrichtendetails und Weiterleitungsentwurf nutzen native `details`-Elemente. Es gibt keine künstlichen Dropdown-Zeichen an den Prüfpunkten und keine Vorab-Warnmarkierungen.

Das Feedback erhält Fokus ohne sofortigen Scrollsprung. Nach dem Öffnen wird bei Bedarf nur so weit gescrollt, dass Urteil und erste Hinweise sichtbar sind; Reduced Motion verwendet keine Animation. Ein Live-Status kündigt das Ergebnis an. Auch bei Suchresultaten steht das Feedback über der Simulation. Das offizielle Resultat wird erst nach der Entscheidung gekennzeichnet. Auf der Schlussseite stehen der Gesamtscore, höchstens drei Kategorien und drei Merksätze. Die frühere Team-Sektion ist entfernt; der Footer bleibt erhalten.

## Neues Szenario hinzufügen

1. Kopiere in `assets/phishing-quiz-data.js` ein Szenario mit dem passenden `type` und ergänze es im Array `scenarios`.
2. Vergib eindeutige IDs aus Kleinbuchstaben, Ziffern und Bindestrichen; die ID beginnt mit einem Buchstaben. Das gilt auch für Antworten und Prüfpunkte.
3. Passe `label`, `intro`, `question` und `content` an. `question` ist die sichtbare Aufgabe. `kind` ist `phishing`, `legitimate` oder `mixed` (Suchresultate). `content` ist strukturiertes Textmaterial, kein HTML. Verrate die Lösung nicht im Titel oder Kontext.
4. Pflege `choices` als `{ id, label }` und `correctAnswer` als genau eine gültige Antwort-ID. Beim Suchszenario müssen `content.results[].id` und Antwort-IDs übereinstimmen.
5. Ergänze `inspections` mit `{ id, label, value, caption, replyTo? }`. `replyTo` ergänzt die Antwortadresse in den Nachrichtendetails und am Antworten-Button. E-Mail unterstützt `sender`, optional `deadline`, `link` und `attachment`; QR `qr/deadline`, Login `address/login`, SMS `sender/link`, Business `sender/pressure`. `deadline` und `pressure` sind normaler Nachrichtentext, der erst nach einer Entscheidung markiert werden kann. Bei Suchresultaten kommen die Prüfpunkte aus `content.results` samt einer kurzen, trefferspezifischen `feedback`-Zeile. Die Floating-Bezeichnungen werden in `inspectionPoint()` zentral dem Typ zugeordnet; keine Lösungshinweise im Vorschautext hinterlegen.
6. Pflege `verdict` (z. B. «Diese Nachricht war legitim.»), `summary` (ein Satz für sofortiges Feedback), `redFlags` (`{ title, text, target? }`) und `protectionTips`. Trotz des historischen Feldnamens enthält `redFlags` bei legitimen Beispielen bestätigende Hinweise. Maximal zwei kurze `title`-Werte und der erste Schutzschritt sind direkt sichtbar. `explanation`, die ausführlichen `text`-Werte und optional `learningNote` erscheinen unter «Mehr erfahren».
7. Wähle passende `categories` aus `domains`, `identity` und `pressure`.
8. Optional: `learnArticleUrl`, `learnArticleTitle`, `videoUrl`, `videoTitle`. Nur existierende, zum Thema passende Ressourcen verlinken. Ohne URL wird nichts ausgegeben; ein Titel allein erzeugt keinen Platzhalter. Links öffnen mit `target="_blank" rel="noopener noreferrer"`. Interne Artikelpfade oder HTTPS-URLs verwenden. Aktuell sind bestehende Learn-Artikel hinterlegt; es gibt keine erfundenen Video-Links.
9. Aktualisiere bei geänderter Anzahl die Zeitangabe und Metadaten in `phishing-quiz/index.html`. Fortschritt, Score und Kategorieergebnisse berechnen sich aus dem Datenarray. Auch die Zeitangabe beim Learn-Einstieg im Generator redaktionell prüfen.

Für einen neuen Oberflächentyp wird eine Rendererfunktion zur `renderers`-Tabelle in `phishing-quiz.js` ergänzt. Vorhandene Interaktionen lassen sich über `data-inspect`, `data-preview` und `data-answer` wiederverwenden. Keine HTML-Fragmente in Szenariodaten einsetzen: Die Renderer maskieren Text vor der Darstellung.

## Sichere Simulation

- Fiktive Adressen verwenden in legitimen und betrügerischen Situationen ausschliesslich Subdomains unter `swissploit.ch` (z. B. `alpenprint.swissploit.ch`). Es werden keine DNS-Einträge angelegt oder Adressen aufgerufen. Keine fremden registrierbaren Domains als Phishing-Ziele einsetzen. Der gemeinsame Namensraum ist kein Lösungshinweis. Sie werden nie als navigierbare Links ausgegeben. Auch das offizielle Suchresultat ist eine Quiz-Schaltfläche.
- Die QR-Grafik ist ein absichtlich unvollständiges Übungsmuster ohne kodierte Daten. Sie ist kein Zahlungs-QR-Code.
- Es gibt keine Login-Eingabefelder, keine Anmeldeweiterleitung und keine Speicherung oder Übermittlung von Quizantworten. Nur die bestehende Theme-Präferenz wird durch das gemeinsame `app.js` gespeichert.
- Beispiele, Firmennamen und Personen sind fiktiv. Ein richtiger Quizscore ist kein Sicherheitsnachweis.
- Die Darstellung der offiziellen E-Vignetten-Adresse wurde am 6. Oktober 2026 gegen die [BAZG-Information zur E-Vignette](https://www.bazg.admin.ch/de/elektronische-vignette-via-portal-kaufen) geprüft: Das BAZG nennt `e-vignette.ch` beziehungsweise `via.admin.ch/shop/`. Bei späteren Inhaltsänderungen erneut prüfen.
- Learn-, Video- und Service-Verweise sind echte Links. Vertiefende Ressourcen erscheinen ausschliesslich nach der Entscheidung und öffnen einen neuen Tab, damit der Quizfortschritt erhalten bleibt.

## Validierung und Vorschau

```sh
node scripts/preview.mjs
# http://127.0.0.1:4173/phishing-quiz/

npm run build
npm test
npm run check:headers
npm run check:seo
npm run check:quiz
```

Die Browserprüfung benötigt Node.js mit nativem WebSocket (hier Node 24) sowie Chrome. Bei abweichender Installation `CHROME_PATH` setzen. Sie prüft alle neun Situationen in Hell und Dunkel bei 1440, 768, 390 und 320 Pixeln, sämtliche Prüfpunkte, richtige/falsche/gemischte Antworten, Mehrfachklickschutz, Neustart, Tastatur und Touch (erster Tap, zweiter Tap zum Schliessen und explizite Bestätigung), Feedback oberhalb der Simulation mit bedarfsabhängiger Scrollführung, optionale Ressourcen, Themewechsel, Navigation, Reduced Motion sowie Modulfehler und fehlendes JavaScript. Zusätzliche echte Mausereignisse prüfen Cursor-Nachlauf ohne Inhalts-Neuaufbau, Hover-Persistenz und alle vier Bildschirmränder. Externe Schriftanfragen sind während des Tests gesperrt. Screenshots liegen im bereits ignorierten Ordner `.visual-check/phishing-quiz/`.

Vor Freigabe zusätzlich in realem Mobile Safari/Chrome und mit Screenreader prüfen; die automatisierte Abdeckung nutzt Desktop-Chrome mit verschiedenen Viewportgrössen und emuliertem Touch.
