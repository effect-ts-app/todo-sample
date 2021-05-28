/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Adapted,
  adaptRes,
  annotate,
  array,
  bool,
  literal,
  makeOptional,
  metaC,
  metaIdentifier,
  Model,
  named,
  namedC,
  positiveInt,
  Post,
  prop,
  props,
} from "@effect-ts-app/core/ext/Schema"
import * as S from "@effect-ts-app/core/ext/Schema"
import { typedKeysOf } from "@effect-ts-app/core/ext/utils"

import { TaskView } from "./views"

const selectableKeys = typedKeysOf(TaskView.Model.Api.props)

// TODO: but only make selectableKeys optional ;-)
const TaskViewAdapted = props(makeOptional(TaskView.Model.Api.props))
  ["|>"](named("DynamicTaskView"))
  ["|>"](
    annotate(metaIdentifier, {
      description:
        "The available properties depend on $select. if $select is omitted, all properties will be available",
    })
  )

// https://docs.microsoft.com/en-us/graph/query-parameters#odata-system-query-options

function odataProps<Keys extends string[]>(fieldNames: Keys) {
  const selectableFields = literal(...fieldNames)
  return {
    // todo: SET / nonEmptySet / nonEmptyArray
    $select: prop(array(selectableFields)).opt(),
    $count: prop(bool).opt(),
    // $filter
    // $orderBy
    // $search
    $skip: prop(positiveInt).opt(),
    $top: prop(positiveInt).opt(),
  }
}

@namedC
export default class SearchTasks extends Post("/tasks/search")<SearchTasks>()({
  ...odataProps(selectableKeys),
}) {}

@metaC({ description: "A list of Tasks" })
export class Response extends Model<Response>()({
  // TODO: Have to expose to openapi that the fields can be selected
  // but, if not adapted, the Optionals must be removed again.
  // aka: if has adapter:
  // - openapi Response: all optional
  // - Response encoder: all required, but only the selected keys available.
  items: prop(array(TaskView.Model)),

  // TODO: make the count appear as non optional when $count: true on Request.
  count: prop(positiveInt).opt(),
}) {}

export class ResponseOpenApi extends Model<ResponseOpenApi>()({
  items: prop(array(TaskViewAdapted)),
  count: prop(positiveInt).opt(),
}) {}

export function makeAdapter<Props extends S.PropertyRecord>(props: Props) {
  function a<Key extends keyof Props>(
    req: SearchTasks & {
      fields: readonly Key[]
    }
  ): Adapted<Props, Key>
  function a(req: SearchTasks): typeof Response // todo
  function a(req: SearchTasks): any {
    return req.$select ? adaptRes(props)(req.$select) : Response.Model
  }

  return a
}

export const adapt = makeAdapter(TaskView.Model.Api.props)
