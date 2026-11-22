/* © 2026 Júlia Ramos – Mortua Flora. Todos os direitos reservados. */
/* =====================================================
   PREVISÕES CLIMÁTICAS POR PLANTA
   - cidade: busca mundial (Open-Meteo Geocoding)
   - previsão: 7 dias (Open-Meteo Forecast), sem chave, direto do navegador
   - nada é gravado: nem a cidade, nem a planta
   As regras de avaliação ficam na seção "REGRAS" (valores ajustáveis).
   ===================================================== */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var enc = encodeURIComponent;
  var PLANTAS = window.PLANTAS || [], CLIMA = window.CLIMA || {};
  var lugar = null;

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function r(n) { return Math.round(n); }
  function media(a) { var v = a.filter(function (x) { return x != null; }); return v.length ? v.reduce(function (s, x) { return s + x; }, 0) / v.length : null; }

  /* ================= REGRAS (ajustáveis) ================= */
  var UMID_AR = { alta: [65, 100], media: [45, 75], baixa: [15, 55] };            // % de umidade relativa
  var UMID_SOLO = { frequente: [0.25, 0.50], regular: [0.18, 0.40], leve: [0.10, 0.30], fraca: [0.05, 0.22] }; // m³/m³
  var CHUVA_SEMANA_MIN = { frequente: 20, regular: 10, leve: 5, fraca: 3 };       // mm/semana abaixo disso = complementar com rega
  var TXT_REGA = {
    frequente: "mantenha o substrato sempre úmido, com regas frequentes",
    regular: "faça regas regulares, deixando só a camada de cima secar levemente entre uma e outra",
    leve: "faça regas leves e espaçadas",
    fraca: "faça regas fracas, só o suficiente para o substrato não secar por completo"
  };
  var TXT_UMID = { alta: "alta", media: "média", baixa: "baixa" };
  var TXT_LUZ = { "nublado": "luz difusa (dias nublados)", "sombra-parcial": "sombra parcial", "sol-parcial": "sol parcial", "ensolarado": "sol pleno" };
  var TXT_EST = { verao: "Verão", outono: "Outono", inverno: "Inverno", primavera: "Primavera" };

  var RANK = { na: -1, ok: 0, warn: 1, bad: 2 };
  function pior(a, b) { return RANK[a] >= RANK[b] ? a : b; }

  /* ================= AVALIAÇÃO DE CADA FATOR ================= */
  function avTemp(p, d) {
    if (d.tmin == null || d.tmax == null) return "na";
    var dev = Math.max(p.temp[0] - d.tmin, d.tmax - p.temp[1], 0);
    return dev <= 2 ? "ok" : dev <= 5 ? "warn" : "bad";
  }
  function avFaixa(v, lo, hi, mw) {
    if (v == null) return "na";
    if (v >= lo && v <= hi) return "ok";
    return (v >= lo - mw && v <= hi + mw) ? "warn" : "bad";
  }
  function avUmid(p, d) { var f = UMID_AR[p.umidade]; return avFaixa(d.umid, f[0], f[1], 10); }
  function avSoloU(p, d) { var f = UMID_SOLO[p.rega]; return avFaixa(d.soloU, f[0], f[1], 0.07); }
  function avSoloT(p, d) { return avFaixa(d.soloT, p.temp[0] - 2, p.temp[1] + 2, 4); }
  function avChuva(p, d) {
    var mm = d.chuva; if (mm == null) return "na";
    if (p.efeitoChuva === "perigoso") return mm >= 15 ? "bad" : mm >= 3 ? "warn" : "ok";
    if (p.efeitoChuva === "indiferente") return mm >= 40 ? "warn" : "ok";
    return mm >= 80 ? "bad" : mm >= 50 ? "warn" : "ok";
  }
  function avLuz(p, d) {
    var s = d.sol, uv = d.uv; if (s == null && uv == null) return "na";
    var n = "ok";
    if (s != null) {
      switch (p.luz) {
        case "nublado": n = s > 8 ? "bad" : s > 5 ? "warn" : "ok"; break;
        case "sombra-parcial": n = (s < 2 || s > 9) ? "warn" : "ok"; break;
        case "sol-parcial": n = (s < 4 || s > 10) ? "warn" : "ok"; break;
        case "ensolarado": n = s < 2 ? "bad" : s < 6 ? "warn" : "ok"; break;
      }
    }
    if (uv != null && (p.luz === "nublado" || p.luz === "sombra-parcial") && uv >= 8) { n = pior(n, "warn"); }   // UV alto: só aviso, a pessoa pode sombrear
    return n;
  }

  function avaliarDia(p, d) {
    var f = { temp: avTemp(p, d), umid: avUmid(p, d), chuva: avChuva(p, d), luz: avLuz(p, d), soloT: avSoloT(p, d), soloU: avSoloU(p, d) };
    var bad = 0, warn = 0;
    Object.keys(f).forEach(function (k) { if (f[k] === "bad") bad++; if (f[k] === "warn") warn++; });
    var score = bad * 2 + warn;
    var geral = (f.temp === "bad" || score >= 4) ? "bad" : score >= 1 ? "warn" : "ok";
    return { f: f, geral: geral };
  }

  /* ================= DICAS ================= */
  function dicas(p, dias) {
    var L = [], lo = p.temp[0], hi = p.temp[1], vaso = p.plantio === "vaso";

    var frio = dias.filter(function (d) { return d.tmin != null && d.tmin < lo - 2; });
    if (frio.length) {
      var m = Math.min.apply(null, frio.map(function (d) { return d.tmin; }));
      L.push({ n: m < lo - 5 ? "bad" : "warn", t: "Frio: mínimas de até " + r(m) + " °C em " + frio.length + " dia(s), abaixo do ideal (" + lo + " a " + hi + " °C). " +
        (vaso ? "Nas noites frias, leve o vaso para um local abrigado (varanda coberta, junto a uma parede ou janela)." : "Proteja a base com cobertura morta (folhas secas ou palha) e evite o vento frio.") });
    }
    var calor = dias.filter(function (d) { return d.tmax != null && d.tmax > hi + 2; });
    if (calor.length) {
      var mx = Math.max.apply(null, calor.map(function (d) { return d.tmax; }));
      L.push({ n: mx > hi + 5 ? "bad" : "warn", t: "Calor: máximas de até " + r(mx) + " °C em " + calor.length + " dia(s), acima do ideal. Dê sombra nas horas mais quentes (sombrite ou posição com sombra à tarde) e regue de manhã cedo ou no fim da tarde." });
    }

    var um = media(dias.map(function (d) { return d.umid; })), fu = UMID_AR[p.umidade];
    if (um != null && um < fu[0] - 5) {
      L.push({ n: um < fu[0] - 15 ? "bad" : "warn", t: "Ar mais seco que o ideal (média de " + r(um) + "%; a planta prefere umidade " + TXT_UMID[p.umidade] + "). Borrife névoa fina nas folhas, agrupe vasos próximos ou use uma bandeja com pedras e água sob o vaso (sem encostar a água no fundo do vaso)." });
    } else if (um != null && um > fu[1] + 5) {
      L.push({ n: "warn", t: "Ar mais úmido que o ideal (média de " + r(um) + "%). Garanta boa ventilação e evite deixar as folhas molhadas à noite, para prevenir fungos e mofo." });
    }

    var total = dias.reduce(function (s, d) { return s + (d.chuva || 0); }, 0);
    var pe = p.efeitoChuva;
    var diasPerigo = dias.filter(function (d) { return d.chuva != null && d.chuva >= 3; });
    if (pe === "perigoso" && diasPerigo.length) {
      L.push({ n: diasPerigo.some(function (d) { return d.chuva >= 15; }) ? "bad" : "warn", t: "Chuva prevista em " + diasPerigo.length + " dia(s) (" + r(total) + " mm na semana). Para esta espécie a chuva é perigosa: abrigue-a nesses dias (cobertura transparente ou local protegido) e garanta drenagem muito rápida." });
    } else if (total < CHUVA_SEMANA_MIN[p.rega] && pe !== "perigoso") {
      L.push({ n: "warn", t: "Pouca chuva prevista (" + r(total) + " mm na semana). Complemente com rega: " + TXT_REGA[p.rega] + "." });
    } else if (pe === "perigoso") {
      L.push({ n: "ok", t: "Pouca chuva prevista (" + r(total) + " mm na semana), o que favorece esta espécie. " + TXT_REGA[p.rega].charAt(0).toUpperCase() + TXT_REGA[p.rega].slice(1) + "." });
    } else if (dias.some(function (d) { return d.chuva >= 50; })) {
      L.push({ n: "warn", t: "Chuva forte prevista (" + r(Math.max.apply(null, dias.map(function (d) { return d.chuva || 0; }))) + " mm em um dia). Garanta drenagem, não deixe água parada no pratinho e, se possível, proteja do temporal." });
    } else {
      L.push({ n: "ok", t: "Chuva prevista de " + r(total) + " mm na semana, suficiente para esta espécie. Ajuste a rega: " + TXT_REGA[p.rega] + "." });
    }

    var muitoSol = dias.filter(function (d) { return avLuz(p, d) !== "ok" && ((d.sol != null && ((p.luz === "nublado" && d.sol > 5) || (p.luz === "sombra-parcial" && d.sol > 9) || (p.luz === "sol-parcial" && d.sol > 10))) || (d.uv != null && d.uv >= 8 && (p.luz === "nublado" || p.luz === "sombra-parcial"))); });
    var pouco = dias.filter(function (d) { return d.sol != null && ((p.luz === "ensolarado" && d.sol < 6) || (p.luz === "sol-parcial" && d.sol < 4) || (p.luz === "sombra-parcial" && d.sol < 2)); });
    if (muitoSol.length) {
      var uvmax = Math.max.apply(null, dias.map(function (d) { return d.uv || 0; }));
      L.push({ n: "warn", t: "Sol forte para esta espécie (UV de até " + r(uvmax) + ") em " + muitoSol.length + " dia(s). A planta prefere " + TXT_LUZ[p.luz] + ": use sombrite ou deixe-a onde pegue sol só de manhã." });
    }
    if (pouco.length) {
      L.push({ n: "warn", t: "Poucas horas de sol em " + pouco.length + " dia(s). A planta prefere " + TXT_LUZ[p.luz] + ": coloque-a no ponto mais iluminado disponível." });
    }

    var st = media(dias.map(function (d) { return d.soloT; }));
    if (st != null && st < lo - 4) L.push({ n: "warn", t: "Solo frio (média de " + r(st) + " °C). Evite deixar o vaso direto no chão frio e use cobertura morta para proteger as raízes." });
    if (st != null && st > hi + 4) L.push({ n: "warn", t: "Solo quente (média de " + r(st) + " °C). Use cobertura morta, vaso de cor clara e sombra à tarde para proteger as raízes." });
    var su = media(dias.map(function (d) { return d.soloU; })), fs = UMID_SOLO[p.rega];
    if (su != null && su < fs[0] - 0.03) L.push({ n: "warn", t: "Solo da região mais seco que o ideal. Verifique o substrato com o dedo e regue quando estiver seco a 2 cm de profundidade." });
    if (su != null && su > fs[1] + 0.03) L.push({ n: "warn", t: "Solo da região muito encharcado. Garanta drenagem no vaso ou canteiro e evite regar até o substrato secar um pouco." });

    if (p.plantio === "hospedeiro") L.push({ n: "warn", t: "Esta espécie é parasita e depende de uma planta hospedeira: o clima ajuda, mas não basta. Cuide também da hospedeira." });
    if (p.plantio === "solo") L.push({ n: "ok", t: "Esta espécie é de grande porte (" + p.altura + ") e deve ser plantada direto no solo, não em vaso." });

    var temProblema = L.some(function (x) { return x.n !== "ok"; });
    if (!temProblema && !(p.plantio === "hospedeiro")) L.unshift({ n: "ok", t: "Condições boas para esta espécie nos próximos dias. Mantenha os cuidados de rotina." });
    return L;
  }

  /* ================= TELA ================= */
  var NOMES = { ok: "ideal", warn: "atenção", bad: "risco", na: "sem dado" };
  var ICON = { ok: "✔", warn: "▲", bad: "✖", na: "–" };
  function chip(label, valor, nivel) {
    return '<li class="prv-chip prv-chip--' + nivel + '"><span class="prv-chip__l">' + label + '</span><span class="prv-chip__v">' + valor + '</span><span class="prv-chip__s" title="' + NOMES[nivel] + '"><span aria-hidden="true">' + ICON[nivel] + '</span><span class="sr">' + NOMES[nivel] + '</span></span></li>';
  }
  function dataBr(iso) {
    var p = iso.split("-"), d = new Date(+p[0], +p[1] - 1, +p[2]);
    var s = d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
    return s.replace(".", "");
  }

  function desenhar(planta, perfil, dias, loc) {
    var av = dias.map(function (d) { return avaliarDia(perfil, d); });
    var nOk = av.filter(function (a) { return a.geral === "ok"; }).length;
    var nBad = av.filter(function (a) { return a.geral === "bad"; }).length;
    var veredito = nOk >= 5 ? ["ok", "Semana favorável"] : nBad >= 3 ? ["bad", "Semana desfavorável"] : ["warn", "Semana com pontos de atenção"];

    var cards = dias.map(function (d, i) {
      var f = av[i].f;
      return '<article class="prv-dia prv-dia--' + av[i].geral + '"><h4>' + esc(dataBr(d.data)) + "</h4><ul>" +
        chip("Temp.", d.tmin == null ? "–" : r(d.tmin) + "–" + r(d.tmax) + " °C", f.temp) +
        chip("Ar", d.umid == null ? "–" : r(d.umid) + "%", f.umid) +
        chip("Chuva", d.chuva == null ? "–" : (d.chuva < 1 ? "0" : r(d.chuva)) + " mm", f.chuva) +
        chip("Luz", d.sol == null ? "–" : r(d.sol) + " h · UV " + (d.uv == null ? "–" : r(d.uv)), f.luz) +
        chip("Solo", (d.soloT == null ? "–" : r(d.soloT) + " °C") + " · " + (d.soloU == null ? "–" : r(d.soloU * 100) + "%"), pior(f.soloT, f.soloU)) +
        "</ul></article>";
    }).join("");

    var ds = dicas(perfil, dias).map(function (x) { return '<li class="prv-dica prv-dica--' + x.n + '"><span aria-hidden="true">' + ICON[x.n] + "</span><span>" + esc(x.t) + "</span></li>"; }).join("");

    var cuid = (perfil.cuidados || []).map(function (c) { return "<li>" + esc(c) + "</li>"; }).join("");
    var melhor = [], evitar = [], ext = [];
    Object.keys(perfil.estacoes).forEach(function (k) { var v = perfil.estacoes[k]; (v === "melhor" ? melhor : v === "extremos" ? ext : evitar).push(TXT_EST[k]); });

    $("resultado").innerHTML =
      '<div class="prv-topo prv-topo--' + veredito[0] + '"><div><p class="prv-topo__l">' + esc(planta.nome) + " · " + esc(loc) + '</p><h2>' + veredito[1] + '</h2>' +
      '<p class="prv-topo__s">' + nOk + " de " + dias.length + " dias com condições ideais · próximos 7 dias</p></div></div>" +
      '<div class="prv-dias">' + cards + "</div>" +
      "<h3>O que fazer esta semana</h3><ul class=\"prv-dicas\">" + ds + "</ul>" +
      "<h3>Condições ideais de " + esc(planta.nome) + " (guia)</h3>" +
      '<ul class="prv-ficha"><li><b>Temperatura:</b> ' + perfil.temp[0] + " a " + perfil.temp[1] + " °C</li><li><b>pH do solo:</b> " + perfil.ph[0] + " a " + perfil.ph[1] + "</li>" +
      "<li><b>Umidade do ar:</b> " + TXT_UMID[perfil.umidade] + "</li><li><b>Luz:</b> " + TXT_LUZ[perfil.luz] + "</li><li><b>Altura:</b> " + esc(perfil.altura) + "</li>" +
      "<li><b>Floração:</b> " + esc(perfil.florescer) + "</li>" +
      "<li><b>Melhor época:</b> " + (melhor.join(", ") || "–") + (ext.length ? " · <b>Clima extremo:</b> " + ext.join(", ") : "") + (evitar.length ? " · <b>Não adequado:</b> " + evitar.join(", ") : "") + "</li>" +
      (cuid ? "<li><b>Cuidados:</b><ul>" + cuid + "</ul></li>" : "") + "</ul>" +
      '<p class="prv-aviso">Estimativa com base em modelos de previsão, não uma garantia. Os dados de solo são calculados para a região (não medidos no seu local) e a luz mostra a insolação da região, não o sombreamento do seu espaço. As estações seguem o guia; em outro hemisfério, considere a estação equivalente.</p>';
    $("resultado").hidden = false;
  }

  /* ================= DADOS ================= */
  function montarDias(j) {
    var d = j.daily, h = j.hourly, dias = [];
    for (var i = 0; i < d.time.length; i++) {
      var dia = d.time[i], u = [], st = [], su = [];
      for (var k = 0; k < h.time.length; k++) {
        if (h.time[k].slice(0, 10) === dia) { u.push(h.relative_humidity_2m[k]); st.push(h.soil_temperature_6cm[k]); su.push(h.soil_moisture_3_to_9cm[k]); }
      }
      dias.push({
        data: dia, tmax: d.temperature_2m_max[i], tmin: d.temperature_2m_min[i], chuva: d.precipitation_sum[i], uv: d.uv_index_max[i],
        sol: d.sunshine_duration[i] == null ? null : d.sunshine_duration[i] / 3600,
        umid: media(u), soloT: media(st), soloU: media(su)
      });
    }
    return dias;
  }

  function msg(t, ruim) { var m = $("prv-msg"); m.textContent = t || ""; m.classList.toggle("is-bad", !!ruim); }

  function atualizar() {
    var id = $("sel-planta").value;
    if (!lugar || !id) { $("resultado").hidden = true; return; }
    var planta = PLANTAS.filter(function (p) { return p.id === id; })[0], perfil = CLIMA[id];
    if (!planta || !perfil) return;
    msg("Buscando a previsão…");
    var url = "https://api.open-meteo.com/v1/forecast?latitude=" + lugar.lat + "&longitude=" + lugar.lon + "&timezone=auto&forecast_days=7" +
      "&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,uv_index_max,sunshine_duration" +
      "&hourly=relative_humidity_2m,soil_temperature_6cm,soil_moisture_3_to_9cm";
    fetch(url).then(function (res) { if (!res.ok) throw new Error("HTTP " + res.status); return res.json(); })
      .then(function (j) { msg(""); desenhar(planta, perfil, montarDias(j), lugar.nome); })
      .catch(function () { $("resultado").hidden = true; msg("Não foi possível obter a previsão agora. Tente novamente em instantes.", true); });
  }

  function buscarLugar(e) {
    e.preventDefault();
    var q = $("cidade").value.trim();
    if (q.length < 2) return msg("Digite o nome da cidade.", true);
    msg("Buscando…"); $("lista-lugares").hidden = true;
    fetch("https://geocoding-api.open-meteo.com/v1/search?name=" + enc(q) + "&count=8&language=pt&format=json")
      .then(function (res) { if (!res.ok) throw new Error("HTTP " + res.status); return res.json(); })
      .then(function (j) {
        var rs = j.results || [];
        if (!rs.length) { msg("Nenhuma cidade encontrada. Tente outro nome (ou o nome em inglês).", true); return; }
        msg("Escolha o local:");
        $("lista-lugares").innerHTML = rs.map(function (x, i) {
          var nome = [x.name, x.admin1, x.country].filter(Boolean).join(", ");
          return '<li><button type="button" data-i="' + i + '">' + esc(nome) + "</button></li>";
        }).join("");
        $("lista-lugares").hidden = false;
        $("lista-lugares").onclick = function (ev) {
          var b = ev.target.closest("button"); if (!b) return;
          var x = rs[+b.getAttribute("data-i")];
          lugar = { lat: x.latitude, lon: x.longitude, nome: [x.name, x.admin1, x.country].filter(Boolean).join(", ") };
          $("lugar-escolhido").textContent = "Local: " + lugar.nome;
          $("lista-lugares").hidden = true; msg("");
          atualizar();
        };
      })
      .catch(function () { msg("Não foi possível buscar a cidade agora. Tente novamente.", true); });
  }

  var o0 = document.createElement("option"); o0.value = ""; o0.textContent = "Escolha a planta…"; $("sel-planta").appendChild(o0);
  PLANTAS.forEach(function (p) { var o = document.createElement("option"); o.value = p.id; o.textContent = p.nome; $("sel-planta").appendChild(o); });
  $("form-busca").addEventListener("submit", buscarLugar);
  $("sel-planta").addEventListener("change", atualizar);

  /* abre já com a planta indicada na URL (ex.: previsao/?planta=black-bat) */
  try { var pr = new URLSearchParams(location.search).get("planta"); if (pr && CLIMA[pr]) $("sel-planta").value = pr; } catch (e) {}
})();
