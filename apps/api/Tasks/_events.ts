/* eslint-disable @typescript-eslint/no-explicit-any */
// https://docs.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/domain-events-design-implementation

import * as T from "@effect-ts/core/Effect"
import * as EO from "@effect-ts-app/core/EffectOption"
import { flow, identity, tuple } from "@effect-ts-app/core/Function"
import * as O from "@effect-ts-app/core/Option"
import * as S from "@effect-ts-app/core/Schema"
import { TaskEvents, TaskId, User, UserId, UserTask } from "@effect-ts-demo/todo-types"

import { TodoContext } from "@/services"

const matchTaskEvent = TaskEvents.Events.matchOne
const eventHandlers = tuple(
  // Sample: Update the "User" aggregate to store the user state for this Task.
  matchTaskEvent("TaskCreated", ({ myDay, taskId, userId }) =>
    EO.genUnit(function* ($) {
      const { Users } = yield* $(TodoContext.TodoContext)
      const md = yield* $(myDay)
      yield* $(
        Users.update(
          userId,
          User.modifyUserTask(taskId, UserTask.lenses.myDay.set(O.some(md)))
        )
      )
    })
  ),
  matchTaskEvent("TaskUpdated", ({ taskId, userChanges, userId }) =>
    EO.genUnit(function* ($) {
      const { Users } = yield* $(TodoContext.TodoContext)
      const { myDay, reminder } = userChanges
      if (!myDay && !reminder) {
        return
      }
      yield* $(
        Users.update(
          userId,
          User.modifyUserTask(
            taskId,
            flow(
              myDay ? UserTask.lenses.myDay.set(myDay) : identity,
              reminder ? UserTask.lenses.reminder.set(reminder) : identity
            )
          )
        )
      )
    })
  ),

  // This is here just to test multiple handlers, and the merging of R and E accordingly.
  matchTaskEvent("TaskCreated", () => TodoContext.getLoggedInUser["|>"](T.asUnit)),

  // Sample for dispatching an Integration Event.
  // On_TaskCreated_SendTaskCreatedEmail
  matchTaskEvent("TaskCreated", ({ taskId, userId }) =>
    publishIntegrationEvent(new SendTaskCreatedEmail({ taskId, userId }))
  )
)

export function handleEvents<T extends TaskEvents.Events>(events: readonly T[]) {
  return T.forEach_(events, (evt) => T.forEach_(eventHandlers, (x) => T.union(x(evt))))
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
  SendTaskCreatedEmail,
})
export type IntegrationEvents = S.ParsedShapeOf<typeof IntegrationEvents>

function unimplemented(message: string) {
  return T.succeedWith(() => console.warn("Called unimplemented: " + message))
}
