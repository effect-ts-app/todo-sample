import {
  emailUnsafe,
  phoneNumberUnsafe,
  reasonableStringUnsafe,
  userIdUnsafe,
} from "@effect-ts-demo/todo-client/test.helpers"
import { User } from "@effect-ts-demo/todo-types/User"

export * from "@effect-ts-demo/todo-client/test.helpers"

export function testUser() {
  return new User({
    id: userIdUnsafe("2"),
    name: reasonableStringUnsafe("Patroklos"),
    email: emailUnsafe("some@test.com"),
    phoneNumber: phoneNumberUnsafe("555-444-123"),
  })
}
