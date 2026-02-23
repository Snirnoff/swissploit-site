---
id: outlook-fragezeichen-zeichenkodierung-utf8
date: 2026-02-19
tags: [outlook, microsoft365, encoding, utf-8, classic-outlook, windows]
thumb: assets/blog/OutlookUml.png
title: Outlook zeigt Umlaute als ?
excerpt: In Classic Outlook werden Sonderzeichen zu Fragezeichen. So löst du es (UTF-8, OWA, Rollback).
---

<p>Wenn in <strong>Classic Outlook</strong> plötzlich aus Sonderzeichen wie <strong>é, ü, ñ, ® oder £</strong> nur noch <strong>Fragezeichen</strong> werden, wirkt das wie ein Font-Problem – ist es aber meistens nicht. In der Praxis ist es fast immer ein Thema rund um <strong>Zeichenkodierung</strong> und ein aktuelles Outlook-Update.</p>

<p>Microsoft führt dieses Verhalten als bekanntes Problem, das laut bisherigen Rückmeldungen vor allem in <strong>Version 2601 (Build 19628.20150 und höher)</strong> auftritt. Der Status steht aktuell auf “Untersuchung läuft”.</p>

## Was genau passiert hier?

<p>Outlook muss beim Versenden entscheiden, in welcher Kodierung eine Mail rausgeht. Wenn dabei nicht sauber <strong>Unicode/UTF-8</strong> verwendet wird, sondern eine eingeschränkte Kodierung, können Zeichen außerhalb von ASCII nicht korrekt dargestellt werden. Das Ergebnis sieht dann so aus: statt “Grüsse, Zürich®” steht beim Empfänger “Gr??e, Z?rich?”.</p>

## Schnelle Lösung: OWA oder Neues Outlook

<p>Wenn du sofort wieder korrekt schreiben musst, ist der schnellste Weg, vorübergehend auf <strong>Outlook Web Access (OWA)</strong> oder das <strong>Neue Outlook</strong> zu wechseln. Dort tritt das Problem typischerweise nicht auf, weil die Verarbeitung moderner und konsequent Unicode-basiert ist.</p>

## Workaround in Classic Outlook: UTF-8 / Kodierung erzwingen

<p>Wenn du Classic Outlook zwingend brauchst, hilft es in vielen Fällen, die automatische Auswahl der Kodierung abzuschalten und stattdessen eine stabile Kodierung zu erzwingen. In der Praxis funktioniert <strong>UTF-8</strong> am zuverlässigsten, weil es Sonderzeichen sauber abbildet und in modernen Umgebungen Standard ist. Genau dieser Schritt verhindert häufig, dass Outlook “falsch rät” und Zeichen beim Senden kaputt macht.</p>

<figure class="post-figure">
  <img src="assets/blog/Outlutf-8.png" alt="Outlook: Codierung auf Unicode (UTF-8) umstellen">
  <figcaption>Hier müssen diese zwei Optionen auf Unicode UTF-8 gewechselt werden.</figcaption>
</figure>

<figure class="post-figure">
  <img src="assets/blog/Outlutf-8_2.png" alt="Outlook: weitere UTF-8 Einstellung">
</figure>

## Workaround: auf eine ältere Version zurück

<p>Wenn das Problem mit einem Update gekommen ist und du dringend stabil arbeiten musst, kannst du testweise auf eine vorherige Version zurückgehen. Microsoft nennt dafür eine bekannte, funktionierende Version und beschreibt den Rollback über <em>officec2rclient.exe</em>. Danach solltest du Office-Updates temporär pausieren, damit es nicht direkt wieder auf den problematischen Build springt.</p>

## Wann kommt der Fix?

<p>Im Microsoft-Artikel wird als praktischer Reminder explizit der <strong>10. März</strong> genannt, um Einstellungen oder Updates wieder zu aktivieren. Realistisch ist daher, dass eine offizielle Korrektur eher mit dem nächsten Patch-Zyklus greifbar wird – also rund um den <strong>Patchday am 10. März</strong>.</p>

## Quelle

<p>Microsoft Support (Known Issue): <a href="https://support.microsoft.com/de-de/topic/das-klassische-outlook-ersetzt-akzentierte-und-erweiterte-zeichen-durch-fragezeichen-c1fdb067-38ca-464a-bcb1-bd657a85e1d3" target="_blank" rel="noopener">Das klassische Outlook ersetzt akzentierte und erweiterte Zeichen durch Fragezeichen</a></p>
