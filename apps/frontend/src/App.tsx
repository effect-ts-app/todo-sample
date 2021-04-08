import React from "react"
import { BrowserRouter } from "react-router-dom"

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
          <Tasks />
        </BrowserRouter>
      </section>
    </div>
  )
}

export default App
