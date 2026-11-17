// A tiny, safe renderer for the markdown-ish text the API returns in
// descriptions and rules. Everything is escaped first; only a small set of
// block and inline shapes is then turned back into elements, and links are
// only honoured for http(s) URLs.

import { esc } from './format.js';

function inline(text) {
  return text
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" rel="noopener">$1</a>')
    .replace(/(^|\s)(https?:\/\/[^\s<]+)/g, '$1<a href="$2" rel="noopener">$2</a>');
}

export function markdown(source) {
  const lines = esc(source ?? '').split('\n');
  const out = [];
  let list = null; // 'ul' | 'ol'
  let code = null; // array of lines while inside a fence

  const closeList = () => {
    if (list) out.push(`</${list}>`);
    list = null;
  };

  for (const line of lines) {
    if (code) {
      if (/^```/.test(line.trim())) {
        out.push(`<pre><code>${code.join('\n')}</code></pre>`);
        code = null;
      } else code.push(line);
      continue;
    }
    if (/^```/.test(line.trim())) {
      closeList();
      code = [];
      continue;
    }
    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      closeList();
      const level = Math.min(heading[1].length + 1, 4); // page h1 is ours; API text starts at h2
      out.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      continue;
    }
    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (bullet || numbered) {
      const kind = bullet ? 'ul' : 'ol';
      if (list !== kind) {
        closeList();
        out.push(`<${kind}>`);
        list = kind;
      }
      out.push(`<li>${inline((bullet ?? numbered)[1])}</li>`);
      continue;
    }
    closeList();
    if (line.trim()) out.push(`<p>${inline(line)}</p>`);
  }
  if (code) out.push(`<pre><code>${code.join('\n')}</code></pre>`);
  closeList();
  return out.join('\n');
}
