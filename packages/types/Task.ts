import * as S from "@effect-ts-demo/core/ext/Schema"
import { pipe } from "@effect-ts/core"
import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as O from "@effect-ts/core/Option"
import { Option } from "@effect-ts/core/Option"
import * as Lens from "@effect-ts/monocle/Lens"

// export const TaskListIdU = UUID
// export type TaskListIdU = AType<typeof TaskListIdU>

// export const TaskListId = make((F) =>
//   F.union(
//     TaskListIdU(F),
//     TaskListIdLiteral(F)
//   )({
//     guards: [guard(TaskListIdU).is, guard(TaskListIdLiteral).is],
//   })
// )
// export type TaskListId = AType<typeof TaskListId>

//// SCHEMA TEST
export const UserId = S.positiveInt
export type UserId = S.ParsedShapeOf<typeof UserId>

export const TaskId = S.UUID
export type TaskId = S.ParsedShapeOf<typeof TaskId>

// TODO: Schema unions missing?
export const TaskListId = S.UUID
export type TaskListId = S.ParsedShapeOf<typeof TaskListId>

export const TaskListIdU = S.nonEmptyString
export type TaskListIdU = S.ParsedShapeOf<typeof TaskListIdU>

@S.namedC
export class Step extends S.Model<Step>()(
  pipe(
    S.required({ title: S.nonEmptyString, completed: S.bool }),
    S.asBuilder,
    S.withDefaultConstructorField("completed", () => false),
    S.openapi(() => ({ openapiRef: "Step" }))
  )
) {
  static complete = Lens.id<Step>()["|>"](Lens.prop("completed")).set(true)
}

export const EditableTaskProps = S.struct({
  required: {
    title: S.nonEmptyString,
    completed: S.nullable(S.date),
    isFavorite: S.bool, // TODO: Add bool

    due: S.nullable(S.date),
    reminder: S.nullable(S.date),
    note: S.nullable(S.nonEmptyString),
    steps: S.array(Step.Model),
    assignedTo: S.nullable(UserId),
  },
})

export const EditablePersonalTaskProps = S.struct({
  required: {
    myDay: S.nullable(S.date),
  },
})

@S.namedC
export class Task extends S.Model<Task>()(
  pipe(
    S.intersect(
      S.required({
        id: TaskId,
        createdAt: S.date,
        updatedAt: S.date,
        createdBy: UserId,
        listId: TaskListIdU,
      })
    )(EditableTaskProps),
    S.asBuilder,
    S.withDefaultUuidId,
    // TODO: We should have one call, with all defaults at once.
    S.withDefaultConstructorField("isFavorite", () => false),
    S.withDefaultConstructorField("steps", () => [] as A.Array<Step>),
    S.withDefaultConstructorField("listId", () => "inbox" as TaskListIdU),
    S.withDefaultConstructorField("createdAt", () => new Date()),
    S.withDefaultConstructorField("updatedAt", () => new Date()),
    S.withDefaultConstructorField("completed", () => O.none as O.Option<Date>),
    S.withDefaultConstructorField("due", () => O.none as O.Option<Date>),
    S.withDefaultConstructorField("reminder", () => O.none as O.Option<Date>),
    S.withDefaultConstructorField("note", () => O.none as O.Option<S.NonEmptyString>),
    S.withDefaultConstructorField("assignedTo", () => O.none as O.Option<UserId>),
    S.openapi(() => ({ openapiRef: "Task" }))
  )
) {
  static complete = Lens.id<Task>()
    ["|>"](Lens.prop("completed"))
    .set(O.some(new Date()))
}

@S.namedC
export class Membership extends S.Model<Membership>()(
  pipe(S.struct({ required: { id: UserId, name: S.nonEmptyString } }), S.asBuilder)
) {}

@S.namedC
export class SharableTaskList extends S.Model<SharableTaskList>()(
  pipe(
    S.struct({
      required: {
        id: TaskListId,
        title: S.nonEmptyString,
        order: S.array(TaskId),

        members: S.array(Membership.Model),
        ownerId: UserId,
        // tasks: F.array(TaskOrVirtualTask(F))
      },
    }),
    S.asBuilder,
    S.tag("TaskList"),
    S.withDefaultUuidId,
    S.withDefaultConstructorField("order", () => [] as A.Array<TaskId>),
    S.withDefaultConstructorField("members", () => [] as A.Array<Membership>)
  )
) {}

@S.namedC
export class TaskListGroup extends S.Model<TaskListGroup>()(
  pipe(
    S.struct({
      required: {
        id: TaskListId,
        title: S.nonEmptyString,
        lists: S.array(TaskListId),

        ownerId: UserId,
      },
    }),
    S.asBuilder,
    S.tag("TaskListGroup"),
    S.withDefaultUuidId,
    S.withDefaultConstructorField("lists", () => [] as A.Array<TaskListId>)
  )
) {}

export const TaskListOrGroup = S.tagged(SharableTaskList.Model, TaskListGroup.Model)
export type TaskListOrGroup = S.ParsedShapeOf<typeof TaskListOrGroup>

const MyDay = S.struct({ required: { id: TaskId, date: S.date } })
type MyDay = S.ParsedShapeOf<typeof MyDay>

@S.namedC
export class User extends S.Model<User>()(
  pipe(
    S.required({
      id: UserId,
      name: S.nonEmptyString,
      inboxOrder: S.array(TaskId),
      myDay: S.array(MyDay) /* position */,
    }),
    S.asBuilder,
    S.withDefaultConstructorField("inboxOrder", () => [] as A.Array<TaskId>),
    S.withDefaultConstructorField("myDay", () => [] as A.Array<MyDay>)
  )
) {
  static readonly createTask = (
    a: Omit<ConstructorParameters<typeof Task>[0], "createdBy">
  ) => (u: User) => new Task({ ...a, createdBy: u.id })
  static readonly getMyDay = (t: Task) => (u: User) =>
    A.findFirst_(u.myDay, (x) => x.id === t.id)["|>"](O.map((m) => m.date))
  static readonly addToMyDay = (t: Task, date: Date) => (u: User): User => ({
    ...u,
    myDay: A.findIndex_(u.myDay, (m) => m.id === t.id)
      ["|>"](O.chain((idx) => A.modifyAt_(u.myDay, idx, (m) => ({ ...m, date }))))
      ["|>"](O.getOrElse(() => A.snoc_(u.myDay, { id: t.id, date }))),
  })
  static readonly removeFromMyDay = (t: Task) => (u: User): User => ({
    ...u,
    myDay: u.myDay["|>"](A.filter((m) => m.id !== t.id)),
  })
  static readonly toggleMyDay = (t: Task, myDay: Option<Date>) =>
    O.fold_(
      myDay,
      () => User.removeFromMyDay(t),
      (date) => User.addToMyDay(t, date)
    )
}
