import React from 'react';
import logo from './logo.svg';
import './App.css';

import Tasks from "./Tasks"

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
      </header>
      <section id="main">
<Tasks />
          </section>
    </div>
  );
}

export default App;
