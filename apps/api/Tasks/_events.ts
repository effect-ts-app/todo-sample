// https://docs.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/domain-events-design-implementation

import * as TUP from "@effect-ts/core/Collections/Immutable/Tuple"
import * as T from "@effect-ts/core/Effect"
import { _E, _R, ForcedTuple } from "@effect-ts/core/Utils"
import * as EO from "@effect-ts-app/core/ext/EffectOption"
import * as S from "@effect-ts-app/core/ext/Schema"
import { TaskCreated, TaskEvents, User } from "@effect-ts-demo/todo-types"

import { getLoggedInUser } from "@/_services/TodoContext"
import { TodoContext } from "@/services"

export function handleEvents<T extends TaskEvents>(events: readonly T[]) {
  return T.forEach_(
    events,
    TaskEvents.Api.matchW(
      {
        TaskCreated: (evt) => myTup(...EventHandlers.TaskCreated.map((h) => h(evt))),
      }
      // // Default
      // () => T.unit
    )
  )
}

const EventHandlers = {
  // TODO: a sample for dispatching an Integration Event.
  TaskCreated: [
    // Sample: Update the "User" aggregate to store the myDay state for this Task.
    ({ myDay, taskId, userId }: TaskCreated) =>
      EO.genUnit(function* ($) {
        const { Users } = yield* $(TodoContext.TodoContext)
        yield* $(Users.update(userId, User.addToMyDay({ id: taskId }, yield* $(myDay))))
      }),
    // This is here just to test multiple handlers, and the merging of R and E accordingly.
    () => getLoggedInUser["|>"](T.asUnit),
  ] as const,
}

////
// Tuple tools, to merge the types better
export function myTup<T extends readonly T.Effect<any, any, any>[]>(
  ...t: T
): T.Effect<_R<T[number]>, _E<T[number]>, ForcedTuple<TupleA<T>>> {
  return T.map_(T.collectAll(t /*T.accessCallTrace() */), (x) => TUP.tuple(...x)) as any
}

export type TupleA<T extends readonly T.Effect<any, any, any>[]> = {
  [K in keyof T]: [T[K]] extends [T.Effect<any, any, infer A>] ? A : never
}

// TODO
export const IntegrationEventProps = {
  id: S.defaultProp(S.UUID),
  createdAt: S.defaultProp(S.date),
}
