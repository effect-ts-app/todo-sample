import { Post, useClassNameForSchema } from "@effect-ts-app/core/Schema"

import CreateTaskOriginal, { Response } from "../../Tasks/Create"

@useClassNameForSchema
export default class CreateTask extends Post("/lists/:listId/tasks")<CreateTask>()(
  CreateTaskOriginal.Model.Api.props
) {}

export { Response }
