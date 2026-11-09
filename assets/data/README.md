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

# Econometría Aplicada I, Clase 6

Copias docentes descargadas el 8 de noviembre de 2026 del paquete `wooldridge`
publicado por su mantenedor en R-universe. Se seleccionaron únicamente las columnas
utilizadas; no se modificaron valores, imputaron faltantes ni eliminaron filas.

- `mlb1.csv`: 353 jugadores, columnas `lsalary`, `years`, `gamesyr`, `bavg`,
  `hrunsyr`, `rbisyr`. Salarios de 1993 y estadísticas de carrera hasta 1992.
  [Documentación y origen](https://justinmshea.github.io/wooldridge/reference/mlb1.html).
  [CSV fuente](https://justinmshea.r-universe.dev/wooldridge/data/mlb1/csv).
- `crime1.csv`: 2.725 personas, columnas `narr86`, `pcnv`, `ptime86`, `qemp86`,
  `avgsen`, `tottime`. Datos de Grogger (1991), *Certainty vs. Severity of Punishment*.
  `narr86` cuenta arrestos, `avgsen` es duración media de condena en meses y
  `tottime` tiempo en prisión desde los 18 años en meses.
  [Documentación y origen](https://justinmshea.github.io/wooldridge/reference/crime1.html).
  [CSV fuente](https://justinmshea.r-universe.dev/wooldridge/data/crime1/csv).

La web carga cada CSV automáticamente. Para ejecutar el código copiado a un `.py`, colocar
su CSV en el directorio de trabajo. Los contrastes clásicos reproducen las slides;
no verifican por sí mismos homocedasticidad ni identifican efectos causales.
