import type { ExecFileException } from 'node:child_process';
import { promisify } from 'node:util';

export const execFile = promisify(
  (await import('node:child_process')).execFile,
);

export function isExecFileException(
  error: unknown,
): error is ExecFileException {
  return (
    error instanceof Error &&
    Object.hasOwn(error, 'code') &&
    Object.hasOwn(error, 'stdout') &&
    Object.hasOwn(error, 'stderr')
  );
}
