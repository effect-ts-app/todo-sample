import * as S from "@effect-ts-demo/core/ext/Schema"
import { typedKeysOf } from "@effect-ts-demo/core/ext/utils"
import {
  EditablePersonalTaskProps,
  EditableTaskProps,
  TaskId,
} from "@effect-ts-demo/todo-types"

export class Request extends S.WriteRequest<Request>()("PATCH", "/tasks/:id", {
  path: S.props({ id: S.prop(TaskId) }),
  body: S.props({
    ...makeOptional(EditableTaskProps),
    ...makeOptional(EditablePersonalTaskProps),
  }),
}) {}

function makeOptional<NER extends Record<string, S.AnyProperty>>(
  t: NER // TODO: enforce non empty
): {
  [K in keyof NER]: S.Property<
    NER[K]["_schema"],
    "optional",
    NER[K]["_as"],
    NER[K]["_def"]
  >
} {
  return typedKeysOf(t).reduce((prev, cur) => {
    prev[cur] = t[cur].opt()
    return prev
  }, {} as any)
}
