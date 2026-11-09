# Cómo actualizar la pestaña Clases

La página pública se encuentra en `/clases/`. Su estructura está en `/_pages/econometria.html`, pero el contenido que cambiarás habitualmente está en:

`/assets/js/econometria-content.js`

## Añadir un curso

Dentro de `ECON_COURSES`, copia un bloque y cambia sus datos:

```js
{
  id: "microeconometria",
  code: "ECO · 03",
  title: "Microeconometría",
  description: "Modelos para variables discretas y limitadas."
}
```

El valor de `id` conecta el curso con sus slides y códigos.

## La forma recomendada: subir PDFs

Puedes preparar todas las ecuaciones y gráficos en LaTeX/Beamer. Para publicar una clase solamente debes subir el PDF a la carpeta correspondiente:

- Econometría Aplicada I: `/files/clases/econometria-aplicada-1/`
- Inferencia Causal: `/files/clases/inferencia-causal/`

No tienes que modificar el código de la página. GitHub detectará el archivo y lo añadirá automáticamente al curso correcto.

Nombra los archivos con un número al comienzo para controlar su orden y título:

```text
01-introduccion.pdf
02-regresion-lineal.pdf
03-variables-instrumentales.pdf
```

Usa solamente letras sin tilde, números y guiones en el nombre del archivo. Evita espacios, tildes, `ñ` y símbolos porque pueden producir enlaces incompatibles en GitHub Pages. El título visible sí se mostrará separado y con mayúsculas.

Por ejemplo, `03-variables-instrumentales.pdf` aparecerá como la clase **03 · Variables Instrumentales**.

### Subir un PDF desde GitHub

1. Abre la carpeta del curso en GitHub.
2. Presiona **Add file → Upload files**.
3. Arrastra el PDF.
4. Presiona **Commit changes**.
5. Espera uno o dos minutos mientras GitHub actualiza la página.

## Añadir slides creadas dentro de la página

Dentro de `ECON_SLIDES`, copia uno de los bloques existentes. Cambia `id`, `course`, `number`, `title`, `description`, `tag` y el contenido de `pages`. El campo `course` debe coincidir con el `id` del curso.

Cada página puede usar:

```js
{
  eyebrow: "Tema",
  title: "Título de la slide",
  body: "Explicación principal.",
  points: ["Primer punto", "Segundo punto"],
  formula: "uᵢⱼ = xⱼβ + εᵢⱼ"
}
```

## Registrar manualmente un PDF

Normalmente no necesitas hacer esto. Úsalo solamente si quieres personalizar la descripción, color o duración de una presentación.

1. Guarda el PDF en la carpeta del curso.
2. Añade este bloque dentro de `ECON_SLIDES`:

```js
{
  id: "demanda-discreta",
  course: "econometria-aplicada-1",
  number: "04",
  title: "Demanda discreta",
  description: "Modelo logit y aplicaciones.",
  tag: "Demanda",
  duration: "30 min",
  color: "blue",
  type: "pdf",
  url: "/files/clases/econometria-aplicada-1/demanda-discreta.pdf"
}
```

## Añadir Google Slides

En Google Slides selecciona **Archivo → Compartir → Publicar en la web → Insertar**. Copia el valor de `src` y úsalo como `url`, cambiando `type` a `embed`.

## Añadir un ejercicio de Python

### Clase 4 de Inferencia Causal: multinomial, ordenado y bivariado

Los **12 ejercicios de Clase 04** se editan en `assets/js/inferencia-clase4.js`.
Los títulos siguen `01 Clase 4 · ...` y cada editor recibe un programa completo,
con parámetros al comienzo, gráficos y conclusión. `parameters` contiene las
asignaciones que aparecen bajo `PARÁMETROS QUE PUEDES CAMBIAR`; `code` contiene
los cálculos. Las constantes `IC4_BASE`, `IC4_CHOICE`, `IC4_FISH`, `IC4_HEALTH`,
`IC4_ORDER` e `IC4_BIV` incorporan las funciones que necesita cada programa.

| Ejercicio | Tema | Slides |
| --- | --- | --- |
| 01 | Datos de pesca y transformación de ancho a largo | 5–6 |
| 02 | Multinomial con ingreso y probabilidades | 12–18 |
| 03 | Cambio de base e invariancia de probabilidades | 13–16 |
| 04 | RRR, AME, MEM y cambios exactos | 14–19 |
| 05 | Verosimilitud, LR, pseudo-R² y evaluación fuera de muestra | 4, 15–18 |
| 06 | Logit condicional con precios y tasas de pesca | 7–11 |
| 07 | Atributos de alternativas, constantes e ingreso por alternativa | 20–24 |
| 08 | Efectos propios y cruzados; escenario de aumento de precio | 11, 22–24 |
| 09 | Variable latente, umbrales y categorías ordenadas | 25–28 |
| 10 | Logit ordenado de salud, AME/MEM y comparación multinomial | 29–32 |
| 11 | Probit bivariado simulado: rho y probabilidades conjuntas | 33–37 |
| 12 | Salud y visitas al médico: estimación bivariada, LR e IC de rho | 36–39 |

Los ejercicios 01–08 tienen `dataset: "mus15"`; 10 y 12 usan `dataset: "mus18"`.
El ejecutor coloca `assets/data/mus15data.csv` o `assets/data/mus18data_year2.csv`
en el directorio virtual de Python antes de ejecutar. Los dos restantes son
simulaciones sin base externa. Ver `assets/data/README.md` para procedencia,
unidades y filtros. No se incorpora Tobit ni `mus16data` en esta clase.

La estimación usa NumPy/SciPy y comprobaciones de convergencia, sin instalar
Stata ni requerir otros ejemplos abiertos. En probit bivariado la CDF se calcula
con integración determinista de Gauss–Legendre (40 nodos por defecto); 80 nodos
reproducen los mismos resultados. Se compara el modelo conjunto con la restricción
rho=0 usando LR, y se calcula un IC de rho mediante la transformación tanh.

Referencias numéricas reproducidas de las slides/do-file:
- Log L multinomial con ingreso: aproximadamente −1477.151; LR(3): 41.144.
- Log L condicional sin constantes: −1311.9796.
- Log L con atributos e ingreso: −1215.1376.
- Log L ordenado: −4769.8525; pendientes en unidades originales:
  edad −0.0292944, log-ingreso 0.2836537, enfermedades −0.0549905.
- Log L bivariado: −6958.0751; rho 0.0282183; LR(1) 1.5295, p 0.2162.

Precisiones didácticas incorporadas al código (sin alterar el PDF):
- `asclogit` combina regresores de personas y alternativas con coeficientes fijos;
  no es el mixed logit de coeficientes aleatorios. Base playa en los tres modelos.
- Las probabilidades suman uno; sus cambios y derivadas suman cero. Un RRR de
  0.867 reduce la razón relativa en 13.3%, no en 13.3 puntos porcentuales.
- AME promedia derivadas individuales; MEM evalúa las características medias,
  como `mfx` por defecto. Para cambios grandes se recalculan las probabilidades.
- Pseudo-R² no es fracción de varianza ni tasa de aciertos. El ejercicio 05 usa
  una partición de entrenamiento/prueba; no evalúa sobre la misma muestra ajustada.
- El logit ordenado no agrega intercepto separado de los umbrales. El grupo de
  salud más bajo une pobre y regular, como en el do-file.
- Para las cuatro combinaciones binarias se usa
  `Phi2(q1*eta1, q2*eta2; q1*q2*rho)`: también cambia el signo de la correlación.
  La correlación de respuestas no es rho; no rechazar rho=0 no prueba independencia.

Referencias: [asclogit](https://www.stata.com/manuals15/rasclogit.pdf),
[biprobit](https://www.stata.com/manuals/rbiprobit.pdf),
[logit ordenado](https://www.statsmodels.org/stable/examples/notebooks/generated/ordinal_regression.html).

### Clase 6 de Econometría Aplicada I: restricciones y pruebas conjuntas

El PDF de 80 páginas está en `files/clases/econometria-aplicada-1/06.pdf`.
Los **9 ejercicios de Clase 06** se editan en `assets/js/aplicada-clase6.js`.
Cada uno tiene un título `01 Clase 6 · ...`, parámetros al inicio, gráficos y una
conclusión intuitiva; cada programa funciona por separado y se puede copiar a un `.py`.

1. Diferencia de coeficientes: covarianza y reparametrización (slides 26–29).
2. Béisbol con `mlb1`: pruebas individuales, conjunta y global; F=t² cuando q=1
   para la prueba bilateral (32–48).
3. Mejora de ajuste por azar y distribución F bajo H0 (38–44 y 73–76).
4. Cobb–Douglas: rendimientos constantes, RSS y cambio de dependiente (49–51).
5. Restricciones editables `R beta = r`, MCO restringido y equivalencia Wald/RSS (52).
6. Información adicional del rating y de los fundamentos, datos sintéticos (57–63).
7. Solow básico/ampliado: restricciones débiles, fuertes y participaciones (64–72).
8. LM con `crime1`: residuos restringidos y regresión auxiliar (77–80).
9. F frente a LM en muestras finitas y grandes; errores normales/asimétricos (73–80).

No se repiten los ejercicios básicos de t, intervalos, potencia, R² ajustado,
colinealidad, FWL ni heteroscedasticidad de clases anteriores. La comparación de dos
efectos usa t para una **nueva hipótesis lineal**, no vuelve a enseñar la prueba básica.
Se mantienen todas las simulaciones previas. No se modificó el PDF proporcionado.
Los cálculos se hacen con datos y precisión completa, sin copiar errores aritméticos
o redondeos de las slides. El modelo de rating y los modelos de producción/Solow
están expresamente identificados como simulados, no como réplicas de las tablas.

Los dos CSV y sus fuentes están documentados en `assets/data/README.md`.
El registro `ECON_A6_DATA` y los atributos del script en `_pages/econometria.html`
permiten cargarlos automáticamente en el navegador, también con un subdirectorio
de GitHub Pages. Para ejecutar un programa copiado fuera de la web, guardar el
CSV correspondiente en su directorio de trabajo e instalar numpy, pandas, scipy y
matplotlib. Los F/RSS y LM de esta clase son clásicos: requieren homocedasticidad;
la F finita exacta requiere normalidad del error, y la referencia chi² de LM es
asintótica. No rechazar una restricción no confirma que sea verdadera.

### Clase 5 de Econometría Aplicada I: regresión lineal múltiple

El PDF de 68 páginas entregado el 1 de noviembre de 2026 se conserva sin cambios
en `files/clases/econometria-aplicada-1/05.pdf`. Los **16 ejercicios de Clase 05**
se editan en `assets/js/aplicada-clase5.js`, con títulos `01 Clase 5 · ...`.
Cada código visible es independiente, editable, y contiene gráficos y una conclusión.
`A5_IMPORTS` y `A5_MCO` se incorporan automáticamente en los ejemplos que los necesitan.

| Ejercicio | Tema | Slides |
| --- | --- | --- |
| 01 | Tabla de 15 familias: matrices, estimación y predicciones de calefacción | 6–12 |
| 02 | Plano de regresión y efectos parciales, manteniendo controles fijos | 2–5, 13–15 |
| 03 | Regresión salarial con wage1, ajustes, residuos y SE clásicos | 35–36, 44–50 |
| 04 | Cambios simultáneos en log-salario; elasticidad-renta del gasto | 16, 19 |
| 05 | Unidades, transformación de coeficientes/SE e invariancia de t y R² | 17–18, 67 |
| 06 | Experiencia al cuadrado, derivada, cambio finito y punto de giro | 4, 20–21 |
| 07 | Cuatro observaciones: ortogonalidad, medias y descomposición de R² | 22–34, 37–41 |
| 08 | R² al añadir variables; extensión: R² ajustado y error fuera de muestra | 37–41, 58 |
| 09 | Frisch–Waugh–Lovell, residualización y grados de libertad del SE | 42–50 |
| 10 | Identidad exacta entre pendientes simple y múltiple en wage1 | 51–53 |
| 11 | Sesgo por variable omitida: cuatro combinaciones de signos | 54–60 |
| 12 | Omitir x²: patrón no lineal en residuos y mala especificación | 5, 34, 56 |
| 13 | Colinealidad perfecta, rango y no unicidad de coeficientes | 54–55 |
| 14 | Variable irrelevante, multicolinealidad, VIF y precisión | 58, 61–64 |
| 15 | Insesgadez condicional, n−k−1, varianza residual y SE de coeficientes | 57, 65–66 |
| 16 | Gauss–Markov: MCO frente a otro estimador lineal insesgado | 68 |

Los ejercicios 03, 09 y 10 llevan `dataset: "wage1"`: el ejecutor usa la copia
local existente `assets/data/wage1.csv`. Para correrlos fuera de la web, coloca
esa base junto al archivo Python. Los demás no requieren descargar bases.
El 01 y 07 usan las tablas de las slides; el 04 es una calculadora con sus
coeficientes, no una estimación nueva; los restantes generan datos ficticios.

Parámetros sugeridos: `rho`/`rhos` (relación entre regresores), `gamma` (efecto
de la variable omitida), `curvatura`, `n` (observaciones), `B` (repeticiones),
`k` (regresores, sin contar intercepto), `sigma` (SD del ruido) y `controles`.
El botón Restaurar deshace cambios temporales del navegador.

Precisiones didácticas (el PDF no se altera):

- Slide 21: con el modelo escrito allí, la derivada respecto de experiencia
  es `beta2 + 2*beta3*exper`, no `beta1 + 2*beta2*exper`. El ejemplo 06 usa
  los coeficientes correctos e incluye el cambio finito del término cuadrático.
- Slides 42–50: residualizar solo x conserva la pendiente, pero no los SE ni
  el R² de la regresión completa. El 09 muestra ambos métodos y recupera el SE
  clásico con los residuos completos y los grados de libertad correspondientes.
- Slide 59: la fórmula con la pendiente auxiliar muestral describe el sesgo
  condicional en X. El 11 usa una población normal explícita con
  `E(z|x)=rho*x` y varianzas unitarias, de modo que el sesgo poblacional es
  `gamma*rho`; el 10 separa la identidad muestral de una interpretación causal.
- Añadir controles no garantiza identificación causal. Los SE clásicos y
  Gauss–Markov requieren sus supuestos, incluida homocedasticidad; BLUE se
  refiere a estimadores lineales en y, condicionales a X, e insesgados.

Referencias técnicas de contraste: [MCO](https://www.statsmodels.org/stable/examples/notebooks/generated/ols.html)
y [VIF](https://www.statsmodels.org/stable/generated/statsmodels.stats.outliers_influence.variance_inflation_factor.html).

### Clase 3 de Econometría Aplicada I: estructura de datos

Los tres ejercicios de **Clase 03** están en `assets/js/aplicada-clase3.js`:

- `01 Clase 3 · Corte transversal`: una fila por persona en un mismo año;
  muestra la base y la distribución de la media entre muestras iid.
- `02 Clase 3 · Panel`: una fila por persona-año; sigue los mismos IDs,
  muestra trayectorias y permite simular observaciones faltantes al azar.
- `03 Clase 3 · Series de tiempo`: una serie mensual con tendencia,
  estacionalidad y componente AR(1); compara la incertidumbre de su promedio
  con la fórmula iid, manteniendo fija la varianza marginal del componente.

Son datos ficticios, no bases oficiales. Cada código incluye imports, una tabla,
gráficos, parámetros editables y una conclusión. Usan NumPy, pandas y Matplotlib.
El PDF `files/clases/econometria-aplicada-1/03.pdf` permanece sin cambios.
Las referencias corresponden a sus 17 páginas, especialmente 2–7 y 8–17.

### Clase 4 de Econometría Aplicada I: regresión lineal simple

Edita `assets/js/aplicada-clase4.js` para sus 14 simulaciones. Cada título identifica
el número y clase, por ejemplo `01 Clase 4 · Media condicional: personas y promedios`.
Los códigos visibles son independientes, editables, e incluyen gráficos y conclusiones.
La Clase 4 está en `files/clases/econometria-aplicada-1/04.pdf`.
Se cubren CEF, BLP, cálculo MCO (tabla de la slide 51), minimización, residuos,
R²/SER, precisión, outliers, unidades, logs, dependencia entre observaciones,
pruebas t, intervalos, significancia económica y propiedades asintóticas.
Los ejemplos de inferencia t usan SciPy y explicitan normalidad y homocedasticidad.
El PDF se reemplazó por la versión entregada el 1 de noviembre de 2026 (127 páginas).
Los códigos 01–22 se conservan sin modificaciones; únicamente se actualizaron las
referencias de página en sus descripciones. El ejemplo 06 sigue mostrando que R² no aumenta
necesariamente al agregar observaciones.

Los **ocho nuevos ejercicios 15–22** se editan por separado en
`assets/js/aplicada-clase4-inferencia.js`. Cubren el cálculo de t, grados de libertad,
regiones de rechazo, p-valores bilaterales/unilaterales, equivalencia con el IC,
potencia, error tipo I y elección de la cola después de observar el resultado.
Todos aparecen en la misma pestaña **Clase 04**, después de los 14 anteriores.
El 22 reproduce la prueba de las slides 124–125 y advierte que, con n=22 y SE clásico,
beta_hat=62 y SE=8 implican R²≈0.7502, no 0.42, en regresión simple con intercepto.
Usa beta_hat/SE/n para la prueba sin inventar una base que reproduzca resúmenes
incompatibles. Se publica el PDF entregado sin alterar su contenido.

Los **cinco ejercicios 23–27** se editan en `assets/js/aplicada-clase4-varianza.js`
y completan los temas de varianza que faltaban. La pestaña **Clase 04** tiene 27 ejercicios:

| Ejercicio | Tema y parámetros principales | Slides actuales |
| --- | --- | --- |
| 23 | Homocedasticidad vs. heteroscedasticidad: `intensidad=0` iguala ambos perfiles; `sigma` controla la dispersión promedio. | 94, 102–104 |
| 24 | Heteroscedasticidad vs. sesgo: `delta` cambia la media del error; `n` es la muestra y `B` las repeticiones. | 66–68, 88–94, 105 |
| 25 | SE clásico, HC0 y HC1; cobertura y falsos rechazos. `hetero=False` recupera varianza constante. | 105–109 |
| 26 | SCR/n frente a SCR/(n−2): `n` controla cuánto importa perder dos grados de libertad. | 96–101 |
| 27 | Varianza del intercepto y pendiente; centrar x y extrapolación. Cambia `x_min`, `x_max`, `n` y `sigma`. | 27, 95, 98–101 |

Los cinco usan datos simulados y diseño x fijo, incluyen gráficos y conclusiones,
y pueden ejecutarse independientemente. El 25 estima intercepto aunque el DGP
tenga intercepto cero, como `lm(Y ~ X)` en las slides. No se selecciona una semilla
para forzar un rechazo. Se usa referencia normal asintótica para comparar los tres
SE; HC0/HC1 no dan una t exacta y pueden tener mala cobertura con n pequeño.
Robustecer el SE no cambia MCO, no corrige endogeneidad ni dependencia entre unidades.
HC0 usa la fórmula de la slide 106 y HC1 multiplica su varianza por n/(n−2).
Referencias de las fórmulas:
[HC0](https://www.statsmodels.org/stable/generated/statsmodels.regression.linear_model.OLSResults.HC0_se.html)
y [HC1](https://www.statsmodels.org/stable/generated/statsmodels.regression.linear_model.OLSResults.HC1_se.html).

Observaciones de revisión (PDF preservado, sin corregirlo):

- Slide 98: la varianza del intercepto requiere el factor 1/n:
  `sigma² * sum(x²)/(n*Sxx)`, equivalente a `sigma²*(1/n+xbar²/Sxx)`.
  La slide 95 sí incluye ese factor; el ejercicio 27 usa la fórmula correcta.
- Slide 107: con x fija y varianzas distintas, los errores son independientes,
  pero no idénticamente distribuidos. La heteroscedasticidad sí es compatible
  con muestreo iid de pares (X,Y) cuando X es aleatoria; son afirmaciones distintas.
- El resultado de rechazo de la slide 109 es de una muestra concreta, no una
  garantía general. El ejercicio 25 muestra la primera muestra y frecuencias
  de repetición, sin forzar que clásico y robusto den decisiones distintas.

### Clase 2 de Inferencia Causal: variables instrumentales

Edita `assets/js/inferencia-clase2.js`. Sus 15 simulaciones se añaden a la Clase 1,
con nombres como `01 Clase 2 · Problema variable omitida` en lista y editor.
Cada código visible es independiente, editable y contiene gráficos y una conclusión intuitiva.
Los datos son hipotéticos. Los ejercicios 01–06 separan problema y solución IV para
omisión, medición y simultaneidad; 07–15 cubren matrices, Wald, debilidad, invalidez,
controles, errores estándar, DWH, Sargan y consistencia.
El PDF está en `files/clases/inferencia-causal/02-variables-instrumentales.pdf`.

Referencia de implementación de 2SLS, covarianzas y contrastes:
https://bashtage.github.io/linearmodels/iv/mathematical-formula.html
Se usan residuos estructurales `y-X@beta` para inferencia IV. Sargan es homocedástico;
DWH se implementa mediante inclusión del residuo y contraste asintótico de un grado.
La diapositiva 23 del PDF tiene `Corr(z,x)` en el primer denominador: el código usa
la fórmula correcta `Cov(z,y)/Cov(z,x)`. El PDF original se conserva sin alteraciones.

### Clase 2 de Econometría Aplicada I: variables aleatorias continuas

Edita `assets/js/aplicada-clase2.js` para las doce simulaciones de esta clase.
Los títulos y encabezados del editor identifican número de ejercicio y clase:
`01 Clase 2 · Densidad no es probabilidad`. La numeración se reinicia en cada clase.
Los ejercicios contienen parámetros editables, gráficos y conclusiones intuitivas.
El PDF se encuentra en `files/clases/econometria-aplicada-1/02-variables-aleatorias-continuas.pdf`.

### Clase 1 de Econometría Aplicada I: variables aleatorias discretas

Edita `assets/js/aplicada-clase1.js` para los ocho ejemplos de esta clase.
Cada bloque tiene título, instrucciones (`description`) y código Python (`code: String.raw`).
Los parámetros al inicio de cada ejercicio son editables, y los resultados incluyen gráficos
y una conclusión. Los datos de empleo, ventas e ingresos son hipotéticos o simulados.
La extensión binomial está identificada como tal.

PDF actual: `files/clases/econometria-aplicada-1/01-variables-aleatorias-discretas.pdf`.
Los antiguos ejercicios de muestreo siguen en el historial y en el archivo base,
pero esta clase carga sus propios ejemplos en lugar de ellos.

### Laboratorios de la Clase 1 de Inferencia Causal

Los diez laboratorios de revisión MCO se editan en `assets/js/inferencia-clase1.js`.
Cada bloque contiene `title`, `description` (instrucciones y diapositivas) y `code`.
El código usa `String.raw` para conservar las barras de Python, por ejemplo `\n`.
Los ejemplos con datos reales llevan `dataset: "wage1"`: el ejecutor coloca la copia
de `assets/data/wage1.csv` en Python antes de ejecutar. Los demás son independientes.

El PDF está en `files/clases/inferencia-causal/01-revision-mco.pdf`.
Para una segunda clase, sube `02-nombre-del-tema.pdf` a la misma carpeta.

En la página, cambia los valores que siguen a `# CAMBIA`, o edita directamente X e y,
y pulsa Ejecutar. Las matrices se imprimen en RESULTADO y las figuras aparecen debajo.
Las ediciones en el navegador son temporales; para publicarlas, cambia el archivo en GitHub.
Restaurar recupera el ejemplo publicado. Todos los datos salariales son descriptivos;
las simulaciones especifican sus propios efectos verdaderos y supuestos.

### Clase 3 de Inferencia Causal y pestañas por clase

- PDF: `files/clases/inferencia-causal/03-respuesta-binaria.pdf`.
- Los 12 ejercicios están en `assets/js/inferencia-clase3.js`: variable latente,
  modelo lineal, verosimilitud, logit/probit, AME/MEM, cambios discretos,
  perfiles, odds ratios, pseudo-R²/AIC/BIC, calibración/HL, clasificación y causalidad.
- Los datos son **simulados**, no reproducen la base de las capturas de Stata.
  Cada bloque incluye sus importaciones y funciones; usa NumPy, Matplotlib y SciPy.
- Python Lab ahora separa los ejemplos por **Clase 01, Clase 02, etc.**, en ambos cursos.
  No se modificaron los códigos de clases anteriores. Una clase con PDF pero sin
  código muestra un aviso, sin mezclar ejercicios de otra clase.
- Para un nuevo ejercicio, especifica `classNumber: 3` (o el número correspondiente).
  Para los antiguos se reconoce `Clase N` en el título; sin número se usa Clase 1.
  Las pestañas se crean automáticamente a partir de los ejemplos y los PDFs.
- Conserva nombres como `01 Clase 3 · Nombre del ejercicio`. Los cambios hechos
  en el editor web son temporales; para guardarlos modifica este archivo en GitHub.

### Añadir ejemplos

Dentro de `ECON_PYTHON_EXAMPLES`, copia un ejemplo y cambia sus campos. El campo `course` determina en qué curso aparecerá:

```js
{
  id: "mi-ejercicio",
  course: "inferencia-causal",
  classNumber: 3,
  title: "Mi ejercicio",
  filename: "mi_ejercicio.py",
  code: `print("Hola")`
}
```

Los visitantes necesitan conexión a internet para que Pyodide cargue Python. El código se ejecuta en el navegador del visitante, no en un servidor.
