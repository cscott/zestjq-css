/**
 * Tests for the zest `/` JSON-attribute operator backed by ZestJQ.
 * Ported from wikimedia/mediawiki-libs-Zest ZestJQTest.php.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import domino from 'domino';
import { zest } from '../src/index.js';

/**
 * HTML fixture with JSON-bearing attributes.
 *
 * Elements:
 *   cite-needed  typeof=mw:Transclusion, data-mw has one template part:
 *                  Citation_needed with a date param ("March 2026")
 *   refimprove   typeof=mw:Transclusion, data-mw has one template part:
 *                  Refimprove, no date param
 *   parserfunc   typeof=mw:Transclusion, data-mw has one parserfunction part
 *                  (no "template" key at all)
 *   mixed        typeof=mw:Transclusion, data-mw has two parts:
 *                  parts[0] is a bare string, parts[1] is Citation_needed
 *   no-attr      no data-mw attribute
 *   bad-json     data-mw present but not valid JSON
 *   numbers      separate data-vals attribute with numeric/bool/null values
 */
const HTML = `<html><body>
<span id="cite-needed" typeof="mw:Transclusion"
  data-mw='{"parts":[{"template":{"target":{"wt":"Citation needed","href":"./Template:Citation_needed"},"params":{"date":{"wt":"March 2026"}},"i":0}}]}'
></span>
<span id="refimprove" typeof="mw:Transclusion"
  data-mw='{"parts":[{"template":{"target":{"wt":"Refimprove","href":"./Template:Refimprove"},"params":{},"i":0}}]}'
></span>
<span id="parserfunc" typeof="mw:Transclusion"
  data-mw='{"parts":[{"parserfunction":{"target":{"wt":"#if:"},"params":{},"i":0}}]}'
></span>
<span id="mixed" typeof="mw:Transclusion"
  data-mw='{"parts":["some text",{"template":{"target":{"wt":"Citation needed","href":"./Template:Citation_needed"},"params":{},"i":1}}]}'
></span>
<span id="no-attr"></span>
<span id="bad-json" data-mw="not valid json"></span>
<span id="numbers" data-vals='{"count":42,"flag":true,"nothing":null}'></span>
</body></html>`;

const doc = domino.createWindow(HTML).document;

/** Run selector against the fixture; return sorted element IDs. */
function find(selector) {
  return zest(selector, doc).map(el => el.getAttribute('id')).sort();
}

describe('ZestJQ: / JSON-attribute operator', () => {

  describe('equality on a nested path through an array', () => {
    it('matches Citation_needed by href', () => {
      assert.deepEqual(
        find('[data-mw/.parts[].template?.target.href == "./Template:Citation_needed"]'),
        ['cite-needed', 'mixed'],
      );
    });

    it('matches Refimprove by href', () => {
      assert.deepEqual(
        find('[data-mw/.parts[].template?.target.href == "./Template:Refimprove"]'),
        ['refimprove'],
      );
    });

    it('returns empty for a non-existent template', () => {
      assert.deepEqual(
        find('[data-mw/.parts[].template?.target.href == "./Template:NonExistent"]'),
        [],
      );
    });
  });

  describe('combined standard CSS attribute selector + JQ operator', () => {
    it('combines typeof and Citation_needed href', () => {
      assert.deepEqual(
        find('[typeof="mw:Transclusion"][data-mw/.parts[].template?.target.href == "./Template:Citation_needed"]'),
        ['cite-needed', 'mixed'],
      );
    });
  });

  describe('path-only truthy check (no comparison operator)', () => {
    it('matches elements where .template? exists in any part', () => {
      // parserfunc has a parserfunction key, not template; .template? on that
      // object returns null (missing key on object → null in jq), which is falsy
      assert.deepEqual(
        find('[data-mw/.parts[].template?]'),
        ['cite-needed', 'mixed', 'refimprove'],
      );
    });

    it('matches elements where .parserfunction? exists in any part', () => {
      assert.deepEqual(
        find('[data-mw/.parts[].parserfunction?]'),
        ['parserfunc'],
      );
    });

    it('matches only elements with valid JSON (not bad-json or no-attr)', () => {
      // bad-json: data-mw present but not parseable → silently no match
      // no-attr: data-mw absent → no match
      assert.deepEqual(
        find('[data-mw/.parts]'),
        ['cite-needed', 'mixed', 'parserfunc', 'refimprove'],
      );
    });
  });

  describe('deep path: multiple property steps', () => {
    it('matches by date param value', () => {
      // refimprove: empty params; mixed: Citation_needed has no date param
      assert.deepEqual(
        find('[data-mw/.parts[].template?.params.date.wt == "March 2026"]'),
        ['cite-needed'],
      );
    });
  });

  describe('explicit array indexing', () => {
    it('[0]: matches only when first part is the target template', () => {
      // mixed: parts[0] is a bare string, so .template? yields null → no match
      assert.deepEqual(
        find('[data-mw/.parts[0].template?.target.href == "./Template:Citation_needed"]'),
        ['cite-needed'],
      );
    });

    it('[-1]: matches when last part is the target template', () => {
      // cite-needed: one part, parts[-1] = parts[0] = the template
      // mixed: two parts, parts[-1] = parts[1] = Citation_needed template
      assert.deepEqual(
        find('[data-mw/.parts[-1].template?.target.href == "./Template:Citation_needed"]'),
        ['cite-needed', 'mixed'],
      );
    });
  });

  describe('inequality', () => {
    it('matches transclusions whose template href differs from Citation_needed', () => {
      // parserfunc: .template? → null, null.target → null, null.href → null,
      //   null != "..." → true in jq → match
      // refimprove: href is Refimprove, not Citation_needed → match
      // cite-needed, mixed: href == Citation_needed → no match
      assert.deepEqual(
        find('[typeof="mw:Transclusion"][data-mw/.parts[].template?.target.href != "./Template:Citation_needed"]'),
        ['parserfunc', 'refimprove'],
      );
    });
  });

  describe('numeric and boolean literal comparisons', () => {
    it('numeric equality', () => {
      assert.deepEqual(find('[data-vals/.count == 42]'), ['numbers']);
    });

    it('numeric >=: matches when value satisfies condition', () => {
      assert.deepEqual(find('[data-vals/.count >= 10]'), ['numbers']);
    });

    it('numeric <: no match when condition is false', () => {
      assert.deepEqual(find('[data-vals/.count < 10]'), []);
    });

    it('boolean true equality', () => {
      assert.deepEqual(find('[data-vals/.flag == true]'), ['numbers']);
    });

    it('boolean false: no match when value is true', () => {
      assert.deepEqual(find('[data-vals/.flag == false]'), []);
    });

    it('null equality', () => {
      assert.deepEqual(find('[data-vals/.nothing == null]'), ['numbers']);
    });
  });

  describe('edge cases', () => {
    it('missing attribute never matches', () => {
      assert.deepEqual(find('[no-such-attr/.foo == "bar"]'), []);
    });

    it('bad JSON attribute never matches', () => {
      assert.ok(!find('[data-mw/.parts]').includes('bad-json'));
    });
  });

});
