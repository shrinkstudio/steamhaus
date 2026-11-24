// Builds one readable <script> snippet per feature into webflow/ for pasting
// into Webflow (site footer or the component that uses the feature).
import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';

const out = 'webflow';
fs.mkdirSync(out, { recursive: true });

// name: [label, module, init function, guard flag]
const features = {
  cases: ['Cases', 'cases.js', 'initCases'],
  accordion: ['Accordion', 'accordion.js', 'initAccordions'],
  tabs: ['Tabs', 'tabs.js', 'initTabs'],
  filter: ['Filter', 'filter-basic.js', 'initFilterBasic'],
  'dot-field': ['Dot field', 'dot-field.js', 'initDotField'],
  'form-validate': ['Form validation', 'form-validate.js', 'initFormValidate'],
};

const opts = (contents) => ({
  stdin: { contents, resolveDir: path.resolve('src/scripts'), loader: 'js' },
  bundle: true,
  write: false,
  format: 'iife',
  target: ['es2020'],
  legalComments: 'none',
  minifyWhitespace: false,
  minifySyntax: false,
  minifyIdentifiers: false,
});

const stripComments = (code) =>
  code
    .split('\n')
    .filter((l) => !/^\s*\/\//.test(l))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');

async function snippet(file, label, entry) {
  const res = await esbuild.build(opts(entry));
  const code = stripComments(res.outputFiles[0].text).trim();
  const html = `<!-- ${label} -->\n<script>\n${code}\n</script>\n`;
  fs.writeFileSync(path.join(out, file), html);
  console.log(`${file.padEnd(22)} ${html.length} chars`);
}

for (const [name, [label, mod, fn]] of Object.entries(features)) {
  const flag = `__sh_${name.replace(/-/g, '_')}`;
  await snippet(`${name}.html`, label, `
    import { ${fn} } from './${mod}';
    if (!window.${flag}) {
      window.${flag} = true;
      const run = () => ${fn}(document);
      document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', run) : run();
    }
  `);
}

await snippet('site-footer.html', 'Site scripts', `import './site.js';`);
