import { Root, Declaration, Plugin } from 'postcss';
import path from 'path';

export const rebasePlugin = (opts: { from: string; to: string }): Plugin => ({
  postcssPlugin: 'rebase-urls',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Once(root: Root) {
    root.walkDecls((decl: Declaration) => {
      if (decl.value && decl.value.includes('url(')) {
        decl.value = decl.value.replace(
          /url\((['"]?)([^'")]+)\1\)/g,
          (_, quote, urlPath) => {
            if (urlPath.startsWith('data:') || /^[a-z]+:\/\//.test(urlPath)) {
              return `url(${quote}${urlPath}${quote})`; // skip absolute/data URLs
            }
            const rebased = path.relative(
              opts.to,
              path.resolve(path.dirname(opts.from), urlPath),
            );
            return `url(${quote}${rebased}${quote})`;
          },
        );
      }
    });
  },
});
rebasePlugin.postcss = true; // required for TS + PostCSS plugin type support
