// assets/blog-post.js
(function(){
  const posts = window.SWISSPLOIT_BLOG_POSTS || [];
  const params = new URLSearchParams(location.search);
  const id = params.get("id");

  const post = posts.find(p => p.id === id);

  const headerEl = document.getElementById("postHeader");
  const bodyEl = document.getElementById("postBody");

  function esc(s){
    return String(s||"").replace(/[&<>"']/g, (m) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[m]));
  }

  function youtubeEmbed(url){
    try{
      const u = new URL(url);
      if(u.hostname.includes("youtube.com") && u.searchParams.get("v")){
        return `https://www.youtube.com/embed/${u.searchParams.get("v")}`;
      }
      if(u.hostname.includes("youtu.be")){
        const id = u.pathname.replace("/","");
        return `https://www.youtube.com/embed/${id}`;
      }
    }catch(e){}
    return null;
  }

  if(!post){
    headerEl.innerHTML = `
      <h1 class="blog-post-title">Artikel nicht gefunden</h1>
      <p class="blog-post-lead">Der Link ist ungültig oder der Beitrag existiert nicht.</p>
    `;
    bodyEl.innerHTML = `<a class="blog-mini-btn" href="blog.html">Zur Übersicht</a>`;
    return;
  }

  document.title = `${post.title} – Swissploit Blog`;

  const embed = post.videoUrl ? youtubeEmbed(post.videoUrl) : null;

  headerEl.innerHTML = `
    <h1 class="blog-post-title">${esc(post.title)}</h1>
    <div class="blog-meta blog-meta-post">
      <span class="blog-date">${esc(post.date)}</span>
      <span class="blog-tags">${(post.tags||[]).map(t=>`#${esc(t)}`).join(" ")}</span>
    </div>

    ${post.image ? `
      <div class="blog-post-hero">
        <img src="${esc(post.image)}" alt="${esc(post.title)}" loading="lazy">
      </div>
    ` : ""}

    ${post.videoUrl ? `
      <div class="blog-post-video">
        ${embed ? `
          <div class="video-embed">
            <iframe
              src="${esc(embed)}"
              title="${esc(post.title)}"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen></iframe>
          </div>
        ` : `
          <a class="blog-mini-btn" href="${esc(post.videoUrl)}" target="_blank" rel="noopener">▶ Video ansehen</a>
        `}
      </div>
    ` : ""}
  `;

  const content = post.content || post.excerpt || "";
  bodyEl.innerHTML = `
    <article class="blog-article">
      ${content.includes("<") ? content : `<p>${esc(content)}</p>`}
    </article>
  `;
})();
