import * as z from 'zod';
import minimist from 'minimist';

export function getSymlinks() {
  const knownOptions = {
    string: 'symlinks',
    default: { symlinks: '' },
  };

  try {
    return z
      .object({ symlinks: z.string() })
      .transform(({ symlinks: value }) => value.split(','))
      .parse(minimist(process.argv.slice(2), knownOptions));
  } catch {
    return [];
  }
}
