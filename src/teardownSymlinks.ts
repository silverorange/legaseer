import log from 'fancy-log';
import colors from 'ansi-colors';
import fs from 'fs';
import path from 'path';
import paths from './paths';
import { getSymlinks } from './getSymlinks';

/**
 * Replaces package symlinks with directories that point to installed composer
 * packages
 */
function teardown() {
  paths.vendors.forEach((vendorPath) => {
    if (fs.existsSync(vendorPath)) {
      fs.readdirSync(vendorPath).forEach((packageName) => {
        const packageLinkPath = path.join(vendorPath, packageName);
        const packageOriginalPath = `${packageLinkPath}${paths.symlinkSuffix}`;
        if (
          fs.existsSync(packageLinkPath) &&
          fs.existsSync(packageOriginalPath) &&
          fs.lstatSync(packageLinkPath).isSymbolicLink() &&
          fs.lstatSync(packageOriginalPath).isDirectory()
        ) {
          fs.unlinkSync(packageLinkPath);
          fs.renameSync(packageOriginalPath, packageLinkPath);

          log(colors.gray('..'), packageName);
        }
      });
    }
  });

  log(colors.blue('Done'));
}

export function teardownSymlinks() {
  const symlinks = getSymlinks();
  const useSymlinks = symlinks.length > 0;

  if (useSymlinks) {
    log(colors.blue('Restoring symlinks in vendor directories:'));
    teardown();
  }
}
