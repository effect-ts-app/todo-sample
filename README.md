# Practical use of Effect-TS: Todo app sample

This is an opinionated sample use of full-stack [Effect-TS](https://github.com/Effect-TS/core).
(See repositories for more info and discord link, articles, youtube videos, etc).

Though in the frontend, the Views and Presentational components so far are void of it's use.

The sample is somewhat based on Microsoft To Do.

**WORK IN PROGRESS**

## Note worthy

- API usecases are implemented in Delivery and Persistence ignorant way
 - Delivery type: HTTP REST/RPC/GQL can easily be exchanged. Library too: Express, KOA, etc.
 - Persistence type: NoSQL, SQL can easily be exchanged. DB driver too: in memory, disk, Redis, Mongo, etc.

TODO: Implement a Layer to demo replacing for example the persistence mechanism.

## Getting Started

From repo root:
- `yarn`
- `yarn dev`
- visit `http://localhost:3133`
- for api docs, visit: `http://localhost:3330/docs` or `http://localhost:3330/swagger`

Interesting bits are in:
- `apps/api`
- `apps/frontend/src/Tasks`
- `packages/client` and `packages/types`

You can interact via the included frontend project, the `docs/postman` collection, or go wild with `curl` if that's your thing ;-)

### Testing

From repo root or per app/package:
`yarn testsuite`

### Important steps

- in Editor, make sure the typescript runtime is set to the local node_modules/typescript
