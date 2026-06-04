# zestjq-css

A CSS selector engine with a jq JSON-attribute operator, ideal for querying MediaWiki/Parsoid HTML.

Combines two packages:

- **[zest](https://github.com/cscott/zest)** (fork of [`chjj/zest`](https://www.npmjs.com/package/zest)) — fast, lightweight CSS selector engine with extensible attribute operators
- **[zestjq](https://www.npmjs.com/package/zestjq)** — TypeScript jq JSON-filter language implementation

The `/` attribute operator extends CSS selectors to test JSON-valued HTML attributes using jq syntax:

```css
/* Match <span> elements whose data-mw encodes a Citation_needed transclusion */
[typeof="mw:Transclusion"][data-mw/.parts[].template?.target.href == "./Template:Citation_needed"]

/* Match elements where any transclusion part has a "date" param */
[data-mw/.parts[].template?.params.date.wt == "March 2026"]
```

There's a PHP implementation of this same idea in the
[wikimedia/zest-css](https://packagist.org/packages/wikimedia/zest-css)
package; see the [JSON-valued attribute operators](https://github.com/wikimedia/mediawiki-libs-Zest#extension-json-valued-attribute-operators)
section in its README.

## Install

```bash
npm install zestjq-css
```

## Usage (ESM)

```javascript
import { zest, JQ, JQError, JQUtils } from 'zestjq-css';

// zest already has the `/` operator registered
const matches = zest('[data-mw/.parts[].template?.target.href == "./Template:Citation_needed"]', document);
```

## Usage (browser IIFE)

```html
<!-- via CDN (no install needed) -->
<script src="https://unpkg.com/zestjq-css/dist/zest-jq.iife.js"></script>
<!-- or after npm install, from node_modules -->
<script src="node_modules/zestjq-css/dist/zest-jq.iife.js"></script>
<script>
  const { zest, JQ, JQError, JQUtils } = ZestJQ;
  const matches = zest('[data-mw/.parts[].template?.target.href == "./Template:Citation_needed"]', document);
</script>
```

## Live demo

A hosted version of the demo is available at **<https://cscott.github.io/zestjq-css/>**.

The `index.html` file is a live demo that fetches a Wikipedia page via the MediaWiki API and lets
you run Zest CSS selectors (including `/` jq operators) against the real Parsoid HTML. To run it
locally:

```bash
npm install
npm run build   # produces dist/
npm start       # python3 -m http.server 8080
```

Then open <http://localhost:8080>.

## Running tests

```bash
npm test   # 19 tests via node:test + domino
```

## API

`zestjq-css` re-exports the full APIs of both underlying packages:

| Export | Source | Description |
|--------|--------|-------------|
| `zest` | `zest` | CSS selector function with `/` operator pre-registered |
| `JQ` | `zestjq` | Compile and run jq expressions |
| `JQError` | `zestjq` | Error class for jq parse/runtime errors |
| `JQUtils` | `zestjq` | Utilities: `jsonDecode`, `toBoolean`, etc. |

## License

MIT. Copyright (c) 2026 C. Scott Ananian. Portions copyright (c) 2011 Christopher Jeffrey.
