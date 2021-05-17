import { makeOptional, prop, Patch, metaC } from "@effect-ts-demo/core/ext/Schema"
import {
  EditablePersonalTaskProps,
  EditableTaskProps,
  TaskId,
} from "@effect-ts-demo/todo-types"

@metaC({
  description: "You can optionally update selected fields of the Task",
  summary: "Update a Task", // no shit.
})
export default class UpdateTask extends Patch("/tasks/:id")<UpdateTask>()({
  id: prop(TaskId),
  ...makeOptional(EditableTaskProps),
  ...makeOptional(EditablePersonalTaskProps),
}) {}
