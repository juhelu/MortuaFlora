(function () {
  "use strict";
  var S = window.SITE, api = window.MF.api;
  var dlg = document.getElementById("dlg-interesse");
  var form = document.getElementById("form-interesse");
  var msg = document.getElementById("form-msg");
  var done = document.getElementById("form-ok");
  var sel = form.elements.planta;
  var abertoEm = 0;

  window.PLANTAS.forEach(function (p) {
    var o = document.createElement("option"); o.value = p.id; o.textContent = p.nome; sel.appendChild(o);
  });

  function nomePlanta(id) { var p = window.PLANTAS.filter(function (x) { return x.id === id; })[0]; return p ? p.nome : id; }
  function so(n) { return String(n || "").replace(/\D/g, ""); }
  function erro(t) { msg.textContent = t; msg.hidden = !t; }

  window.MF.abrirFormulario = function (plantaId) {
    form.hidden = false; done.hidden = true; erro("");
    if (plantaId) sel.value = plantaId;
    abertoEm = Date.now();
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
    form.elements.nome.focus();
  };
  dlg.querySelectorAll("[data-close]").forEach(function (b) { b.addEventListener("click", function () { dlg.close(); }); });
  dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });

  /* máscaras simples */
  form.elements.cep.addEventListener("input", function (e) {
    var v = so(e.target.value).slice(0, 8); e.target.value = v.length > 5 ? v.slice(0, 5) + "-" + v.slice(5) : v;
  });
  form.elements.celular.addEventListener("input", function (e) {
    var v = so(e.target.value).slice(0, 11), o = v;
    if (v.length > 2) o = "(" + v.slice(0, 2) + ") " + v.slice(2);
    if (v.length > 7) o = "(" + v.slice(0, 2) + ") " + v.slice(2, v.length - 4) + "-" + v.slice(-4);
    e.target.value = o;
  });
  form.elements.pais.addEventListener("change", function () {
    var br = form.elements.pais.value.trim().toLowerCase() === "brasil";
    form.elements.cep.required = br;
  });

  function validar(f) {
    var nome = f.nome.value.trim().replace(/\s+/g, " ");
    if (nome.split(" ").length < 2 || nome.length < 5) return "Informe seu nome completo.";
    var tel = so(f.celular.value);
    if (tel.length < 10 || tel.length > 15) return "Informe um celular válido, com DDD.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.value.trim())) return "Informe um e-mail válido.";
    var br = f.pais.value.trim().toLowerCase() === "brasil";
    if (br && so(f.cep.value).length !== 8) return "Informe o CEP com 8 dígitos.";
    if (!f.finalidade.value) return "Escolha a finalidade do cultivo.";
    if (!f.estufa.value) return "Informe se você possui estufa adequada.";
    if (!f.lgpd.checked) return "É preciso aceitar o aviso de privacidade.";
    return "";
  }

  /* ---------- antirrobô: honeypot + tempo mínimo + intervalo entre envios ---------- */
  /* pedidos enviados neste navegador dentro da janela de horas */
  function enviosRecentes() {
    var lim = Date.now() - (S.janelaHoras || 24) * 3600 * 1000, a = [];
    try { a = JSON.parse(localStorage.getItem("mf_envios") || "[]"); } catch (e) {}
    return a.filter(function (t) { return t > lim; });
  }

  function bloqueado() {
    if (form.elements.website.value) return true;
    if ((Date.now() - abertoEm) / 1000 < S.minSegundosPreenchimento) return "Só um instante e clique em Enviar novamente.";
    try {
      var ult = Number(localStorage.getItem("mf_ult_envio") || 0);
      if ((Date.now() - ult) / 1000 < S.intervaloEntreEnvios) return "Aguarde alguns segundos antes de enviar outro pedido.";
      if (enviosRecentes().length >= (S.maxEnvios || 2)) return "Você atingiu o limite de pedidos neste navegador nas últimas " + (S.janelaHoras || 24) + " horas. Para novos pedidos, fale conosco pelo WhatsApp.";
    } catch (e) {}
    return false;
  }

  /* ---------- e-mails (EmailJS, opcional) ---------- */
  function enviarEmail(templateId, params) {
    var c = S.emailjs || {};
    if (!c.publicKey || !c.serviceId || !templateId) return Promise.resolve();
    return fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ service_id: c.serviceId, template_id: templateId, user_id: c.publicKey, template_params: params })
    }).catch(function () {});
  }
  /* ---------- grava no banco com os dados pessoais criptografados ---------- */
  var PESSOAIS = ["nome", "celular", "email", "pais", "estado", "cep", "finalidade", "estufa"];
  function enviar(doc) {
    if (!S.chavePublica || !window.MF.crip) return api.create(doc);
    var segredo = {}, aberto = {};
    Object.keys(doc).forEach(function (k) { if (PESSOAIS.indexOf(k) > -1) segredo[k] = doc[k]; else aberto[k] = doc[k]; });
    return window.MF.crip.selar(S.chavePublica, segredo).then(function (t) { aberto.enc = t; return api.create(aberto); });
  }
  form.addEventListener("submit", function (e) {
    e.preventDefault(); erro("");
    var f = form.elements;
    var b = bloqueado();
    if (b === true) { form.hidden = true; done.hidden = false; return; }   // robô: finge sucesso, não grava
    if (b) return erro(b);
    var v = validar(f); if (v) return erro(v);

    var btn = form.querySelector("[type=submit]"); btn.disabled = true; btn.textContent = "Enviando…";
    var doc = {
      tipo: "interesse",
      status: "novo",
      plantaId: f.planta.value,
      plantaNome: nomePlanta(f.planta.value),
      nome: f.nome.value.trim().replace(/\s+/g, " "),
      celular: so(f.celular.value),
      email: f.email.value.trim().toLowerCase(),
      pais: f.pais.value.trim(),
      estado: f.estado.value.trim(),
      cep: so(f.cep.value),
      finalidade: f.finalidade.value,
      estufa: f.estufa.value,
      lgpdAceite: new Date().toISOString(),
      lgpdVersao: "1.0"
    };
    api.create(doc).then(function (r) {
      try {
        localStorage.setItem("mf_ult_envio", String(Date.now()));
        var env = enviosRecentes(); env.push(Date.now()); localStorage.setItem("mf_envios", JSON.stringify(env));
      } catch (e) {}
      var params = {
        protocolo: r.id || "", planta: doc.plantaNome, nome: doc.nome, celular: doc.celular, email: doc.email,
        to_email: doc.email, to_name: doc.nome, local: doc.estado + " / " + doc.pais, cep: doc.cep,
        finalidade: doc.finalidade, estufa: doc.estufa, reply_to: doc.email
      };
      // o destinatário da equipe fica fixo dentro do template no EmailJS (não aparece no código do site)
      enviarEmail(S.emailjs && S.emailjs.templateEquipe, params);
      enviarEmail(S.emailjs && S.emailjs.templateCliente, params);
      document.getElementById("ok-protocolo").textContent = r.id ? "Protocolo: " + r.id : "";
      document.getElementById("ok-planta").textContent = doc.plantaNome;
      form.reset(); form.hidden = true; done.hidden = false;
    }).catch(function () {
      erro("Não foi possível enviar agora. Tente novamente ou fale conosco pelo WhatsApp.");
    }).then(function () { btn.disabled = false; btn.textContent = "Enviar pedido"; });
  });
})();
