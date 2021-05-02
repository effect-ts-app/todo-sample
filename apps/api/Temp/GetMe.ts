import { TaskListOrGroup, TaskListOrVirtual } from "@effect-ts-demo/todo-types"
import { Chunk, pipe } from "@effect-ts/core"
import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as T from "@effect-ts/core/Effect"

import { UserSVC } from "@/services"

import * as UserContext from "../Temp/UserContext"

import {
  Request,
  Response,
  TaskListEntryOrGroup,
} from "@effect-ts-demo/todo-client/Temp/GetMe"

export const handle = (_: Request) =>
  T.gen(function* ($) {
    const u = yield* $(UserSVC.UserEnv)
    const user = yield* $(UserContext.get(u.id))

    return {
      name: user.name,
      taskList: { id: user.taskList.id },
      taskLists: yield* $(
        pipe(
          A.map_(
            user.taskLists,
            T.matchMorph(TaskListOrGroup)({
              TaskList: ({ id, title }) =>
                T.succeed(TaskListEntryOrGroup.of.TaskList({ id, title })),
              VirtualTaskList: ({ id }) =>
                pipe(
                  UserContext.getTaskList(id)["|>"](T.orDie),
                  T.map(({ id, title }) =>
                    TaskListEntryOrGroup.of.TaskList({ id, title })
                  )
                ),
              TaskListGroup: ({ lists, ...rest }) =>
                T.gen(function* ($) {
                  return TaskListEntryOrGroup.of.TaskListGroup({
                    ...rest,
                    lists: yield* $(
                      pipe(
                        lists,
                        A.map(
                          T.matchMorph(TaskListOrVirtual)({
                            TaskList: ({ id, title }) =>
                              T.succeed(
                                TaskListEntryOrGroup.as.TaskList({ id, title })
                              ),
                            VirtualTaskList: ({ id }) =>
                              pipe(
                                UserContext.getTaskList(id)["|>"](T.orDie),
                                T.map(({ id, title }) =>
                                  TaskListEntryOrGroup.as.TaskList({ id, title })
                                )
                              ),
                          })
                        ),
                        T.collectAll,
                        T.map(Chunk.toArray)
                      )
                    ),
                  })
                }),
            })
          ),
          T.collectAll,
          T.map(Chunk.toArray)
        )
      ),
    }
  })

export { Request, Response }
