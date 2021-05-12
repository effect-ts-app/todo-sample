//import { handleAuth } from "@auth0/nextjs-auth0"

// export default handleAuth()

// pages/api/auth/[...auth0].js
import { handleAuth, handleLogin } from "@auth0/nextjs-auth0"

export default handleAuth({
  async login(req, res) {
    try {
      await handleLogin(req, res, {
        authorizationParams: {
          audience: "http://localhost:3330/api/proxy", // or AUTH0_AUDIENCE
          // Add the `offline_access` scope to also get a Refresh Token
          // request scopes; if available, will get, otherwise will be ignored
          // make sure RBAC is enabled!
          scope: "openid offline_access profile email read:tasks", // or AUTH0_SCOPE // read:products
        },
      })
    } catch (error) {
      res.status(error.status || 400).end(error.message)
    }
  },
})
