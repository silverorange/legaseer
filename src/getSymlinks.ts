import * as z from 'zod';
import minimist from 'minimist';

export function getSymlinks() {
  const knownOptions = {
    string: 'symlinks',
    default: { symlinks: '' },
  };

  try {
    // Package names arrive as a comma-separated string, but minimist yields an
    // array of strings when `--symlinks` is repeated. Accept either shape and
    // normalize to a flat list of non-empty names.
    return z
      .object({ symlinks: z.union([z.string(), z.array(z.string())]) })
      .transform(({ symlinks: value }) =>
        (Array.isArray(value) ? value : [value])
          .flatMap((entry) => entry.split(','))
          .filter((name) => name !== ''),
      )
      .parse(minimist(process.argv.slice(2), knownOptions));
  } catch {
    return [];
  }
}
