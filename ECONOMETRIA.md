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

### Otros ejemplos

Dentro de `ECON_PYTHON_EXAMPLES`, copia un ejemplo y cambia sus campos. El campo `course` determina en qué curso aparecerá:

```js
{
  id: "mi-ejercicio",
  course: "inferencia-causal",
  title: "Mi ejercicio",
  filename: "mi_ejercicio.py",
  code: `print("Hola")`
}
```

Los visitantes necesitan conexión a internet para que Pyodide cargue Python. El código se ejecuta en el navegador del visitante, no en un servidor.
