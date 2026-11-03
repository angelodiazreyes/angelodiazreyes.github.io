# wage1

Datos docentes de Wooldridge: 526 observaciones de la Current Population Survey de 1976.
`wage`: salario por hora en dólares de 1976; `educ`: años de educación;
`exper`: experiencia potencial; `tenure`: antigüedad con el empleador.

Documentación: https://justinmshea.github.io/wooldridge/reference/wage1.html
Copia CSV descargada el 21-09-2026 de:
https://vincentarelbundock.github.io/Rdatasets/csv/wooldridge/wage1.csv

La copia local permite ejecutar los ejemplos sin depender de otro servidor para los datos.
Son observaciones históricas: las asociaciones estimadas no identifican por sí solas efectos causales.

# Inferencia Causal, Clase 4

Versiones CSV preparadas el 3 de noviembre de 2026 a partir de los archivos
`mus15data.dta` y `mus18data.dta` proporcionados por el docente, de los materiales
de Cameron y Trivedi, *Microeconometrics Using Stata*.
[Documentación y bases originales del autor](https://cameron.econ.ucdavis.edu/musbook/mus.html).

- `mus15data.csv`: 1.182 observaciones, 14 columnas. Se conservan `mode`, `income`
  y los indicadores `d`, precios `p` y tasas de captura `q` para `beach`, `pier`,
  `private` y `charter`. El orden explícito es playa, muelle, privado y arrendado.
  `income` ya está expresado en **miles de dólares mensuales**: no dividirlo otra
  vez por 1.000. Los precios están en dólares.
- `mus18data_year2.csv`: 5.574 observaciones, solo `year == 2`, como en el do-file.
  Se conservan `year`, `hlthp`, `hlthf`, `hlthg`, `age`, `linc`, `ndisease`, `dmdu`.
  No se publican identificadores ni las demás columnas del archivo original.
  `hlthp` = salud pobre, `hlthf` = regular, `hlthg` = buena. La categoría excelente
  se obtiene como `1 - hlthp - hlthf - hlthg`. `linc` es log-ingreso familiar anual,
  `ndisease` cuenta enfermedades crónicas y `dmdu` indica alguna visita médica.

No se modifican valores ni se imputan datos; la exportación respeta la precisión
numérica de Stata. Las filas seleccionadas no tienen faltantes en estas variables.
Son datos docentes históricos, no una muestra actual de Chile. Los ejercicios
se ejecutan sin ponderadores, replicando el do-file proporcionado; no constituyen
una evaluación causal ni recomendaciones médicas.

Para ejecutar los ejemplos fuera de la web, guardar el CSV correspondiente en el
directorio de trabajo del programa Python. La página lo carga automáticamente.
