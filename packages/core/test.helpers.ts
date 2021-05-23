import * as S from "@effect-ts-app/core/ext/Schema"

export const positiveInt = S.Constructor.for(S.positiveInt)
export const positiveIntUnsafe = positiveInt["|>"](S.unsafe)
export const reasonableString = S.Constructor.for(S.reasonableString)
export const reasonableStringUnsafe = reasonableString["|>"](S.unsafe)

export const nonEmptyString = S.Constructor.for(S.nonEmptyString)
export const nonEmptyStringUnsafe = nonEmptyString["|>"](S.unsafe)

export const email = S.Constructor.for(S.Email)
export const emailUnsafe = email["|>"](S.unsafe)
export const phoneNumber = S.Constructor.for(S.PhoneNumber)
export const phoneNumberUnsafe = phoneNumber["|>"](S.unsafe)
