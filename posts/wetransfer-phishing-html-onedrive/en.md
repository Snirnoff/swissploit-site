---
id: wetransfer-phishing-html-onedrive
date: 2026-01-27
tags: [security, phishing, microsoft365, onedrive, outlook]
thumb: assets/blog/h355-014.png
videoUrl: https://www.youtube.com/watch?v=5aVeWRinSxM
title: HTML Attack
excerpt: A real Microsoft account takeover!
---

<p><strong>WeTransfer phishing</strong> is currently one of the most effective ways to compromise <strong>Microsoft 365 / OneDrive / Outlook accounts</strong> — because the flow looks normal: download link, open file, login.</p>

<p>In this post I break down a real incident (with the video embedded) and explain <strong>what actually happens</strong> and <strong>why an HTML file can be dangerous</strong> even when it looks harmless.</p>

<div class="blog-callout">
  <p><strong>What this attack is about</strong><br>
  Attackers use a legit-looking WeTransfer download to deliver an <strong>HTML file</strong>. When opened, it launches a browser and shows a <strong>fake OneDrive/Microsoft login page</strong>. If you type credentials, they get captured.</p>
</div>

## Why WeTransfer is used so often

<p>WeTransfer is widely trusted. Attackers exploit that trust to increase clicks and reduce suspicion, compared to unknown file-hosting domains.</p>

## How the attack unfolds

<p>You receive an email that looks like shared files, invoices, or documents. The link opens a download-style page. Instead of a PDF/DOCX, you download something like <em>invoice.html</em> or <em>documents.html</em>.</p>

<p>When you open it, your browser shows a convincing <strong>OneDrive/Microsoft login</strong>. Many people assume it’s a normal cloud authentication step — and enter their password.</p>

## Why the HTML file is the key risk

<p>An HTML file is basically “a web page saved as a file”. When opened, it can render a fake login page, redirect you, or submit what you type to an attacker-controlled server. That’s why “opening a file” can suddenly turn into a credential theft moment.</p>

## How to spot it quickly

<p>Check the browser address: is it a real Microsoft domain? Also ask: why is this <strong>.html</strong> instead of a document? If the message adds urgency (“expires soon”, “urgent”, “view now”), treat it as a strong warning sign.</p>

## How to protect your Microsoft 365 account

<p>Enable <strong>MFA</strong> (Authenticator preferred), use a <strong>password manager</strong>, and review suspicious sign-ins. For businesses, consider Security Defaults or Conditional Access. And teach teams that “HTML file ≠ document”.</p>

## Video

<p>The embedded video shows the incident flow and what to look for in real life.</p>

<p><strong>Key takeaway:</strong> WeTransfer itself isn’t the threat. Attackers use the trusted download flow as camouflage. The danger starts when an HTML file triggers a login prompt.</p>
