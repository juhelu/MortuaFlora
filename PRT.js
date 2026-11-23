/* © 2026 Júlia Ramos – Mortua Flora. Todos os direitos reservados. */
(function () {
  "use strict";
  var S = window.SITE || {};

  var ok = (S.dominios || ["juhelu.github.io", "localhost", "127.0.0.1"]);
  var h = location.hostname;
  if (location.protocol !== "file:" && ok.indexOf(h) === -1) {
    document.documentElement.innerHTML = "<body style='font-family:sans-serif;padding:2rem'><h1>Cópia não autorizada</h1><p>Este conteúdo pertence a Júlia Ramos – Mortua Flora. Acesse o site oficial.</p></body>";
    return;
  }

  if (window.top !== window.self) {
    try { window.top.location = window.self.location; } catch (e) { document.documentElement.style.display = "none"; }
  }

  function ehImg(t) { return t && t.closest && t.closest("img, picture, .no-copy"); }
  document.addEventListener("contextmenu", function (e) { if (ehImg(e.target)) e.preventDefault(); });
  document.addEventListener("dragstart", function (e) { if (ehImg(e.target)) e.preventDefault(); });
  document.addEventListener("auxclick", function (e) { if (e.button === 1 && ehImg(e.target) && !(e.target.closest && e.target.closest("a"))) e.preventDefault(); });
  document.addEventListener("keydown", function (e) {
    var t = e.target, campo = t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName);
    if (campo) return;
    var k = (e.key || "").toLowerCase();
    if ((e.ctrlKey || e.metaKey) && (k === "s" || k === "p" || (k === "u" && !e.shiftKey))) e.preventDefault();
  });
  document.querySelectorAll("img").forEach(function (i) { i.setAttribute("draggable", "false"); });

  document.querySelectorAll("[data-f]").forEach(function (e) { e.textContent = S[e.getAttribute("data-f")]; });
  document.querySelectorAll("[data-f-mail]").forEach(function (e) {
    var m = S[e.getAttribute("data-f-mail")]; e.textContent = m; e.href = "mailto:" + m;
  });

  try { console.log("%cMortua Flora", "font:700 28px sans-serif;color:#7a1f3d", "\n© 2026 Júlia Ramos. Todos os direitos reservados. Cópia ou reutilização sem autorização é violação de direitos autorais (Lei 9.610/98)."); } catch (e) {}
})();
