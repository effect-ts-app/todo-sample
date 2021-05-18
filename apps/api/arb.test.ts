import { Task, User } from "@effect-ts-demo/todo-types"
import * as fc from "fast-check"
import { Random } from "fast-check"
import * as rand from "pure-rand"

const rnd = new Random(rand.congruential(5))

it("works", () => {
  const userARB = User.Arbitrary(fc)
  const taskARB = Task.Arbitrary(fc)

  console.log(userARB.generate(rnd).value)
  console.log(taskARB.generate(rnd).value)
})
