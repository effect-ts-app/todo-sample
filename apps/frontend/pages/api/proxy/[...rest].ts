import { getSession, getAccessToken, withApiAuthRequired } from "@auth0/nextjs-auth0"
import { createProxyMiddleware } from "http-proxy-middleware"

const {
  API_ROOT = "http://localhost:3330",
  AUTH_DISABLED: PROVIDED_AUTH_DISABLED = "false",
} = process.env
const AUTH_DISABLED = PROVIDED_AUTH_DISABLED === "true"

// Create proxy instance outside of request handler function to avoid unnecessary re-creation

const apiProxy = createProxyMiddleware({
  target: API_ROOT,
  changeOrigin: true,
  pathRewrite: { [`^/api/proxy`]: "" },
  secure: false,
})

export default AUTH_DISABLED
  ? apiProxy
  : withApiAuthRequired(async function proxy(req, res) {
      const s = getSession(req, res)
      if (s) {
        // If your Access Token is expired and you have a Refresh Token
        // `getAccessToken` will fetch you a new one using the `refresh_token` grant
        const { accessToken } = await getAccessToken(req, res, {
          // demand scopes; error when don't have.
          scopes: ["openid", "profile", "read:tasks"],
          refresh: true,
        })
        req.headers["authorization"] = `Bearer ${accessToken}`
      }

      // @ts-expect-error doc
      return apiProxy(req, res)
    })

export const config = { api: { externalResolver: true, bodyParser: false } }

export async function getServerSideProps() {
  return {
    props: {}, // will be passed to the page component as props
  }
}
