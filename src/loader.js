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

    return { frame, content };
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

  return item;
}

module.exports = { loadContent };
