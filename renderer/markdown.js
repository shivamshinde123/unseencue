// Script text -> HTML. Standard Markdown (via marked) plus a colour shorthand:
//   {red}text{/}            text colour
//   {red|yellow}text{/}     text colour + background
//   {|#333}text{/}          background only
// Colours can be names (red) or hex (#ff0, #ff8800, #ff880080).

const COLOR = /^(#[0-9a-f]{3,8}|[a-z]+)$/i;

export function expandColors(src) {
  return src.replace(/\{([^{}|\/]*)(?:\|([^{}\/]*))?\}([\s\S]*?)\{\/\}/g, (whole, fg, bg, body) => {
    fg = fg.trim();
    bg = (bg || '').trim();
    if ((fg && !COLOR.test(fg)) || (bg && !COLOR.test(bg)) || (!fg && !bg)) return whole; // not a colour tag, leave as typed
    const style = [fg && `color:${fg}`, bg && `background:${bg}`].filter(Boolean).join(';');
    return `<span class="tag" style="${style}">${body}</span>`;
  });
}

export function renderScript(src, marked) {
  return marked.parse(expandColors(src), { gfm: true, breaks: true });
}
