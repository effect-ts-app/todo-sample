import React, { useEffect, useState } from "react"
import { Task } from "@effect-ts-demo/todo-types"
import * as GetTasks from "@effect-ts-demo/todo-client/Tasks/GetTasks"
import * as A from "@effect-ts/core/Array"
import * as T from "@effect-ts/core/Effect"

import { decoder } from "@effect-ts/morphic/Decoder"
//import { encoder } from "@effect-ts/morphic/Encoder"
import { pipe } from "@effect-ts/core"

// TODO: Move to todo-client
//const { encode } = encoder(GetTasks.Request)
const { decode } = decoder(GetTasks.Response)

const getTasks = pipe(T.fromPromise(() => fetch("http://localhost:6000/tasks").then(r => r.json())), T.chain(decode))

export default () => {
    const [tasks, setTasks] = useState([] as A.Array<Task>)
    useEffect(() => {
        const tasks = async () => {
            const r = await pipe(getTasks, T.runPromise)
            setTasks(r.tasks)
        }
        tasks()
    }
    , [])
    return (<div>
        <ul>
            {tasks.map(t => <li key={t.id}>${t.title}</li>)}
            </ul>
        </div>)
}
