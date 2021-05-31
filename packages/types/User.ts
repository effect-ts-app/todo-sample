import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as O from "@effect-ts/core/Option"
import * as Lens from "@effect-ts/monocle/Lens"
import {
  allWithDefault,
  array,
  defaultProp,
  Email,
  Model,
  namedC,
  partialConstructor,
  PhoneNumber,
  prop,
  reasonableString,
} from "@effect-ts-app/core/Schema"
import { reverseCurriedMagix, uncurriedMagix } from "@effect-ts-app/core/utils"

import { TaskId, UserId } from "./ids"
import { EditablePersonalTaskProps, Task, UserTaskView } from "./Task"
import { TaskList, TaskListGroup } from "./TaskList"

const createPartialTask = partialConstructor(Task)
const createPartialTaskList = partialConstructor(TaskList)
const createPartialTaskListGroup = partialConstructor(TaskListGroup)

export class UserTask extends Model<UserTask>()({
  taskId: prop(TaskId),
  ...allWithDefault(EditablePersonalTaskProps),
}) {}

@namedC
export class User extends Model<User>()({
  id: prop(UserId),
  email: prop(Email),
  name: prop(reasonableString),
  phoneNumber: prop(PhoneNumber),

  inboxOrder: defaultProp(array(TaskId)),
  userTasks: defaultProp(array(UserTask.Model)),
}) {
  static createTask = reverseCurriedMagix((u: User) =>
    createPartialTask({ createdBy: u.id })
  )
  static createTaskList = reverseCurriedMagix((u: User) =>
    createPartialTaskList({ ownerId: u.id })
  )
  static createTaskListGroup = reverseCurriedMagix((u: User) =>
    createPartialTaskListGroup({ ownerId: u.id })
  )

  static getOrCreateUserTask = uncurriedMagix((u: User, taskId: TaskId) => {
    return u.userTasks["|>"](A.findFirst((x) => x.taskId === taskId))["|>"](
      O.getOrElse(() => new UserTask({ taskId }))
    )
  })

  static modifyUserTask = (taskId: TaskId, mod: (tu: UserTask) => UserTask) => {
    return User.lenses.userTasks["|>"](
      Lens.modify((uts) =>
        A.findIndex_(uts, (m) => m.taskId === taskId)
          ["|>"](O.chain((idx) => A.modifyAt_(uts, idx, mod)))
          ["|>"](O.getOrElse(() => A.snoc_(uts, mod(new UserTask({ taskId })))))
      )
    )
  }

  static personaliseTask = uncurriedMagix((u: User, t: Task) => {
    const { myDay, reminder } = User.getOrCreateUserTask._(u, t.id)
    return new UserTaskView({
      ...t,
      myDay,
      reminder,
    })
  })
}
