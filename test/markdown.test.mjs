import { test } from 'node:test';
import assert from 'node:assert/strict';
import { marked } from 'marked';
import { expandColors, renderScript } from '../renderer/markdown.js';

test('colour shorthand', () => {
  assert.equal(expandColors('{red}hi{/}'), '<span class="tag" style="color:red">hi</span>');
  assert.equal(expandColors('{red|#ff0}hi{/}'), '<span class="tag" style="color:red;background:#ff0">hi</span>');
  assert.equal(expandColors('{|#333}hi{/}'), '<span class="tag" style="background:#333">hi</span>');
});

test('rejects things that are not colours (no style injection)', () => {
  const bad = '{red;position:fixed}x{/}';
  assert.equal(expandColors(bad), bad);
  assert.equal(expandColors('{}x{/}'), '{}x{/}');
});

test('markdown headings still render with colour inside', () => {
  const html = renderScript('# Intro\n{red}Hello{/} world', marked);
  assert.match(html, /<h1>Intro<\/h1>/);
  assert.match(html, /<span class="tag" style="color:red">Hello<\/span> world/);
});
