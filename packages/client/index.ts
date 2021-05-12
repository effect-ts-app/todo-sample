export * from "./config"

import * as Ts from "./Tasks/_index"
import { clientFor } from "./clientFor"

export const TasksClient = clientFor(Ts)
export * as Tasks from "./Tasks/_index"

// TasksClient.DeleteTask
// TasksClient.CreateTask
// TasksClient.FindTask
// TasksClient.GetTasks({})
//   ["|>"](T.provideSomeLayer(LiveApiConfig({ apiUrl: "http://localhost:3330" })))
//   ["|>"](T.delay(2000))
//   ["|>"](T.result)
//   ["|>"](T.runPromise)
//   .then((x) => console.warn(JSON.stringify(x, undefined, 2)))
