// assets/blog-posts.js
window.SWISSPLOIT_BLOG_POSTS = [
  {
    id: "wetransfer-phishing-html-onedrive",
    date: "2026-01-27",
    tags: ["security", "phishing", "microsoft365", "onedrive", "outlook"],
    videoUrl: "https://www.youtube.com/watch?v=5aVeWRinSxM",
      thumb: "assets/blog/h355-014.png",
    i18n: {
      de: {
        title: "Echter Angriff: WeTransfer-Phishing → HTML-Datei → Fake OneDrive Login",
        excerpt: "So wurde ein Microsoft-Konto übernommen: WeTransfer-Link, HTML-Download, gefälschtes OneDrive-Login.",
content: `
  <p><strong>WeTransfer-Phishing</strong> ist aktuell eine der fiesesten Methoden, um <strong>Microsoft 365 / OneDrive / Outlook Accounts</strong> zu übernehmen – weil der Ablauf “normal” wirkt: Download-Link, Datei öffnen, Login.</p>

  <p>In diesem Beitrag zeige ich dir den Angriff <strong>Schritt für Schritt</strong> anhand eines realen Falls – inklusive Video – und erkläre, <strong>warum eine HTML-Datei gefährlich sein kann</strong>, obwohl sie auf den ersten Blick harmlos aussieht.</p>

  <div class="blog-callout">
    <p><strong>Worum geht’s?</strong><br>
    Ein Angreifer lockt dich über einen scheinbar legitimen WeTransfer-Link zu einem Download. Statt eines PDFs oder Dokuments bekommst du eine <strong>HTML-Datei</strong>, die ein <strong>Fake OneDrive-Login</strong> öffnet. Sobald du dort dein Passwort eingibst, kann dein Microsoft-Konto kompromittiert werden.</p>
  </div>

  <h2>Warum ausgerechnet WeTransfer?</h2>
  <p>Viele kennen WeTransfer als seriösen Dienst zum Teilen von Dateien. Genau dieses Vertrauen wird ausgenutzt. Ein Link zu WeTransfer löst bei vielen weniger Misstrauen aus als “random-file-share.com”. Für Angreifer ist das perfekt: hoher Klick-Faktor, geringe Alarmglocken.</p>

  <h2>Der Angriff – technisch einfach, aber effektiv</h2>
  <p>Der typische Ablauf sieht so aus (vereinfacht, aber realistisch):</p>
  <ul>
    <li>📩 Du erhältst eine E-Mail, die nach Bestellung, Dokumenten oder “freigegebenen Dateien” aussieht.</li>
    <li>🔗 Der Link führt auf eine Seite, die wie ein normaler WeTransfer-Download wirkt.</li>
    <li>📄 Du lädst eine Datei herunter – oft mit Namen wie <em>Rechnung.html</em> oder <em>Dokumente.html</em>.</li>
    <li>🌐 Beim Öffnen startet dein Browser und zeigt eine <strong>täuschend echte OneDrive/Microsoft-Anmeldeseite</strong>.</li>
    <li>🔐 Du meldest dich an – und gibst deine Zugangsdaten direkt an den Angreifer.</li>
  </ul>

  <h2>Was macht die HTML-Datei so gefährlich?</h2>
  <p>Eine HTML-Datei ist im Prinzip “eine Webseite als Datei”. Öffnest du sie, kann sie:</p>
  <ul>
    <li>eine Login-Seite nachbauen (optisch 1:1 wie Microsoft)</li>
    <li>dich auf eine Phishing-Domain weiterleiten</li>
    <li>Formulareingaben (E-Mail/Passwort) an einen Server senden</li>
  </ul>
  <p>Das Gemeine: Viele erwarten bei “Datei öffnen” kein Login-Fenster – und interpretieren es als “normaler Cloud-Flow”.</p>

  <h2>Woran du den Fake erkennst (Quick Checks)</h2>
  <ul>
    <li><strong>Domain prüfen:</strong> Steht dort wirklich <em>login.microsoftonline.com</em> (oder eine saubere Microsoft-Domain)?</li>
    <li><strong>Dateityp prüfen:</strong> Warum ist es eine <strong>.html</strong> statt PDF/DOCX?</li>
    <li><strong>Druck erzeugt:</strong> “Sofort ansehen”, “dringend”, “läuft ab” – klassischer Social-Engineering-Trick.</li>
    <li><strong>Absender-Kontext:</strong> Passt das wirklich zu deiner aktuellen Arbeit? Im Zweifel kurz nachfragen.</li>
  </ul>

  <h2>So schützt du dein Microsoft 365 Konto nachhaltig</h2>
  <ul>
    <li><strong>MFA aktivieren</strong> (Authenticator-App bevorzugt) – das stoppt viele Übernahmen sofort.</li>
    <li><strong>Passwort-Manager</strong> nutzen: Der füllt nur auf der echten Domain automatisch aus.</li>
    <li><strong>Security Defaults / Conditional Access</strong> (für KMU): Login-Risiken reduzieren.</li>
    <li><strong>Awareness im Team:</strong> Kurz erklären: “HTML-Datei ≠ Dokument”.</li>
    <li><strong>Verdacht?</strong> Passwort ändern, Sessions abmelden, Geräte prüfen, Logins checken.</li>
  </ul>

  <h2>Video zum Fall (inkl. Ablauf)</h2>
  <p>Im Video zeige ich dir den Ablauf als Beispiel und erkläre, worauf du achten musst.</p>

  <p><strong>Takeaway:</strong> WeTransfer ist nicht “das Problem” – der Angreifer nutzt den Download-Flow als Tarnung. Kritisch wird es, sobald eine HTML-Datei ein Login auslöst.</p>
`},


      en: {
        title: "Real Attack: WeTransfer Phishing → HTML File → Fake OneDrive Login",
        excerpt: "A real Microsoft account takeover via a WeTransfer phishing page that delivered a malicious HTML file.",
content: `
  <p><strong>WeTransfer phishing</strong> is currently one of the most effective ways to compromise <strong>Microsoft 365 / OneDrive / Outlook accounts</strong> — because the flow looks normal: download link, open file, login.</p>

  <p>In this post I break down a real-world incident (with the video embedded) and explain <strong>what actually happens</strong> during the attack and <strong>why an HTML file can be dangerous</strong> even when it looks harmless.</p>

  <div class="blog-callout">
    <p><strong>What this attack is about</strong><br>
    The attacker uses a “legit-looking” WeTransfer download to deliver an <strong>HTML file</strong>. When opened, it launches a browser and shows a <strong>fake OneDrive/Microsoft login page</strong>. If the victim types credentials, the attacker captures them and can take over the account.</p>
  </div>

  <h2>Why WeTransfer is used so often</h2>
  <p>WeTransfer is widely trusted for sharing files. Attackers exploit that trust: people are more likely to click a WeTransfer link than an unknown file-hosting site. That high trust = high click rate.</p>

  <h2>The attack flow (simple but effective)</h2>
  <ul>
    <li>📩 A fake email claims documents, invoices, or shared files are available.</li>
    <li>🔗 The link opens a WeTransfer-style download page.</li>
    <li>📄 The download is often named like <em>invoice.html</em> or <em>documents.html</em>.</li>
    <li>🌐 Opening the file launches a browser with a <strong>convincing OneDrive/Microsoft login</strong>.</li>
    <li>🔐 Credentials entered → sent to the attacker.</li>
  </ul>

  <h2>Why HTML files are risky</h2>
  <p>An HTML file is essentially “a web page saved as a file”. When opened, it can:</p>
  <ul>
    <li>render a realistic login page</li>
    <li>redirect you to a phishing domain</li>
    <li>submit your email/password to an attacker-controlled server</li>
  </ul>
  <p>The trick works because many people don’t expect a login page after “opening a file”.</p>

  <h2>How to spot it quickly</h2>
  <ul>
    <li><strong>Check the domain:</strong> is it a real Microsoft domain (e.g. <em>login.microsoftonline.com</em>)?</li>
    <li><strong>Check the file type:</strong> why is it <strong>.html</strong> instead of PDF/DOCX?</li>
    <li><strong>Urgency cues:</strong> “expires soon”, “urgent”, “view now” are common pressure tactics.</li>
    <li><strong>Context check:</strong> does this email match something you actually expect?</li>
  </ul>

  <h2>How to protect your Microsoft 365 account</h2>
  <ul>
    <li><strong>Enable MFA</strong> (Authenticator app preferred).</li>
    <li>Use a <strong>password manager</strong> — it auto-fills only on the real domain.</li>
    <li>For businesses: use <strong>Security Defaults / Conditional Access</strong>.</li>
    <li>Train your team: “HTML file ≠ document”.</li>
    <li>If you suspect compromise: change password, revoke sessions, review sign-in logs.</li>
  </ul>

  <h2>Video (real incident walkthrough)</h2>
  <p>The embedded video shows the incident flow and what to look for in real life.</p>

  <p><strong>Key takeaway:</strong> WeTransfer itself isn’t the threat — the attacker uses the trusted download flow as camouflage. The danger starts when an HTML file triggers a login prompt.</p>
`

      }
    }
  }
];
