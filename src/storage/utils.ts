import type { NextHandleFunction } from 'connect';
import type { Request, Response } from 'express';

export function buildOptionsHandler(methods: Array<string>): NextHandleFunction {
  const methodSet = new Set(methods);
  if (methodSet.has('GET')) {
    methodSet.add('HEAD');
  }

  const sortedMethods = Array.from(methodSet).sort().join(', ');

  return (((req: Request, res: Response) => {
    res.setHeader('Allow', sortedMethods);
    res.setHeader('Content-Length', Buffer.byteLength(sortedMethods));
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.end(sortedMethods);
  }) as unknown) as NextHandleFunction;
}
