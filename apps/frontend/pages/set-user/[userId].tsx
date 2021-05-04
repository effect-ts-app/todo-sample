import { useRouter } from "next/router"

import { useEffect } from "@/data"

const SetUser = () => {
  const r = useRouter()

  useEffect(() => {
    if (r.query.userId) {
      window.localStorage.setItem("user-id", r.query.userId as string)
      window.location.href = "/tasks"
    }
  }, [r.query.userId])
  return null
}

export default SetUser
