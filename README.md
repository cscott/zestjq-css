# zest + zestjq Demo

A single-page demo showcasing two npm packages as client-side JavaScript:

- **[zest](https://github.com/chjj/zest)** — fast, lightweight CSS selector engine
- **[zestjq](https://www.mediawiki.org/wiki/ZestJQ)** — native jq JSON-filter language implementation

## Running the demo

```bash
npm install
npm start
```

Then open <http://localhost:8080> in your browser.

## What's in the demo

**ZestJQ panel** — an interactive jq filter playground. Enter any jq expression against the pre-loaded bookstore JSON, press Run or Enter, and see the output. Quick-example buttons demonstrate common patterns like `select`, `map`, `sort_by`, and recursive descent.

**Zest panel** — a CSS selector playground against a rendered sample document. Enter a selector (e.g. `article.featured`, `.tag`, `a.nav-link.active`), click Find, and matching elements are highlighted in the DOM with their serialized HTML shown below.
