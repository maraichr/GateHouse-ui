const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'b', 'em', 'i', 'u',
  'ul', 'ol', 'li',
  'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'blockquote', 'code', 'pre', 'span', 'div',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
]);

const DANGEROUS_ATTRS = /^on/i;

/**
 * Simple HTML sanitizer — strips <script>, <style>, event handlers,
 * and disallowed tags while keeping safe formatting elements.
 */
export function sanitizeHtml(html: string): string {
  // Strip script and style tags entirely (including content)
  let clean = html.replace(/<script[\s\S]*?<\/script>/gi, '');
  clean = clean.replace(/<style[\s\S]*?<\/style>/gi, '');

  // Use DOMParser to safely parse and filter
  const doc = new DOMParser().parseFromString(clean, 'text/html');
  sanitizeNode(doc.body);
  return doc.body.innerHTML;
}

function sanitizeNode(node: Node): void {
  const children = Array.from(node.childNodes);
  for (const child of children) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as Element;
      const tag = el.tagName.toLowerCase();

      if (!ALLOWED_TAGS.has(tag)) {
        // Replace disallowed element with its children
        while (el.firstChild) {
          node.insertBefore(el.firstChild, el);
        }
        node.removeChild(el);
        continue;
      }

      // Remove dangerous attributes
      for (const attr of Array.from(el.attributes)) {
        if (DANGEROUS_ATTRS.test(attr.name) || attr.name === 'style') {
          el.removeAttribute(attr.name);
        }
      }

      // For <a> tags, ensure target="_blank" and rel="noopener noreferrer"
      if (tag === 'a') {
        el.setAttribute('target', '_blank');
        el.setAttribute('rel', 'noopener noreferrer');
      }

      sanitizeNode(el);
    }
  }
}
