/* eslint-disable @typescript-eslint/no-explicit-any */
import { pipe } from "@effect-ts/core"
import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as Chunk from "@effect-ts/core/Collections/Immutable/Chunk"
import * as T from "@effect-ts/core/Effect"
import { _A } from "@effect-ts/core/Utils"

import * as RM from "./morphic/routing"
import * as RS from "./schema/routing"

type Methods = "GET" | "PUT" | "POST" | "PATCH" | "DELETE"

/**
 * Work in progress JSONSchema generator.
 */
export function makeJsonSchema(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  r: Iterable<
    | RM.RouteDescriptor<any, any, any, any, any, any, any, any>
    | RS.RouteDescriptor<any, any, any, any, any, any, any, any>
  >
) {
  return pipe(
    Chunk.from(r),
    //Chunk.filter((x) => x._tag === "Morphic"),
    T.forEach((e) =>
      e._tag === "Morphic" ? RM.makeFromMorphic(e) : RS.makeFromSchema(e)
    ),
    T.map((e) => {
      const map = ({ method, path, responses, ...rest }: _A<typeof e>) => ({
        [method]: {
          ...rest,
          responses: A.reduce_(
            responses,
            {} as Record<Response["statusCode"], Response["type"]>,
            (prev, cur) => {
              prev[cur.statusCode] = cur.type
              return prev
            }
          ),
        },
      })
      return Chunk.reduce_(
        e,
        {} as Record<string, Record<Methods, ReturnType<typeof map>>>,
        (prev, e) => {
          prev[e.path] = {
            ...prev[e.path],
            ...map(e),
          }
          return prev
        }
      )
    })
  )
}

class Response {
  constructor(
    public readonly statusCode: number,
    public readonly type: any //string | JSONSchema | SubSchema
  ) {}
}
