import { namedC, Post } from "@effect-ts-app/core/ext/Schema"

import CreateTaskOriginal, { Response } from "../../Tasks/Create"

@namedC()
export default class CreateTask extends Post("/lists/:listId/tasks")<CreateTask>()(
  CreateTaskOriginal.Model.Api.props
) {}

export { Response }
