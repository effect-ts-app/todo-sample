/* eslint-disable @typescript-eslint/no-explicit-any */
// https://docs.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/domain-events-design-implementation

import * as TUP from "@effect-ts/core/Collections/Immutable/Tuple"
import * as T from "@effect-ts/core/Effect"
import { _E, _R, ForcedTuple } from "@effect-ts/core/Utils"
import * as EO from "@effect-ts-app/core/ext/EffectOption"
import * as S from "@effect-ts-app/core/ext/Schema"
import { TaskEvents, TaskId, User, UserId } from "@effect-ts-demo/todo-types"

import { TodoContext } from "@/services"

export function handleEvents<T extends TaskEvents.Events>(events: readonly T[]) {
  return T.forEach_(
    events,
    TaskEvents.Events.Api.matchW(
      {
        TaskCreated: (evt) => myTup(...EventHandlers.TaskCreated.map((h) => h(evt))),
      }
      // // Default
      // () => T.unit
    )
  )
}

const EventHandlers = {
  TaskCreated: [
    // Sample: Update the "User" aggregate to store the myDay state for this Task.
    ({ myDay, taskId, userId }: TaskEvents.TaskCreated) =>
      EO.genUnit(function* ($) {
        const { Users } = yield* $(TodoContext.TodoContext)
        yield* $(Users.update(userId, User.addToMyDay({ id: taskId }, yield* $(myDay))))
      }),

    // This is here just to test multiple handlers, and the merging of R and E accordingly.
    () => TodoContext.getLoggedInUser["|>"](T.asUnit),

    // Sample for dispatching an Integration Event.
    // On_TaskCreated_SendTaskCreatedEmail
    ({ taskId, userId }: TaskEvents.TaskCreated) =>
      publishIntegrationEvent(new SendTaskCreatedEmail({ taskId, userId })),
  ] as const,
}

//////
// Play with Integration events
function publishIntegrationEvent(evt: IntegrationEvents) {
  // TODO:
  // 1. store to database within same transaction to ensure capturing the event
  // 2. background worker picks up the event from database
  // 3. background worker executes the required steps for this integration event, e.g;
  //   - publish the event on a message bus, to be picked up by other micro services
  //   - send email via e.g SendGrid
  return unimplemented("publishIntegrationEvent: " + JSON.stringify(evt, undefined, 2))
}

export function IntegrationEventProps<T extends string>(tag: T) {
  return {
    _tag: S.prop(S.literal(tag)),
    id: S.defaultProp(S.UUID),
    createdAt: S.defaultProp(S.date),
  }
}

export class SendTaskCreatedEmail extends S.Model<SendTaskCreatedEmail>()({
  ...IntegrationEventProps("SendTaskCreatedEmail"),
  taskId: S.prop(TaskId),
  userId: S.prop(UserId),
}) {}

export const IntegrationEvents = S.union({
  SendTaskCreatedEmail: SendTaskCreatedEmail.Model,
})
export type IntegrationEvents = S.ParsedShapeOf<typeof IntegrationEvents>

function unimplemented(message: string) {
  return T.succeedWith(() => console.warn("Called unimplemented: " + message))
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
