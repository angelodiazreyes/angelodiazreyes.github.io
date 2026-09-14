/*
 * EDITA ESTE ARCHIVO PARA AÑADIR SLIDES Y EJEMPLOS DE PYTHON.
 * Las instrucciones completas están en ECONOMETRIA.md.
 */

const ECON_SLIDES = [
  {
    id: "introduccion",
    number: "01",
    title: "¿Qué es un modelo estructural?",
    description: "Preferencias, tecnología, equilibrio e identificación en una sola historia económica.",
    tag: "Fundamentos",
    duration: "18 min",
    color: "lime",
    type: "html",
    pages: [
      {
        eyebrow: "Fundamentos",
        title: "Del comportamiento observado al mecanismo económico",
        body: "Un modelo estructural conecta decisiones individuales con parámetros económicos interpretables.",
        points: ["Primitivas: preferencias y tecnología", "Reglas de decisión", "Equilibrio y datos observados"]
      },
      {
        eyebrow: "La idea central",
        title: "Parámetros para estudiar políticas",
        body: "La meta no es solamente ajustar los datos: queremos evaluar escenarios contrafactuales.",
        formula: "datos → parámetros → decisiones → contrafactuales"
      }
    ]
  },
  {
    id: "identificacion",
    number: "02",
    title: "Identificación",
    description: "Qué variación de los datos permite recuperar cada parámetro del modelo.",
    tag: "Métodos",
    duration: "24 min",
    color: "blue",
    type: "html",
    pages: [
      {
        eyebrow: "Identificación",
        title: "¿Qué aprendemos antes de estimar?",
        body: "Un parámetro está identificado cuando distintas magnitudes producen distribuciones observables distintas.",
        formula: "θ ≠ θ′  ⇒  P(datos | θ) ≠ P(datos | θ′)"
      },
      {
        eyebrow: "Diagnóstico",
        title: "Tres preguntas útiles",
        points: ["¿Qué momento de los datos mueve el parámetro?", "¿Qué supuesto excluye explicaciones alternativas?", "¿La variación existe en la muestra?"]
      }
    ]
  },
  {
    id: "momentos",
    number: "03",
    title: "Estimación por momentos",
    description: "Una introducción operativa a GMM y a la distancia mínima simulada.",
    tag: "Estimación",
    duration: "31 min",
    color: "orange",
    type: "html",
    pages: [
      {
        eyebrow: "GMM",
        title: "Hacer coincidir modelo y datos",
        body: "Elegimos parámetros para acercar los momentos predichos por el modelo a los momentos empíricos.",
        formula: "θ̂ = arg min  g(θ)' W g(θ)"
      }
    ]
  }
];

const ECON_PYTHON_EXAMPLES = [
  {
    id: "valor-presente",
    title: "Primer cálculo",
    filename: "valor_presente.py",
    code: `# Un cálculo sencillo y reproducible
beta = 0.95
utility_today = 10
utility_tomorrow = 12

present_value = utility_today + beta * utility_tomorrow
print(f"Valor presente: {present_value:.2f}")`
  },
  {
    id: "grid-search",
    title: "Búsqueda en grilla",
    filename: "grid_search.py",
    code: `# Estimación por distancia mínima
observed_moment = 2.4
candidates = [x / 10 for x in range(1, 51)]

def model_moment(theta):
    return 0.5 + 0.8 * theta

losses = [(theta, (model_moment(theta) - observed_moment) ** 2)
          for theta in candidates]
theta_hat, loss = min(losses, key=lambda item: item[1])

print(f"theta estimado = {theta_hat:.2f}")
print(f"pérdida = {loss:.6f}")`
  },
  {
    id: "bellman",
    title: "Decisión dinámica",
    filename: "bellman.py",
    code: `# Iteración de valor: reemplazar o mantener una máquina
beta = 0.92
cost_replace = 4.0
states = range(6)
value = [0.0] * len(states)

for iteration in range(200):
    updated = []
    for age in states:
        keep = -0.35 * age + beta * value[min(age + 1, 5)]
        replace = -cost_replace + beta * value[0]
        updated.append(max(keep, replace))
    if max(abs(a - b) for a, b in zip(updated, value)) < 1e-9:
        break
    value = updated

print("Iteraciones:", iteration + 1)
print("Función de valor:", [round(x, 3) for x in value])`
  }
];
