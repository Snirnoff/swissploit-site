// assets/blog-post.js
(function(){
  const posts = window.SWISSPLOIT_BLOG_POSTS || [];
  const params = new URLSearchParams(location.search);
  const id = params.get("id");

  const headerEl = document.getElementById("postHeader");
  const bodyEl = document.getElementById("postBody");
  const langBtns = document.querySelectorAll(".lang-btn");

  const UI = {
    de: { back: "← Zurück zum Blog", watch: "▶ Video ansehen", notFoundTitle: "Artikel nicht gefunden", notFoundLead: "Der Link ist ungültig oder der Beitrag existiert nicht.", overview: "Zur Übersicht" },
    en: { back: "← Back to blog", watch: "▶ Watch video", notFoundTitle: "Post not found", notFoundLead: "The link is invalid or the post doesn’t exist.", overview: "Back to overview" }
  };

  let currentLang = localStorage.getItem("swissploit-blog-lang") || "de";
  const post = posts.find(p => p.id === id);

  function esc(s){
    return String(s || "").replace(/[&<>"']/g, (m) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[m]));
  }

  // Unterstützt: watch?v=, youtu.be/, youtube.com/shorts/
  function youtubeEmbed(url){
    try{
      const u = new URL(url);

      // youtube.com/watch?v=VIDEOID
      const v = u.searchParams.get("v");
      if(u.hostname.includes("youtube.com") && v){
        return `https://www.youtube.com/embed/${v}`;
      }

      // youtu.be/VIDEOID
      if(u.hostname.includes("youtu.be")){
        const vid = u.pathname.replace("/", "").trim();
        if(vid) return `https://www.youtube.com/embed/${vid}`;
      }

      // youtube.com/shorts/VIDEOID
      if(u.hostname.includes("youtube.com") && u.pathname.startsWith("/shorts/")){
        const vid = u.pathname.split("/shorts/")[1]?.split(/[?&#/]/)[0];
        if(vid) return `https://www.youtube.com/embed/${vid}`;
      }
    }catch(e){}
    return null;
  }

  function getTxt(){
    return (post?.i18n?.[currentLang]) || (post?.i18n?.de) || {};
  }

  function applyUiLanguage(){
    const ui = UI[currentLang] || UI.de;

    document.querySelectorAll("[data-i18n]").forEach(el=>{
      const key = el.getAttribute("data-i18n");
      if(ui[key]) el.textContent = ui[key];
    });

    langBtns.forEach(b => b.classList.toggle("is-active", b.dataset.lang === currentLang));
  }

  function render(){
    const ui = UI[currentLang] || UI.de;

    if(!headerEl || !bodyEl){
      console.warn("blog-post.js: postHeader/postBody nicht gefunden.");
      return;
    }

    if(!post){
      headerEl.innerHTML = `<h1 class="blog-post-title">${esc(ui.notFoundTitle)}</h1>`;
      bodyEl.innerHTML = `
        <p class="blog-post-lead">${esc(ui.notFoundLead)}</p>
        <a class="blog-mini-btn" href="blog.html" data-transition>${esc(ui.overview)}</a>
      `;
      return;
    }

    const txt = getTxt();
    document.title = `${txt.title || "Blog"} – Swissploit`;

    const embed = post.videoUrl ? youtubeEmbed(post.videoUrl) : null;

    headerEl.innerHTML = `
      <a class="blog-back" href="blog.html" data-transition>${esc(ui.back)}</a>

      <h1 class="blog-post-title">${esc(txt.title || "")}</h1>

      <div class="blog-meta blog-meta-post">
        <span class="blog-date">${esc(post.date || "")}</span>
        <span class="blog-tags">${(post.tags||[]).map(t=>`#${esc(t)}`).join(" ")}</span>
      </div>

      ${post.videoUrl ? `
        <div class="blog-post-video">
          ${embed ? `
            <div class="video-embed">
              <iframe
                src="${esc(embed)}"
                title="${esc(txt.title || "Video")}"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen></iframe>
            </div>
          ` : `
            <a class="blog-mini-btn" href="${esc(post.videoUrl)}" target="_blank" rel="noopener">${esc(ui.watch)}</a>
          `}
        </div>
      ` : ""}
    `;

    const content = txt.content || "";
    bodyEl.innerHTML = `
      <article class="blog-article">
        ${content.includes("<") ? content : `<p>${esc(content)}</p>`}
      </article>
    `;
  }

  // language buttons
  langBtns.forEach(btn=>{
    btn.addEventListener("click", ()=>{
      currentLang = btn.dataset.lang || "de";
      localStorage.setItem("swissploit-blog-lang", currentLang);
      applyUiLanguage();
      render();
    });
  });

  // init
  applyUiLanguage();
  render();
})();
