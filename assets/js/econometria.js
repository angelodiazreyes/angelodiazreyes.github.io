(function () {
  const app = document.querySelector("#econometria-app");
  if (!app) return;

  const grid = document.querySelector("#econ-grid");
  const modal = document.querySelector("#econ-modal");
  const modalBody = document.querySelector("#econ-modal-body");
  const code = document.querySelector("#econ-code");
  const result = document.querySelector("#econ-result");
  const run = document.querySelector("#econ-run");
  const status = document.querySelector("#econ-status");
  let pyodide;
  let currentCourse = ECON_COURSES[0].id;
  let currentExample;

  const pdfColors = ["lime", "blue", "orange"];
  (window.ECON_PDF_FILES || []).forEach((file, index) => {
    const stem = file.filename.replace(/\.pdf$/i, "");
    const numberMatch = stem.match(/^(\d+)/);
    const cleanTitle = stem.replace(/^\d+[-_ ]*/, "").replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
    ECON_SLIDES.push({
      id: `pdf-${file.course}-${stem}`,
      course: file.course,
      number: numberMatch ? numberMatch[1].padStart(2, "0") : String(index + 1).padStart(2, "0"),
      title: cleanTitle || "Presentación",
      description: "Presentación de la clase en formato PDF.",
      tag: "PDF",
      duration: "Abrir",
      color: pdfColors[index % pdfColors.length],
      type: "pdf",
      url: file.url
    });
  });

  document.querySelector("#econ-courses").innerHTML = ECON_COURSES.map((course, index) => `
    <button class="econ-course ${index === 0 ? "is-active" : ""}" data-course="${course.id}">
      <span>${course.code}</span><strong>${course.title}</strong><small>${course.description}</small><i>→</i>
    </button>`).join("");

  function selectCourse(courseId) {
    currentCourse = courseId;
    const course = ECON_COURSES.find((item) => item.id === courseId);
    document.querySelectorAll(".econ-course").forEach((button) => button.classList.toggle("is-active", button.dataset.course === courseId));
    document.querySelector("#econ-slides-title").textContent = course.title;
    document.querySelector("#econ-python-title").textContent = `${course.title} · Python`;
    document.querySelector("#econ-search").value = "";
    drawCards(ECON_SLIDES.filter((slide) => slide.course === courseId));
    drawExamples();
  }

  document.querySelectorAll(".econ-course").forEach((button) => button.addEventListener("click", () => selectCourse(button.dataset.course)));

  document.querySelectorAll(".econ-tab").forEach((tab) => tab.addEventListener("click", function () {
    document.querySelectorAll(".econ-tab").forEach((item) => item.classList.toggle("is-active", item === tab));
    document.querySelectorAll(".econ-view").forEach((view) => view.classList.toggle("is-active", view.id === `econ-${tab.dataset.econView}`));
  }));

  function drawCards(items) {
    grid.innerHTML = items.map((slide) => `
      <button class="econ-card" data-id="${slide.id}">
        <span class="econ-card-top"><b>${slide.number}</b><i class="${slide.color}"></i></span>
        <span class="econ-card-art ${slide.color}"><em>${slide.number === "01" ? "μ" : slide.number === "02" ? "θ" : "ĝ"}</em></span>
        <strong>${slide.title}</strong>
        <p>${slide.description}</p>
        <span class="econ-card-meta"><span>${slide.tag}</span><span>${slide.duration} ↗</span></span>
      </button>`).join("");
    document.querySelector("#econ-empty").hidden = items.length !== 0;
    grid.querySelectorAll(".econ-card").forEach((card) => card.addEventListener("click", () => openDeck(card.dataset.id)));
  }

  function openDeck(id) {
    const slide = ECON_SLIDES.find((item) => item.id === id);
    document.querySelector("#econ-modal-meta").textContent = `${slide.tag} · ${slide.duration}`;
    document.querySelector("#econ-modal-title").textContent = slide.title;
    if (slide.type === "html") drawPage(slide, 0);
    else modalBody.innerHTML = `<iframe src="${slide.url}" title="${slide.title}" allowfullscreen></iframe>`;
    modal.showModal();
  }

  function drawPage(slide, index) {
    const page = slide.pages[index];
    modalBody.innerHTML = `<div class="econ-deck">
      <article><small>${page.eyebrow || slide.tag}</small><h3>${page.title}</h3>${page.body ? `<p>${page.body}</p>` : ""}${page.formula ? `<p class="econ-formula">${page.formula}</p>` : ""}${page.points ? `<ul>${page.points.map((point) => `<li>${point}</li>`).join("")}</ul>` : ""}</article>
      <footer><span>${index + 1} / ${slide.pages.length}</span><div><button id="econ-prev" ${index === 0 ? "disabled" : ""}>← Anterior</button><button id="econ-next" ${index === slide.pages.length - 1 ? "disabled" : ""}>Siguiente →</button></div></footer>
    </div>`;
    document.querySelector("#econ-prev").onclick = () => drawPage(slide, index - 1);
    document.querySelector("#econ-next").onclick = () => drawPage(slide, index + 1);
  }

  document.querySelector("#econ-search").addEventListener("input", function () {
    const query = this.value.toLowerCase().trim();
    drawCards(ECON_SLIDES.filter((slide) => slide.course === currentCourse && `${slide.title} ${slide.description} ${slide.tag}`.toLowerCase().includes(query)));
  });
  document.querySelector("#econ-close").onclick = () => modal.close();
  modal.addEventListener("click", (event) => { if (event.target === modal) modal.close(); });

  function drawExamples() {
    const examples = ECON_PYTHON_EXAMPLES.filter((example) => example.course === currentCourse);
    document.querySelector("#econ-examples").innerHTML = examples.map((example, index) => `<button class="econ-example ${index === 0 ? "is-active" : ""}" data-id="${example.id}">${example.title}</button>`).join("");
    document.querySelectorAll(".econ-example").forEach((button) => button.addEventListener("click", () => selectExample(ECON_PYTHON_EXAMPLES.find((example) => example.id === button.dataset.id))));
    if (examples.length) selectExample(examples[0]);
  }
  function selectExample(example) {
    currentExample = example;
    code.value = example.code;
    document.querySelector("#econ-filename").textContent = example.filename;
    document.querySelectorAll(".econ-example").forEach((button) => button.classList.toggle("is-active", button.dataset.id === example.id));
  }
  async function startPython() {
    try {
      pyodide = await loadPyodide();
      status.classList.add("is-ready");
      status.innerHTML = "<i></i> Python listo";
      result.textContent = "Listo. Presiona Ejecutar para ver el resultado.";
      run.disabled = false;
    } catch (error) {
      status.classList.add("is-error");
      status.innerHTML = "<i></i> No se pudo cargar";
      result.textContent = "No fue posible cargar Python. Revisa tu conexión y recarga la página.";
    }
  }

  async function runPython() {
    if (!pyodide) return;
    run.disabled = true;
    run.textContent = "Ejecutando…";
    let text = "";
    pyodide.setStdout({ batched: (line) => { text += `${line}\n`; } });
    pyodide.setStderr({ batched: (line) => { text += `${line}\n`; } });
    try {
      await pyodide.loadPackagesFromImports(code.value);
      const value = await pyodide.runPythonAsync(code.value);
      result.textContent = text || (value === undefined ? "✓ Código ejecutado sin salida." : String(value));
    } catch (error) {
      result.textContent = error.message;
    } finally {
      run.disabled = false;
      run.textContent = "▶ Ejecutar";
    }
  }

  run.addEventListener("click", runPython);
  code.addEventListener("keydown", (event) => { if (event.key === "Enter" && event.shiftKey) { event.preventDefault(); runPython(); } });
  document.querySelector("#econ-reset").onclick = () => selectExample(currentExample);
  selectCourse(currentCourse);
  startPython();
}());
