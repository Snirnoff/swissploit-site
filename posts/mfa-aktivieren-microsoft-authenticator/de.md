---
id: mfa-aktivieren-microsoft-authenticator
date: "2026-03-05"
title: "MFA aktivieren: Microsoft Authenticator"
excerpt: "So aktivierst du MFA mit Microsoft Authenticator in wenigen Minuten – Schritt für Schritt."
tags: [mfa, microsoft-authenticator, konto-sicherheit, microsoft-konto, entra-id, two-factor-authentication, security, identity, phishing, login]
thumb: assets/blog/021_tn.webp
videoUrl: "https://youtube.com/shorts/Sg2nFP_aDu0?si=r5M1WGa254fFR6c-"
---

Wenn jemand dein Microsoft-Passwort hat, kann er dein Konto übernehmen – oft ohne dass du’s sofort merkst. Mit **MFA (Multi-Faktor-Authentifizierung)** reicht das Passwort allein nicht mehr: Für den Login braucht es zusätzlich eine Bestätigung auf deinem Handy. Das ist eine der schnellsten Sicherheitsmassnahmen überhaupt – und in wenigen Minuten eingerichtet.

## Was ist passiert?

- **Passwort allein ist nicht genug Schutz**: Es kann geleakt, erraten oder via Phishing abgegriffen werden.
- **Angreifer loggen sich oft „leise“ ein** und richten z. B. Weiterleitungen oder Apps ein.
- **MFA stoppt viele Kontoübernahmen**, weil ein zweiter Faktor (dein Gerät) nötig ist.

## Schritt-für-Schritt Lösung

1. **Setup-Seite öffnen**
   - Öffne den Browser und gehe auf:
     - `aka.ms/mfasetup`

2. **Mit deinem Microsoft-Konto anmelden**
   - Melde dich mit deinem Microsoft-Konto an.
   - Du solltest danach auf der Seite **Sicherheitsinfos** landen.

3. **Falls du nicht bei „Sicherheitsinfos“ bist**
   - Öffne direkt:
     - `mysignins.microsoft.com/security-info`

4. **Anmeldemethode hinzufügen**
   - Klicke auf **„Anmeldemethode hinzufügen“**.

5. **Microsoft Authenticator auswählen**
   - Du siehst mehrere Optionen.
   - Empfehlung: **Microsoft Authenticator** (schnell, sicher, bequem).
   - Wähle **Microsoft Authenticator** und klicke **Weiter**.

6. **Microsoft Authenticator am Handy installieren**
   - Öffne **App Store** oder **Google Play Store**
   - Suche nach **Microsoft Authenticator**
   - Installieren und danach öffnen

7. **QR-Code am PC anzeigen lassen**
   - Am PC auf **Weiter** klicken – es erscheint ein **QR-Code**.

8. **QR-Code mit dem Handy scannen**
   - In der Authenticator-App:
     - Tippe auf **Konto hinzufügen** / **+** / das **QR-Code-Icon**
     - Scanne den QR-Code am Bildschirm

9. **Test bestätigen (Zahl am Handy bestätigen)**
   - Microsoft macht danach einen Test:
     - Am PC erscheint eine **Zahl**
     - Diese musst du am Handy **bestätigen** bzw. **eingeben**

10. **Fertig: Bestätigung prüfen**
   - Wenn alles klappt, bekommst du eine Bestätigung.
   - Du siehst dein Handy jetzt unter **Sicherheitsinfos** als neue Anmeldemethode.

## Häufige Fragen / Troubleshooting

**Ich sehe die Seite „Sicherheitsinfos“ nicht – wo muss ich hin?**  
Gehe direkt auf `mysignins.microsoft.com/security-info` und melde dich an.

**Ich finde das QR-Code-Symbol im Authenticator nicht.**  
Öffne die App und suche nach „Konto hinzufügen“/„+“ oder dem QR-Symbol. Je nach Version ist es unten rechts oder im Menü.

**Der Zahlentest kommt nicht oder schlägt fehl.**  
Prüfe Internetverbindung am Handy, schliesse die Authenticator-App komplett und öffne sie neu. Starte den Vorgang am PC nochmals mit „Weiter“.

**Kann ich MFA auch ohne Authenticator-App nutzen?**  
Meist ja (SMS/Anruf), aber **Authenticator ist empfehlenswert**, weil bequemer und in der Regel sicherer.

**Was, wenn ich mein Handy verliere?**  
Lege (falls möglich) eine zweite Methode/Backup an (z. B. zweites Gerät oder alternative Methode), damit du nicht ausgesperrt wirst.

<div class="callout tip">
  <div class="callout-title"><strong>💡 Tipp</strong></div>
  Aktiviere nach dem Setup <strong>mindestens eine Backup-Option</strong> (z. B. zweite Methode), damit du bei Gerätewechsel oder Verlust weiterhin Zugriff hast.
</div>


## Kurzfassung

- Öffne `aka.ms/mfasetup` und melde dich an.
- **Microsoft Authenticator** auswählen, App installieren, **QR-Code scannen**.
- Zahlentest bestätigen – danach ist MFA aktiv und dein Konto deutlich besser geschützt.

## Weiterführender Hinweis bei Verdacht auf Phishing

Wenn du das Gefühl hast, in einen Angriff oder eine Phishing-Mail reingefallen zu sein (z. B. Link geklickt oder Passwort eingegeben), dann arbeite diese Sofortmassnahmen durch:

- [Phishing-Notfall-Checkliste für Microsoft 365 & Entra ID](https://swissploit.ch/blog-post.html?id=notfall-checkliste-phishing-microsoft-365)
