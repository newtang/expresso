# expresso

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
 - The order you add routes shouldn't matter.