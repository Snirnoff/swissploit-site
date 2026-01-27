// assets/transition.js
(function(){
  document.body.classList.add("page-transition");

  document.addEventListener("click", (e)=>{
    const a = e.target.closest("a");
    if(!a) return;

    const href = a.getAttribute("href") || "";
    const target = a.getAttribute("target");

    if(target === "_blank") return;
    if(href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
    if(href.startsWith("http")) return;

    e.preventDefault();
    document.body.classList.add("is-leaving");
    setTimeout(()=>{ window.location.href = href; }, 220);
  });
})();
