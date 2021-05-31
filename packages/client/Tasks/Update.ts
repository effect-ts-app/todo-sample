import { metaC, namedC, Patch, prop } from "@effect-ts-app/core/Schema"
import {
  OptionalEditablePersonalTaskProps,
  OptionalEditableTaskProps,
  TaskId,
} from "@effect-ts-demo/todo-types"

@metaC({
  description: "You can optionally update selected fields of the Task",
  summary: "Update a Task", // no shit.
})
@namedC
export default class UpdateTask extends Patch("/tasks/:id")<UpdateTask>()({
  id: prop(TaskId),
  ...OptionalEditableTaskProps.Api.props,
  ...OptionalEditablePersonalTaskProps.Api.props,
}) {}
