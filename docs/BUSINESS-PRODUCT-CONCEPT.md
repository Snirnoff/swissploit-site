# Swissploit Learn for Business: Produktkonzept und Demo

Stand: 15. Oktober 2026. Dies ist ein Produktkonzept, keine produktive Plattform und keine rechtliche Zusicherung.

## Aktueller Umfang

Die statische Website zeigt einen vollständig lokalen Beispielablauf für ein fiktives Unternehmen mit 25 Personen. Die Demo verwendet keine Konten, externe APIs, Mitarbeiterdatenbank oder persistente Speicherung. Ein Neuladen setzt den Zustand zurück. Ein JSON-Musterbericht enthält ausschliesslich die fiktiven Daten der aktuellen Simulation.

`assets/business/demo-data.js` ist die einzige Quelle für Personen, Teams, Module, Kampagne und Zuweisungen. Kennzahlen, Berichte, Nachweise und Mitarbeitendenansicht werden daraus abgeleitet. Eine simulierte Zuweisung ersetzt die aktuelle Beispielkampagne. Neue Zuweisungen sind zunächst offen. Der Fortschrittsbutton zeigt ausdrücklich einen späteren, simulierten Stand. Einzelne Abschlüsse lassen sich in der Mitarbeitendenansicht simulieren. Ohne Quiz entstehen weder ein Quizresultat noch eine Bestehensbehauptung.

Die Bibliothek zeigt Konzeptmodule mit Beispieldauern. Die separat eingebundenen öffentlichen Artikel und Videos stammen aus den bestehenden Katalogen. Lernpakete kombinieren in dieser Phase mehrere Formate zu einem ausgewählten Thema. Monatliche, quartalsweise, einmalige und individuelle Intervalle sind Demonstrationen, keine aktiven Zeitpläne oder Benachrichtigungen.

Die verfügbaren Bausteine sind pro Modul definiert und werden mit denselben Icons in Bibliothek, Builder und Mitarbeitendenansicht dargestellt. Die Smartphone-Vorschau ist ein browserbasiertes Lernerlebnis, keine native App. Einzelne Lernschritte und Testresultate können simuliert werden. Ein nicht bestandenes Quiz erzeugt keinen Abschluss; nach einer erfolgreichen Wiederholung und allen erledigten Bausteinen aktualisieren sich Übersicht, Bericht und Nachweis gemeinsam.

Die Inhaltsquelle «Eigene Inhalte» zeigt eine feste Beispielrichtlinie. Der Dialog zum Hinzufügen ergänzt ausschliesslich ein weiteres fiktives Modul im Arbeitsspeicher; er liest keine lokale Datei. «Demo zurücksetzen» entfernt diese Ergänzung. Individuelle Content-Produktion führt zum bestehenden Kontaktformular.

Die Verkaufsseite zeigt Hero, Kostenlos-vs.-Business, Dashboard, Problem/Lösung, Lernprozess, aktuelle Inhalte, Mail-Lernbeispiele, eigene Inhalte, Reporting, die drei ergänzenden Services und den Abschluss-CTA. Rhythmusplanung bleibt im Dashboard; separate Rhythmus-, Business-Spielkarten- und Lernpass-Marketingabschnitte sind entfernt.

Die Mailbeispiele verwenden ausschliesslich fiktive Identitäten und reservierte `.example`-Adressen. Ihre Aktionen aktualisieren lokale Erklärungen. Die Workflow-Verbindung nutzt zwei leichte SVG-Pfade mit pausierter Animation ausserhalb des sichtbaren Bereichs und statischer Darstellung bei reduzierter Bewegung. Die bestehende Canvas-Partikelengine für Homepage und Services bleibt erhalten.

## Vorgesehene Rollen

| Rolle | Vorgesehene Verantwortung |
| --- | --- |
| Unternehmensadministrator | Organisation, Mitgliedschaften, Teams und Berechtigungen verwalten. Keine automatische Einsicht in jedes individuelle Testdetail. |
| HR-/Security-Verantwortliche | Berechtigte Inhalte auswählen, Lernpakete und Kampagnen organisieren, Zuweisungen und zulässige Auswertungen einsehen. |
| Mitarbeitende | Eigene Zuweisungen, Inhalte, Versuche und Abschlüsse einsehen. Keine Einsicht in andere Personen oder Teams. |

Die zwei interaktiven Perspektiven sind Demo-Ansichten. Sie stellen keine Authentifizierung oder wirksame Zugriffskontrolle dar. Berechtigungen müssen später serverseitig erzwungen werden.

## Zukünftige Datenobjekte

| Objekt | Wesentliche Beziehungen und Bedeutung |
| --- | --- |
| Unternehmen | Mandant; besitzt Teams, Mitgliedschaften, eigene Inhalte und Kampagnen. |
| Benutzer | Identität; kann über getrennte Mitgliedschaften mit mehreren Unternehmen verbunden sein. |
| Mitgliedschaft | Verknüpft Benutzer und Unternehmen, enthält Rolle, Status und Freigabeumfang. |
| Team | Gehört zu genau einem Unternehmen; enthält dessen Mitgliedschaften. |
| Lerninhalt | Stabile Identität eines Videos, Artikels, Quiz, Spiels oder internen Dokuments; Eigentümer und Sichtbarkeit ausdrücklich festlegen. |
| Inhaltsversion | Unveränderliche Fassung mit Sprache, Lernzielen, Veröffentlichungsstand und gegebenenfalls Test-/Bestehensregel. |
| Lernpaket | Geordnete Sammlung konkreter Inhaltsversionen; Änderungen erzeugen neue Paketversionen. |
| Kampagne | Unternehmen, Paketversion, Zielgruppe, verantwortliche Mitgliedschaft, Start, Frist, Rhythmus und Erinnerungskonzept. |
| Zuweisung | Kampagneninstanz, Mitgliedschaft und Paketversion; Status und Termine. Wiederholungen erzeugen getrennte Zuweisungen. |
| Quizversuch | Zuweisung, konkrete Testversion, Versuch, Zeitpunkt und Ergebnis. Antworten und Rohdaten nur soweit erforderlich speichern. |
| Abschluss | Bezieht sich auf eine konkrete Zuweisung und deren dokumentierte Bedingungen; Zeit und erfüllte Inhalte nachvollziehbar halten. |
| Nachweis | Lesbare Darstellung eines Abschlusses samt Versionen und Regeln. Kein allgemeiner Sicherheits-Score. |
| Aktivitätenprotokoll | Wer änderte welche Zuweisung, Rolle oder Version wann? Sparsame, mandantengebundene Ereignisse, keine unkontrollierten Inhaltskopien. |

Wiederkehrende Kampagnen dürfen frühere Abschlüsse nicht überschreiben. Die heutige Demo ersetzt ihren einzigen aktiven Beispieldatensatz zur besseren Verständlichkeit; dieses Verhalten ist kein Modell für produktive Historisierung.

## Datenschutz und Berechtigungen für die nächste Phase

- Mandantentrennung für Datenzugriff, Hintergrundaufgaben, Suchindizes und Exporte; Berechtigungen bei jeder serverseitigen Operation prüfen.
- Rechte nach Rolle und Aufgabe, nicht nach blosser Kenntnis einer URL. Personenbezogene Testergebnisse restriktiver behandeln als aggregierte Abschlussquoten.
- Mitarbeitende vor Nutzung transparent über Zweck, Sichtbarkeit, Auswertung, Fristen und Ansprechpersonen informieren. Kein verdecktes Leistungsmonitoring und keine pauschalen Personen-Rankings.
- Nur erforderliche Identitäts-, Zuweisungs- und Abschlussdaten erheben. Aufbewahrungsfristen je Datenart und Zweck vor Produktivbetrieb festlegen, einschliesslich Backups und Protokollen.
- Verfahren für Auskunft, Export, Korrektur, Löschung und Austritt vorsehen. Historie, berechtigte Dokumentationszwecke und Löschanforderungen müssen gemeinsam beurteilt werden.
- Eigene Unternehmensinhalte und Lieferanten/Hosting, vertragliche Zuständigkeiten sowie mögliche Datenübermittlungen in einer späteren Datenschutzprüfung bewerten. Hier wird weder ein Hostingstandort noch eine gesetzliche Konformität zugesichert.
- Ergebnisse nur in ihrem Kontext zeigen: Inhalt, Version, Lernziel, Datum und Prüfungsbedingungen. Ein Quizresultat belegt keine umfassende Sicherheitsqualifikation.

## Learning Passport: spätere Funktion

Das persönliche Lernprofil muss vom Unternehmensmandanten getrennt sein. Ein ehemaliger Arbeitgeber behält keinen automatischen Zugriff auf ein privates Profil. Ein neuer Arbeitgeber erhält weder frühere interne Testdaten noch vertrauliche Inhalte automatisch.

Die Person wählt ausdrücklich aus, welche geeigneten Abschlüsse sie teilt. Verifikation, Widerruf, Gültigkeit, Löschung und die Behandlung später geänderter Inhalte sind vor Implementierung zu klären. Unternehmensinterne Materialien sind grundsätzlich nicht automatisch portierbar. Diese Roadmap-Idee wird auf der aktuellen Verkaufsseite nicht mehr dargestellt.

## Ausdrücklich nicht implementiert

Produktive Anmeldung, Konten, Rollenverwaltung, Mitarbeiterimport, echte Zuweisungen, Erinnerungsmails, Uploads, Zahlungen, Abonnements, Zertifikatsprüfung, Kundendatenexporte und Profilübertragung gehören in eine getrennte Entwicklungsphase. Individuelle Videos können über den vorhandenen Kontaktweg angefragt werden; Preise oder Produktionsfristen werden nicht versprochen.

## Kontaktweg

Im untersuchten Repository existiert kein Kontakt-Backend. Der vorhandene Mechanismus öffnet einen E-Mail-Entwurf im lokalen Mailprogramm. Das gemeinsame Kontaktformular validiert Anliegen/Nachricht, übergibt einen korrekt codierten Entwurf und erklärt, dass der Nutzer dort selbst senden muss. Es behauptet keinen erfolgreichen Versand und speichert keine Nachricht. Für browserbasierten Versand ist später eine gesonderte Backend-Entscheidung nötig.

## Quellen im Repository und Pflege

- Gemeinsamer Header/Footer: `scripts/site-header.mjs`, `scripts/site-footer.mjs`, `scripts/sync-headers.mjs`, `assets/navigation.css`.
- Service-/About-Inhalte: `data/service-pages.mjs`, `scripts/product-sections.mjs`, `scripts/build-product-pages.mjs`.
- Business-Seite: `unternehmen/index.html`; markierte Abschnitte werden aus `scripts/business-sections.mjs` aktualisiert. Die generierten Kommentargrenzen erhalten.
- Demo-Daten/Interaktionen: `assets/business/demo-data.js`, `dashboard.js`, `business.js` und `business.css`.
- Gemeinsame Partikelengine: `assets/security-core/security-core.js`; Serviceformen über das `shape`-Attribut, keine zweite Engine.
- Build: `npm run build`. Tests: `npm test`, `npm run check:seo`, `npm run check:headers`, `npm run check:motion`, `npm run check:quiz`, `node scripts/check-refinement-browser.mjs`.
- Browserprüfungen nutzen das vorhandene Chrome/CDP-Hilfsprogramm. `scripts/check-premium-browser.mjs` prüft die Seiten und den vollständigen Demo-Ablauf; `scripts/check-rotation-browser.mjs` prüft das Video-Karussell. Vorher-/Nachher-Bilder und Abschnittsansichten liegen lokal unter `.visual-check/premium-v5.1/` und gehören nicht zum öffentlichen Seiteninhalt.
- Formulare verwenden native Selects mit progressivem `base-select`-Styling. Browser ohne Unterstützung behalten ihre systemeigene Optionsdarstellung und Tastaturbedienung.
- Spielstart: `/phishing-simulation/?play=1` öffnet das vorhandene Phish Escape direkt. «Beenden» und Escape räumen die Spielsitzung auf und führen nach `/quiz-games/`.
