# App Getting started

# Composition Root

Creating, managing and using dependencies, running programs and providing the required dependencies.

## Defining a Service

### Explicit Definition


Interface defined up front:

```ts
import * as Has from "@effect-ts/core/Has"

// Tag (Identifier + Interface)
export interface MyService {
  add: (a: number, b: number) => number
}
export const MyService = Has.tag<MyService>()

// Implementation
const makeMyServiceImplementation (): MyService => ({
  add: (a, b) => a + b
})
```

Relying on the return type shape of the MyService constructor function:

```ts
import * as Has from "@effect-ts/core/Has"

// Implementation
const makeMyServiceImplementation () => ({
  add: (a, b) => a + b
})

// Tag (Identifier + Interface)
export interface MyService
  extends ReturnType<typeof makeServiceImplementation> {}
export const MyService = Has.tag<MyService>()
```

### Provider

```ts
import * as L from "@effect-ts/core/Layer"

export const MyServiceLive = L.fromFunction(makeMyServiceImplementation)
```

### Using a Service

Generator approach:
```ts
import * as T from "@effect-ts/core/Effect"

const program: T.Effect<Has<MyService>, never, number> = T.gen(function* ($) {
  const { add } = yield* $(MyService)

  return add(1, 2)
})
```

Accessor approach:
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

Now you can run the program!

TODO: combining multiple Layers (`L.All`, `>>>`, `<<<`, `+++`, `<+<`, `>+>`)

## Runtimes

These will run your code, and may provide default environments applicable to the runtime target.

### Default

Provides default `Clock` and `Random` services.

Run in Background
```ts
import * as T from "@effect-ts/core/Effect"

T.run(program)
```

Run to Promise
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

Provides additional test environment services, e.g to fast forward time.

`J.runTime`


TODO


### React

`ServiceContext`

TODO

## Managed Services

These provide the ability to bracket, open a resource, use the resource, and close the resource.
E.g think of connections to caches or databases.

TODO

## Samples

- https://github.com/effect-ts-app/boilerplates/blob/master/api/start-server.ts#L25
- https://github.com/effect-ts-app/todo-sample/blob/master/apps/api/start-server.ts#L28
- https://github.com/Matechs-Garage/workshop-facile-final-kata/blob/master/day-4/src/index.ts
- https://github.com/Matechs-Garage/mars-rover-kata/blob/master/src/index.ts
- https://github.com/Matechs-Garage/next-effect-ts/blob/main/src/Server.tsx

## Schema

TODO