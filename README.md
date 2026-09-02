# swissploit-site

## Neuen Learn-Artikel hinzufügen

1. Lege pro Beitrag einen Ordner unter `posts/<slug>/` an.
2. Erstelle darin `de.md` und optional `en.md`.
3. Der bestehende öffentliche Artikelpfad bleibt `/blog/<slug>/`
   beziehungsweise `/en/blog/<slug>/`.

Pflichtfelder im Frontmatter:

```yaml
---
date: "2026-03-11"
category: phishing-betrug
title: "Artikel-Titel"
excerpt: "Kurzer Beschreibungstext fuer Karten und Suche."
tags: [phishing, microsoft-365]
---
```

`date` ist das Veröffentlichungsdatum. Alternativ wird auch
`publishedDate` akzeptiert.

Erlaubte `category`-IDs:

- `phishing-betrug`
- `accounts-passwoerter`
- `social-engineering`
- `security-alltag`
- `privacy-datenschutz`
- `security-buero`

Optionale Felder:

```yaml
updated: "2026-04-02"
shortDescription: "Falls der Kartentext vom excerpt abweichen soll."
image: "assets/blog/beispiel.webp"
imageAlt: "Beschreibung des Hauptbildes"
videoUrl: "https://www.youtube.com/watch?v=..."
videoType: short
relatedArticles:
  - anderer-artikel-slug
seoTitle: "Optionaler SEO-Titel"
seoDescription: "Optionale SEO-Beschreibung"
```

`thumb` bleibt als altes Bildfeld kompatibel; neue Beiträge sollten
`image` verwenden. Bilder liegen bevorzugt unter `assets/blog/`.

Videos sind optional. Ohne `videoUrl` wird kein Videobereich gerendert.
YouTube-Links werden responsiv eingebettet; `videoType: short` zeigt
die Überschrift "In 60 Sekunden erklärt".

Related Content zeigt maximal drei Beiträge: zuerst explizite
`relatedArticles`, sonst Beiträge derselben `category`.

`/phishing-simulation` darf nicht als Learn-Artikel, Karte, Suche,
Navigation, Footer oder Related Content veröffentlicht werden.

Build:

```sh
npm run build:posts
```
