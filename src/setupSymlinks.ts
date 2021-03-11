import log from 'fancy-log';
import colors from 'ansi-colors';
import fs from 'fs';
import path from 'path';
import paths from './paths.js';
import { getSymlinks } from './getSymlinks';

/**
 * Replaces vendor package directories with symlinks that point to active
 * package working directories instead of installed composer packages
 *
 * @param symlinks
 */
function setup(symlinks: string) {
  const packages = symlinks.split(',');
  packages.forEach((packageName) => {
    let packageFound = false;
    paths.vendors.forEach((vendorPath) => {
      if (fs.existsSync(vendorPath)) {
        const packageLinkPath = path.join(vendorPath, packageName);
        if (fs.existsSync(packageLinkPath)) {
          packageFound = true;
          if (!fs.lstatSync(packageLinkPath).isDirectory()) {
            log(colors.red(`.. ${packageName} not a directory`));
          } else {
            const packageRealPath = path.join(
              '/so',
              'packages',
              packageName,
              paths.work
            );

            if (
              fs.existsSync(packageRealPath) &&
              (!fs.existsSync(packageLinkPath) ||
                packageRealPath !== fs.realpathSync(packageLinkPath))
            ) {
              fs.renameSync(
                packageLinkPath,
                `${packageLinkPath}${paths.symlinkSuffix}`
              );
              fs.symlinkSync(packageRealPath, packageLinkPath);

              log(colors.gray('..'), packageName);
            }
          }
        }
      }
    });

    if (!packageFound) {
      log(colors.red(`.. ${packageName} package not found`));
    }
  });

  log(colors.blue('Done'));
}

export function setupSymlinks() {
  const symlinks = getSymlinks();
  const useSymlinks = symlinks.length > 0;

  if (useSymlinks) {
    log(colors.blue('Updating symlinks in vendor directories:'));
    setup(symlinks);
  }
}
