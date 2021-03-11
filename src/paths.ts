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
  compiled: 'www/compiled',
  compiledFlag: 'www/.concentrate-compiled',
  symlinkSuffix: '.original',
};
