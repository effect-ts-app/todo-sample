<template>
  <div class="container">
    <div>
      <Logo />
      <ul id="example-1">
        <li v-for="task in tasks" :key="task.id">
          {{ task.title }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import * as Todo from '@effect-ts-demo/todo-types'
import * as TodoClient from '@effect-ts-demo/todo-client'
import { pipe } from '@effect-ts/core/Function'
import * as T from '@effect-ts/core/Effect'

const config = Object.freeze({
  apiUrl: 'http://localhost:3330', // '/api'
})

export default Vue.extend({
  data() {
    return {
      tasks: [] as readonly Todo.Task[],
    }
  },

  async fetch() {
    await pipe(
      TodoClient.Tasks.getTasks,
      T.chain((r) => T.succeedWith(() => (this.tasks = r.items))),
      T.provideLayer(TodoClient.LiveApiConfig(config)),
      T.runPromise
    )
  },
})
</script>

<style>
.container {
  margin: 0 auto;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.title {
  font-family: 'Quicksand', 'Source Sans Pro', -apple-system, BlinkMacSystemFont,
    'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  display: block;
  font-weight: 300;
  font-size: 100px;
  color: #35495e;
  letter-spacing: 1px;
}

.subtitle {
  font-weight: 300;
  font-size: 42px;
  color: #526488;
  word-spacing: 5px;
  padding-bottom: 15px;
}

.links {
  padding-top: 15px;
}
</style>
