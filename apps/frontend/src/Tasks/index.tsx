import React, { useEffect, useState } from "react"
import { Task } from "@effect-ts-demo/todo-types"
import { Tasks as TasksClient } from "@effect-ts-demo/todo-client"
import * as A from "@effect-ts/core/Array"
import * as T from "@effect-ts/core/Effect"

import { pipe } from "@effect-ts/core"

function useTasks() {
    const [tasks, setTasks] = useState([] as A.Array<Task>)
    useEffect(() => {
        const tasks = async () => {
            const r = await pipe(TasksClient.getTasks, T.runPromise)
            setTasks(r.tasks)
        }
        tasks().catch(console.error)
    }, [])
    return [tasks] as const
}


function Tasks() {
    const [tasks] = useTasks()

    return (
        <div>
            <div><h1>Tasks</h1></div>
            <ul>
                {tasks.map(t => <li key={t.id}>{t.title}</li>)}
            </ul>
        </div>
    )
}

export default Tasks
