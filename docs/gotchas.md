# Gotchas

## Function names ending with `_`

These are the uncurried versions of the function with the same name.

## When to use Fully Qualified Module names when accessing functions

e.g `S.props` over `props`:

Whenever the majority purpose of the module, is not to work with the imported module `S`.
Aka. if a module is all about defining Schema types, you would not `import * as S` but `import { props }`

## When to use inline pipe `["|>"]` over multi-line `pipe`

Basically as the title says: for quick, often short, inline pipes, use `["|>]`,
but for longer more steps, multi-line pipes, prefer `pipe`
