import { makeQueryString } from "./utils"

describe("makeQueryString", () => {
  it("works", () => {
    const r = makeQueryString({ a: 1, b: 2, c: "3" })
    expect(r).toBe("?a=1&b=2&c=3")
  })

  it("drops undefined", () => {
    const r = makeQueryString({ a: 1, b: undefined, c: "3" })
    expect(r).toBe("?a=1&c=3")
  })
})
