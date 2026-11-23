/* =====================================================
   CONFIGURAÇÕES DO SITE - edite só aqui
   ===================================================== */
window.SITE = {
  // ---------- Contatos ----------
  whatsapp: "5511945334323",          // só números, com 55 + DDD
  telefoneFixo: "551142939080",
  instagram: "ts.serena.art",           // sem @
  email: "juheluani@uni9.edu.br",
  endereco: "Avenida Professor Luiz Ignácio Anhaia Mello, 1363, Vila Prudente, São Paulo - SP",
  mensagemContato: "Olá! Vim pelo site da Mortua Flora e gostaria de falar com vocês.",

  // ---------- Responsável pelos dados (LGPD) ----------
  responsavel: "Júlia Ramos",
  nomeFantasia: "Mortua Flora",
  emailPrivacidade: "juheluani@uni9.edu.br",

  // ---------- Banco de dados (API Technoworks, rota /rest/{ra}) ----------
  apiBase: "https://technoworks.com.br",
  ra: "3023105368",            // <<< COLOQUE SEU RA AQUI. Vazio = MODO TESTE (dados só no seu navegador)
  estoqueId: "",     // <<< ID do documento de estoque (a página admin mostra qual é, na aba Estoque)

  // ---------- Área administrativa ----------
  // Hash SHA-256 da senha. Para trocar a senha, veja o README.
  adminHash: "269749033714e53cda080de0b0595065f0454b9401c9a6b01f6736e00fd231b4",
  chavePublica: {"kty":"RSA","n":"5KBMZdf24-lW84mT3FKGfm8dgaOSSrUfKcA0385_AuqFbLRtqmrJngjnT82DDVF-fbPQr8hC2e-j0O5C5wdOxOMbv7M4jiA7uCzMau0X-co2rd8uTnQKy_-wfLL2B7tuBtfX008mhvYuzdB5y5bU1hzyRmr-qZXWnq7tz4oqaM0DIF1d_-irrwdA5fAtVtdf8PB4e898Mw5PIq9682mkRW5w4Rb9P3Q3_rXFDgsUCMV3kdbSIRI-3R-FacNFn8Z_61_Ia7tl58FY2QWJMiLGTsmiamCh2Sqh6wGDUihAU4nLkaq5ocOOaNO8SBTmRiMdbud281bHrh0yFvQXA-KgaBbUxeNj4UHU7fn8jjwqeOh3pvkeNO7gtS0BNPNv-vD8qIegU6XrVUjfxtv3Wam1Gjpo91H35r9c1_ZdDE3jLg8ElgSOrLLcT-k1uu0Fn1ljabtN1vb3C7Sf0p5GdFDnxZ7VitghocfO0zq_9xXKI5urX2HKbPd67atobniy7FdV","e":"AQAB","alg":"RSA-OAEP-256","ext":true,"key_ops":["encrypt"]},

  // ---------- E-mails automáticos (EmailJS - opcional) ----------
  // Deixe vazio para não enviar. Passo a passo no README.
  emailjs: {
    publicKey: "",
    serviceId: "",
    templateEquipe: "",    // aviso para a equipe
    templateCliente: ""    // confirmação para o cliente
  },

  // ---------- Antirrobô ----------
  minSegundosPreenchimento: 4,   // envio mais rápido que isso é descartado
  intervaloEntreEnvios: 30       // segundos entre envios do mesmo navegador
};
