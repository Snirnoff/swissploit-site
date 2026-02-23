---
id: wetransfer-phishing-html-onedrive
date: 2026-01-27
tags: [security, phishing, microsoft365, onedrive, outlook]
thumb: assets/blog/h355-014.png
videoUrl: https://www.youtube.com/watch?v=5aVeWRinSxM
title: Angriff mit HTML
excerpt: So wurde ein Microsoft-Konto übernommen!
---

<p><strong>WeTransfer-Phishing</strong> ist aktuell eine der fiesesten Methoden, um <strong>Microsoft 365 / OneDrive / Outlook Accounts</strong> zu übernehmen – weil der Ablauf “normal” wirkt: Download-Link, Datei öffnen, Login.</p>

<p>In diesem Beitrag zeige ich dir den Angriff anhand eines realen Falls – inklusive Video – und erkläre, <strong>warum eine HTML-Datei gefährlich sein kann</strong>, obwohl sie auf den ersten Blick harmlos aussieht.</p>

<div class="blog-callout">
  <p><strong>Worum geht’s?</strong><br>
  Ein Angreifer lockt dich über einen scheinbar legitimen WeTransfer-Link zu einem Download. Statt eines PDFs oder Dokuments bekommst du eine <strong>HTML-Datei</strong>, die ein <strong>Fake OneDrive-Login</strong> öffnet. Sobald du dort dein Passwort eingibst, kann dein Microsoft-Konto kompromittiert werden.</p>
</div>

## Warum ausgerechnet WeTransfer?

<p>Viele kennen WeTransfer als seriösen Dienst zum Teilen von Dateien. Genau dieses Vertrauen wird ausgenutzt. Ein Link zu WeTransfer löst bei vielen weniger Misstrauen aus als eine unbekannte File-Share-Seite – und genau das erhöht die Klickrate.</p>

## So läuft der Angriff ab

<p>Das Muster ist fast immer gleich: Du bekommst eine Mail, die nach Dokumenten, Bestellung oder “freigegebenen Dateien” klingt. Der Link führt auf eine Seite, die wie ein normaler Download wirkt. Du lädst eine Datei herunter – häufig mit Namen wie <em>Rechnung.html</em> oder <em>Dokumente.html</em>.</p>

<p>Beim Öffnen startet dein Browser und zeigt eine <strong>täuschend echte OneDrive/Microsoft-Anmeldeseite</strong>. Viele denken: “Ah, Microsoft will kurz bestätigen” – und tippen ihre Zugangsdaten ein.</p>

## Warum die HTML-Datei der kritische Punkt ist

<p>Eine HTML-Datei ist im Prinzip “eine Webseite als Datei”. Öffnest du sie, kann sie eine Login-Seite nachbauen, dich weiterleiten oder Formulareingaben an einen Server senden. Das Gemeine: Ein “Dokument” wirkt harmlos – aber im Browser wird daraus plötzlich ein Login.</p>

## So erkennst du den Fake schnell

<p>Schau dir die Adresse im Browser an: Ist das wirklich eine saubere Microsoft-Domain? Und frag dich: Warum ist das ein <strong>.html</strong> und kein PDF/DOCX? Wenn zusätzlich Druck aufgebaut wird (“läuft ab”, “dringend”, “sofort ansehen”), ist das fast immer ein Warnsignal.</p>

## So schützt du dein Microsoft 365 Konto nachhaltig

<p>Aktiviere <strong>MFA</strong> (am besten per Authenticator-App), nutze einen <strong>Passwort-Manager</strong> und prüfe verdächtige Logins. Für KMU lohnt sich zusätzlich Security Defaults oder Conditional Access. Und ganz wichtig: Im Team kurz erklären, dass “HTML-Datei ≠ Dokument” ist.</p>

## Video zum Fall

<p>Im Video zeige ich dir den Ablauf im Detail und worauf du in der Praxis achten solltest.</p>

<p><strong>Takeaway:</strong> WeTransfer ist nicht “das Problem”. Der Angreifer nutzt den vertrauten Download-Flow als Tarnung. Kritisch wird es, wenn eine HTML-Datei ein Login auslöst.</p>
