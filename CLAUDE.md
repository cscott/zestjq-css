# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common commands

```bash
npm install           # install dependencies
npm run build         # bundle src/index.js → dist/ (required before serving)
npm start             # python3 -m http.server 8080 → http://localhost:8080
npm test              # run 19 tests via node:test + domino
```

## Architecture

The repo serves two purposes: a live demo (`index.html`) and an npm library (`zestjq-css`). The demo is hosted on GitHub Pages at <https://cscott.github.io/zestjq-css/>.

### Key files

| File | Role |
|------|------|
| `src/index.js` | Library entry point: imports zest + zestjq, registers `/` operator, exports API |
| `dist/zest-jq.iife.js` | Built IIFE bundle — `window.ZestJQ = { zest, JQ, JQError, JQUtils }` |
| `dist/zest-jq.esm.js` | Built ESM bundle — for npm / `<script type="module">` |
| `index.html` | Demo SPA: markup, CSS, and JS in one file; loads `dist/zest-jq.iife.js` |
| `rollup.config.js` | Rollup config producing both `dist/` outputs from `src/index.js` |
| `test/ZestJQTest.js` | Test suite for the `/` operator (ported from ZestJQTest.php) |
| `test/setup.js` | Preloaded via `--import`; sets `globalThis.document` via domino so zest initialises in Node.js |

### Build

`src/index.js` imports `zest` (CommonJS, handled by `@rollup/plugin-commonjs`) and `zestjq` (ESM), registers the `/` operator, and re-exports `{ zest, JQ, JQError, JQUtils }`. Both `dist/` outputs are committed to git so GitHub Pages serves them without a CI build step. Re-run `npm run build` after updating either dependency.

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

The `cscott/zest` fork (vs. the npm `zest` package) is required
because it amends the zest attribute operator set to include `/`, which is
used in our integration.

### Wikipedia fetch (live document)

On startup, `index.html` fetches a Wikipedia page via the MediaWiki action API:

```
https://en.wikipedia.org/w/api.php?action=parse&format=json&origin=*&page={title}&parser=parsoid&formatversion=2
```

Response shape: `{ parse: { title, text } }` where `text` is Parsoid HTML. This is injected directly into `#sample-dom` via `innerHTML` — MediaWiki output is pre-sanitized and contains no `<script>` elements. The rendered HTML is always wrapped in `<div class="mw-parser-output">`.

### data-mw → ZestJQ transfer

After a Zest selector runs, `runCSS()` walks the matched elements for the first one with a `data-mw` attribute. If found, its JSON value is pretty-printed into the jq input textarea and `runJQ()` is called automatically, linking the two panels.

### Globals (browser, via IIFE bundle)

`window.ZestJQ = { zest, JQ, JQError, JQUtils }` — `zest` already has the `/` operator registered.
