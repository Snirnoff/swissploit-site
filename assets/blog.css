/* assets/blog.css – Swissploit Blog (same style as main site)
   - fixes "stretched" blog cards
   - overrides global .section styles inside cards
*/

/* =========================
   HERO / TITLE
   ========================= */

.blog-hero{
  padding-top: 90px;
  padding-bottom: 60px;
}

/* H1 block like hero */
.blog-title{
  margin: 0 0 12px;
  display: grid;
  justify-content: center;
  gap: 10px;
}

/* Swissploit word = same scale as .hero h1 */
.blog-brand{
  display: inline-block;
  font-size: clamp(42px, 8vw, 88px);
  line-height: 1.05;
  letter-spacing: -0.02em;
  color: var(--fg);
}

/* Kicker like: Tech.Security.Klar. (your style) */
.blog-kicker{
  display: inline-block;
  font-size: clamp(16px, 2.2vw, 22px);
  font-weight: 300;
  color: color-mix(in oklab, var(--fg) 85%, transparent);
  letter-spacing: .02em;
}

/* =========================
   SEARCH
   ========================= */

.blog-search{
  margin: 18px auto 0;
  max-width: 720px;
  text-align: left;
}

.blog-search input{
  width: 100%;
  padding: 14px 14px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--panel);
  color: var(--fg);
  font-size: 16px;
  outline: none;
}

.blog-search input::placeholder{
  color: color-mix(in oklab, var(--fg) 55%, transparent);
}

.blog-search-hint{
  display: block;
  margin-top: 10px;
  font-size: 14px;
  color: color-mix(in oklab, var(--fg) 72%, transparent);
}

/* =========================
   LANG TOGGLE
   ========================= */

.lang-toggle{
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 16px;
}

.lang-btn{
  appearance: none;
  padding: 10px 12px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--panel);
  color: var(--fg);
  font-weight: 700;
  cursor: pointer;
  transition: transform .15s ease, box-shadow .15s ease, border-color .15s ease;
}

.lang-btn:hover{
  transform: translateY(-1px);
  box-shadow: var(--shadow);
}

.lang-btn.is-active{
  border-color: color-mix(in oklab, var(--accent) 55%, var(--border));
  background: color-mix(in oklab, var(--accent) 12%, var(--panel));
}

/* =========================
   GRID
   ========================= */

.blog-grid-section{
  padding-top: 60px;
}

/* IMPORTANT: center cards + avoid a single card becoming huge */
.blog-grid{
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;

  justify-items: center; /* <<< makes single-card layout look normal */
  align-items: start;
}

@media (max-width: 1024px){
  .blog-grid{ grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 640px){
  .blog-grid{ grid-template-columns: 1fr; }
}

/* =========================
   CARD (fix stretched height)
   ========================= */

/* Card has a max width so it doesn't look like a phone screenshot in a huge column */
.blog-card{
  width: 100%;
  max-width: 360px;                 /* <<< key: stops "endless tall look" */
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 14px;
  box-shadow: var(--shadow);
  overflow: hidden;
  text-decoration: none;
  color: var(--fg);
  display: grid;                    /* thumb + body */
  grid-template-rows: auto 1fr;
  transition: scale .18s ease, box-shadow .18s ease, border-color .18s ease;
  scale: 1;
}

.blog-card:hover{
  scale: 1.02;
  box-shadow: 0 18px 36px rgba(211,0,0,.18), 0 6px 18px rgba(0,0,0,.08);
  border-color: color-mix(in oklab, var(--accent) 45%, var(--border));
}

/* Thumbnail: fixed height (most robust, no surprises) */
.blog-card-thumb{
  width: 100%;
  height: 180px;                    /* <<< compact thumbnail height */
  background: #000;
  overflow: hidden;
}

.blog-card-thumb img{
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* Body: compact and not influenced by global .section styles */
.blog-card-body{
  padding: 12px 12px 14px;
  text-align: left;

  display: grid;
  gap: 6px;
}

/* IMPORTANT OVERRIDES against styles.css:
   your global .section p sets font-size/max-width/margins.
   We reset it here so cards look tight and clean.
*/
.blog-card-body p,
.blog-card-body h3,
.blog-card-body .blog-card-title,
.blog-card-body .blog-card-excerpt{
  max-width: none !important;
  margin: 0 !important;
}

/* Title: 2 lines max, no ugly cutoff */
.blog-card-title{
  font-size: 15px;
  line-height: 1.2;
  overflow-wrap: anywhere;

  display: -webkit-box;
  -webkit-line-clamp: 2;           /* <<< max 2 lines */
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Excerpt: brighter + 2 lines max */
.blog-card-excerpt{
  font-size: 13px;
  line-height: 1.35;
  color: color-mix(in oklab, var(--fg) 88%, transparent); /* <<< clearly readable */

  display: -webkit-box;
  -webkit-line-clamp: 2;           /* <<< max 2 lines */
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* No results */
.blog-no-results{
  margin-top: 18px;
  color: color-mix(in oklab, var(--fg) 75%, transparent);
  text-align: center;
}

/* A11y helper (if you use sr-only labels) */
.sr-only{
  position:absolute;
  width:1px;
  height:1px;
  padding:0;
  margin:-1px;
  overflow:hidden;
  clip:rect(0,0,0,0);
  white-space:nowrap;
  border:0;
}
