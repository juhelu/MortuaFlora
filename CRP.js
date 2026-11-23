/* © 2026 Júlia Ramos – Mortua Flora. Todos os direitos reservados. */
(function () {
  "use strict";
  var enc = new TextEncoder(), dec = new TextDecoder();
  function b64(buf) { var s = "", a = new Uint8Array(buf); for (var i = 0; i < a.length; i++) s += String.fromCharCode(a[i]); return btoa(s); }
  function unb64(t) { var s = atob(t), a = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return a; }
  var ALG = { name: "RSA-OAEP", hash: "SHA-256" };

  function selar(pubJwk, obj) {
    var aes, iv = crypto.getRandomValues(new Uint8Array(12));
    return Promise.all([
      crypto.subtle.importKey("jwk", pubJwk, ALG, false, ["encrypt"]),
      crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt"])
    ]).then(function (r) {
      aes = r[1];
      return Promise.all([
        crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, aes, enc.encode(JSON.stringify(obj))),
        crypto.subtle.exportKey("raw", aes).then(function (raw) { return crypto.subtle.encrypt({ name: "RSA-OAEP" }, r[0], raw); })
      ]);
    }).then(function (x) { return "v1." + b64(iv) + "." + b64(x[1]) + "." + b64(x[0]); });
  }

  function abrir(privJwk, texto) {
    var p = String(texto || "").split(".");
    if (p[0] !== "v1" || p.length !== 4) return Promise.reject(new Error("formato"));
    return crypto.subtle.importKey("jwk", privJwk, ALG, false, ["decrypt"]).then(function (k) {
      return crypto.subtle.decrypt({ name: "RSA-OAEP" }, k, unb64(p[2]));
    }).then(function (raw) {
      return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["decrypt"]);
    }).then(function (aes) {
      return crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(p[1]) }, aes, unb64(p[3]));
    }).then(function (b) { return JSON.parse(dec.decode(b)); });
  }

  function gerarPar() {
    return crypto.subtle.generateKey({ name: "RSA-OAEP", modulusLength: 3072, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["encrypt", "decrypt"])
      .then(function (kp) {
        return Promise.all([crypto.subtle.exportKey("jwk", kp.publicKey), crypto.subtle.exportKey("jwk", kp.privateKey)]);
      }).then(function (r) { return { pub: r[0], priv: r[1] }; });
  }

  window.MF = window.MF || {};
  window.MF.crip = { selar: selar, abrir: abrir, gerarPar: gerarPar };
})();
