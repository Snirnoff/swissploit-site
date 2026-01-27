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

  function render(list) {
    grid.innerHTML = list.map(p => `
      <article class="blog-card">
        <a class="blog-card-link" href="blog-post.html?id=${encodeURIComponent(p.id)}">
          <div class="blog-thumb">
            <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.title)}" loading="lazy">
          </div>
          <div class="blog-card-body">
            <div class="blog-meta">
              <span class="blog-date">${escapeHtml(p.date)}</span>
              <span class="blog-tags">${(p.tags || []).map(t => `#${escapeHtml(t)}`).join(" ")}</span>
            </div>
            <h2 class="blog-card-title">${escapeHtml(p.title)}</h2>
            <p class="blog-card-excerpt">${escapeHtml(p.excerpt)}</p>
          </div>
        </a>
      </article>
    `).join("");

    const empty = list.length === 0;
    noResults.hidden = !empty;
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

  // initial sort: newest first
  posts.sort((a, b) => String(b.date).localeCompare(String(a.date)));

  render(posts);

  let t;
  input.addEventListener("input", () => {
    clearTimeout(t);
    t = setTimeout(() => render(filter(input.value)), 80);
  });
})();
