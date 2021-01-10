# expresso

A faster, safer, backwards compatible router for Expesss


Goals of this project

Speed
- significantly faster than Express' original router, especially for static and parameterized routes

Compatibility and configurability
 - very compatible with Express in terms of options and apis. A drop in replacement in many cases.
 - However, not 100% perfectly compatible to minimize confusion
  - Aim to have the same configurations that Express has. Also, allow flexibility for disabling any Expresso safety checks.


Prevent common sources of error by default
 - Throw exceptions when creating invalid or overlapping routes

Order independent
 - The order you add routes shouldn't matter. The only exception is "use". Only routes created before a use function won't see the use part called.


There's a lot of patterns, some which are wacky, that won't work with this router. Mostly if you expect a route handler to filter down into some other route.

`router.get(/^api*/, (req, res, next) => next())`
`router.get("/api/", (req, res, next) => doSomething())//won't get called`

`router.get("/api", (req, res, next) => {
	req.url = "/foo";
	next()
})
`
`router.get("/foo", (req, res, next) => doSomething())//won't get called`
