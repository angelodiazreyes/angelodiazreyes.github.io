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
import matplotlib.pyplot as plt

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
print(f"IC aproximado del 95%:   [$ {lower:,.0f}, $ {upper:,.0f}]")

plt.figure(figsize=(8, 4.5))
plt.hist(sample, bins=12, color="#68a7ff", edgecolor="white", alpha=0.85)
plt.axvline(mu, color="#171b20", linewidth=2, label="Media poblacional")
plt.axvline(mean_hat, color="#e85d3f", linewidth=2, label="Media muestral")
plt.axvspan(lower, upper, color="#c7ff50", alpha=0.28, label="IC 95%")
plt.title("Una muestra aleatoria de ingresos")
plt.xlabel("Ingreso")
plt.ylabel("Frecuencia")
plt.legend()
plt.tight_layout()`
  },
  {
    id: "distribucion-muestral",
    course: "econometria-aplicada-1",
    title: "Distribución muestral de la media",
    filename: "distribucion_muestral.py",
    code: `# Clase 1: repetir el muestreo permite estudiar un estimador
import numpy as np
import matplotlib.pyplot as plt

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

print("\\nAl aumentar n, la distribución de la media se concentra alrededor de μ.")

fig, axes = plt.subplots(1, 3, figsize=(11, 3.5), sharey=True)
for axis, n in zip(axes, [10, 50, 200]):
    samples = rng.choice(population, size=(B, n), replace=True)
    sample_means = samples.mean(axis=1)
    axis.hist(sample_means, bins=28, color="#68a7ff", edgecolor="white")
    axis.axvline(mu, color="#e85d3f", linewidth=2)
    axis.set_title(f"n = {n}")
    axis.set_xlabel("Media muestral")
axes[0].set_ylabel("Frecuencia")
fig.suptitle("Distribución muestral: mayor n, menor dispersión")
plt.tight_layout()`
  },
  {
    id: "ley-grandes-numeros",
    course: "econometria-aplicada-1",
    title: "Ley de los Grandes Números",
    filename: "ley_grandes_numeros.py",
    code: `# Clase 1: consistencia de la media muestral
import numpy as np
import matplotlib.pyplot as plt

rng = np.random.default_rng(123)
population = rng.lognormal(mean=13, sigma=0.6, size=100_000)
mu = population.mean()
B = 1_500
epsilon = 50_000
n_values = [5, 10, 30, 50, 100, 300, 1_000]
probabilities = []

print(f"Distancia considerada grande: $ {epsilon:,.0f}")
print(" n   P(|media muestral - μ| > distancia)")
print("---- ------------------------------------")

for n in n_values:
    samples = rng.choice(population, size=(B, n), replace=True)
    sample_means = samples.mean(axis=1)
    probability = np.mean(np.abs(sample_means - mu) > epsilon)
    probabilities.append(probability)
    print(f"{n:4d} {probability:>19.3%}")

print("\\nLa probabilidad disminuye con n: la media muestral converge a μ.")

plt.figure(figsize=(8, 4.5))
plt.plot(n_values, probabilities, marker="o", linewidth=2.5, color="#2563eb")
plt.xscale("log")
plt.ylim(bottom=0)
plt.title("Ley de los Grandes Números")
plt.xlabel("Tamaño de muestra n (escala logarítmica)")
plt.ylabel("Probabilidad de alejarse de μ")
plt.grid(alpha=0.25)
plt.tight_layout()`
  },
  {
    id: "teorema-central-limite",
    course: "econometria-aplicada-1",
    title: "Teorema Central del Límite",
    filename: "teorema_central_limite.py",
    code: `# Clase 1: normalidad aproximada de la media estandarizada
import numpy as np
import matplotlib.pyplot as plt

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
print("\\nAunque los ingresos son asimétricos, la media estandarizada es casi normal.")

x = np.linspace(-4, 4, 400)
normal_density = np.exp(-(x ** 2) / 2) / np.sqrt(2 * np.pi)
plt.figure(figsize=(8, 4.5))
plt.hist(z, bins=35, density=True, color="#68a7ff", edgecolor="white", alpha=0.8, label="Simulación")
plt.plot(x, normal_density, color="#e85d3f", linewidth=2.5, label="Normal estándar")
plt.axvspan(-1.96, 1.96, color="#c7ff50", alpha=0.2, label="95% teórico")
plt.title("Teorema Central del Límite")
plt.xlabel("Media muestral estandarizada (z)")
plt.ylabel("Densidad")
plt.legend()
plt.tight_layout()`
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
