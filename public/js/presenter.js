(function () {
  "use strict";

  let slideData = null;
  let currentSlide = 0;

  async function init() {
    const [slidesRes, stylesRes] = await Promise.all([
      fetch("/api/slides"),
      fetch("/api/styles"),
    ]);

    slideData = await slidesRes.json();
    const customStyles = await stylesRes.json();

    document.title = slideData.meta.title || "Presenter";

    customStyles.forEach((css) => {
      const style = document.createElement("style");
      style.textContent = css;
      document.head.appendChild(style);
    });

    document.addEventListener("keydown", handleKeydown);
    render();
  }

  function handleKeydown(e) {
    if (e.key === "ArrowRight" || e.key === " ") {
      e.preventDefault();
      nextSlide();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      prevSlide();
    }
  }

  function nextSlide() {
    if (currentSlide < slideData.slides.length - 1) {
      currentSlide++;
      render();
    }
  }

  function prevSlide() {
    if (currentSlide > 0) {
      currentSlide--;
      render();
    }
  }

  function render() {
    const container = document.getElementById("slide-container");
    const slide = slideData.slides[currentSlide];

    container.innerHTML = "";
    container.className = "slide";
    container.setAttribute("data-slide-index", currentSlide);

    const frameEl = renderFrame(slide.frame);
    const contentEl = renderContent(slide.content);

    container.appendChild(frameEl);
    container.appendChild(contentEl);

    renderProgress();
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

  function renderProgress() {
    let bar = document.getElementById("progress-bar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "progress-bar";
      document.body.appendChild(bar);
    }
    const pct = ((currentSlide + 1) / slideData.slides.length) * 100;
    bar.style.width = pct + "%";
  }

  init();
})();
