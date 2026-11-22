/* © 2026 Júlia Ramos – Mortua Flora. Todos os direitos reservados. */
/* =====================================================
   CONDIÇÕES IDEAIS POR PLANTA  (fonte: Guia de Plantas Exóticas)
   Os ids são os mesmos do PLS.js. Para ajustar uma planta, edite só aqui.

   temp      -> [mínima, máxima] ideal em °C
   ph        -> [mínimo, máximo] do solo
   altura    -> texto (como no guia)
   umidade   -> do ar: "alta" | "media" | "baixa"
   chuva     -> frequência natural: "diaria" | "semanal" | "quinzenal" | "incerta"
   rega      -> "frequente" | "regular" | "leve" | "fraca"
   luz       -> "nublado" | "sombra-parcial" | "sol-parcial" | "ensolarado"
   efeitoChuva -> "muito-bom" | "bom" | "indiferente" | "perigoso"
   plantio   -> "vaso" | "solo" | "hospedeiro"
   estacoes  -> verao/outono/inverno/primavera: "melhor" | "extremos" | "nao"
   cuidados  -> ações recomendadas no guia
   ===================================================== */
window.CLIMA = {
  "middlemist-red": {
    temp: [7, 18], ph: [5.5, 6.5], altura: "180 a 300 cm",
    umidade: "media", chuva: "semanal", rega: "regular", luz: "sombra-parcial", efeitoChuva: "bom",
    plantio: "vaso", florescer: "Final do inverno ao início da primavera",
    estacoes: { verao: "nao", outono: "extremos", inverno: "nao", primavera: "melhor" },
    cuidados: ["Remover áreas afetadas", "Tratar com óleo hortícola"]
  },
  "cobra-lily": {
    temp: [21, 27], ph: [4.5, 6.0], altura: "50 a 100 cm",
    umidade: "alta", chuva: "diaria", rega: "frequente", luz: "sol-parcial", efeitoChuva: "bom",
    plantio: "vaso", florescer: "Final da primavera ao início do verão",
    estacoes: { verao: "nao", outono: "extremos", inverno: "melhor", primavera: "nao" },
    cuidados: ["Remover fertilizantes", "Resfriar as raízes"]
  },
  "darth-vader": {
    temp: [16, 26], ph: [6.0, 7.0], altura: "30 a 60 cm",
    umidade: "alta", chuva: "semanal", rega: "regular", luz: "sombra-parcial", efeitoChuva: "bom",
    plantio: "vaso", florescer: "Final da primavera ao início do verão",
    estacoes: { verao: "nao", outono: "extremos", inverno: "nao", primavera: "melhor" },
    cuidados: ["Trocar o substrato", "Ajustar a umidade"]
  },
  "dracula-vampira": {
    temp: [15, 25], ph: [5.5, 6.0], altura: "15 a 30 cm",
    umidade: "alta", chuva: "diaria", rega: "frequente", luz: "nublado", efeitoChuva: "muito-bom",
    plantio: "vaso", florescer: "Final do outono ao início do inverno",
    estacoes: { verao: "nao", outono: "extremos", inverno: "melhor", primavera: "nao" },
    cuidados: ["Ventilar o ambiente", "Umidificar o ar"]
  },
  "rafflesia": {
    temp: [24, 29], ph: [5.5, 6.5], altura: "rente ao solo (0 cm)",
    umidade: "alta", chuva: "incerta", rega: "fraca", luz: "sombra-parcial", efeitoChuva: "bom",
    plantio: "hospedeiro", florescer: "Início ao final do verão",
    estacoes: { verao: "nao", outono: "extremos", inverno: "nao", primavera: "melhor" },
    cuidados: ["Isolar o mofo", "Cuidar da planta hospedeira"]
  },
  "hydnora": {
    temp: [22, 35], ph: [7.0, 8.0], altura: "10 a 15 cm",
    umidade: "baixa", chuva: "incerta", rega: "fraca", luz: "ensolarado", efeitoChuva: "perigoso",
    plantio: "hospedeiro", florescer: "Final do outono ao início do inverno",
    estacoes: { verao: "nao", outono: "nao", inverno: "melhor", primavera: "extremos" },
    cuidados: ["Controlar a hidratação", "Proteger a planta hospedeira"]
  },
  "welwitschia": {
    temp: [20, 30], ph: [6.0, 6.5], altura: "30 a 50 cm",
    umidade: "baixa", chuva: "quinzenal", rega: "leve", luz: "ensolarado", efeitoChuva: "perigoso",
    plantio: "vaso", florescer: "Início ao final do verão",
    estacoes: { verao: "nao", outono: "extremos", inverno: "melhor", primavera: "melhor" },
    cuidados: ["Transportar com cuidado a raiz", "Borrifar névoa fina"]
  },
  "devils-hand": {
    temp: [16, 27], ph: [6.5, 7.5], altura: "10 a 30 m",
    umidade: "media", chuva: "semanal", rega: "regular", luz: "sol-parcial", efeitoChuva: "bom",
    plantio: "solo", florescer: "Início da primavera ao final do verão",
    estacoes: { verao: "nao", outono: "extremos", inverno: "melhor", primavera: "nao" },
    cuidados: ["Aplicar quelato de ferro", "Remover áreas afetadas"]
  },
  "parachute": {
    temp: [16, 25], ph: [6.0, 7.0], altura: "30 a 50 cm",
    umidade: "media", chuva: "quinzenal", rega: "leve", luz: "sombra-parcial", efeitoChuva: "indiferente",
    plantio: "vaso", florescer: "Início da primavera ao final do verão",
    estacoes: { verao: "nao", outono: "extremos", inverno: "nao", primavera: "melhor" },
    cuidados: ["Remover áreas afetadas", "Aumentar a luminosidade"]
  },
  "black-bat": {
    temp: [21, 29], ph: [5.5, 6.5], altura: "60 a 100 cm",
    umidade: "alta", chuva: "diaria", rega: "frequente", luz: "sombra-parcial", efeitoChuva: "bom",
    plantio: "vaso", florescer: "Início da primavera ao final do outono",
    estacoes: { verao: "nao", outono: "extremos", inverno: "nao", primavera: "melhor" },
    cuidados: ["Barrar o vento", "Trocar a terra"]
  }
};
