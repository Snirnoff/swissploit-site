// assets/blog.js
(function () {
  const posts = (window.SWISSPLOIT_BLOG_POSTS || []).slice();

  const grid = document.getElementById("blogGrid");
  const input = document.getElementById("blogSearch");
  const noResults = document.getElementById("noResults");

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (m) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[m]));
  }

  function trimText(s, n = 120) {
    s = String(s || "");
    return s.length > n ? s.slice(0, n - 1) + "…" : s;
  }

  function render(list) {
    grid.innerHTML = list.map(p => {
      const tags = (p.tags || []).slice(0, 4).map(t => `#${escapeHtml(t)}`).join(" ");
      const excerpt = trimText(p.excerpt, 120);

      const videoBtn = p.videoUrl
        ? `<a class="blog-mini-btn" href="${escapeHtml(p.videoUrl)}" target="_blank" rel="noopener">▶ Video</a>`
        : "";

      return `
        <article class="blog-card">
          <a class="blog-card-link" href="blog-post.html?id=${encodeURIComponent(p.id)}">
            <div class="blog-thumb">
              <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.title)}" loading="lazy">
            </div>
            <div class="blog-card-body">
              <div class="blog-meta">
                <span class="blog-date">${escapeHtml(p.date)}</span>
                <span class="blog-tags">${tags}</span>
              </div>
              <h2 class="blog-card-title">${escapeHtml(p.title)}</h2>
              <p class="blog-card-excerpt">${escapeHtml(excerpt)}</p>
            </div>
          </a>

          <div class="blog-card-actions">
            <a class="blog-mini-btn" href="blog-post.html?id=${encodeURIComponent(p.id)}">Artikel</a>
            ${videoBtn}
          </div>
        </article>
      `;
    }).join("");

    noResults.hidden = list.length !== 0;
  }

  function filter(q) {
    const s = q.trim().toLowerCase();
    if (!s) return posts;

    return posts.filter(p => {
      const hay = [
        p.title, p.excerpt, (p.tags || []).join(" ")
      ].join(" ").toLowerCase();
      return hay.includes(s);
    });
  }

  posts.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  render(posts);

  let t;
  input.addEventListener("input", () => {
    clearTimeout(t);
    t = setTimeout(() => render(filter(input.value)), 70);
  });
})();
