# Marseille Development Plan

## Phase 1: Foundation
- [x] Project scaffolding (npm, ESLint, Vitest, directory structure)
- [x] Content loader with tests (YAML/JSON parsing, meta defaults, frame inheritance, content normalization)
- [x] CLI argument parsing with tests (--content, --style, --port)
- [x] Fastify server with tests (API endpoints, static file serving, custom CSS injection)
- [x] Frontend: HTML shell + slide renderer (fetch, render, arrow key navigation)
- [x] Default dark theme CSS (CSS custom properties, per-slide targeting)
- [x] Sample content.yaml

## Phase 2: Packaging & CI
- [x] Dockerfile (multi-stage build, node:22-alpine, .dockerignore)
- [x] GitHub CI workflow — lint + test on PRs and pushes to main
- [x] GitHub publish workflow — build and push to ghcr.io (tagged latest + package.json version)

## Phase 3: Future Ideas (not yet planned)
- Speaker notes / practice mode
- Slide transitions
- Slide types (title slide, section divider, etc.)
- Hot reload on content/style changes
- Syntax-highlighted code blocks
- Presenter view (current slide + next slide + notes + timer)
