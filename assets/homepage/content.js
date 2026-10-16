// Existing generated catalogue is the sole article source. Parse its JSON payload;
// never execute fetched code or inject article HTML into the preview.
export const featuredArticle = ''; // Optional existing slug, e.g. 'ceo-fraud'.
export async function loadLearnArticles(featured = featuredArticle) {
  const response = await fetch('/assets/blog-posts.js');
  if (!response.ok) throw Error('Learn unavailable');
  const source = await response.text();
  const payload = source.match(/window\.SWISSPLOIT_BLOG_POSTS\s*=\s*(\[[\s\S]*\]);?\s*$/);
  if (!payload) throw Error('Invalid Learn catalogue');
  const categories = { 'phishing-betrug': 'Phishing & Betrug', 'konten-passwoerter': 'Konten & Passwörter', 'microsoft-365': 'Microsoft 365' };
  const articles = JSON.parse(payload[1]).filter(post => post.i18n?.de && post.urls?.de && /^\d{4}-\d{2}-\d{2}$/.test(post.date))
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(post => ({ slug: post.slug, href: new URL(post.urls.de).pathname, title: post.i18n.de.title,
      image: '/' + (post.thumb || post.image).replace(/^\//, ''), category: categories[post.category] || 'Cybersecurity', date: post.date }))
    .filter(post => /^\/blog\/[a-z0-9-]+\/$/.test(post.href) && /^\/assets\//.test(post.image));
  const index = articles.findIndex(post => post.slug === featured);
  if (index > 0) articles.unshift(...articles.splice(index, 1));
  return articles;
}
