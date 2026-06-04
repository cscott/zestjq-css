# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Dev server

```bash
npm install
npm start        # python3 -m http.server 8080 → http://localhost:8080
```

There are no build steps, bundlers, or tests. Everything runs directly in the browser from `node_modules/`.

## Architecture

The demo is a single static page (`index.html`) plus a small integration shim (`zestjq.js`), served as-is by Python's http.server. There is no framework, transpiler, or bundler.

### Key files

| File | Role |
|------|------|
| `index.html` | Entire SPA: markup, CSS, and JS in one file |
| `zestjq.js` | Wires `zest` and `zestjq` together (loaded after both libraries) |
| `node_modules/zest/lib/zest.js` | CSS selector engine (from `github:cscott/zest`) |
| `node_modules/zestjq/dist/browser/zestjq.iife.js` | jq implementation; exposes `window.ZestJQ` |

### Build

```bash
npm run build   # rollup -c → dist/zest-jq.esm.js + dist/zest-jq.iife.js
```

`src/index.js` is the entry point. It imports `zest` (CommonJS, via `@rollup/plugin-commonjs`) and `zestjq` (ESM), registers the `/` operator, and re-exports `{ zest, JQ, JQError, JQUtils }`. Rollup produces two outputs in `dist/`:

| File | Format | Use |
|------|--------|-----|
| `dist/zest-jq.iife.js` | IIFE | `<script src>` — exposes `window.ZestJQ` |
| `dist/zest-jq.esm.js` | ESM | `import` — for npm / `<script type="module">` |

Both files are committed to git so GitHub Pages can serve them without a CI build step. Re-run `npm run build` after updating either dependency.

### Script load in index.html

```html
<script src="dist/zest-jq.iife.js"></script>  <!-- window.ZestJQ = { zest, JQ, JQError, JQUtils } -->
<script> const { zest, JQ, JQError } = ZestJQ; /* page logic */ </script>
```

### The `/` attribute operator (key integration point)

`src/index.js` registers a custom operator on `zest.operators['/']`. This lets CSS selectors test JSON-valued HTML attributes using jq syntax:

```css
[data-mw/.parts[].template?.target.href == "./Template:Citation_needed"]
```

The operator parses the attribute value as JSON, runs the jq expression against it via `JQ.compile()`, and returns true if the first output value is truthy. Results are cached by jq expression in a module-level `Map`.

The `cscott/zest` fork (vs. the npm `zest` package) is required because it exposes `zest.operators` for extension.

### Wikipedia fetch (live document)

On startup, `index.html` fetches a Wikipedia page via the MediaWiki action API:

```
https://en.wikipedia.org/w/api.php?action=parse&format=json&origin=*&page={title}&parser=parsoid&formatversion=2
```

Response shape: `{ parse: { title, text } }` where `text` is Parsoid HTML. This is injected directly into `#sample-dom` via `innerHTML` — MediaWiki output is pre-sanitized and contains no `<script>` elements. The rendered HTML is always wrapped in `<div class="mw-parser-output">`.

### data-mw → ZestJQ transfer

After a Zest selector runs, `runCSS()` walks the matched elements for the first one with a `data-mw` attribute. If found, its JSON value is pretty-printed into the jq input textarea and `runJQ()` is called automatically, linking the two panels.

### Globals

- `window.ZestJQ` — `{ JQ, JQError, JQUtils, Cache }` after `zestjq.js` runs
- `window.zest(selector, context)` — returns array of matching DOM elements
