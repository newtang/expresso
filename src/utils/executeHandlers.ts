import type { NextHandleFunction, HandleFunction, ErrorHandleFunction } from 'connect';
import type { Request, Response, NextFunction } from 'express';

export default function executeHandlers(
  req: Request,
  res: Response,
  done: NextFunction,
  handlerStack: Array<HandleFunction>
): void {
  let index = 0;
  next();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function next(err?: any): void {
    /**
     * This should exit the current route handler, then go to the next valid route handler
     * However, since we sort of merge all the route handlers, this doesn't work as it should
     * Requires some reworking to enable this functionality.
     * Issue #15
     *
     **/

    if (err === 'route' || err === 'router') {
      // exit router
      return done();
    }

    const nextHandler = handlerStack[index++];
    if (nextHandler) {
      if (err) {
        return handleNextError(nextHandler, err, req, res, next);
      } else {
        return handleNextRequest(nextHandler, req, res, next);
      }
    } else {
      return done(err);
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function handleNextError(handle: HandleFunction, error: any, req: Request, res: Response, next): void {
  if (handle.length !== 4) {
    // not a standard error handler
    return next(error);
  }

  try {
    (handle as ErrorHandleFunction)(error, req, res, next);
  } catch (err) {
    next(err);
  }
}

function handleNextRequest(
  handle: HandleFunction,
  req: Request,
  res: Response,
  next: (err?: any) => void // eslint-disable-line @typescript-eslint/no-explicit-any
): void {
  if (handle.length > 3) {
    // not a standard request handler
    return next();
  }

  try {
    (handle as NextHandleFunction)(req, res, next);
  } catch (err) {
    next(err);
  }
}
