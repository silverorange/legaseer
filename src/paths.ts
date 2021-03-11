import path from 'path';

const cwd = process.cwd();
const workDir = path.basename(cwd);
const vendorDirs = [
  path.join(cwd, 'vendor', 'silverorange'),
  path.join(cwd, 'vendor', 'hippo'),
];
const packagesDir = path.join(cwd, 'www', 'packages');

export default {
  cwd,
  work: workDir,
  vendors: vendorDirs,
  packages: packagesDir,
  composerLock: 'composer.lock',
  less: [
    'www/styles/*.less',
    'www/styles/**/*.less',
    'www/packages/*/styles/*.less',
    'www/packages/*/styles/**/*.less',
  ],
  php: [
    'include/*.php',
    'include/**/*.php',
    'system/**/*.php',
    'newsletter/**/*.php',
    'www/*.php',
    'www/admin/*.php',
  ],
  min: 'www/min',
  compiled: 'www/compiled',
  minified: 'www/min',
  compiledFlag: 'www/.concentrate-compiled',
  minifiedFlag: 'www/.concentrate-minified',
  combinedFlag: 'www/.concentrate-combined',
  symlinkSuffix: '.original',
};
