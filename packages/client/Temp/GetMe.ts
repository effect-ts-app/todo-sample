import { NonEmptyString } from "@effect-ts-demo/core/ext/Model"
import { TaskListId } from "@effect-ts-demo/todo-types"
import { make, AType, EType, opaque, makeADT } from "@effect-ts/morphic"

// Must end up in openapi, but not in Request.
const RequestHeaders_ = make((F) =>
  F.interface({
    "x-user-id": NonEmptyString(F),
  })
)
const Request_ = make((F) => F.interface({}))
export interface Request extends AType<typeof Request_> {}
export interface RequestE extends EType<typeof Request_> {}
export const Request = Object.assign(opaque<RequestE, Request>()(Request_), {
  Headers: RequestHeaders_,
})

const TaskListEntry_ = make((F) =>
  F.interface({
    id: TaskListId(F),
    //tasks: F.array(Task(F)), // taskCount
    // order
  })
)

export interface TaskListEntry extends AType<typeof TaskListEntry_> {}
export interface TaskListEntryE extends EType<typeof TaskListEntry_> {}
export const TaskListEntry = opaque<TaskListEntryE, TaskListEntry>()(TaskListEntry_)

const SharableTaskListEntry_ = make((F) =>
  F.intersection(
    TaskListEntry(F),
    F.interface({
      title: NonEmptyString(F),
      //   members: F.array(Member(F)),
      //   // tasks: F.array(TaskOrVirtualTask(F))
      _tag: F.stringLiteral("TaskList"),
    })
  )()
)

export interface SharableTaskListEntry extends AType<typeof SharableTaskListEntry_> {}
export interface SharableTaskListEntryE extends EType<typeof SharableTaskListEntry_> {}
export const SharableTaskListEntry = opaque<
  SharableTaskListEntryE,
  SharableTaskListEntry
>()(SharableTaskListEntry_)

export const TaskListEntrys = make((F) => F.array(SharableTaskListEntry(F)))
export type TaskListEntrys = AType<typeof TaskListEntrys>

// TaskListEntryGroups contains tasklists
const TaskListEntryGroup_ = make((F) =>
  F.interface({
    id: TaskListId(F),
    title: NonEmptyString(F),
    lists: TaskListEntrys(F),
    _tag: F.stringLiteral("TaskListGroup"),
  })
)
export interface TaskListEntryGroup extends AType<typeof TaskListEntryGroup_> {}
export interface TaskListEntryGroupE extends EType<typeof TaskListEntryGroup_> {}
export const TaskListEntryGroup = opaque<TaskListEntryGroupE, TaskListEntryGroup>()(
  TaskListEntryGroup_
)

export const TaskListEntryOrGroup = makeADT("_tag")({
  TaskListGroup: TaskListEntryGroup,
  TaskList: SharableTaskListEntry,
})

export type TaskListEntryOrGroup = AType<typeof TaskListEntryOrGroup>

const Response_ = make((F) =>
  F.interface({
    name: NonEmptyString(F),
    inbox: TaskListEntry(F),
    lists: F.array(TaskListEntryOrGroup(F)),
  })
)
export interface Response extends AType<typeof Response_> {}
export interface ResponseE extends EType<typeof Response_> {}
export const Response = opaque<ResponseE, Response>()(Response_)
