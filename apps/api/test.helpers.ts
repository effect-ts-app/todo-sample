import { Email, PhoneNumber, ReasonableString } from "@effect-ts-app/core/Schema"
import { UserId } from "@effect-ts-demo/todo-types/"
import { User } from "@effect-ts-demo/todo-types/User"

export function testUser() {
  return new User({
    id: UserId.unsafe("2"),
    name: ReasonableString.unsafe("Patroklos"),
    email: Email.unsafe("some@test.com"),
    phoneNumber: PhoneNumber.unsafe("555-444-123"),
  })
}
