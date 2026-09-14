# Cómo actualizar la pestaña Econometría

La página se encuentra en `/_pages/econometria.html`, pero el contenido que cambiarás habitualmente está en:

`/assets/js/econometria-content.js`

## Añadir slides creadas en la página

Dentro de `ECON_SLIDES`, copia uno de los bloques existentes. Cambia `id`, `number`, `title`, `description`, `tag` y el contenido de `pages`.

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

Dentro de `ECON_PYTHON_EXAMPLES`, copia un ejemplo y cambia sus cuatro campos:

```js
{
  id: "mi-ejercicio",
  title: "Mi ejercicio",
  filename: "mi_ejercicio.py",
  code: `print("Hola")`
}
```

Los visitantes necesitan conexión a internet para que Pyodide cargue Python. El código se ejecuta en el navegador del visitante, no en un servidor.
