import { Exit } from "@effect-ts/core/Effect/Exit"
import React, { useState } from "react"

import * as Todo from "./Todo"
import { CompletableEntry, Table } from "./components"
import { WithLoading } from "./utils"

function TaskDetail({
  addNewStep,
  deleteStep,
  task: t,
  toggleChecked,
  toggleStepChecked,
}: {
  task: Todo.Task
  addNewStep: WithLoading<(stepTitle: string) => Promise<Exit<unknown, unknown>>>
  deleteStep: WithLoading<(s: Todo.Step) => void>
  toggleChecked: WithLoading<() => void>
  toggleStepChecked: WithLoading<(s: Todo.Step) => void>
}) {
  const [newStepTitle, setNewStepTitle] = useState("")
  return (
    <>
      <CompletableEntry as="h2" completed={t.completed} style={{ textAlign: "left" }}>
        <input
          type="checkbox"
          disabled={toggleChecked.loading}
          checked={t.completed}
          onChange={() => toggleChecked()}
        />
        &nbsp;
        {t.title}
      </CompletableEntry>
      <div>
        <div>
          <form>
            <input
              value={newStepTitle}
              onChange={(evt) => setNewStepTitle(evt.target.value)}
              type="text"
            />
            <button
              onClick={() =>
                addNewStep(newStepTitle).then(
                  (r) => r._tag === "Success" && setNewStepTitle("")
                )
              }
              disabled={!newStepTitle.length || addNewStep.loading}
            >
              add step
            </button>
          </form>
        </div>
        <Table>
          <tbody>
            {t.steps.map((s, idx) => (
              <CompletableEntry completed={s.completed} key={idx}>
                <td>
                  <input
                    type="checkbox"
                    disabled={toggleStepChecked.loading}
                    checked={s.completed}
                    onChange={() => toggleStepChecked(s)}
                  />
                </td>
                <td>{s.title}</td>
                <td>
                  <button disabled={deleteStep.loading} onClick={() => deleteStep(s)}>
                    X
                  </button>
                </td>
              </CompletableEntry>
            ))}
          </tbody>
        </Table>
      </div>

      <hr />
      <div>
        <i>Updated: {t.updatedAt.toISOString()}</i>
      </div>
      <div>
        <i>Created: {t.createdAt.toISOString()}</i>
      </div>
      <div>
        <i>Id: {t.id}</i>
      </div>
    </>
  )
}

export default TaskDetail
