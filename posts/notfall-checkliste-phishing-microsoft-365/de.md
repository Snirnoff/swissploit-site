---
id: notfall-checkliste-phishing-microsoft-365
date: "2026-02-26"
title: "Phishing-Notfall-Checkliste"
excerpt: "Phishing passiert schnell: Diese Notfall-Checkliste für Microsoft 365/Entra ID zeigt, wie du Konten sofort absicherst und Folgeschäden minimierst."
tags: [phishing, incident-response, microsoft-365, entra-id, azure-ad, exchange-online, mfa, conditional-access, audit-logs, onedrive]
thumb: ""
---

Phishing ist oft in Minuten passiert – und genau dann zählt ein klarer Ablauf. Diese Checkliste hilft dir, ein betroffenes Microsoft-365/Entra-ID-Konto **schnell zu stabilisieren**, den **Schaden zu begrenzen** und **weitere Kompromittierungen** zu verhindern.

## Was ist passiert?

Für die erste Einschätzung brauchst du zwei Kerninfos:

- Wurde **nur der Link** geklickt?
- Wurde **auch ein Passwort** eingegeben?

**Szenario A – Nur Link geklickt**  
Risiko meist geringer (kein Passwort eingegeben). Fokus: **Endgerät prüfen** (Downloads, Malware, Browser/Session).

**Szenario B – Passwort eingegeben**  
Konto als **kompromittiert** behandeln. **Vollständige Checkliste** durchlaufen.

## Schritt-für-Schritt Lösung

1. **Passwort sofort ändern**
   - **Hybrid-User (AD On-Prem → Entra synchronisiert):** Starkes neues Passwort **im On-Prem AD** setzen und dem User **per Telefon** mitteilen.
   - **Cloud-only Account:** Starkes neues Passwort **in Entra ID (Azure AD)** setzen und dem User **per Telefon** mitteilen.

2. **Alle aktiven Sitzungen abmelden**
   - **Microsoft 365 admin center:** User auswählen → **“Sign out from all sessions”**
   - Zusätzlich in **Entra ID:** User auswählen → **Revoke sessions**
   
   ![Microsoft 365: User von allen Sessions abmelden (Sign out from all sessions)](assets/blog/image-20260226-125126.webp)
   ![Entra ID: Sessions des Users widerrufen (Revoke sessions)](assets/blog/image-20260226-125428.webp)

3. **MFA (Multi-Faktor-Authentifizierung) überprüfen**
   Prüfe in **Entra ID → User → Authentication methods**:
   - Wurden neue Authenticator-Geräte hinzugefügt?
   - Wurden neue Telefonnummern hinterlegt?
   - Wurden alternative Methoden ergänzt?  
   ➜ **Unbekannte Methoden sofort entfernen**  
   ➜ MFA bei Bedarf **komplett neu registrieren** lassen

   ![Entra ID: Authentication methods prüfen und unbekannte MFA-Methoden entfernen](assets/blog/image-20260226-125651.webp)

4. **Mailbox-Regeln und Weiterleitungen prüfen**
   In **Exchange Online** kontrollieren:
   - Inbox-Regeln (v. a. **Weiterleitungs- & Löschregeln**)
   - Weiterleitungen / automatische Antworten
   - Transportregeln (falls Admin-Konto betroffen)  
   ➜ Unbekannte Weiterleitungen **sofort entfernen**

5. **(Optional, aber empfohlen) OneDrive/Teams/SharePoint prüfen**
   Suche nach ungewöhnlichen Datenabflüssen:
   - Kürzlich erstellte Freigaben
   - Ungewöhnliche externe Shares
   - Neue anonyme Links  
   Vorgehen (Beispiel OneDrive):
   - OneDrive im Browser öffnen → **Shared**
   - **Shared by you**
   - Nach **Recently shared** sortieren

   ![OneDrive: Freigaben „Shared by you“ nach „Recently shared“ sortieren](assets/blog/image-20260226-125948.webp)

6. **Endgeräte prüfen**
   - Malware-Scan durchführen (EDR/Defender/AV)
   - Session-Cookies löschen, Browser komplett schliessen
   - Cookies/Cache löschen
   - Browser-Passwörter als kompromittiert betrachten:
     - gespeicherte Passwörter prüfen
     - sensible Passwörter (z. B. Banking) ändern

7. **Audit-Logs prüfen (Sign-ins)**
   In **Entra ID → User → Sign-in logs**:
   - Ungewöhnliche Login-Standorte
   - „Impossible travel“-Muster / riskante Sign-ins
   - Auffällige User-Agent-/Device-Wechsel

   ![Entra ID: Sign-in logs prüfen (ungewöhnliche Standorte, Impossible Travel)](assets/blog/image-20260226-123042.webp)

8. **Azure/Entra Rollen & Admin-Aktivitäten prüfen**
   - Wurden Rollen zugewiesen?
   - Wurden neue Benutzer erstellt?
   - Sind privilegierte Rollen betroffen (Global Admin, App Admin, Exchange Admin)?

9. **Weitere betroffene Konten prüfen**
   - Wurde die Phishing-Mail intern weitergeleitet?
   - **Message Trace** durchführen
   - Wenn möglich: Mail tenantweit löschen
   - Benutzer informieren (kurze Guidance: Passwort/MFA/Endgerät)

10. **Conditional Access / Security Defaults prüfen**
   - Wenn **Security Defaults** aktiv sind: kein klassisches Conditional Access.
   - Ansonsten prüfen:
     - Wurden Policies geändert oder neu erstellt?
     - Wurden **Named Locations** hinzugefügt?
   Tipp: In Entra nach **Erstellt/Geändert** sortieren, um Änderungen schnell zu sehen.

   ![Entra ID: Risk-based Conditional Access und Named locations auf Änderungen prüfen](assets/blog/image-20260226-124257.webp)

11. **Registrierte Apps / Enterprise Applications prüfen (OAuth-Consent)**
   In **Entra ID → User → Applications** (bzw. Enterprise Applications):
   - Wurden neue Apps mit Berechtigungen hinzugefügt?
   - Gibt es neue OAuth-Consent-Einträge (User/Admin Consent)?
   - Unbekannte Anwendungen entfernen, Admin-Consent validieren

   ![Entra ID: User Applications – Consent und Berechtigungen prüfen](assets/blog/image-20260226-123558.webp)

12. **Optional – je nach Schweregrad**
   - Passwort-Reset für alle Admin-Konten
   - Global Sign-out für die gesamte Organisation
   - Meldung an Datenschutzbeauftragten (bei möglichem Datenabfluss)

## Häufige Fragen / Troubleshooting

**Muss ich die ganze Liste machen, wenn „nur“ der Link geklickt wurde?**  
Empfohlen ja – mindestens **Endgeräteprüfung + Sessions abmelden + MFA-Check**, weil Drive-by-Downloads und Session-Theft möglich sind.

**Warum soll das neue Passwort per Telefon mitgeteilt werden?**  
Weil E-Mail/Chat-Kanäle im Incident-Fall potenziell kompromittiert oder mitgelesen sein können.

**Reicht „Passwort ändern“ allein?**  
Meist nicht. Wenn ein Angreifer bereits ein Token/Session hat, bleibt der Zugriff ohne **Sign-out/Revoke sessions** oft bestehen.

**Worauf muss ich bei Inbox-Regeln besonders achten?**  
Auf Regeln, die Mails **weiterleiten**, **löschen**, „als gelesen markieren“ oder Betreff/Absender filtern – das sind klassische Angreifer-Tricks.

**Wie erkenne ich OAuth-Phishing?**  
Wenn Apps plötzlich weitreichende Rechte haben (Mail lesen, Files, Teams), ohne dass das bewusst freigegeben wurde: **Consent entziehen**, App entfernen, Logs prüfen.

## Profi-Tipp

Lege diese Checkliste als **runbook** ab und ergänze sie um eure Standard-Tools (EDR, Ticketing, SIEM) – im Ernstfall sparen klare Klickpfade Minuten.

## Kurzfassung

- **Passwort ändern + Sessions beenden + MFA bereinigen** sind die ersten Pflichtschritte.
- Danach **Mailbox-Regeln, Freigaben, Logs, Rollen und Apps** prüfen.
- Bei Verdacht auf Datenabfluss: **Organisationweit eskalieren** (Admin-Resets, global sign-out, Datenschutz).
