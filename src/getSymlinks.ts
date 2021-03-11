import minimist from 'minimist';

export function getSymlinks() {
  const knownOptions = {
    string: 'symlinks',
    default: { symlinks: '' },
  };

  const options = minimist(process.argv.slice(2), knownOptions);
  return options.symlinks;
}
