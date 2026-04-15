(function () {
  "use strict";

  let slideData = null;
  let selectedSlide = 0;
  let selectedElement = null;

  async function init() {
    const [slidesRes, stylesRes] = await Promise.all([
      fetch("/api/slides"),
      fetch("/api/styles"),
    ]);

    slideData = await slidesRes.json();
    const customStyles = await stylesRes.json();

    document.title = (slideData.meta.title || "Editor") + " — Editor";

    customStyles.forEach((css) => {
      const style = document.createElement("style");
      style.textContent = css;
      document.head.appendChild(style);
    });

    const params = new URLSearchParams(window.location.search);
    const slideParam = parseInt(params.get("slide"), 10);
    if (!isNaN(slideParam) && slideParam >= 0 && slideParam < slideData.slides.length) {
      selectedSlide = slideParam;
    }

    document.addEventListener("keydown", handleKeydown);
    renderSidebar();
    renderMainSlide();

    const activeThumb = document.querySelector(".thumbnail.active");
    if (activeThumb) {
      activeThumb.scrollIntoView({ block: "nearest" });
    }
  }

  function handleKeydown(e) {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      selectSlide(Math.min(selectedSlide + 1, slideData.slides.length - 1));
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      selectSlide(Math.max(selectedSlide - 1, 0));
    }
  }

  function selectSlide(index) {
    if (index === selectedSlide) {
      return;
    }
    selectedSlide = index;
    const url = new URL(window.location);
    url.searchParams.set("slide", index);
    window.history.replaceState(null, "", url);
    updateSidebarSelection();
    renderMainSlide();
  }

  // --- Add / Delete slides ---

  async function addSlide() {
    const newSlide = {
      frame: { ...slideData.meta },
      content: [{ type: "text", value: "New slide" }],
      notes: "",
    };
    slideData.slides.splice(selectedSlide + 1, 0, newSlide);
    selectedSlide = selectedSlide + 1;
    await saveSlideData();
  }

  async function deleteSlide(index) {
    if (slideData.slides.length <= 1) {
      return;
    }
    slideData.slides.splice(index, 1);
    if (selectedSlide >= slideData.slides.length) {
      selectedSlide = slideData.slides.length - 1;
    } else if (selectedSlide > index) {
      selectedSlide--;
    }
    await saveSlideData();
  }

  // --- Sidebar ---

  function renderSidebar() {
    const sidebar = document.getElementById("sidebar");
    sidebar.innerHTML = "";

    slideData.slides.forEach((slide, i) => {
      const thumb = document.createElement("div");
      thumb.className = "thumbnail" + (i === selectedSlide ? " active" : "");
      thumb.setAttribute("data-index", i);
      thumb.addEventListener("click", () => selectSlide(i));

      const label = document.createElement("div");
      label.className = "thumbnail-label";
      label.textContent = i + 1;
      thumb.appendChild(label);

      if (slideData.slides.length > 1) {
        const deleteBtn = document.createElement("button");
        deleteBtn.className = "thumbnail-delete";
        deleteBtn.textContent = "\u00d7";
        deleteBtn.title = "Delete slide";
        deleteBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          deleteSlide(i);
        });
        thumb.appendChild(deleteBtn);
      }

      const viewport = document.createElement("div");
      viewport.className = "thumbnail-viewport";
      viewport.appendChild(renderSlide(slide, i));
      thumb.appendChild(viewport);

      sidebar.appendChild(thumb);

      // Scale the viewport to fit the thumbnail
      const scale = thumb.clientWidth / 1024;
      viewport.style.transform = `scale(${scale})`;
    });

    const addBtn = document.createElement("button");
    addBtn.className = "sidebar-add-btn";
    addBtn.textContent = "+ Add slide";
    addBtn.addEventListener("click", () => addSlide());
    sidebar.appendChild(addBtn);
  }

  function updateSidebarSelection() {
    const thumbs = document.querySelectorAll(".thumbnail");
    thumbs.forEach((thumb) => {
      const idx = parseInt(thumb.getAttribute("data-index"), 10);
      thumb.classList.toggle("active", idx === selectedSlide);
    });

    // Scroll active thumbnail into view
    const active = document.querySelector(".thumbnail.active");
    if (active) {
      active.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }

  // --- Main slide view ---

  function renderMainSlide() {
    const container = document.getElementById("slide-container");
    container.innerHTML = "";
    selectedElement = null;
    clearPanel();

    const slide = slideData.slides[selectedSlide];
    container.appendChild(renderSlide(slide, selectedSlide));
    attachClickHandlers(container, slide);
    renderNotes(slide);
  }

  function renderNotes(slide) {
    const input = document.getElementById("notes-input");
    input.value = slide.notes || "";

    const saveBtn = document.getElementById("notes-save");
    const cancelBtn = document.getElementById("notes-cancel");

    const newSave = saveBtn.cloneNode(true);
    saveBtn.parentNode.replaceChild(newSave, saveBtn);
    const newCancel = cancelBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);

    const originalValue = slide.notes || "";
    newSave.addEventListener("click", async () => {
      slide.notes = input.value;
      await saveSlideData();
    });
    newCancel.addEventListener("click", () => {
      input.value = originalValue;
    });
  }

  function attachContentClickHandlers(parentEl, items) {
    const children = parentEl.children;
    items.forEach((item, i) => {
      const el = children[i];
      if (item.type === "columns" || item.type === "rows") {
        // Container itself is clickable
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          selectContentBlock(el, item);
        });
        // Children are also clickable (stopPropagation prevents bubbling to container)
        item.items.forEach((child, j) => {
          const childWrapper = el.children[j];
          const childEl = childWrapper.firstChild;
          if (childEl) {
            childEl.addEventListener("click", (e) => {
              e.stopPropagation();
              selectContentBlock(childEl, child);
            });
          }
        });
      } else {
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          selectContentBlock(el, item);
        });
      }
    });
  }

  function attachClickHandlers(container, slide) {
    // Content blocks
    const contentEl = container.querySelector(".slide-content");
    attachContentClickHandlers(contentEl, slide.content);

    // Frame title
    const titleEl = container.querySelector(".slide-title");
    if (titleEl) {
      titleEl.addEventListener("click", (e) => {
        e.stopPropagation();
        selectFrameField(titleEl, "title", slide);
      });
    }

    // Frame subtitle
    const subtitleEl = container.querySelector(".slide-subtitle");
    if (subtitleEl) {
      subtitleEl.addEventListener("click", (e) => {
        e.stopPropagation();
        selectFrameField(subtitleEl, "subtitle", slide);
      });
    }
  }

  function selectContentBlock(el, item) {
    clearSelection();
    selectedElement = el;
    el.classList.add("selected");
    showContentPanel(item);
  }

  function selectFrameField(el, field, slide) {
    clearSelection();
    selectedElement = el;
    el.classList.add("selected");
    showFramePanel(field, slide);
  }

  function clearSelection() {
    if (selectedElement) {
      selectedElement.classList.remove("selected");
      selectedElement = null;
    }
  }

  // --- Editor panel ---

  function clearPanel() {
    const placeholder = document.getElementById("panel-placeholder");
    const content = document.getElementById("panel-content");
    placeholder.style.display = "";
    content.classList.add("hidden");
    content.innerHTML = "";
  }

  function showPanel(panelEl) {
    const placeholder = document.getElementById("panel-placeholder");
    const content = document.getElementById("panel-content");
    placeholder.style.display = "none";
    content.classList.remove("hidden");
    content.innerHTML = "";
    content.appendChild(panelEl);
  }

  function createButtons(onSave, onCancel) {
    const bar = document.createElement("div");
    bar.className = "panel-buttons";

    const saveBtn = document.createElement("button");
    saveBtn.className = "panel-btn panel-btn-save";
    saveBtn.textContent = "Save";
    saveBtn.addEventListener("click", onSave);

    const cancelBtn = document.createElement("button");
    cancelBtn.className = "panel-btn panel-btn-cancel";
    cancelBtn.textContent = "Cancel";
    cancelBtn.addEventListener("click", onCancel);

    bar.appendChild(saveBtn);
    bar.appendChild(cancelBtn);
    return bar;
  }

  async function saveSlideData() {
    const res = await fetch("/api/slides", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(slideData),
    });
    if (!res.ok) {
      showStatus("Save failed: " + res.status, true);
      return;
    }
    showStatus("Saved");
    renderSidebar();
    renderMainSlide();
  }

  function showStatus(message, isError) {
    let status = document.getElementById("panel-status");
    if (!status) {
      status = document.createElement("div");
      status.id = "panel-status";
      document.getElementById("editor-panel").appendChild(status);
    }
    status.textContent = message;
    status.className = isError ? "panel-status error" : "panel-status";
    clearTimeout(status._timer);
    status._timer = setTimeout(() => {
      status.remove();
    }, 2000);
  }

  function getContentValueAndKey(item) {
    switch (item.type) {
      case "text":
        return { label: "Text", key: "value", value: item.value };
      case "image":
        return { label: "Image", key: "url", value: item.url };
      case "iframe":
        return { label: "Iframe", key: "url", value: item.url };
      case "html":
        return { label: "HTML", key: "value", value: item.value };
      case "columns":
        return { label: "Columns", key: null, value: item.items.length + " columns" };
      case "rows":
        return { label: "Rows", key: null, value: item.items.length + " rows" };
      default:
        return { label: item.type, key: null, value: JSON.stringify(item) };
    }
  }

  function showContentPanel(item) {
    const { label, key, value } = getContentValueAndKey(item);
    const panel = document.createElement("div");

    const typeEl = document.createElement("div");
    typeEl.className = "panel-type";
    typeEl.textContent = label;
    panel.appendChild(typeEl);

    if (key) {
      const useTextarea = item.type === "html";
      const input = document.createElement(useTextarea ? "textarea" : "input");
      input.className = "panel-input";
      if (useTextarea) {
        input.rows = 4;
      } else {
        input.type = "text";
      }
      input.value = value;
      panel.appendChild(input);

      const originalValue = value;
      panel.appendChild(createButtons(
        async () => {
          item[key] = input.value;
          await saveSlideData();
        },
        () => {
          input.value = originalValue;
        }
      ));
    } else {
      const valueEl = document.createElement("div");
      valueEl.className = "panel-value";
      valueEl.textContent = value;
      panel.appendChild(valueEl);
    }

    showPanel(panel);
  }

  function showFramePanel(field, slide) {
    const meta = slideData.meta;
    const frame = slide.frame;
    const metaValue = meta[field] || "";
    const hasOverride = frame[field] !== metaValue;

    const panel = document.createElement("div");

    const typeEl = document.createElement("div");
    typeEl.className = "panel-type";
    typeEl.textContent = "Frame: " + field;
    panel.appendChild(typeEl);

    const input = document.createElement("input");
    input.type = "text";
    input.className = "panel-input";
    input.value = frame[field] || "";
    panel.appendChild(input);

    const overridesEl = document.createElement("div");
    overridesEl.className = "panel-overrides";
    if (hasOverride) {
      overridesEl.innerHTML =
        '<span class="override-label">Override: </span>' +
        '<span class="override-value">This slide overrides the meta ' + field +
        ' (meta value: "' + metaValue.replace(/[<>&"]/g, "") + '")</span>';
    } else {
      overridesEl.innerHTML = '<span class="override-value">Inherited from meta</span>';
    }
    panel.appendChild(overridesEl);

    const originalValue = frame[field] || "";
    panel.appendChild(createButtons(
      async () => {
        frame[field] = input.value;
        await saveSlideData();
      },
      () => {
        input.value = originalValue;
      }
    ));

    showPanel(panel);
  }

  // --- Shared slide rendering ---

  function renderSlide(slide, index) {
    const el = document.createElement("div");
    el.className = "slide";
    el.setAttribute("data-slide-index", index);
    el.appendChild(renderFrame(slide.frame));
    el.appendChild(renderContent(slide.content));
    return el;
  }

  function renderFrame(frame) {
    const el = document.createElement("div");
    el.className = "slide-frame";

    if (frame.logo) {
      const logo = document.createElement("img");
      logo.className = "slide-logo";
      logo.src = frame.logo;
      logo.alt = "Logo";
      el.appendChild(logo);
    }

    if (frame.title) {
      const title = document.createElement("div");
      title.className = "slide-title";
      title.textContent = frame.title;
      el.appendChild(title);
    }

    if (frame.subtitle) {
      const subtitle = document.createElement("div");
      subtitle.className = "slide-subtitle";
      subtitle.textContent = frame.subtitle;
      el.appendChild(subtitle);
    }

    if (frame.date) {
      const date = document.createElement("div");
      date.className = "slide-date";
      date.textContent = frame.date;
      el.appendChild(date);
    }

    return el;
  }

  function renderContent(contentItems) {
    const el = document.createElement("div");
    el.className = "slide-content";
    contentItems.forEach((item) => {
      el.appendChild(renderContentItem(item));
    });
    return el;
  }

  function renderContentItem(item) {
    switch (item.type) {
      case "text":
        return renderText(item);
      case "image":
        return renderImage(item);
      case "iframe":
        return renderIframe(item);
      case "html":
        return renderHtml(item);
      case "columns":
        return renderColumns(item);
      case "rows":
        return renderRows(item);
      default: {
        const el = document.createElement("div");
        el.textContent = `Unknown content type: ${item.type}`;
        return el;
      }
    }
  }

  function renderText(item) {
    const el = document.createElement("div");
    el.className = "content-text";
    el.textContent = item.value;
    if (item.size) {
      el.setAttribute("data-size", item.size);
    }
    return el;
  }

  function renderImage(item) {
    const el = document.createElement("div");
    el.className = "content-image";
    const img = document.createElement("img");
    img.src = item.url;
    img.alt = item.alt || "";
    el.appendChild(img);
    return el;
  }

  function renderIframe(item) {
    const el = document.createElement("div");
    el.className = "content-iframe loading";
    const spinner = document.createElement("div");
    spinner.className = "iframe-spinner";
    el.appendChild(spinner);
    const iframe = document.createElement("iframe");
    iframe.src = item.url;
    iframe.setAttribute("frameborder", "0");
    iframe.setAttribute("allowfullscreen", "true");
    iframe.addEventListener("load", () => {
      el.classList.remove("loading");
    });
    el.appendChild(iframe);
    return el;
  }

  function renderHtml(item) {
    const el = document.createElement("div");
    el.className = "content-html";
    el.innerHTML = item.value;
    return el;
  }

  function renderColumns(item) {
    const el = document.createElement("div");
    el.className = "content-columns";
    item.items.forEach((child) => {
      const col = document.createElement("div");
      col.className = "content-column";
      col.appendChild(renderContentItem(child));
      el.appendChild(col);
    });
    return el;
  }

  function renderRows(item) {
    const el = document.createElement("div");
    el.className = "content-rows";
    item.items.forEach((child) => {
      const row = document.createElement("div");
      row.className = "content-row";
      row.appendChild(renderContentItem(child));
      el.appendChild(row);
    });
    return el;
  }

  init();
})();
