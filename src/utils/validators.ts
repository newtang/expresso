import isSafeRegex from 'safe-regex';
import { RouterOptions } from '../interfaces';

export type ValidatePathOptions = {
  allowColon: boolean;
  allowRegex: false | 'safe' | 'all';
};

export const defaultOptions: RouterOptions = {
  allowDuplicateParams: false,
  allowDuplicatePaths: false,
  allowRegex: false,
  caseSensitive: false,
  strict: false,
};

export function validateOptions(options: RouterOptions): void {
  for (const opt in options) {
    if (opt in defaultOptions) {
      if (opt === 'allowRegex') {
        if (![false, 'safe', 'all'].includes(options[opt])) {
          throw new Error(
            `Unexpected value found for ${opt}: ${options[opt]}. Allowed values are false, 'safe', 'all'.`
          );
        }
      } else {
        if (typeof options[opt] !== 'boolean') {
          throw new Error(`Unexpected value found for boolean ${opt}: ${options[opt]}`);
        }
      }
    } else {
      throw new Error(`Unexpected options: opt`);
    }
  }
}

export function validatePath(path: string | RegExp, options: ValidatePathOptions): void {
  if (!path) {
    throw new Error(`Invalid path: ${path}`);
  }

  if (path instanceof RegExp) {
    return validateRegexPath(path, options);
  }

  if (typeof path !== 'string') {
    throw new Error(`Invalid path: ${path}`);
  }

  if (path[0] !== '/') {
    throw new Error(`First character in path, must be a slash. ${path}`);
  }

  //allowable characters
  const charRegex = options.allowColon
    ? /^\/[a-zA-Z0-9:$\-_.+!*'(),/~]*$/gi
    : /^\/[a-zA-Z0-9$\-_.+!*'(),/~]*$/gi;

  const pass = charRegex.test(path);
  if (!pass) {
    throw new Error(`Invalid path: ${path}`);
  }

  const fail = /\/\//gi.test(path);
  if (fail) {
    throw new Error(`Invalid path. Contains consecutive '//', ${path}`);
  }
}

function validateRegexPath(path: RegExp, { allowRegex }: ValidatePathOptions): void {
  if (!allowRegex) {
    throw new Error(`Regular expressions are prohibited when allowRegex option is false: ${path}`);
  }

  if (allowRegex === 'safe') {
    if (!isSafeRegex(path)) {
      throw new Error(`Unsafe regex ${path}`);
    }
  } else if (allowRegex === 'all') {
    return;
  } else {
    throw new Error(`invalid value of allowRegex option: ${allowRegex}`);
  }
}
