import React, { useEffect, useState } from "react"
import * as Todo from "@effect-ts-demo/todo-types"
import * as TodoClient from "@effect-ts-demo/todo-client"
import * as A from "@effect-ts/core/Array"
import * as T from "@effect-ts/core/Effect"

import { pipe } from "@effect-ts/core"

import styled, { css } from "styled-components"

function useTasks() {
    const [tasks, setTasks] = useState([] as A.Array<Todo.Task>)
    useEffect(() => {
        const tasks = async () => {
            const r = await pipe(TodoClient.Tasks.getTasks, T.runPromise)
            setTasks(r.tasks)
        }
        tasks().catch(console.error)
    }, [])
    return [tasks] as const
}

const Task = styled.li<Pick<Todo.Task, "completed">>`
    ${({ completed }) => completed && css`text-decoration: line-through`}
`
function makeStepCount(steps: Todo.Task["steps"]) {
    if (steps.length === 0) { return "0" }
    const completedSteps = steps["|>"](A.filter(x => x.completed))
    return `${completedSteps.length}/${steps.length}`
}

function Tasks() {
    const [tasks] = useTasks()

    return (
        <div>
            <div><h1>Tasks</h1></div>
            <ul>
                {tasks.map(t => (
                    <Task key={t.id} completed={t.completed}>
                        {t.title}
                        &nbsp;
                        [{makeStepCount(t.steps)}]
                    </Task>)
                )}
            </ul>
        </div>
    )
}

export default Tasks
