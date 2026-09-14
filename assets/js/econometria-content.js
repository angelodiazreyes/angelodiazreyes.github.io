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
    id: "muestra-estimacion",
    course: "econometria-aplicada-1",
    title: "Muestra, estimación y error estándar",
    filename: "muestra_estimacion.py",
    code: `# Clase 1: de una población a una estimación muestral
import numpy as np

rng = np.random.default_rng(123)

# Población ficticia de ingresos: asimétrica y no normal
population = rng.lognormal(mean=13, sigma=0.6, size=100_000)
mu = population.mean()

# Una muestra aleatoria de 50 personas
n = 50
sample = rng.choice(population, size=n, replace=False)
mean_hat = sample.mean()
sample_sd = sample.std(ddof=1)
standard_error = sample_sd / np.sqrt(n)

# Intervalo aproximado de confianza al 95%
lower = mean_hat - 1.96 * standard_error
upper = mean_hat + 1.96 * standard_error

print(f"Media poblacional:       $ {mu:,.0f}")
print(f"Media de la muestra:     $ {mean_hat:,.0f}")
print(f"Desviación estándar:     $ {sample_sd:,.0f}")
print(f"Error estándar:          $ {standard_error:,.0f}")
print(f"IC aproximado del 95%:   [$ {lower:,.0f}, $ {upper:,.0f}]")`
  },
  {
    id: "distribucion-muestral",
    course: "econometria-aplicada-1",
    title: "Distribución muestral de la media",
    filename: "distribucion_muestral.py",
    code: `# Clase 1: repetir el muestreo permite estudiar un estimador
import numpy as np

rng = np.random.default_rng(123)
population = rng.lognormal(mean=13, sigma=0.6, size=100_000)
mu = population.mean()
sigma = population.std(ddof=0)
B = 3_000

print(" n | sesgo simulado | EE simulado | sigma/sqrt(n)")
print("---|----------------|-------------|--------------")

for n in [10, 50, 200]:
    samples = rng.choice(population, size=(B, n), replace=True)
    sample_means = samples.mean(axis=1)

    bias = sample_means.mean() - mu
    simulated_se = sample_means.std(ddof=1)
    theoretical_se = sigma / np.sqrt(n)

    print(
        f"{n:3d} | {bias:14,.0f} | {simulated_se:11,.0f} |"
        f" {theoretical_se:12,.0f}"
    )

print("\\nAl aumentar n, la distribución de la media se concentra alrededor de μ.")`
  },
  {
    id: "ley-grandes-numeros",
    course: "econometria-aplicada-1",
    title: "Ley de los Grandes Números",
    filename: "ley_grandes_numeros.py",
    code: `# Clase 1: consistencia de la media muestral
import numpy as np

rng = np.random.default_rng(123)
population = rng.lognormal(mean=13, sigma=0.6, size=100_000)
mu = population.mean()
B = 1_500
epsilon = 50_000

print(f"Distancia considerada grande: $ {epsilon:,.0f}")
print(" n   P(|media muestral - μ| > distancia)")
print("---- ------------------------------------")

for n in [5, 10, 30, 50, 100, 300, 1_000]:
    samples = rng.choice(population, size=(B, n), replace=True)
    sample_means = samples.mean(axis=1)
    probability = np.mean(np.abs(sample_means - mu) > epsilon)
    print(f"{n:4d} {probability:>19.3%}")

print("\\nLa probabilidad disminuye con n: la media muestral converge a μ.")`
  },
  {
    id: "teorema-central-limite",
    course: "econometria-aplicada-1",
    title: "Teorema Central del Límite",
    filename: "teorema_central_limite.py",
    code: `# Clase 1: normalidad aproximada de la media estandarizada
import numpy as np

rng = np.random.default_rng(123)
population = rng.lognormal(mean=13, sigma=0.6, size=100_000)
mu = population.mean()
sigma = population.std(ddof=0)

n = 200
B = 5_000
samples = rng.choice(population, size=(B, n), replace=True)
sample_means = samples.mean(axis=1)

# Estadístico que el TCL aproxima con una N(0, 1)
z = (sample_means - mu) / (sigma / np.sqrt(n))
q025, q975 = np.quantile(z, [0.025, 0.975])
inside_95 = np.mean(np.abs(z) <= 1.96)

print(f"Media de z:                 {z.mean():.3f}   (teoría: 0)")
print(f"Desviación estándar de z:  {z.std(ddof=1):.3f}   (teoría: 1)")
print(f"Percentiles 2.5% y 97.5%:  [{q025:.3f}, {q975:.3f}]")
print(f"Proporción entre -1.96 y 1.96: {inside_95:.1%}")
print("\\nAunque los ingresos son asimétricos, la media estandarizada es casi normal.")`
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
