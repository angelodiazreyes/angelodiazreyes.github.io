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

// Las presentaciones se añaden automáticamente desde files/clases/.
const ECON_SLIDES = [];

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
