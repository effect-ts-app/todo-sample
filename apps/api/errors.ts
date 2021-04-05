export class NotFoundError {
  public readonly _tag = "NotFoundError"
  public readonly message: string
  constructor(type: string, id: string) {
    this.message = `Didn't find ${type}#${id}`
  }
}
