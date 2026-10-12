import { marked } from 'marked';
import DOMPurify from 'dompurify';

window.sbMarkdown = {
  render(source) {
    const html = marked.parse(source, { gfm: true, breaks: false, async: false });
    const fragment = DOMPurify.sanitize(html, {
      RETURN_DOM_FRAGMENT: true,
      ALLOWED_TAGS: ['p','h1','h2','h3','h4','h5','h6','ul','ol','li','blockquote','pre','code','hr','br','strong','em','del','a','table','thead','tbody','tr','th','td'],
      ALLOWED_ATTR: ['href','title'],
      ALLOW_DATA_ATTR: false,
      ALLOW_ARIA_ATTR: false
    });
    for (const link of fragment.querySelectorAll('a')) {
      const href = link.getAttribute('href') || '';
      // Do not navigate the app's hash router or fetch private text through embedded media.
      if (!/^(https?:\/\/|mailto:)/i.test(href)) link.removeAttribute('href');
      else if (/^https?:\/\//i.test(href)) {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
        link.setAttribute('referrerpolicy', 'no-referrer');
      }
    }
    return fragment;
  }
};
