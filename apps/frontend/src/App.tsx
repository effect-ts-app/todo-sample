import qs from "querystring"

import React from "react"
import { BrowserRouter, Redirect, Route, Switch } from "react-router-dom"

import Tasks from "./Tasks"
import logo from "./logo.svg"
import "./App.css"

function getQueryParam(search: qs.ParsedUrlQuery, param: string) {
  const v = search[param]
  if (Array.isArray(v)) {
    return v[0]
  }
  return v ?? null
}

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
                location,
                match: {
                  params: { category },
                },
              }) => {
                const pars = qs.parse(location.search.slice(1))

                return (
                  <Tasks
                    category={category}
                    order={getQueryParam(pars, "order")}
                    orderDirection={getQueryParam(pars, "orderDirection")}
                  />
                )
              }}
            />
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
