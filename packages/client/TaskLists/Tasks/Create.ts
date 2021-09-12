import { Post, useClassNameForSchema } from "@effect-ts-app/core/Schema"

import { CreateTaskRequest as CreateTaskOriginal, Response } from "../../Tasks/Create"

@useClassNameForSchema
export class CreateTaskRequest extends Post(
  "/lists/:listId/tasks"
)<CreateTaskRequest>()(CreateTaskOriginal.Model.Api.props) {}

export { Response }
