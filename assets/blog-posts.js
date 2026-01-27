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
        excerpt:
          "So wurde ein Microsoft-Konto übernommen: WeTransfer-Link, HTML-Download, gefälschtes OneDrive-Login.",
        content: content: `
<p><strong>WeTransfer-Phishing</strong> ist aktuell eine der fiesesten Methoden, um <strong>Microsoft 365 / OneDrive / Outlook Accounts</strong> zu übernehmen – weil der Ablauf “normal” wirkt: Download-Link, Datei öffnen, Login.</p>

<p>In diesem Beitrag zeige ich dir den Angriff anhand eines realen Falls – inklusive Video – und erkläre, <strong>warum eine HTML-Datei gefährlich sein kann</strong>, obwohl sie auf den ersten Blick harmlos aussieht.</p>

<div class="blog-callout">
  <p><strong>Worum geht’s?</strong><br>
  Ein Angreifer lockt dich über einen scheinbar legitimen WeTransfer-Link zu einem Download. Statt eines PDFs oder Dokuments bekommst du eine <strong>HTML-Datei</strong>, die ein <strong>Fake OneDrive-Login</strong> öffnet. Sobald du dort dein Passwort eingibst, kann dein Microsoft-Konto kompromittiert werden.</p>
</div>

<h2>Warum ausgerechnet WeTransfer?</h2>
<p>Viele kennen WeTransfer als seriösen Dienst zum Teilen von Dateien. Genau dieses Vertrauen wird ausgenutzt. Ein Link zu WeTransfer löst bei vielen weniger Misstrauen aus als eine unbekannte File-Share-Seite – und genau das erhöht die Klickrate.</p>

<h2>So läuft der Angriff ab</h2>
<p>Das Muster ist fast immer gleich: Du bekommst eine Mail, die nach Dokumenten, Bestellung oder “freigegebenen Dateien” klingt. Der Link führt auf eine Seite, die wie ein normaler Download wirkt. Du lädst eine Datei herunter – häufig mit Namen wie <em>Rechnung.html</em> oder <em>Dokumente.html</em>.</p>

<p>Und jetzt kommt der Trick: Beim Öffnen startet dein Browser und zeigt eine <strong>täuschend echte OneDrive/Microsoft-Anmeldeseite</strong>. Viele denken: “Ah, Microsoft will kurz bestätigen” – und tippen ihre Zugangsdaten ein.</p>

<h2>Warum die HTML-Datei der kritische Punkt ist</h2>
<p>Eine HTML-Datei ist im Prinzip “eine Webseite als Datei”. Öffnest du sie, kann sie eine Login-Seite nachbauen, dich weiterleiten oder Formulareingaben an einen Server senden. Das Gemeine: Ein “Dokument” wirkt harmlos – aber im Browser wird daraus plötzlich ein Login.</p>

<h2>So erkennst du den Fake schnell</h2>
<p>Schau dir die Adresse im Browser an: Ist das wirklich eine saubere Microsoft-Domain? Und frag dich: Warum ist das ein <strong>.html</strong> und kein PDF/DOCX? Wenn zusätzlich Druck aufgebaut wird (“läuft ab”, “dringend”, “sofort ansehen”), ist das fast immer ein Warnsignal.</p>

<h2>So schützt du dein Microsoft 365 Konto nachhaltig</h2>
<p>Aktiviere <strong>MFA</strong> (am besten per Authenticator-App), nutze einen <strong>Passwort-Manager</strong> und prüfe verdächtige Logins. Für KMU lohnt sich zusätzlich Security Defaults oder Conditional Access. Und ganz wichtig: Im Team kurz erklären, dass “HTML-Datei ≠ Dokument” ist.</p>

<h2>Video zum Fall</h2>
<p>Im Video zeige ich dir den Ablauf im Detail und worauf du in der Praxis achten solltest.</p>

<p><strong>Takeaway:</strong> WeTransfer ist nicht “das Problem”. Der Angreifer nutzt den vertrauten Download-Flow als Tarnung. Kritisch wird es, wenn eine HTML-Datei ein Login auslöst.</p>
`
,
      },

      en: {
        title: "Real Attack: WeTransfer Phishing → HTML File → Fake OneDrive Login",
        excerpt:
          "A real Microsoft account takeover via a WeTransfer phishing page that delivered a malicious HTML file.",
        content: content: `
<p><strong>WeTransfer phishing</strong> is currently one of the most effective ways to compromise <strong>Microsoft 365 / OneDrive / Outlook accounts</strong> — because the flow looks normal: download link, open file, login.</p>

<p>In this post I break down a real incident (with the video embedded) and explain <strong>what actually happens</strong> and <strong>why an HTML file can be dangerous</strong> even when it looks harmless.</p>

<div class="blog-callout">
  <p><strong>What this attack is about</strong><br>
  Attackers use a legit-looking WeTransfer download to deliver an <strong>HTML file</strong>. When opened, it launches a browser and shows a <strong>fake OneDrive/Microsoft login page</strong>. If you type credentials, they get captured.</p>
</div>

<h2>Why WeTransfer is used so often</h2>
<p>WeTransfer is widely trusted. Attackers exploit that trust to increase clicks and reduce suspicion, compared to unknown file-hosting domains.</p>

<h2>How the attack unfolds</h2>
<p>You receive an email that looks like shared files, invoices, or documents. The link opens a download-style page. Instead of a PDF/DOCX, you download something like <em>invoice.html</em> or <em>documents.html</em>.</p>

<p>When you open it, your browser shows a convincing <strong>OneDrive/Microsoft login</strong>. Many people assume it’s a normal cloud authentication step — and enter their password.</p>

<h2>Why the HTML file is the key risk</h2>
<p>An HTML file is basically “a web page saved as a file”. When opened, it can render a fake login page, redirect you, or submit what you type to an attacker-controlled server. That’s why “opening a file” can suddenly turn into a credential theft moment.</p>

<h2>How to spot it quickly</h2>
<p>Check the browser address: is it a real Microsoft domain? Also ask: why is this <strong>.html</strong> instead of a document? If the message adds urgency (“expires soon”, “urgent”, “view now”), treat it as a strong warning sign.</p>

<h2>How to protect your Microsoft 365 account</h2>
<p>Enable <strong>MFA</strong> (Authenticator preferred), use a <strong>password manager</strong>, and review suspicious sign-ins. For businesses, consider Security Defaults or Conditional Access. And teach teams that “HTML file ≠ document”.</p>

<h2>Video</h2>
<p>The embedded video shows the incident flow and what to look for in real life.</p>

<p><strong>Key takeaway:</strong> WeTransfer itself isn’t the threat. Attackers use the trusted download flow as camouflage. The danger starts when an HTML file triggers a login prompt.</p>
`,

      },
    },
  },
];
