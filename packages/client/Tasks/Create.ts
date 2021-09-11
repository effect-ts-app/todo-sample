import {
  date,
  Model,
  optionFromNull,
  Post,
  prop,
  useClassNameForSchema,
} from "@effect-ts-app/core/Schema"
import { Task, TaskId } from "@effect-ts-demo/todo-types"

@useClassNameForSchema
export class CreateTaskRequest extends Post("/tasks")<CreateTaskRequest>()({
  ...Task.include(({ isFavorite, listId, title }) => ({
    listId,
    title,
    isFavorite,
  })),
  myDay: prop(optionFromNull(date)),
}) {}

export class Response extends Model<Response>()({ id: prop(TaskId) }) {}
