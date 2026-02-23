// assets/blog-posts.js
// AUTO-GENERATED FILE. Do not edit directly.
// Edit Markdown files in /posts and run: npm run build:posts

window.SWISSPLOIT_BLOG_POSTS = [
  {
    "id": "wetransfer-phishing-html-onedrive",
    "date": "Tue Jan 27 2026 00:00:00 GMT+0000 (Coordinated Universal Time)",
    "tags": [
      "security",
      "phishing",
      "microsoft365",
      "onedrive",
      "outlook"
    ],
    "thumb": "assets/blog/h355-014.png",
    "videoUrl": "https://www.youtube.com/watch?v=5aVeWRinSxM",
    "i18n": {
      "de": {
        "title": "Angriff mit HTML",
        "excerpt": "So wurde ein Microsoft-Konto übernommen!",
        "content": "<p><strong>WeTransfer-Phishing</strong> ist aktuell eine der fiesesten Methoden, um <strong>Microsoft 365 / OneDrive / Outlook Accounts</strong> zu übernehmen – weil der Ablauf “normal” wirkt: Download-Link, Datei öffnen, Login.</p>\n\n<p>In diesem Beitrag zeige ich dir den Angriff anhand eines realen Falls – inklusive Video – und erkläre, <strong>warum eine HTML-Datei gefährlich sein kann</strong>, obwohl sie auf den ersten Blick harmlos aussieht.</p>\n\n<div class=\"blog-callout\">\n  <p><strong>Worum geht’s?</strong><br>\n  Ein Angreifer lockt dich über einen scheinbar legitimen WeTransfer-Link zu einem Download. Statt eines PDFs oder Dokuments bekommst du eine <strong>HTML-Datei</strong>, die ein <strong>Fake OneDrive-Login</strong> öffnet. Sobald du dort dein Passwort eingibst, kann dein Microsoft-Konto kompromittiert werden.</p>\n</div>\n\n<h2>Warum ausgerechnet WeTransfer?</h2>\n<p>Viele kennen WeTransfer als seriösen Dienst zum Teilen von Dateien. Genau dieses Vertrauen wird ausgenutzt. Ein Link zu WeTransfer löst bei vielen weniger Misstrauen aus als eine unbekannte File-Share-Seite – und genau das erhöht die Klickrate.</p>\n\n<h2>So läuft der Angriff ab</h2>\n<p>Das Muster ist fast immer gleich: Du bekommst eine Mail, die nach Dokumenten, Bestellung oder “freigegebenen Dateien” klingt. Der Link führt auf eine Seite, die wie ein normaler Download wirkt. Du lädst eine Datei herunter – häufig mit Namen wie <em>Rechnung.html</em> oder <em>Dokumente.html</em>.</p>\n\n<p>Beim Öffnen startet dein Browser und zeigt eine <strong>täuschend echte OneDrive/Microsoft-Anmeldeseite</strong>. Viele denken: “Ah, Microsoft will kurz bestätigen” – und tippen ihre Zugangsdaten ein.</p>\n\n<h2>Warum die HTML-Datei der kritische Punkt ist</h2>\n<p>Eine HTML-Datei ist im Prinzip “eine Webseite als Datei”. Öffnest du sie, kann sie eine Login-Seite nachbauen, dich weiterleiten oder Formulareingaben an einen Server senden. Das Gemeine: Ein “Dokument” wirkt harmlos – aber im Browser wird daraus plötzlich ein Login.</p>\n\n<h2>So erkennst du den Fake schnell</h2>\n<p>Schau dir die Adresse im Browser an: Ist das wirklich eine saubere Microsoft-Domain? Und frag dich: Warum ist das ein <strong>.html</strong> und kein PDF/DOCX? Wenn zusätzlich Druck aufgebaut wird (“läuft ab”, “dringend”, “sofort ansehen”), ist das fast immer ein Warnsignal.</p>\n\n<h2>So schützt du dein Microsoft 365 Konto nachhaltig</h2>\n<p>Aktiviere <strong>MFA</strong> (am besten per Authenticator-App), nutze einen <strong>Passwort-Manager</strong> und prüfe verdächtige Logins. Für KMU lohnt sich zusätzlich Security Defaults oder Conditional Access. Und ganz wichtig: Im Team kurz erklären, dass “HTML-Datei ≠ Dokument” ist.</p>\n\n<h2>Video zum Fall</h2>\n<p>Im Video zeige ich dir den Ablauf im Detail und worauf du in der Praxis achten solltest.</p>\n\n<p><strong>Takeaway:</strong> WeTransfer ist nicht “das Problem”. Der Angreifer nutzt den vertrauten Download-Flow als Tarnung. Kritisch wird es, wenn eine HTML-Datei ein Login auslöst.</p>"
      },
      "en": {
        "title": "HTML Attack",
        "excerpt": "A real Microsoft account takeover!",
        "content": "<p><strong>WeTransfer phishing</strong> is currently one of the most effective ways to compromise <strong>Microsoft 365 / OneDrive / Outlook accounts</strong> — because the flow looks normal: download link, open file, login.</p>\n\n<p>In this post I break down a real incident (with the video embedded) and explain <strong>what actually happens</strong> and <strong>why an HTML file can be dangerous</strong> even when it looks harmless.</p>\n\n<div class=\"blog-callout\">\n  <p><strong>What this attack is about</strong><br>\n  Attackers use a legit-looking WeTransfer download to deliver an <strong>HTML file</strong>. When opened, it launches a browser and shows a <strong>fake OneDrive/Microsoft login page</strong>. If you type credentials, they get captured.</p>\n</div>\n\n<h2>Why WeTransfer is used so often</h2>\n<p>WeTransfer is widely trusted. Attackers exploit that trust to increase clicks and reduce suspicion, compared to unknown file-hosting domains.</p>\n\n<h2>How the attack unfolds</h2>\n<p>You receive an email that looks like shared files, invoices, or documents. The link opens a download-style page. Instead of a PDF/DOCX, you download something like <em>invoice.html</em> or <em>documents.html</em>.</p>\n\n<p>When you open it, your browser shows a convincing <strong>OneDrive/Microsoft login</strong>. Many people assume it’s a normal cloud authentication step — and enter their password.</p>\n\n<h2>Why the HTML file is the key risk</h2>\n<p>An HTML file is basically “a web page saved as a file”. When opened, it can render a fake login page, redirect you, or submit what you type to an attacker-controlled server. That’s why “opening a file” can suddenly turn into a credential theft moment.</p>\n\n<h2>How to spot it quickly</h2>\n<p>Check the browser address: is it a real Microsoft domain? Also ask: why is this <strong>.html</strong> instead of a document? If the message adds urgency (“expires soon”, “urgent”, “view now”), treat it as a strong warning sign.</p>\n\n<h2>How to protect your Microsoft 365 account</h2>\n<p>Enable <strong>MFA</strong> (Authenticator preferred), use a <strong>password manager</strong>, and review suspicious sign-ins. For businesses, consider Security Defaults or Conditional Access. And teach teams that “HTML file ≠ document”.</p>\n\n<h2>Video</h2>\n<p>The embedded video shows the incident flow and what to look for in real life.</p>\n\n<p><strong>Key takeaway:</strong> WeTransfer itself isn’t the threat. Attackers use the trusted download flow as camouflage. The danger starts when an HTML file triggers a login prompt.</p>"
      }
    }
  },
  {
    "id": "outlook-fragezeichen-zeichenkodierung-utf8",
    "date": "Thu Feb 19 2026 00:00:00 GMT+0000 (Coordinated Universal Time)",
    "tags": [
      "outlook",
      "microsoft365",
      "encoding",
      "utf-8",
      "classic-outlook",
      "windows"
    ],
    "thumb": "assets/blog/OutlookUml.png",
    "videoUrl": "",
    "i18n": {
      "de": {
        "title": "Outlook zeigt Umlaute als ?",
        "excerpt": "In Classic Outlook werden Sonderzeichen zu Fragezeichen. So löst du es (UTF-8, OWA, Rollback).",
        "videoUrl": "",
        "content": "<p>Wenn in <strong>Classic Outlook</strong> plötzlich aus Sonderzeichen wie <strong>é, ü, ñ, ® oder £</strong> nur noch <strong>Fragezeichen</strong> werden, wirkt das wie ein Font-Problem – ist es aber meistens nicht. In der Praxis ist es fast immer ein Thema rund um <strong>Zeichenkodierung</strong> und ein aktuelles Outlook-Update.</p>\n\n<p>Microsoft führt dieses Verhalten als bekanntes Problem, das laut bisherigen Rückmeldungen vor allem in <strong>Version 2601 (Build 19628.20150 und höher)</strong> auftritt. Der Status steht aktuell auf “Untersuchung läuft”.</p>\n\n<h2>Was genau passiert hier?</h2>\n<p>Outlook muss beim Versenden entscheiden, in welcher Kodierung eine Mail rausgeht. Wenn dabei nicht sauber <strong>Unicode/UTF-8</strong> verwendet wird, sondern eine eingeschränkte Kodierung, können Zeichen außerhalb von ASCII nicht korrekt dargestellt werden. Das Ergebnis sieht dann so aus: statt “Grüsse, Zürich®” steht beim Empfänger “Gr??e, Z?rich?”.</p>\n\n<h2>Schnelle Lösung: OWA oder Neues Outlook</h2>\n<p>Wenn du sofort wieder korrekt schreiben musst, ist der schnellste Weg, vorübergehend auf <strong>Outlook Web Access (OWA)</strong> oder das <strong>Neue Outlook</strong> zu wechseln. Dort tritt das Problem typischerweise nicht auf, weil die Verarbeitung moderner und konsequent Unicode-basiert ist.</p>\n\n<h2>Workaround in Classic Outlook: UTF-8 / Kodierung erzwingen</h2>\n<p>Wenn du Classic Outlook zwingend brauchst, hilft es in vielen Fällen, die automatische Auswahl der Kodierung abzuschalten und stattdessen eine stabile Kodierung zu erzwingen. In der Praxis funktioniert <strong>UTF-8</strong> am zuverlässigsten, weil es Sonderzeichen sauber abbildet und in modernen Umgebungen Standard ist. Genau dieser Schritt verhindert häufig, dass Outlook “falsch rät” und Zeichen beim Senden kaputt macht.</p>\n\n<figure class=\"post-figure\">\n  <img src=\"assets/blog/Outlutf-8.png\" alt=\"Outlook: Codierung auf Unicode (UTF-8) umstellen\">\n  <figcaption>Hier müssen diese zwei Optionen auf Unicode UTF-8 gewechselt werden.</figcaption>\n</figure>\n\n<figure class=\"post-figure\">\n  <img src=\"assets/blog/Outlutf-8_2.png\" alt=\"Outlook: weitere UTF-8 Einstellung\">\n</figure>\n\n<h2>Workaround: auf eine ältere Version zurück</h2>\n<p>Wenn das Problem mit einem Update gekommen ist und du dringend stabil arbeiten musst, kannst du testweise auf eine vorherige Version zurückgehen. Microsoft nennt dafür eine bekannte, funktionierende Version und beschreibt den Rollback über <em>officec2rclient.exe</em>. Danach solltest du Office-Updates temporär pausieren, damit es nicht direkt wieder auf den problematischen Build springt.</p>\n\n<h2>Wann kommt der Fix?</h2>\n<p>Im Microsoft-Artikel wird als praktischer Reminder explizit der <strong>10. März</strong> genannt, um Einstellungen oder Updates wieder zu aktivieren. Realistisch ist daher, dass eine offizielle Korrektur eher mit dem nächsten Patch-Zyklus greifbar wird – also rund um den <strong>Patchday am 10. März</strong>.</p>\n\n<h2>Quelle</h2>\n<p>Microsoft Support (Known Issue): <a href=\"https://support.microsoft.com/de-de/topic/das-klassische-outlook-ersetzt-akzentierte-und-erweiterte-zeichen-durch-fragezeichen-c1fdb067-38ca-464a-bcb1-bd657a85e1d3\" target=\"_blank\" rel=\"noopener\">Das klassische Outlook ersetzt akzentierte und erweiterte Zeichen durch Fragezeichen</a></p>"
      },
      "en": {
        "title": "Classic Outlook turns äöü into ?",
        "excerpt": "Special characters become question marks in Classic Outlook. Here’s why—and how to fix it (UTF-8, OWA, rollback).",
        "videoUrl": "",
        "content": "<p>If <strong>Classic Outlook</strong> suddenly replaces characters like <strong>é, ü, ñ, ® or £</strong> with <strong>question marks</strong>, it looks like a font issue at first—but it usually isn’t. In most real cases, it’s a <strong>character encoding</strong> problem triggered by a recent Outlook update.</p>\n\n<p>Microsoft lists this as a known issue and reports it mainly in <strong>Version 2601 (Build 19628.20150 and later)</strong>. The current status is still “investigating”.</p>\n\n<h2>What’s actually happening?</h2>\n<p>When Outlook sends an email, it needs to choose an outgoing encoding. If it doesn’t reliably use <strong>Unicode/UTF-8</strong> and instead falls back to a limited encoding, characters outside ASCII can’t be represented correctly. That’s when “Grüsse, Zürich®” can end up as “Gr??e, Z?rich?” for the recipient.</p>\n\n<h2>Fastest workaround: OWA or New Outlook</h2>\n<p>If you need a quick, reliable fix right now, switch temporarily to <strong>Outlook on the web (OWA)</strong> or the <strong>New Outlook</strong>. The issue typically doesn’t show there because the handling is more modern and consistently Unicode-based.</p>\n\n<h2>Classic Outlook workaround: force UTF-8 / avoid auto-encoding</h2>\n<p>If you must stay on Classic Outlook, a common fix is to disable the automatic selection of outgoing encoding and use a stable encoding instead. In practice, <strong>UTF-8</strong> is the most reliable choice because it cleanly supports special characters and is the modern standard. This prevents Outlook from “guessing” and damaging characters during sending.</p>\n\n<figure class=\"post-figure\">\n  <img src=\"assets/blog/Outlutf-8.png\" alt=\"Outlook: switch encoding to Unicode (UTF-8)\">\n  <figcaption>Switch these two options to Unicode (UTF-8).</figcaption>\n</figure>\n\n<figure class=\"post-figure\">\n  <img src=\"assets/blog/Outlutf-8_2.png\" alt=\"Outlook: additional UTF-8 setting\">\n</figure>\n\n<h2>Rollback option if you need stability</h2>\n<p>If the problem started right after an update, you can roll back to a previous working version as a temporary stabilization step. Microsoft describes the rollback via <em>officec2rclient.exe</em>, and then recommends pausing updates to avoid jumping back onto the problematic build.</p>\n\n<h2>When to expect a real fix</h2>\n<p>The Microsoft article uses <strong>March 10</strong> as a reminder date to re-enable settings or updates. Realistically, that suggests a proper fix will land around the next patch cycle—so roughly the <strong>March 10 Patch Tuesday</strong> window.</p>\n\n<h2>Source</h2>\n<p>Microsoft Support (Known Issue): <a href=\"https://support.microsoft.com/de-de/topic/das-klassische-outlook-ersetzt-akzentierte-und-erweiterte-zeichen-durch-fragezeichen-c1fdb067-38ca-464a-bcb1-bd657a85e1d3\" target=\"_blank\" rel=\"noopener\">Classic Outlook replaces accented and extended characters with question marks</a></p>"
      }
    }
  },
  {
    "id": "onedrive-restore-deleted-files",
    "date": "Mon Feb 23 2026 00:00:00 GMT+0000 (Coordinated Universal Time)",
    "tags": [
      "onedrive",
      "microsoft-365",
      "windows",
      "cloud",
      "backup",
      "papierkorb"
    ],
    "thumb": "assets/blog/onedrive-restore.png",
    "videoUrl": "",
    "i18n": {
      "de": {
        "title": "OneDrive Dateien zurückholen!",
        "excerpt": "So stellst du Dateien und Ordner in Sekunden wieder her.",
        "videoUrl": "",
        "content": "<h2>Problem</h2>\n<p>Du hast in OneDrive aus Versehen eine Datei oder einen Ordner gelöscht und findest es nicht mehr.</p>\n<h2>Lösung (Schritt für Schritt)</h2>\n<ol>\n<li>Klicke auf das <strong>OneDrive-Symbol</strong> unten rechts in Windows.</li>\n<li>Wähle <strong>Online anzeigen</strong> (öffnet OneDrive im Browser).</li>\n<li>Klicke links auf <strong>Papierkorb</strong>.</li>\n<li>Markiere die gelöschten <strong>Dateien oder Ordner</strong>.</li>\n<li>Klicke auf <strong>Wiederherstellen</strong>.</li>\n</ol>\n<h2>Ergebnis</h2>\n<p>Zurück im OneDrive-Ordner ist alles wieder <strong>genau dort</strong>, wo du es gelöscht hast.</p>\n<h2>Profi-Tipp</h2>\n<p>Wenn du das OneDrive-Symbol nicht siehst: Startmenü öffnen, nach <strong>OneDrive</strong> suchen, anmelden – und nochmals prüfen.</p>"
      },
      "en": {
        "title": "Restore deleted files in OneDrive",
        "excerpt": "Here’s how to restore files and folders from the Recycle Bin in seconds.",
        "videoUrl": "https://youtube.com/shorts/wK_7kSkfQ_g?si=54cgcVFK9d2fzl4a",
        "content": "<h2>Problem</h2>\n<p>You deleted a file or folder in OneDrive and can’t find it anymore.</p>\n<h2>Solution (Step-by-step)</h2>\n<ol>\n<li>Click the <strong>OneDrive icon</strong> in the <strong>bottom-right</strong> corner of Windows.</li>\n<li>Select <strong>View online</strong> to open OneDrive in your browser.</li>\n<li>In the left menu, click <strong>Recycle bin</strong>.</li>\n<li>Select the deleted <strong>files or folders</strong>.</li>\n<li>Click <strong>Restore</strong>.</li>\n</ol>\n<h2>Result</h2>\n<p>Go back to your OneDrive folder — everything is back <strong>exactly where it was</strong>.</p>\n<h2>Pro tip</h2>\n<p>If you don’t see the OneDrive icon, open the Start menu and search for <strong>OneDrive</strong>, then sign in and try again.</p>"
      }
    }
  }
];
