"""
Generate styles/projection.css from the approved mock-up.

design/1-head.html is the mock-up's own stylesheet — the one the design was signed off
against. Rather than re-typing it (and drifting from it, which is what went wrong before),
it is transformed mechanically:

  .stage            -> .sfh-stage            the 1280x860 board the layout is drawn on
  .t-omni           -> .sfh-stage[data-device="omni"]
  .seq-on/.seq-off  -> .sfh-seq-on/.sfh-seq-off
  every selector    -> prefixed with #sfh-projection, so nothing leaks into Foundry
  @keyframes X      -> @keyframes sfh-X, and the animation shorthands with them

Run:  python tools/port-css.py
"""
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / 'design' / '1-head.html'
OUT = ROOT / 'styles' / 'projection.css'

HEADER = """/* =========================================================================
   The projection, generated from the approved mock-up.

   DO NOT EDIT BY HAND. This file is produced by tools/port-css.py from
   design/1-head.html, which is the mock-up's own stylesheet. Change the
   design there and re-run the script, so the module and the mock-up cannot
   drift apart.

   Everything is scoped to #sfh-projection: none of it reaches Foundry's own
   interface, which is themed separately in interface.css.
   ========================================================================= */

"""

# The mock-up's page furniture — the demo toolbar, the scaling wrapper, the footnote — has
# no place in the module. Rules whose selector matches any of these are dropped.
DROP = re.compile(r'^\s*(html|body|\.bar\b|\.brand\b|\.ctl\b|#wrap\b|#scaler\b|\.foot\b|:root\b)')

DEVICES = {'omni': 'omni', 'wrist': 'wrist', 'gdi': 'gdi', 'nod': 'nod', 'tron': 'tron'}


def read_style(html: str) -> str:
    start = html.index('<style>') + len('<style>')
    return html[start:html.index('</style>', start)]


def split_selectors(selector: str):
    """Split on commas that separate selectors, not on commas inside :is(), :not() etc."""
    parts, depth, start = [], 0, 0
    for i, ch in enumerate(selector):
        if ch == '(':
            depth += 1
        elif ch == ')':
            depth -= 1
        elif ch == ',' and depth == 0:
            parts.append(selector[start:i])
            start = i + 1
    parts.append(selector[start:])
    return [p for p in parts if p.strip()]


def transform_selector(sel: str) -> str:
    sel = sel.strip()
    # the etched-grid switch is an attribute on <body> in the module
    grid = re.match(r'\[data-grid="(\w+)"\]\s*', sel)
    prefix = ''
    if grid:
        prefix = f'body[data-sfh-grid="{grid.group(1)}"] '
        sel = sel[grid.end():]
    for dev in DEVICES:
        sel = sel.replace(f'.t-{dev}', f'.sfh-stage[data-device="{dev}"]')
    sel = sel.replace('.seq-on', '.sfh-seq-on').replace('.seq-off', '.sfh-seq-off')
    sel = re.sub(r'(?<![\w-])\.stage(?![\w-])', '.sfh-stage', sel)
    sel = sel.replace('#toasts', '#sfh-toasts')
    if sel.startswith('#sfh-projection'):
        return f'{prefix}{sel}' if prefix else sel
    return f'{prefix}#sfh-projection {sel}'


def transform(css: str) -> str:
    out = []
    # split into rules and at-rules, keeping @keyframes bodies intact
    i = 0
    while i < len(css):
        if css[i] in ' \n\t':
            i += 1
            continue
        if css.startswith('/*', i):
            end = css.index('*/', i) + 2
            out.append(css[i:end])
            i = end
            continue
        if css[i] == '@':
            # at-rule: copy through with its whole (possibly nested) block
            brace = css.index('{', i)
            head = css[i:brace]
            depth, j = 0, brace
            while True:
                if css[j] == '{':
                    depth += 1
                elif css[j] == '}':
                    depth -= 1
                    if depth == 0:
                        break
                j += 1
            body = css[brace + 1:j]
            if head.strip().startswith('@keyframes'):
                out.append(f'@keyframes sfh-{head.split()[1].strip()} {{{body}}}')
            elif head.strip().startswith('@media'):
                out.append(f'{head}{{\n{transform(body)}\n}}')
            else:
                out.append(css[i:j + 1])
            i = j + 1
            continue
        brace = css.index('{', i)
        selector = css[i:brace]
        close = css.index('}', brace)
        body = css[brace + 1:close]
        i = close + 1
        if DROP.match(selector):
            continue
        sels = ', '.join(transform_selector(s) for s in split_selectors(selector))
        body = re.sub(r'animation\s*:\s*([A-Za-z][\w-]*)', lambda m: f'animation:sfh-{m.group(1)}', body)
        body = re.sub(r'animation-name\s*:\s*([A-Za-z][\w-]*)', lambda m: f'animation-name:sfh-{m.group(1)}', body)
        out.append(f'{sels}{{{body}}}')
    return '\n'.join(out)


def main() -> None:
    css = transform(read_style(SRC.read_text(encoding='utf-8')))
    OUT.write_text(HEADER + css + '\n', encoding='utf-8')
    print(f'{OUT.relative_to(ROOT)}: {len(css.splitlines())} rules from {SRC.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
