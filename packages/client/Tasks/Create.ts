import {
  date,
  Model,
  nullable,
  Post,
  prop,
  useClassNameForSchema,
} from "@effect-ts-app/core/Schema"
import { Task, TaskId } from "@effect-ts-demo/todo-types"

@useClassNameForSchema
export default class CreateTask extends Post("/tasks")<CreateTask>()({
  ...Task.include(({ isFavorite, listId, title }) => ({
    listId,
    title,
    isFavorite,
  })),
  myDay: prop(nullable(date)),
}) {}

export class Response extends Model<Response>()({ id: prop(TaskId) }) {}
