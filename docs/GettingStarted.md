# App Getting started

# Composition Root

Creating, managing and using dependencies, running programs and providing the required dependencies.

## Defining a Service

### Tag (Identifier + Interface)

Interface defined up front.

```ts
import * as Has from "@effect-ts/core/Has"

export interface MyService {
  add: (a: number, b: number) => number
}
export const MyService = Has.tag<MyService>()
```

### Implementation

```ts
const makeMyServiceImplementation (): MyService => ({
  add: (a, b) => a + b
})
```

### Shortcut

Relying on the return type shape of the MyService constructor function.

```ts
import * as Has from "@effect-ts/core/Has"

const makeMyServiceImplementation () => ({
  add: (a, b) => a + b
})

export interface MyService
  extends ReturnType<typeof makeServiceImplementation> {}

export const MyService = Has.tag<MyService>()
```

### Provider

```ts
import * as L from "@effect-ts/core/Layer"

export const MyServiceLive = L.fromFrunction(makeMyServiceImplementation)
```

### Using a Service

Generator approach

```ts
import * as T from "@effect-ts/core/Effect"

const program: T.Effect<Has<MyService>, never, number> = T.gen(function* ($) {
  const { add } = yield* $(MyService)

  return add(1, 2)
})
```

Accessor approach
```ts
import * as T from "@effect-ts/core/Effect"

const program: T.Effect<Has<MyService>, never, number> = T.accessService(MyService)(
  ({ add }) => add(1, 2)
)
```

### Providing a Service via Layer

```ts
import { pipe } from "@effect-ts/core/Function"
import * as T from "@effect-ts/core/Effect"

const program = pipe(
  program,
  T.chain((result) => T.succeedWith(() => console.log(result)))
  T.provideSomeLayer(MyServiceLive)
)
```

TODO: combining multiple Layers (`L.All`, `>>>`, `<<<`, `+++`, `<+<`, `>+>`)

Now you can run the program!

## Roots

## General

### Run in background
```ts
import * as T from "@effect-ts/core/Effect"

T.run(program)
```

### Run to promise

```ts
import * as T from "@effect-ts/core/Effect"

T.runPromise(program)
```

### Console apps & Servers

```ts
import * as N from "@effect-ts/node/Runtime"

N.runMain(program)
```

### Tests

TODO
`J.runTime`


### React

TODO
ServiceProvider

## Managed Services

These provide the ability to bracket, open a resource, use the resource, and close the resource.
E.g think of connections to caches or databases.

TODO


## Schema

TODO