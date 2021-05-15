import * as S from "@effect-ts-demo/core/ext/Schema"
import { Task, User } from "@effect-ts-demo/todo-types/Task"
import * as fc from "fast-check"
import { Random } from "fast-check"
import * as rand from "pure-rand"

const rnd = new Random(rand.congruential(5))

it("works", () => {
  const userARB = S.Arbitrary.for(User.Model)(fc)
  const taskARB = S.Arbitrary.for(Task.Model)(fc)

  console.log(userARB.generate(rnd).value)
  console.log(taskARB.generate(rnd).value)
})
