export const campaignPanel = `<div id="panel-campaigns" role="tabpanel" aria-labelledby="tab-campaigns" tabindex="0" hidden>
<div class="dashboard-section-label"><h3>Lernpaket zusammenstellen</h3><span>Inhalte wählen. Gruppe festlegen. Zuweisen.</span></div>
<form id="assignment-form" class="assignment-form"><label>Thema<select id="package-module"></select></label>
<fieldset><legend>Bausteine des Lernpakets</legend><div id="package-formats" class="package-formats"></div></fieldset>
<div class="assignment-grid"><label>Beispielgruppe<select id="package-team"></select></label><label>Rhythmus<select id="package-rhythm"><option value="monthly">Monatlich</option><option value="quarterly">Quartalsweise</option><option value="once">Einmalig</option><option value="custom">Individuell</option></select></label><label id="interval-field" hidden>Alle wie viele Monate?<input id="package-interval" type="number" min="1" max="12" value="2"></label><label>Startdatum<input id="package-start" type="date" value="2026-10-01" required></label><label>Abschlussfrist<input id="package-deadline" type="date" value="2026-10-28" required></label></div>
<label class="check-label"><input id="package-reminders" type="checkbox" checked> Erinnerungen vorsehen (nur Demo)</label><p id="package-summary" class="package-summary"></p><button class="core-test-primary" type="submit">Zuweisung simulieren</button><p id="assignment-feedback" role="status" aria-live="polite"></p></form>
<div class="simulation-actions"><button type="button" class="dash-action" id="simulate-progress">Beispielfortschritt anzeigen</button><button type="button" class="dash-action" id="view-assignments">Zuweisungen ansehen</button><button type="button" class="dash-action" id="reset-demo">Demo zurücksetzen</button></div><p class="dashboard-section-label">Ersetzt die Beispielkampagne. Keine echten Zuweisungen oder E-Mails.</p></div>`;

export const aiExample = `<div class="mail-comparison">
<article class="learning-mail" aria-labelledby="classic-mail-title">
  <div class="mail-toolbar"><span>Posteingang</span><span class="mail-example-label">Lernbeispiel · Klassisch</span></div>
  <div class="mail-header"><h3 id="classic-mail-title">Dein Speicherplatz wird gesperrt</h3>
    <dl><div><dt>Von</dt><dd><button type="button" class="mail-signal" data-signal="domain">CloudDesk Support &lt;service@clouddesk-hilfe.example&gt;</button></dd></div><div><dt>An</dt><dd>Alex Muster &lt;alex@beispielfirma.example&gt;</dd></div><div><dt>Datum</dt><dd>15. Oktober 2026 · 09:12</dd></div></dl>
  </div>
  <div class="mail-body"><p>Guten Tag,</p><p>Ihr Speicher konnte nicht verlängert werden. Bitte bestätige Ihre Kontodaten <button type="button" class="mail-signal" data-signal="urgency">innerhalb von 30 Minuten</button>, damit Ihre Dateien verfügbar bleiben.</p><button type="button" class="mail-link mail-signal" data-signal="link">Speicher jetzt bestätigen <span aria-hidden="true">↗</span></button><p>Freundliche Grüsse<br>Ihr CloudDesk Service-Team</p></div>
  <div class="mail-actions"><button type="button" data-signal="reply">↩ Antworten</button><button type="button" data-signal="forward">Weiterleiten →</button></div>
  <p class="mail-feedback" role="status" aria-live="polite">Wähle eine markierte Stelle. Was fällt dir auf?</p>
</article>
<article class="learning-mail" aria-labelledby="modern-mail-title">
  <div class="mail-toolbar"><span>Posteingang</span><span class="mail-example-label">Lernbeispiel · Modern</span></div>
  <div class="mail-header"><h3 id="modern-mail-title">Aktualisierte Bankverbindung · Rechnung 1048</h3>
    <dl><div><dt>Von</dt><dd>Bergtal Studio · Finanzen &lt;finanzen@bergtal-service.example&gt;</dd></div><div><dt>An</dt><dd>Alex Muster &lt;alex@beispielfirma.example&gt;</dd></div><div><dt>Datum</dt><dd>15. Oktober 2026 · 10:24</dd></div></dl>
  </div>
  <div class="mail-body"><p>Guten Tag Alex</p><p>Vielen Dank für die gute Zusammenarbeit. Für die offene Rechnung 1048 verwenden Sie bitte die aktualisierte Bankverbindung im Dokument.</p><button type="button" class="mail-link" data-reaction="link">Zahlungsdetails ansehen <span aria-hidden="true">↗</span></button><p>Eine erneute Freigabe ist nicht nötig; der Betrag bleibt unverändert.</p><p>Freundliche Grüsse<br>Lea Sommer · Finanzen</p></div>
  <div class="mail-actions"><button type="button" data-reaction="reply">↩ Antworten</button><button type="button" data-reaction="forward">Weiterleiten →</button></div>
  <div class="mail-decisions" role="group" aria-label="Wie würdest du reagieren?"><button type="button" data-reaction="link">Link prüfen</button><button type="button" data-reaction="verify">Über bekannten Kanal verifizieren</button><button type="button" data-reaction="report">Verdächtige Nachricht melden</button></div>
  <p class="mail-feedback" role="status" aria-live="polite">Professionelle Sprache allein macht eine Nachricht nicht vertrauenswürdig.</p>
</article></div>`;

export const customSection = `<section class="business-section custom-content" aria-labelledby="custom-title"><div><p class="hub-eyebrow">Euer Wissen gehört dazu</p><h2 id="custom-title">Security Awareness mit eurem Arbeitsalltag verbinden.</h2><p>Eigene Videos, Richtlinien, PDF-Dokumente und Quiz ergänzen die Swissploit-Bibliothek. So werden auch interne Meldewege und Sicherheitsprozesse zum Lerninhalt.</p><a class="core-test-secondary" href="#dashboard" data-open-own>Eigene Inhalte in der Demo ansehen</a></div><div class="custom-production"><span class="hub-eyebrow">Individuell von Swissploit</span><h3>Eure Themen. Verständlich erklärt.</h3><p>Du möchtest ein eigenes Awareness-Video oder Schulungsmodul? Wir besprechen Zielgruppe, Thema und Umfang.</p><a class="core-test-primary" href="/ueber-swissploit/?anliegen=Individuelles%20Video#kontakt">Individuelle Inhalte anfragen</a></div></section>`;

