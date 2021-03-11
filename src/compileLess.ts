import fs from 'fs';
import { relative, dirname } from 'path';
import { execFile } from 'child_process';
import log from 'fancy-log';
import colors from 'ansi-colors';
import postcss from 'postcss';
import postcssUrl from 'postcss-url';
import paths from './paths';

const fsPromises = fs.promises;

function getImports(css: string) {
  const matches = [
    // Match, single, double, or unquoted imports. Don't match url imports
    // because we only care about dependents of the current file.
    ...css.matchAll(/@import\s+(?:"([^"]+?)"|'([^']+?)'|(.+?));/gi),
  ];
  return matches.map((match) => {
    return match[1] || match[2] || match[3];
  });
}

function isLessImportEqual(a: string, b: string) {
  // less imports can omit the .less extension
  return a.replace(/\.less$/i, '') === b.replace(/\.less$/i, '');
}

function getRelativePath(from: string, to: string) {
  return relative(from.split('/').slice(0, -1).join('/'), to);
}

/**
 * @param {string} a
 * @param {string} b
 */
function alphabeticalSort(a: string, b: string) {
  if (a > b) {
    return 1;
  }
  if (a < b) {
    return -1;
  }
  return 0;
}

async function getDependencies(fileName: string, allFiles: Set<string>) {
  const filesArray = Array.from(allFiles);
  const imports = await Promise.all(
    filesArray.map(async (path) => {
      const less = await fsPromises.readFile(path, { encoding: 'utf8' });
      return getImports(less);
    })
  );

  const importMap = imports.reduce<{ [key: string]: string[] }>(
    (map, currentImports, index) => {
      map[filesArray[index]] = currentImports;
      return map;
    },
    {}
  );

  function getRecursiveDependencies(
    file: string,
    currentDependencies: { [key: string]: true }
  ): string[] {
    currentDependencies[file] = true;

    const dependants = filesArray
      .map((path) => {
        const relativePath = getRelativePath(path, file);
        const pathImports = importMap[path];

        if (
          !currentDependencies[path] &&
          pathImports.some((importFile) =>
            isLessImportEqual(importFile, relativePath)
          )
        ) {
          currentDependencies[path] = true;
          return getRecursiveDependencies(path, currentDependencies);
        }

        return [];
      })
      .flat();

    return [file, ...dependants];
  }

  return getRecursiveDependencies(fileName, {}).sort(alphabeticalSort);
}

function getOutputFileName(fileName: string) {
  return `${paths.compiled}/${fileName.split('/').slice(1).join('/')}`;
}

function rebaseUrls(css: string, from: string, to: string) {
  return postcss([])
    .use(postcssUrl({ url: 'rebase' }))
    .process(css, {
      from,
      to,
    });
}

function compileLessFile(fileName: string) {
  return new Promise<void>((resolve, reject) => {
    execFile('lessc', [fileName], (error, stdout, stderr) => {
      if (error !== null) {
        if (error.code === 1) {
          log('Error compiling', colors.red(fileName));
          console.error();
          console.error(stderr.trim());
          console.error();
          resolve();
        } else {
          console.error(stderr);
          log(`exec error: ${error}`);
          reject(error);
        }
      } else {
        const outputFileName = getOutputFileName(fileName);
        rebaseUrls(stdout, fileName, outputFileName).then((css) => {
          fs.mkdir(dirname(outputFileName), { recursive: true }, (dirError) => {
            if (dirError) {
              reject(dirError);
            } else {
              fs.writeFile(outputFileName, css.toString(), (writeError) => {
                if (writeError) {
                  reject(writeError);
                }
                log(
                  'Compiled',
                  colors.cyan(fileName),
                  'to',
                  colors.cyan(outputFileName)
                );
                resolve();
              });
            }
          });
        });
      }
    });
  });
}

export function compileAllLess(lessFiles: Set<string>) {
  log('Compiling all LESS files');
  return function compileAll() {
    return Promise.all(
      Array.from(lessFiles).map((fileName) => compileLessFile(fileName))
    );
  };
}

export function compileLess(file: string, lessFiles: Set<string>) {
  log('Compiling LESS for changed file', colors.magenta(file));
  return async function compile() {
    const files = await getDependencies(file, lessFiles);
    return Promise.all(files.map((fileName) => compileLessFile(fileName)));
  };
}
