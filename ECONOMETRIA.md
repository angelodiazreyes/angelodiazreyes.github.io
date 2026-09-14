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

## Añadir slides creadas en la página

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

## Añadir una presentación PDF

1. Guarda el PDF en `/files/econometria/`.
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
  url: "/files/econometria/demanda-discreta.pdf"
}
```

## Añadir Google Slides

En Google Slides selecciona **Archivo → Compartir → Publicar en la web → Insertar**. Copia el valor de `src` y úsalo como `url`, cambiando `type` a `embed`.

## Añadir un ejercicio de Python

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
