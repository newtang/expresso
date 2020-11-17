export function lowercaseStaticParts(path: string): string {
  return path
    .split('/')
    .map((part) => {
      return part.startsWith(':') ? part : part.toLowerCase();
    })
    .join('/');
}

export type ValidatePathOptions = {
  allowColon: boolean;
};

export function validatePath(path: string | RegExp, options: ValidatePathOptions): void {
  if (!path) {
    throw new Error(`Invalid path: ${path}`);
  }

  if (path instanceof RegExp) {
    return;
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
