import type { HandleFunction } from 'connect';
import type { Request, Response, NextFunction } from 'express';
import { validatePath } from '../utils/validators';
import executeHandlers from '../utils/executeHandlers';

export type UseHandler = {
  pathStart: string;
  handlers: Array<HandleFunction>;
};

export interface UseLib {
  use: (
    handlerOrPathStart:
      | string
      | Array<string>
      | HandleFunction
      | Array<HandleFunction | Array<HandleFunction>>,
    ...handlers: Array<HandleFunction>
  ) => this;
  getRelevantUseHandlers: (path: string | RegExp) => Array<HandleFunction>;
}

export function buildUse({ caseSensitive }: { caseSensitive: boolean }): UseLib {
  const useHandlers: Array<UseHandler> = [];
  return {
    use: function <T>(
      handlerOrPathStart:
        | string
        | Array<string>
        | HandleFunction
        | Array<HandleFunction | Array<HandleFunction>>,
      ...moreHandlers: Array<HandleFunction>
    ): T {
      const [pathStarts, handlers] = getValidUseArgs(handlerOrPathStart, ...moreHandlers);

      for (let pathStart of pathStarts) {
        //we don't support regex in use yet.

        if ((pathStart as any) instanceof RegExp) {
          throw new Error(`router.use does not support regular expressions yet: ${pathStart}`);
        }
        validatePath(pathStart, { allowColon: false, allowRegex: false });

        if (pathStart.charAt(pathStart.length - 1) === '/') {
          pathStart = pathStart.slice(0, pathStart.length - 1);
        }

        useHandlers.push({
          pathStart,
          handlers,
        });
      }

      return this;
    },
    getRelevantUseHandlers: function (path: string | RegExp): Array<HandleFunction> {
      if (path instanceof RegExp) {
        return getRelevantUseHandlersForRegex(path, useHandlers, caseSensitive);
      }

      const arr: Array<HandleFunction> = [];
      for (const useHandler of useHandlers) {
        /*
		      use(/v1/api)
		         - must start with this
		         - cannot start with /v1/apiabc

		         - remove ending slash from pathStart
		           - path must start with pathStart and with pathStart with an ending slash
		             /v1/api/ * works
		             /v1/api/abc
		             OR
		           - path must equal pathStart.
		             /v1/api

		    */

        if (validStartsWith(path, useHandler.pathStart, caseSensitive)) {
          arr.push(
            trimPathPrefix.bind(null, useHandler.pathStart) as HandleFunction,
            ...useHandler.handlers,
            resetPathPrefix.bind(null, useHandler.pathStart) as HandleFunction
          );
        }
      }

      return arr;
    },
  };
}

function getValidUseArgs(
  handlerOrPathStart: string | Array<string> | HandleFunction | Array<HandleFunction | Array<HandleFunction>>,
  ...handlers: Array<HandleFunction>
): [Array<string>, Array<HandleFunction>] {
  let pathStarts = ['/'];

  if (typeof handlerOrPathStart === 'function') {
    handlers.unshift(handlerOrPathStart);
  } else {
    if (Array.isArray(handlerOrPathStart)) {
      handlerOrPathStart = handlerOrPathStart.flat(2) as Array<HandleFunction> | Array<string>;

      if (!handlerOrPathStart.length) {
        throw new Error(`Invalid path: ${handlerOrPathStart}`);
      }

      if (typeof handlerOrPathStart[0] === 'string') {
        pathStarts = handlerOrPathStart as Array<string>;
      } else if (typeof handlerOrPathStart[0] === 'function') {
        handlers.unshift(...(handlerOrPathStart as Array<HandleFunction>));
      }
    } else {
      pathStarts = [handlerOrPathStart];
    }
  }

  validateUseHandlers(handlers);

  return [pathStarts, handlers];
}

function validateUseHandlers(handlers: Array<HandleFunction>): void {
  if (!handlers || !handlers.length) {
    throw new Error('Handler must be a function');
  }

  for (const handler of handlers) {
    if (typeof handler !== 'function') {
      throw new Error('Handler must be a function');
    }
  }
}

function getRelevantUseHandlersForRegex(
  path: RegExp,
  useHandlers: Array<UseHandler>,
  caseSensitive: boolean
): Array<HandleFunction> {
  const arr: Array<HandleFunction> = [];
  for (const useHandler of useHandlers) {
    arr.push(
      trimPathPrefix.bind(null, useHandler.pathStart) as HandleFunction,
      (((req: Request, res: Response, done: HandleFunction) => {
        if (validStartsWith(req.originalUrl, useHandler.pathStart, caseSensitive)) {
          executeHandlers(req, res, done as NextFunction, useHandler.handlers);
        } else {
          (done as NextFunction)();
        }
      }) as unknown) as HandleFunction,
      resetPathPrefix.bind(null, useHandler.pathStart) as HandleFunction
    );
  }

  return arr;
}

function resetPathPrefix(prefix: string, req: Request, res: Response, next: NextFunction): void {
  if (req.url === '/') {
    req.url = prefix;
    req.baseUrl = req.baseUrl.slice(0, req.baseUrl.length - prefix.length);
  } else {
    req.url = `${prefix}${req.url}`;
    req.baseUrl = req.baseUrl.slice(0, req.baseUrl.length - prefix.length);
  }

  //to restore to a non-strict route if necessary
  if (`${req.url}/` === req.originalUrl) {
    req.url = `${req.url}/`;
  }

  next();
}

function trimPathPrefix(prefix: string, req: Request, res: Response, next: NextFunction): void {
  req.originalUrl = req.originalUrl || req.url;
  req.url = req.url.slice(prefix.length) || '/';
  req.baseUrl = `${req.baseUrl || ''}${prefix}`;
  next();
}

function validStartsWith(path: string, pathStart: string, caseSensitive: boolean): boolean {
  if (!caseSensitive) {
    path = path.toLowerCase();
    pathStart = pathStart.toLowerCase();
  }

  return path === pathStart || (path.startsWith(pathStart) && path.startsWith(`${pathStart}/`));
}
