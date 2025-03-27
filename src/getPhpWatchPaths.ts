import { constants as fsConstants, promises as fs } from 'fs';
import globby from 'globby';
import path from 'path';
import paths from './paths';

const wwwPath = 'www/*.php';

async function getExistingPaths(pathsToTest: string[]) {
  const exists = await Promise.all(
    pathsToTest.map(async (pathToTest) => {
      try {
        // eslint-disable-next-line no-bitwise
        await fs.access(pathToTest, fsConstants.R_OK | fsConstants.X_OK);
        return true;
      } catch (e) {
        return false;
      }
    }),
  );

  return pathsToTest.filter((_, index) => exists[index]);
}

async function getSymlinkPaths(pathsToTest: string[]) {
  const stats = await Promise.all(
    pathsToTest.map((pathToTest) => {
      return fs.lstat(pathToTest);
    }),
  );
  return pathsToTest.filter((_, index) => stats[index].isSymbolicLink());
}

/**
 * Gets resolved PHP files within the www directory
 *
 * Chokidar has trouble with circular symlinks as found in some of our project
 * `www` directories so we resolve the glob to an explicit list of file names.
 *
 * We won't see new files this way, but at least Chokidar will run without
 * complaining.
 */
async function getWwwPaths(wwwPaths: string[]) {
  return globby(wwwPaths, { expandDirectories: false });
}

async function getPhpSymlinkPaths() {
  const vendorPaths = await getExistingPaths(paths.vendors);
  return (
    await Promise.all(
      vendorPaths.map(async (vendorPath) =>
        getSymlinkPaths(
          (await fs.readdir(vendorPath)).map((dir) =>
            path.join(vendorPath, dir),
          ),
        ),
      ),
    )
  ).flat();
}

export async function getPhpIgnorePaths() {
  const symlinkPaths = await getPhpSymlinkPaths();

  return symlinkPaths
    .map((symlinkPath) => [
      `${symlinkPath}/vendor/*`,
      `${symlinkPath}/.git/*`,
      `${symlinkPath}/node_modules/*`,
    ])
    .flat();
}

/**
 * Chokidar can't glob symlink directories properly so explicitly list
 * each directory instead.
 */
export async function getPhpWatchPaths() {
  const symlinkPaths = await getPhpSymlinkPaths();
  // Note: We don't want to include LESS files within the PHP package as they
  // should already be wymlinked under the project's www directory and will
  // be watched using the default paths.less paths.
  const symlinkFilePaths = symlinkPaths
    .map((symlinkPath) => [`${symlinkPath}/**/*.php`])
    .flat();

  const wwwPaths = await getWwwPaths(
    paths.php.filter((testPath) => testPath === wwwPath),
  );

  return [
    ...paths.php.filter((testPath) => testPath !== wwwPath),
    ...wwwPaths,
    ...symlinkFilePaths,
  ];
}
