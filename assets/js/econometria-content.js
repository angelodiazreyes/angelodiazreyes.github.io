/*
 * EDITA ESTE ARCHIVO PARA AÑADIR SLIDES Y EJEMPLOS DE PYTHON.
 * Las instrucciones completas están en ECONOMETRIA.md.
 */

const ECON_COURSES = [
  {
    id: "econometria-aplicada-1",
    code: "ECO · 01",
    title: "Econometría Aplicada I",
    description: "Modelos, estimación e interpretación empírica."
  },
  {
    id: "inferencia-causal",
    code: "ECO · 02",
    title: "Inferencia Causal",
    description: "Diseños de investigación y evaluación de impacto."
  }
];

const ECON_SLIDES = [
  {
    id: "introduccion",
    course: "econometria-aplicada-1",
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
    course: "econometria-aplicada-1",
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
    course: "econometria-aplicada-1",
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
  },
  {
    id: "potenciales",
    course: "inferencia-causal",
    number: "01",
    title: "Resultados potenciales",
    description: "El problema fundamental de la inferencia causal y el efecto de tratamiento.",
    tag: "Fundamentos",
    duration: "22 min",
    color: "blue",
    type: "html",
    pages: [
      {
        eyebrow: "Inferencia causal",
        title: "Dos resultados posibles, uno observado",
        body: "Para cada unidad pensamos en un resultado con tratamiento y otro sin tratamiento.",
        formula: "τᵢ = Yᵢ(1) − Yᵢ(0)"
      },
      {
        eyebrow: "El desafío",
        title: "El contrafactual no se observa",
        points: ["Solo observamos uno de los dos resultados potenciales", "Necesitamos un grupo de comparación válido", "El diseño determina la credibilidad causal"]
      }
    ]
  },
  {
    id: "experimentos",
    course: "inferencia-causal",
    number: "02",
    title: "Experimentos aleatorios",
    description: "Asignación aleatoria, balance y estimación del efecto promedio.",
    tag: "Diseño",
    duration: "27 min",
    color: "orange",
    type: "html",
    pages: [
      {
        eyebrow: "Experimentos",
        title: "La aleatorización crea comparabilidad",
        body: "En promedio, el grupo de control representa el resultado contrafactual del grupo tratado.",
        formula: "ATE = E[Y | D=1] − E[Y | D=0]"
      }
    ]
  }
];

const ECON_PYTHON_EXAMPLES = [
  {
    id: "valor-presente",
    course: "econometria-aplicada-1",
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
    course: "econometria-aplicada-1",
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
    course: "econometria-aplicada-1",
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
  },
  {
    id: "diferencia-medias",
    course: "inferencia-causal",
    title: "Diferencia de medias",
    filename: "diferencia_medias.py",
    code: `# Efecto promedio en un experimento
treated = [12, 15, 11, 17, 14]
control = [9, 10, 12, 8, 11]

mean_treated = sum(treated) / len(treated)
mean_control = sum(control) / len(control)
ate = mean_treated - mean_control

print(f"Media tratados: {mean_treated:.2f}")
print(f"Media control: {mean_control:.2f}")
print(f"Efecto estimado: {ate:.2f}")`
  },
  {
    id: "balance",
    course: "inferencia-causal",
    title: "Chequeo de balance",
    filename: "balance.py",
    code: `# Diferencia estandarizada de una covariable
treated_age = [21, 24, 27, 23, 25]
control_age = [22, 26, 24, 25, 23]

mean_t = sum(treated_age) / len(treated_age)
mean_c = sum(control_age) / len(control_age)
difference = mean_t - mean_c

print(f"Edad media, tratados: {mean_t:.1f}")
print(f"Edad media, control: {mean_c:.1f}")
print(f"Diferencia: {difference:.1f}")`
  }
];
