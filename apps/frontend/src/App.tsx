import React from "react"
import { BrowserRouter, Redirect, Route, Switch } from "react-router-dom"

import Tasks from "./Tasks"
import logo from "./logo.svg"
import "./App.css"

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
      </header>
      <section id="main">
        <BrowserRouter>
          <Switch>
            <Route
              path="/:category"
              render={({
                match: {
                  params: { category },
                },
              }) => <Tasks category={category} />}
            ></Route>
            <Route path="/">
              <Redirect to="/tasks" />
            </Route>
          </Switch>
        </BrowserRouter>
      </section>
    </div>
  )
}

export default App
