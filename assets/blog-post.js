(function () {
  const lang = window.SWISSPLOIT_CURRENT_LANG || document.documentElement.lang || "de";
  localStorage.setItem("swissploit-blog-lang", lang);

  document.querySelectorAll("[data-lang-switch]").forEach((link) => {
    link.addEventListener("click", () => {
      const nextLang = link.getAttribute("data-lang-switch");
      if (nextLang) {
        localStorage.setItem("swissploit-blog-lang", nextLang);
      }
    });
  });
})();