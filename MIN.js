(function () {
  "use strict";
  var S = window.SITE;
  var enc = encodeURIComponent;

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function wa(texto) { return "https://wa.me/" + S.whatsapp + "?text=" + enc(texto); }
  function setHref(id, href) { var el = document.getElementById(id); if (el) el.href = href; }

  /* ---------- Links fixos ---------- */
  setHref("link-fale-conosco", wa(S.mensagemContato));
  setHref("link-whatsapp", wa(S.mensagemContato));
  setHref("link-instagram", "https://www.instagram.com/" + S.instagram + "/");
  setHref("link-telefone", "tel:+" + S.telefoneFixo);
  setHref("link-mapa", "https://www.google.com/maps/search/?api=1&query=" + enc(S.endereco));

  /* ---------- Cartões de planta ---------- */
  function criarCard(p, classe) {
    var el = document.createElement("article");
    el.className = "plant " + (classe || "");
    el.tabIndex = 0;
    el.setAttribute("data-id", p.id);
    var foto = p.foto
      ? '<img src="' + p.foto + '" alt="' + esc(p.nome) + ' (' + esc(p.cientifico) + ')" loading="lazy">'
      : '<div class="plant__soon"><img src="L0G.png" alt=""><span>foto em breve</span></div>';
    el.innerHTML =
      '<div class="plant__photo">' + foto +
        '<div class="plant__overlay">' +
          '<span class="plant__status" aria-live="polite"></span>' +
          '<button type="button" class="plant__cta" data-plant="' + p.id + '">Consultar disponibilidade</button>' +
        '</div>' +
      '</div>' +
      '<h3 class="plant__name">' + esc(p.nome) + '</h3>' +
      '<p class="plant__sci">(' + esc(p.cientifico) + ')</p>';
    return el;
  }

  var destaque = document.getElementById("plantas-destaque");
  var grade = document.getElementById("plantas-grade");
  var cards = {};
  window.PLANTAS.forEach(function (p) {
    var el = criarCard(p, p.destaque ? "plant--big" : "");
    (p.destaque ? destaque : grade).appendChild(el);
    cards[p.id] = el;
  });

  /* Toque (sem hover): 1º toque abre o painel, toque fora fecha */
  if (window.matchMedia("(hover: none)").matches) {
    document.addEventListener("click", function (e) {
      var card = e.target.closest(".plant");
      document.querySelectorAll(".plant.is-open").forEach(function (c) { if (c !== card) c.classList.remove("is-open"); });
      if (card && !e.target.closest(".plant__cta")) card.classList.toggle("is-open");
    });
  } else {
    document.querySelectorAll(".hint--touch").forEach(function (h) { h.hidden = true; });
  }

  document.addEventListener("click", function (e) {
    var b = e.target.closest(".plant__cta");
    if (b && window.MF.abrirFormulario) window.MF.abrirFormulario(b.getAttribute("data-plant"));
  });

  /* ---------- Disponibilidade (lê só o documento de estoque) ---------- */
  window.MF.api.getEstoque().then(function (itens) {
    if (!itens) return;
    Object.keys(cards).forEach(function (id) {
      if (typeof itens[id] === "undefined") return;
      var ok = Number(itens[id]) > 0;
      var badge = cards[id].querySelector(".plant__status");
      badge.textContent = ok ? "Disponível" : "Lista de espera";
      badge.classList.add(ok ? "is-yes" : "is-no");
    });
  }).catch(function () { /* sem estoque: o botão continua funcionando */ });

  /* ---------- Item do menu da seção visível ---------- */
  var links = document.querySelectorAll(".topbar__nav a[href^='#']");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle("is-active", a.getAttribute("href") === "#" + en.target.id); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Array.prototype.forEach.call(links, function (a) {
      var s = document.querySelector(a.getAttribute("href")); if (s) io.observe(s);
    });
  }
})();
