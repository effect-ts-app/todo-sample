import { useCallback, useEffect, useState } from "react"
import styled, { css } from "styled-components"

import * as Todo from "@effect-ts-demo/todo-types"
import * as TodoClient from "@effect-ts-demo/todo-client"
import * as A from "@effect-ts/core/Array"
import * as T from "@effect-ts/core/Effect"

import { useRun } from "../run"
import { UUID } from "@effect-ts/morphic/Algebra/Primitives"
import { Lens } from "@effect-ts/monocle"

import * as O from "@effect-ts/core/Option"


function useTasks() {
    const [tasks, setTasks] = useState([] as A.Array<Todo.Task>)
    const runEffect = useRun()
    const fetchLatestTasks = useCallback(() => {
        return TodoClient.Tasks.getTasks
            ["|>"](T.map(r => setTasks(r.tasks)))
            ["|>"](runEffect)
            .catch(console.error)
    }, [runEffect])
    // TODO: loading vs error, vs fetching more state etc.
    useEffect(() => {fetchLatestTasks()}, [fetchLatestTasks])
    return [tasks, fetchLatestTasks] as const
}

function useNewTask() {
    const runEffect = useRun()
    const [newTaskTitle, setNewTaskTitle] = useState("")
    const [newTaskProcessing, setNewTaskProcessing] = useState(false)

    async function addNewTask() {
        setNewTaskProcessing(true)
        try {
            await TodoClient.Tasks.createTaskE({ title: newTaskTitle })["|>"](runEffect)
            setNewTaskTitle("")
        } catch (err) {
            console.error(err)
        } finally {
            setNewTaskProcessing(false)
        }
    }

    return [{ newTaskTitle, newTaskProcessing}, setNewTaskTitle, addNewTask] as const
}

function useDeleteTask() {
    const runEffect = useRun()
    const [deleteTaskProcessing, setDeleteTaskProcessing] = useState(false)

    async function deleteTask(id: UUID) {
        setDeleteTaskProcessing(true)
        try {
            await TodoClient.Tasks.deleteTask({ id })["|>"](runEffect)
        } catch (err) {
            console.error(err)
        } finally {
            setDeleteTaskProcessing(false)
        }
    }

    return [{ deleteTaskProcessing }, deleteTask] as const
}

function useUpdateTask() {
    const runEffect = useRun()
    const [updateTaskProcessing, setUpdateTaskProcessing] = useState(false)

    async function updateTask(t: Todo.Task) {
        setUpdateTaskProcessing(true)
        try {
            await TodoClient.Tasks.updateTask(t)["|>"](runEffect)
        } catch (err) {
            console.error(err)
        } finally {
            setUpdateTaskProcessing(false)
        }
    }

    return [{ updateTaskProcessing }, updateTask] as const
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
    const [tasks, fetchLatestTasks] = useTasks()

    const [selectedTaskId, setSelectedTaskId] = useState<UUID | null>(null)
    const selectedTask = tasks.find(x => x.id === selectedTaskId)

    const [{ newTaskTitle, newTaskProcessing}, setNewTaskTitle, addNewTask] = useNewTask()

    const [ {  deleteTaskProcessing}, deleteTask] = useDeleteTask()

    const [ { updateTaskProcessing }, updateTask] = useUpdateTask()

    function toggleTaskChecked(t: Todo.Task) {
        const nt = t["|>"](Todo.Task.lens["|>"](Lens.prop("completed"))["|>"](Lens.modify(x => !x)))
        return updateTask(nt).then(fetchLatestTasks)
    }

    function toggleStepChecked(t: Todo.Task, s: Todo.Step) {
        const nt = t["|>"](Todo.Task.lens
            ["|>"](Lens.prop("steps"))
            ["|>"](Lens.modify(steps =>
                A.modifyAt_(
                    steps,
                    A.findIndex_(steps, x => x === s)
                        ["|>"](O.getOrElse(() => -1)),
                    Todo.Step.lens["|>"](Lens.prop("completed"))["|>"](Lens.modify(x => !x))
                )["|>"](O.getOrElse(() => steps)))
            )
            )
        return updateTask(nt).then(fetchLatestTasks)
    }

    return (
        <div>
            <div><h1>Tasks</h1></div>
            <ul>
                {tasks.map(t => (
                    <Task key={t.id} completed={t.completed} onClick={() => setSelectedTaskId(t.id)}>
                        <input type="checkbox" checked={t.completed} disabled={updateTaskProcessing} onChange={() => toggleTaskChecked(t)} />
                        {t.title}
                        &nbsp;
                        [{makeStepCount(t.steps)}]
                        <button disabled={deleteTaskProcessing} onClick={() => deleteTask(t.id).then(fetchLatestTasks)}>X</button>
                    </Task>)
                )}
            </ul>
            <div>
                    <input value={newTaskTitle} onChange={(evt) => setNewTaskTitle(evt.target.value)} type="text" />
                    <button onClick={() => addNewTask().then(fetchLatestTasks)} disabled={!newTaskTitle.length || newTaskProcessing}>
                        add
                    </button>
            </div>

            <div>
                    <h2>Selected Task</h2>
                    {selectedTask && <>
                        {selectedTask.title}
                        <div><ul>
                            {selectedTask.steps.map((s, idx) => (
                                <li key={idx}>
                                    <input type="checkbox"  disabled={updateTaskProcessing} checked={s.completed} onChange={() => toggleStepChecked(selectedTask, s)} />
                                    {s.title}
                                </li>)
                            )}
                        </ul></div>
                        <div>Updated: {selectedTask.updatedAt.toISOString()}</div>
                        <div>Created: {selectedTask.createdAt.toISOString()}</div>
                        <div><i>Id: {selectedTask.id}</i></div>
                        </>
                    }
                    {!selectedTask && "Please select a task"}
            </div>
        </div>
    )
}

export default Tasks
