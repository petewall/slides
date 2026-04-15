const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const META_DEFAULTS = {
  title: "",
  subtitle: "",
  date: "",
  logo: "",
};

const FRAME_FIELDS = ["title", "subtitle", "date", "logo"];

function loadContent(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const raw = fs.readFileSync(filePath, "utf-8");

  let data;
  if (ext === ".yaml" || ext === ".yml") {
    data = yaml.load(raw);
  } else if (ext === ".json") {
    data = JSON.parse(raw);
  } else {
    throw new Error(`Unsupported file format: ${ext}`);
  }

  if (!data || !Array.isArray(data.slides)) {
    throw new Error("Content must contain a slides array");
  }

  const meta = { ...META_DEFAULTS, ...(data.meta || {}) };

  const slides = data.slides.map((slide) => {
    const frame = {};
    for (const field of FRAME_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(slide, field)) {
        frame[field] = slide[field];
      } else {
        frame[field] = meta[field];
      }
    }

    const content = (slide.content || []).map(normalizeContentItem);
    const notes = slide.notes || "";

    return { frame, content, notes };
  });

  return { meta, slides };
}

function normalizeContentItem(item) {
  if (item.text !== undefined) {
    const result = { type: "text", value: item.text };
    if (item.size) {
      result.size = item.size;
    }
    return result;
  }

  if (item.image !== undefined) {
    return { type: "image", url: item.image };
  }

  if (item.iframe !== undefined) {
    return { type: "iframe", url: item.iframe.url };
  }

  if (item.html !== undefined) {
    return { type: "html", value: item.html };
  }

  if (item.columns !== undefined) {
    return {
      type: "columns",
      items: item.columns.map(normalizeContentItem),
    };
  }

  if (item.rows !== undefined) {
    return {
      type: "rows",
      items: item.rows.map(normalizeContentItem),
    };
  }

  return item;
}

function saveContent(filePath, data) {
  const ext = path.extname(filePath).toLowerCase();

  const rawData = {
    meta: data.meta,
    slides: data.slides.map((slide) => denormalizeSlide(slide, data.meta)),
  };

  let output;
  if (ext === ".yaml" || ext === ".yml") {
    output = yaml.dump(rawData, { lineWidth: -1, noRefs: true });
  } else if (ext === ".json") {
    output = JSON.stringify(rawData, null, 2);
  } else {
    throw new Error(`Unsupported file format: ${ext}`);
  }

  fs.writeFileSync(filePath, output, "utf-8");
}

function denormalizeSlide(slide, meta) {
  const raw = {};

  for (const field of FRAME_FIELDS) {
    if (slide.frame[field] !== meta[field]) {
      raw[field] = slide.frame[field];
    }
  }

  raw.content = slide.content.map(denormalizeContentItem);
  if (slide.notes) {
    raw.notes = slide.notes;
  }
  return raw;
}

function denormalizeContentItem(item) {
  switch (item.type) {
    case "text": {
      const raw = { text: item.value };
      if (item.size) {
        raw.size = item.size;
      }
      return raw;
    }
    case "image":
      return { image: item.url };
    case "iframe":
      return { iframe: { url: item.url } };
    case "html":
      return { html: item.value };
    case "columns":
      return { columns: item.items.map(denormalizeContentItem) };
    case "rows":
      return { rows: item.items.map(denormalizeContentItem) };
    default:
      return item;
  }
}

module.exports = { loadContent, saveContent };
