import fs from "fs"
import { promisify } from "util"

import * as T from "@effect-ts/core/Effect"

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)
const exists = promisify(fs.exists)
// const mkdir = promisify(fs.mkdir)
// const deleteFile = promisify(fs.unlink)

export function writeTextFile(fileName: string, content: string) {
  return T.tryPromise(() => writeFile(fileName, content, "utf-8"))["|>"](T.orDie)
}

export function fileExists(fileName: string) {
  return T.tryPromise(() => exists(fileName))["|>"](T.orDie)
}

export function readTextFile(fileName: string) {
  return T.tryPromise(() => readFile(fileName, "utf-8"))
}
