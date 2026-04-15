# Slides

A node-based presentation server. Write your slides in YAML, serve them as a full-screen web presentation, and customize the look with CSS.

## Quick start

```bash
npm install
node bin/presenter.js --content examples/content.yaml
```

Open [http://localhost:4000](http://localhost:4000) in your browser. Use **arrow keys** or **spacebar** to navigate.

### CLI options

| Flag | Description | Default |
|------|-------------|---------|
| `--content <file>` | Path to content file (YAML or JSON) | `content.yaml` |
| `--style <file>` | Path to custom CSS file (repeatable) | none |
| `--port <port>` | Port to listen on | `4000` |

You can pass multiple `--style` flags to layer stylesheets:

```bash
node bin/presenter.js --content examples/content.yaml --style theme.css --style overrides.css
```

## Running with Docker

The container image is published to `ghcr.io/petewall/slides`. Mount your content (and optional stylesheets) into the container:

```bash
docker run -p 4000:4000 \
  -v ./content.yaml:/content/content.yaml \
  -v ./style.css:/content/style.css \
  ghcr.io/petewall/slides \
  --content /content/content.yaml --style /content/style.css
```

Or in a `docker-compose.yaml`:

```yaml
services:
  slides:
    image: ghcr.io/petewall/slides:latest
    ports:
      - "4000:4000"
    volumes:
      - ./content.yaml:/content/content.yaml
      - ./style.css:/content/style.css
    command: ["--content", "/content/content.yaml", "--style", "/content/style.css"]
```

## Content format

Presentations are defined in a `content.yaml` (or `.json`) file with two sections: `meta` and `slides`.

### Meta

Global metadata that applies to all slides. Each field is optional.

```yaml
meta:
  title: My Presentation
  subtitle: A quick overview
  date: "April 9th, 2026"
  logo: https://example.com/logo.png
```

These values appear in the **frame** (top bar) of every slide unless overridden.

### Slides

Each slide can override any frame field and define a `content` array. Setting a field to an empty string (`""`) hides it for that slide.

```yaml
slides:
  # Title slide — hide the frame bar
  - title: ""
    subtitle: ""
    content:
      - text: My Presentation
        size: larger
      - text: A quick overview

  # Normal slide — inherits title/subtitle from meta
  - content:
      - text: "Agenda:"
      - text: "1. Introduction"
      - text: "2. Demo"
```

### Speaker notes

Each slide can include a `notes` field for speaker notes. Notes are not rendered during presentation but are visible in the editor.

```yaml
slides:
  - content:
      - text: "Key takeaway"
    notes: Remember to mention the quarterly results here.
```

### Content types

The `content` array is a list of rows, distributed vertically on the slide. Each item is one of:

#### text

Simple text block. Optional `size` can be `smaller` or `larger`.

```yaml
- text: Hello World
  size: larger
```

#### image

Displays an image.

```yaml
- image: https://example.com/photo.png
```

#### iframe

Embeds a webpage.

```yaml
- iframe:
    url: https://example.com
```

#### columns

Creates horizontal columns. Each column item is itself a content item.

```yaml
- columns:
    - text: Left side
    - text: Middle
    - image: https://example.com/pic.png
```

#### html

Raw HTML for anything the other types don't cover.

```yaml
- html: |
    <div style="text-align: center;">
      <h2>Custom HTML</h2>
      <p>Anything goes here.</p>
    </div>
```

### Full example

```yaml
meta:
  title: Slides Demo
  subtitle: A presentation server
  date: "April 9th, 2026"

slides:
  - title: ""
    subtitle: ""
    content:
      - text: Slides
        size: larger
      - text: A node-based presentation server

  - content:
      - text: "Agenda:"
      - text: "1. What is Slides?"
      - text: "2. Content types"
      - text: "3. Customization"
    notes: Keep this brief, just a roadmap for the audience.

  - title: Content Types
    content:
      - text: Slides supports several content types
      - columns:
          - text: Text blocks
          - text: Images
          - text: Iframes

  - title: Raw HTML
    content:
      - html: |
          <div style="text-align: center; padding: 2rem;">
            <h2 style="color: #36d7b7;">Custom HTML</h2>
            <p>You can embed any HTML you need.</p>
          </div>

  - title: Thank You
    subtitle: ""
    content:
      - text: Questions?
        size: larger
```

## Customizing the style

The default theme is a dark minimal design. You can override it by passing a custom CSS file with `--style`.

### CSS custom properties

The easiest way to re-theme is to override the CSS custom properties:

```css
:root {
  --bg: #ffffff;
  --bg-surface: #f0f0f0;
  --text-primary: #1a1a1a;
  --text-secondary: #666666;
  --accent: #0066cc;
  --font-family: "Georgia", serif;
  --font-size-base: 1.5rem;
  --font-size-smaller: 1.2rem;
  --font-size-larger: 2.2rem;
  --font-size-title: 1.1rem;
  --font-size-subtitle: 0.9rem;
  --frame-height: 3rem;
  --progress-height: 4px;
}
```

### Per-slide styling

Each slide container gets a `data-slide-index` attribute (zero-based), so you can target individual slides:

```css
/* White background on the title slide */
.slide[data-slide-index="0"] {
  background: white;
  color: #1a1a1a;
}

/* Hide the frame on slide 3 */
.slide[data-slide-index="2"] .slide-frame {
  display: none;
}
```

### CSS class reference

| Selector | Element |
|----------|---------|
| `.slide` | Full-viewport slide container |
| `.slide-frame` | Top bar (title, subtitle, logo, date) |
| `.slide-title` | Title text in the frame |
| `.slide-subtitle` | Subtitle text in the frame |
| `.slide-logo` | Logo image in the frame |
| `.slide-date` | Date text in the frame |
| `.slide-content` | Content area below the frame |
| `.content-text` | Text content block |
| `.content-image` | Image content block |
| `.content-iframe` | Iframe content block |
| `.content-html` | Raw HTML content block |
| `.content-columns` | Columns container |
| `.content-column` | Individual column |
| `#progress-bar` | Bottom progress bar |

## Development

```bash
npm install
npm test          # run tests
npm run lint      # run linter
npm run lint:fix  # auto-fix lint issues
```

## License

Apache-2.0
