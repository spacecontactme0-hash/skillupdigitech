import test from "node:test"
import assert from "node:assert/strict"
import { getTokenFromRequest } from "@/lib/jwt"

test("getTokenFromRequest rejects empty, trimmed, or sentinel Bearer values", () => {
  const cases = [
    new Request("http://localhost:3000/api/campuses/1/classrooms", {
      headers: { authorization: "Bearer" },
    }),
    new Request("http://localhost:3000/api/campuses/1/classrooms", {
      headers: { authorization: "Bearer   " },
    }),
    new Request("http://localhost:3000/api/campuses/1/classrooms", {
      headers: { authorization: "Bearer null" },
    }),
    new Request("http://localhost:3000/api/campuses/1/classrooms", {
      headers: { authorization: "Bearer undefined" },
    }),
  ]

  for (const req of cases) {
    assert.equal(getTokenFromRequest(req), null)
  }
})

test("getTokenFromRequest extracts HttpOnly token cookie even when Authorization header is empty", () => {
  const req = new Request("http://localhost:3000/api/campuses/1/classrooms", {
    headers: {
      cookie: "other=1; token=valid-cookie-jwt-token; theme=light",
      authorization: "Bearer ",
    },
  })

  assert.equal(getTokenFromRequest(req), "valid-cookie-jwt-token")
})

test("getTokenFromRequest falls back to valid Authorization Bearer header when no cookie is present", () => {
  const req = new Request("http://localhost:3000/api/campuses/1/classrooms", {
    headers: {
      authorization: "Bearer valid-header-jwt-token",
    },
  })

  assert.equal(getTokenFromRequest(req), "valid-header-jwt-token")
})
