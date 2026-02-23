---
id: outlook-fragezeichen-zeichenkodierung-utf8
date: 2026-02-19
tags: [outlook, microsoft365, encoding, utf-8, classic-outlook, windows]
thumb: assets/blog/OutlookUml.png
title: Classic Outlook turns äöü into ?
excerpt: Special characters become question marks in Classic Outlook. Here’s why—and how to fix it (UTF-8, OWA, rollback).
---

<p>If <strong>Classic Outlook</strong> suddenly replaces characters like <strong>é, ü, ñ, ® or £</strong> with <strong>question marks</strong>, it looks like a font issue at first—but it usually isn’t. In most real cases, it’s a <strong>character encoding</strong> problem triggered by a recent Outlook update.</p>

<p>Microsoft lists this as a known issue and reports it mainly in <strong>Version 2601 (Build 19628.20150 and later)</strong>. The current status is still “investigating”.</p>

## What’s actually happening?

<p>When Outlook sends an email, it needs to choose an outgoing encoding. If it doesn’t reliably use <strong>Unicode/UTF-8</strong> and instead falls back to a limited encoding, characters outside ASCII can’t be represented correctly. That’s when “Grüsse, Zürich®” can end up as “Gr??e, Z?rich?” for the recipient.</p>

## Fastest workaround: OWA or New Outlook

<p>If you need a quick, reliable fix right now, switch temporarily to <strong>Outlook on the web (OWA)</strong> or the <strong>New Outlook</strong>. The issue typically doesn’t show there because the handling is more modern and consistently Unicode-based.</p>

## Classic Outlook workaround: force UTF-8 / avoid auto-encoding

<p>If you must stay on Classic Outlook, a common fix is to disable the automatic selection of outgoing encoding and use a stable encoding instead. In practice, <strong>UTF-8</strong> is the most reliable choice because it cleanly supports special characters and is the modern standard. This prevents Outlook from “guessing” and damaging characters during sending.</p>

<figure class="post-figure">
  <img src="assets/blog/Outlutf-8.png" alt="Outlook: switch encoding to Unicode (UTF-8)">
  <figcaption>Switch these two options to Unicode (UTF-8).</figcaption>
</figure>

<figure class="post-figure">
  <img src="assets/blog/Outlutf-8_2.png" alt="Outlook: additional UTF-8 setting">
</figure>

## Rollback option if you need stability

<p>If the problem started right after an update, you can roll back to a previous working version as a temporary stabilization step. Microsoft describes the rollback via <em>officec2rclient.exe</em>, and then recommends pausing updates to avoid jumping back onto the problematic build.</p>

## When to expect a real fix

<p>The Microsoft article uses <strong>March 10</strong> as a reminder date to re-enable settings or updates. Realistically, that suggests a proper fix will land around the next patch cycle—so roughly the <strong>March 10 Patch Tuesday</strong> window.</p>

## Source

<p>Microsoft Support (Known Issue): <a href="https://support.microsoft.com/de-de/topic/das-klassische-outlook-ersetzt-akzentierte-und-erweiterte-zeichen-durch-fragezeichen-c1fdb067-38ca-464a-bcb1-bd657a85e1d3" target="_blank" rel="noopener">Classic Outlook replaces accented and extended characters with question marks</a></p>
