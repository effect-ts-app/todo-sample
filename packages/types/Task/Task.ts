import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as O from "@effect-ts/core/Option"
import * as Lens from "@effect-ts/monocle/Lens"
import { constant } from "@effect-ts/system/Function"
import { LazyGetter } from "@effect-ts/system/Utils"
import {
  allWithDefault,
  AnyError,
  array,
  bool,
  date,
  defaultProp,
  domainE,
  domainEE,
  DomainError,
  domainResponse,
  domainResponse2,
  include,
  longString,
  makeOptional,
  makeUnorderedStringSet,
  Model,
  ModelSpecial,
  nonEmptyString,
  nullable,
  onConstruct,
  onParseOrConstruct,
  ParsedShapeOf,
  prop,
  props,
  reasonableString,
  useClassNameForSchema,
} from "@effect-ts-app/core/Schema"
import { curriedMagix, uncurriedMagix } from "@effect-ts-app/core/utils"

import { TaskId, TaskListIdU, UserId } from "../ids"
import { TaskAudit, TaskCreated } from "./audit"
import { Attachment } from "./shared"

@useClassNameForSchema
export class Step extends Model<Step>()({
  title: prop(reasonableString),
  completed: defaultProp(bool),
}) {
  @LazyGetter()
  static get complete() {
    return Step.lenses.completed.set(true)
  }
}

export const CategoriesSet = makeUnorderedStringSet(nonEmptyString)
export type CategoriesSet = ParsedShapeOf<typeof CategoriesSet>

export const EditableTaskProps = {
  title: prop(reasonableString),
  completed: prop(nullable(date)),
  isFavorite: prop(bool),

  due: prop(nullable(date)),
  note: prop(nullable(longString)),
  steps: prop(array(Step.Model)),
  assignedTo: prop(nullable(UserId)),

  attachment: prop(nullable(Attachment.Model)),

  categories: prop(CategoriesSet),
}

export const OptionalEditableTaskProps = props(makeOptional(EditableTaskProps))
export type OptionalEditableTaskProps = ParsedShapeOf<typeof OptionalEditableTaskProps>

export const EditablePersonalTaskProps = {
  myDay: prop(nullable(date)),
  reminder: prop(nullable(date)),
}

export const OptionalEditablePersonalTaskProps = props(
  makeOptional(EditablePersonalTaskProps)
)
export type OptionalEditablePersonalTaskProps = ParsedShapeOf<
  typeof OptionalEditablePersonalTaskProps
>

export const FutureDate = date["|>"](
  onParseOrConstruct((i) => {
    const errors: AnyError[] = []
    if (i < new Date()) {
      errors.push(domainEE("Date is not in the future"))
    }
    return domainResponse2(errors, () => i)
  })
)
export type FutureDate = ParsedShapeOf<typeof FutureDate>

export class Task extends ModelSpecial<Task>()(
  props({
    id: defaultProp(TaskId),
    createdBy: prop(UserId),
    listId: defaultProp(TaskListIdU, constant("inbox" as const)),
    createdAt: defaultProp(date),
    updatedAt: defaultProp(date),
    auditLog: defaultProp(array(TaskAudit)),

    ...include(EditableTaskProps)(
      ({
        assignedTo,
        attachment,
        categories,
        completed,
        due,
        isFavorite,
        note,
        steps,
        ...rest
      }) => ({
        ...rest,
        ...allWithDefault({
          assignedTo,
          attachment,
          completed,
          due,
          note,
          isFavorite,
          steps,
          categories,
        }),
      })
    ),
  })["|>"](
    onConstruct((i) => {
      const errors: DomainError[] = []
      if (O.isSome(i.completed) && i.completed.value < i.createdAt) {
        errors.push(domainE("completed", "cannot be before createdAt"))
      }
      return domainResponse(errors, () => ({
        ...i,
        auditLog: [...i.auditLog, new TaskCreated({ userId: i.createdBy })],
      }))
    })
  )
) {
  static complete = Task.lenses.completed.set(O.some(new Date()))

  static addAudit = curriedMagix((audit: TaskAudit) =>
    Task.lenses.auditLog["|>"](Lens.modify(A.snoc(audit)))
  )

  static update = uncurriedMagix((initialTask: Task, _: OptionalEditableTaskProps) => {
    const task = {
      ...initialTask,
      ..._,
      updatedAt: new Date(),
    }
    return task
  })
}

export class UserTaskView extends Model<UserTaskView>()({
  ...Task.Model.Api.props,
  ...EditablePersonalTaskProps,
}) {}
