/* © 2026 Júlia Ramos – Mortua Flora. Todos os direitos reservados. */
(function () {
  "use strict";
  var S = window.SITE, api = window.MF.api;
  var $ = function (id) { return document.getElementById(id); };
  var STATUS = ["novo", "em contato", "reservado", "concluído", "recusado"];
  var dados = [], aba = "interesses";

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function data(iso) { if (!iso) return ""; var d = new Date(iso); return d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }); }
  function cel(n) { n = String(n || ""); return n.length === 11 ? "(" + n.slice(0, 2) + ") " + n.slice(2, 7) + "-" + n.slice(7) : n; }
  function cep(n) { n = String(n || ""); return n.length === 8 ? n.slice(0, 5) + "-" + n.slice(5) : n; }
  function msg(t, bad) { var m = $("adm-msg"); m.textContent = t || ""; m.classList.toggle("is-bad", !!bad); }
  function waLink(n, t) { return "https://wa.me/55" + String(n).replace(/^55/, "") + "?text=" + encodeURIComponent(t); }

  /* ---------- login (senha conferida por hash) ---------- */
  function sha256(s) {
    return crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)).then(function (b) {
      return Array.prototype.map.call(new Uint8Array(b), function (x) { return x.toString(16).padStart(2, "0"); }).join("");
    });
  }
  function entrar() {
    $("login").hidden = true; $("painel").hidden = false; $("sair").hidden = false;
    $("aviso-teste").hidden = !api.modoTeste;
    carregar();
  }
  $("form-login").addEventListener("submit", function (e) {
    e.preventDefault();
    sha256($("senha").value).then(function (h) {
      if (h === S.adminHash) { try { sessionStorage.setItem("mf_admin", h); } catch (x) {} entrar(); }
      else { $("login-erro").hidden = false; }
    });
  });
  $("sair").addEventListener("click", function (e) { e.preventDefault(); try { sessionStorage.removeItem("mf_admin"); } catch (x) {} location.reload(); });
  try { if (sessionStorage.getItem("mf_admin") === S.adminHash) entrar(); } catch (e) {}

  /* ---------- dados ---------- */
  function carregar() {
    msg("Carregando…");
    api.list().then(function (a) { dados = a; msg(""); desenhar(); })
      .catch(function (e) { msg("Erro ao ler o banco: " + e.message, true); });
  }
  function porTipo(t) { return dados.filter(function (x) { return x.tipo === t; }).sort(function (a, b) { return String(b.criadoEm).localeCompare(String(a.criadoEm)); }); }

  function clientes() {
    var m = {};
    porTipo("interesse").forEach(function (i) {
      var k = i.email; if (!m[k]) m[k] = { email: k, nome: i.nome, celular: i.celular, pais: i.pais, estado: i.estado, cep: i.cep, ids: [], plantas: [], desde: i.criadoEm };
      m[k].ids.push(i.id); m[k].plantas.push(i.plantaNome);
    });
    return Object.keys(m).map(function (k) { return m[k]; });
  }

  /* ---------- telas ---------- */
  function tabela(cols, linhas) {
    if (!linhas.length) return '<p class="adm__vazio">Nada por aqui ainda.</p>';
    return '<div class="adm__scroll"><table class="adm__table"><thead><tr>' + cols.map(function (c) { return "<th>" + c + "</th>"; }).join("") +
      "</tr></thead><tbody>" + linhas.join("") + "</tbody></table></div>";
  }

  function telaInteresses() {
    var cont = {};
    porTipo("interesse").forEach(function (i) { var k = i.email + "|" + i.plantaId; cont[k] = (cont[k] || 0) + 1; });
    var linhas = porTipo("interesse").map(function (i) {
      var rep = cont[i.email + "|" + i.plantaId];
      var ped = dados.filter(function (p) { return p.tipo === "pedido" && p.interesseId === i.id; })[0];
      var opts = STATUS.map(function (s) { return "<option" + (s === i.status ? " selected" : "") + ">" + s + "</option>"; }).join("");
      var zap = waLink(i.celular, "Olá, " + i.nome.split(" ")[0] + "! Aqui é a Mortua Flora, sobre o seu interesse em " + i.plantaNome + ".");
      return "<tr><td>" + data(i.criadoEm) + "</td><td><strong>" + esc(i.nome) + "</strong><br>" + esc(i.email) + "<br>" +
        '<a href="' + zap + '" target="_blank" rel="noopener">' + cel(i.celular) + "</a></td><td>" + esc(i.plantaNome) + (rep > 1 ? '<br><span class="adm__tag">repetido (' + rep + "x)</span>" : "") + "</td><td>" +
        esc(i.finalidade) + "<br>Estufa: " + esc(i.estufa) + "</td><td>" + esc(i.estado) + "/" + esc(i.pais) + "<br>" + cep(i.cep) + "</td>" +
        '<td><select data-st="' + i.id + '">' + opts + "</select></td><td>" +
        (ped ? "Pedido " + esc(ped.statusPag) + "<br>" : "") +
        '<button data-ped="' + i.id + '">' + (ped ? "Editar pedido" : "Registrar pedido") + "</button> " +
        '<button class="is-danger" data-del-int="' + i.id + '">Excluir</button></td></tr>';
    });
    return tabela(["Data", "Cliente", "Planta", "Perfil", "Local", "Situação", "Ações"], linhas);
  }

  function telaClientes() {
    var linhas = clientes().map(function (c) {
      return "<tr><td><strong>" + esc(c.nome) + "</strong></td><td>" + esc(c.email) + "</td><td>" + cel(c.celular) + "</td><td>" + esc(c.estado) + "/" + esc(c.pais) + " " + cep(c.cep) + "</td><td>" +
        esc(c.plantas.join(", ")) + '</td><td><button class="is-danger" data-del-cli="' + esc(c.email) + '">Excluir dados (LGPD)</button></td></tr>';
    });
    return '<p class="adm__nota">Cliente = e-mail. Quem pede várias plantas aparece uma vez, com todas as plantas.</p>' +
      tabela(["Nome", "E-mail", "Celular", "Local", "Plantas", "Ação"], linhas);
  }

  function telaPedidos() {
    var linhas = porTipo("pedido").map(function (p) {
      return "<tr><td>" + data(p.criadoEm) + "</td><td>" + esc(p.clienteNome) + "<br>" + esc(p.plantaNome) + "</td><td>R$ " + Number(p.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 }) +
        "</td><td>" + esc(p.pagamento) + " · " + esc(p.statusPag) + "</td><td>" + cep(p.cepEntrega) + "<br>" + esc(p.statusEntrega) + "</td><td>" + esc(p.obs) + "</td></tr>";
    });
    return tabela(["Data", "Cliente / planta", "Valor", "Pagamento", "Entrega", "Obs."], linhas);
  }

  function telaEstoque() {
    var est = porTipo("estoque")[0], it = est ? est.itens : {};
    var linhas = window.PLANTAS.map(function (p) {
      return "<tr><td>" + esc(p.nome) + '</td><td><input type="number" min="0" data-q="' + p.id + '" value="' + (it[p.id] == null ? 0 : it[p.id]) + '"></td></tr>';
    });
    var info = est
      ? '<p class="adm__nota">ID do documento de estoque: <code>' + esc(est.id) + "</code>" +
        (S.estoqueId === est.id ? " (já está no CFG.js)" : " &larr; copie para <code>estoqueId</code> em CFG.js para o site público mostrar Disponível / Lista de espera.") + "</p>"
      : '<p class="adm__nota">O estoque ainda não foi criado. Defina as quantidades e salve.</p>';
    return info + tabela(["Planta", "Quantidade"], linhas) + '<p><button id="salvar-estoque">Salvar estoque</button></p>';
  }

  function desenhar() {
    var h = { interesses: telaInteresses, clientes: telaClientes, pedidos: telaPedidos, estoque: telaEstoque }[aba]();
    $("adm-conteudo").innerHTML = h;
    document.querySelectorAll(".adm__tabs [data-tab]").forEach(function (b) { b.classList.toggle("is-on", b.getAttribute("data-tab") === aba); });
  }

  /* ---------- ações ---------- */
  document.querySelector(".adm__tabs").addEventListener("click", function (e) {
    var t = e.target.getAttribute("data-tab"); if (t) { aba = t; desenhar(); }
  });
  $("btn-atualizar").addEventListener("click", carregar);

  var pedAtual = null;
  var dlg = $("dlg-pedido"), fp = $("form-pedido");
  dlg.querySelectorAll("[data-close]").forEach(function (b) { b.addEventListener("click", function () { dlg.close(); }); });

  $("adm-conteudo").addEventListener("change", function (e) {
    var id = e.target.getAttribute("data-st"); if (!id) return;
    api.patch(id, { status: e.target.value }).then(function () {
      dados.forEach(function (x) { if (x.id === id) x.status = e.target.value; }); msg("Situação atualizada.");
    }).catch(function (er) { msg("Erro: " + er.message, true); });
  });

  $("adm-conteudo").addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    if (b.hasAttribute("data-ped")) {
      var i = dados.filter(function (x) { return x.id === b.getAttribute("data-ped"); })[0];
      var ped = dados.filter(function (p) { return p.tipo === "pedido" && p.interesseId === i.id; })[0];
      pedAtual = { interesse: i, pedido: ped };
      $("ped-quem").textContent = i.nome + " · " + i.plantaNome;
      fp.valor.value = ped ? ped.valor : ""; fp.pagamento.value = ped ? ped.pagamento : "Pix";
      fp.statusPag.value = ped ? ped.statusPag : "Pendente"; fp.cepEntrega.value = cep(ped ? ped.cepEntrega : i.cep);
      fp.statusEntrega.value = ped ? ped.statusEntrega : "Aguardando"; fp.obs.value = ped ? (ped.obs || "") : "";
      dlg.showModal();
    }
    if (b.hasAttribute("data-del-int")) {
      var id = b.getAttribute("data-del-int");
      if (confirm("Excluir este pedido de interesse (e o pedido de pagamento ligado a ele)?")) apagar([id]);
    }
    if (b.hasAttribute("data-del-cli")) {
      var email = b.getAttribute("data-del-cli");
      if (confirm("Excluir TODOS os dados de " + email + " (interesses e pedidos)? Não dá para desfazer.")) {
        var ints = dados.filter(function (x) { return x.tipo === "interesse" && x.email === email; }).map(function (x) { return x.id; });
        apagar(ints);
      }
    }
    if (b.id === "salvar-estoque") {
      var itens = {};
      document.querySelectorAll("[data-q]").forEach(function (inp) { itens[inp.getAttribute("data-q")] = Math.max(0, parseInt(inp.value, 10) || 0); });
      msg("Salvando…");
      api.saveEstoque(itens).then(function () { msg("Estoque salvo."); carregar(); }).catch(function (er) { msg("Erro: " + er.message, true); });
    }
  });

  function apagar(idsInteresse) {
    var ids = idsInteresse.slice();
    dados.forEach(function (p) { if (p.tipo === "pedido" && idsInteresse.indexOf(p.interesseId) > -1) ids.push(p.id); });
    msg("Excluindo…");
    ids.reduce(function (pr, id) { return pr.then(function () { return api.remove(id); }); }, Promise.resolve())
      .then(function () { msg("Excluído."); carregar(); }).catch(function (er) { msg("Erro: " + er.message, true); });
  }

  fp.addEventListener("submit", function (e) {
    e.preventDefault();
    var i = pedAtual.interesse, campos = {
      valor: Number(fp.valor.value), pagamento: fp.pagamento.value, statusPag: fp.statusPag.value,
      cepEntrega: fp.cepEntrega.value.replace(/\D/g, ""), statusEntrega: fp.statusEntrega.value, obs: fp.obs.value.trim()
    };
    var op = pedAtual.pedido
      ? api.patch(pedAtual.pedido.id, campos)
      : api.create(Object.assign({ tipo: "pedido", interesseId: i.id, clienteNome: i.nome, clienteEmail: i.email, plantaNome: i.plantaNome }, campos));
    op.then(function () { dlg.close(); msg("Pedido salvo."); carregar(); }).catch(function (er) { msg("Erro: " + er.message, true); });
  });

  /* ---------- CSV ---------- */
  $("btn-csv").addEventListener("click", function () {
    var linhas;
    if (aba === "clientes") linhas = [["nome", "email", "celular", "pais", "estado", "cep", "plantas"]].concat(clientes().map(function (c) { return [c.nome, c.email, c.celular, c.pais, c.estado, c.cep, c.plantas.join(" | ")]; }));
    else if (aba === "pedidos") linhas = [["data", "cliente", "planta", "valor", "pagamento", "situacao_pagamento", "cep_entrega", "situacao_entrega", "obs"]].concat(porTipo("pedido").map(function (p) { return [p.criadoEm, p.clienteNome, p.plantaNome, p.valor, p.pagamento, p.statusPag, p.cepEntrega, p.statusEntrega, p.obs]; }));
    else linhas = [["data", "nome", "email", "celular", "planta", "finalidade", "estufa", "pais", "estado", "cep", "status"]].concat(porTipo("interesse").map(function (i) { return [i.criadoEm, i.nome, i.email, i.celular, i.plantaNome, i.finalidade, i.estufa, i.pais, i.estado, i.cep, i.status]; }));
    var csv = linhas.map(function (l) { return l.map(function (c) { c = String(c == null ? "" : c); if (/^[=+\-@]/.test(c)) c = "'" + c; return '"' + c.replace(/"/g, '""') + '"'; }).join(";"); }).join("\r\n");
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    a.download = "mortuaflora-" + aba + ".csv"; a.click();
  });
})();
