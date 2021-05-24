import * as h from "@effect-ts-demo/todo-client/test.helpers"
import { User } from "@effect-ts-demo/todo-types/User"

export * from "@effect-ts-demo/todo-client/test.helpers"

export function testUser() {
  return new User({
    id: h.userIdUnsafe("2"),
    name: h.reasonableStringUnsafe("Patroklos"),
    email: h.emailUnsafe("some@test.com"),
    phoneNumber: h.phoneNumberUnsafe("555-444-123"),
  })
}
