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
          <p><strong>In diesem Beitrag (inkl. Video)</strong> zeige ich einen echten Fall, bei dem ein Microsoft-Konto über einen WeTransfer-Phishing-Angriff kompromittiert wurde.</p>

          <div class="blog-callout">
            <p><strong>Wenn du Microsoft 365, OneDrive oder Outlook nutzt:</strong> Dieser Ablauf ist Pflichtwissen.</p>
          </div>

          <h2>So lief der Angriff ab</h2>
          <ul>
            <li>📩 Das Opfer erhält eine <strong>gefälschte E-Mail</strong>.</li>
            <li>🔗 Der Link führt auf eine <strong>WeTransfer-Download-Seite</strong>.</li>
            <li>📄 Statt Dokumenten kommt eine <strong>HTML-Datei</strong>.</li>
            <li>🔐 Die HTML-Datei öffnet ein <strong>Fake OneDrive-Login</strong>.</li>
            <li>❗ Passwort eingegeben → Angreifer <strong>übernimmt das Konto</strong>.</li>
          </ul>

          <h2>Warum das so gut funktioniert</h2>
          <p>Der Trick nutzt Vertrauen (Brand + “Download”-Flow). Eine HTML-Datei wirkt harmlos, kann aber eine täuschend echte Login-Seite öffnen.</p>

          <h2>So schützt du dich</h2>
          <ul>
            <li><strong>Nie</strong> unerwartete HTML-Dateien öffnen.</li>
            <li>Vor dem Login immer die <strong>Domain prüfen</strong>.</li>
            <li><strong>MFA aktivieren</strong> (Microsoft Account / 365).</li>
            <li>Bei “Lieferant”-Mails: Kontext verifizieren (kurze Rückfrage).</li>
          </ul>

          <p>Wenn’s dir geholfen hat: Teile das Video mit anderen – und abonnier für mehr Security-Content.</p>
        `
      },

      en: {
        title: "Real Attack: WeTransfer Phishing → HTML File → Fake OneDrive Login",
        excerpt: "A real Microsoft account takeover via a WeTransfer phishing page that delivered a malicious HTML file.",
        content: `
          <p><strong>In this post (with video)</strong> I show a real incident where a client’s Microsoft account was compromised via a WeTransfer phishing attack.</p>

          <div class="blog-callout">
            <p><strong>If you use Microsoft 365, OneDrive or Outlook:</strong> You should know this flow.</p>
          </div>

          <h2>How the attack unfolded</h2>
          <ul>
            <li>📩 The victim received a <strong>fake email</strong>.</li>
            <li>🔗 The email linked to a <strong>WeTransfer download page</strong>.</li>
            <li>📄 Instead of documents, it delivered a <strong>malicious HTML file</strong>.</li>
            <li>🔐 The file opened a <strong>fake OneDrive login page</strong>.</li>
            <li>❗ Password entered → attackers <strong>took over the account</strong>.</li>
          </ul>

          <h2>Why it works</h2>
          <p>It leverages trust + a familiar download step. An HTML file looks harmless, but can open a convincing login lure.</p>

          <h2>How to protect yourself</h2>
          <ul>
            <li><strong>Never</strong> open unexpected HTML files.</li>
            <li>Verify the domain before logging in.</li>
            <li>Enable <strong>MFA</strong> on Microsoft accounts.</li>
            <li>Verify context if the email looks “supplier legit”.</li>
          </ul>

          <p>If you found this helpful, share the video and subscribe for more Tech & Security content.</p>
        `
      }
    }
  }
];
