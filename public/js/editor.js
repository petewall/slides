(function () {
  "use strict";

  let slideData = null;
  let selectedSlide = 0;

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

    document.addEventListener("keydown", handleKeydown);
    renderSidebar();
    renderMainSlide();
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
    updateSidebarSelection();
    renderMainSlide();
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

      const viewport = document.createElement("div");
      viewport.className = "thumbnail-viewport";
      viewport.appendChild(renderSlide(slide, i));
      thumb.appendChild(viewport);

      sidebar.appendChild(thumb);

      // Scale the viewport to fit the thumbnail
      const scale = thumb.clientWidth / 1024;
      viewport.style.transform = `scale(${scale})`;
    });
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
    const slide = slideData.slides[selectedSlide];
    container.appendChild(renderSlide(slide, selectedSlide));
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

  init();
})();
