---
id: mfa-aktivieren-microsoft-authenticator
date: "2026-03-05"
title: "Enable MFA with Microsoft Authenticator: secure your account in minutes"
excerpt: "If someone has your Microsoft password, they can take over your account. Here’s how to enable MFA with Microsoft Authenticator in a few minutes, step by step."
tags: [mfa, microsoft-authenticator, account-security, microsoft-account, entra-id, two-factor-authentication, security, identity, phishing, login]
thumb: assets/blog/021_tn.webp
videoUrl: "https://youtube.com/shorts/TAYRaRY2-VE?si=PTsL6mFjfgaEe1XQ"
---

If someone has your Microsoft password, they can take over your account — often without you noticing right away. With **MFA (multi-factor authentication)**, a password alone isn’t enough anymore: sign-ins also require a confirmation on your phone. It’s one of the fastest security wins you can implement, and it only takes a few minutes.

## What happened?

- **Passwords aren’t sufficient**: they get leaked, reused, guessed, or phished.
- Attackers often sign in **quietly** and set up forwarding rules or suspicious apps.
- **MFA blocks many takeovers** because a second factor (your device) is required.

## Step-by-step solution

1. **Open the setup page**
   - In your browser, go to:
     - `aka.ms/mfasetup`

2. **Sign in with your Microsoft account**
   - Sign in with your Microsoft account.
   - You should land on the **Security info** page.

3. **If you’re not on “Security info”**
   - Open this directly:
     - `mysignins.microsoft.com/security-info`

4. **Add a sign-in method**
   - Click **“Add sign-in method”**.

5. **Choose Microsoft Authenticator**
   - You’ll see multiple methods.
   - Recommendation: **Microsoft Authenticator** (fast, secure, convenient).
   - Select **Microsoft Authenticator** and click **Next**.

6. **Install Microsoft Authenticator on your phone**
   - Open the **App Store** or **Google Play Store**
   - Search for **Microsoft Authenticator**
   - Install it and open the app

7. **Show the QR code on your PC**
   - Click **Next** on your PC — a **QR code** appears.

8. **Scan the QR code with your phone**
   - In the Authenticator app:
     - Tap **Add account** / **+** / the **QR icon**
     - Scan the QR code on your screen

9. **Confirm the test (number matching)**
   - Microsoft will run a test:
     - A **number** appears on your PC
     - Confirm/enter that number on your phone

10. **Done: verify it’s added**
   - If successful, you’ll see a confirmation.
   - Your phone now appears under **Security info** as a new sign-in method.

## FAQ / Troubleshooting

**I can’t find the “Security info” page — where is it?**  
Go directly to `mysignins.microsoft.com/security-info` and sign in.

**I don’t see the QR-code button in the Authenticator app.**  
Look for “Add account”, a “+” icon, or a QR icon — the location can vary by version.

**The number test doesn’t show up or fails.**  
Check your phone’s internet connection, fully close and reopen the Authenticator app, then restart the step on your PC.

**Can I use MFA without the Authenticator app?**  
Often yes (SMS/call), but **Authenticator is recommended** because it’s more convenient and typically more secure.

**What if I lose my phone?**  
Add at least one backup method if possible, so you don’t lock yourself out when switching devices.

## Pro tip

After setup, add **at least one backup option** (a second method) so you keep access if you lose or replace your phone.

## TL;DR

- Go to `aka.ms/mfasetup` and sign in.
- Pick **Microsoft Authenticator**, install it, and **scan the QR code**.
- Confirm the number test — MFA is enabled and your account is significantly safer.

## If you suspect phishing

If you think you may have fallen for a phishing attempt (clicked a suspicious link or entered your password), follow these immediate containment steps:

- [Phishing emergency checklist for Microsoft 365 & Entra ID](/blog/notfall-checkliste-phishing-microsoft-365)
