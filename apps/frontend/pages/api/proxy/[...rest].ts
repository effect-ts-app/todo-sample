import { getSession, getAccessToken, withApiAuthRequired } from "@auth0/nextjs-auth0"
import { createProxyMiddleware } from "http-proxy-middleware"

const {
  API_ROOT = "http://localhost:3330",
  AUTH_DISABLED: PROVIDED_AUTH_DISABLED = "false",
  //AUTH0_BASE_URL = "http://localhost:3133",
} = process.env
const AUTH_DISABLED = PROVIDED_AUTH_DISABLED === "true"

// Create proxy instance outside of request handler function to avoid unnecessary re-creation

const url = new URL(API_ROOT)

const apiProxy = createProxyMiddleware({
  target: API_ROOT, // takes only the host + port.
  changeOrigin: true,
  pathRewrite: { [`^/api/proxy`]: url.pathname === "/" ? "" : url.pathname },
  secure: false,

  //   onError(err, req, res: any) {
  //     res.writeHead(302, {
  //       Location: `${AUTH0_BASE_URL}/exception?message=${err.message}`,
  //     })
  //     res.end()
  //   },
  //   onProxyReq(proxyReq, req: any, res) {
  //     /**
  //      * manually overwrite origin for CORS (changeOrigin might not work)
  //      */
  //     //proxyReq.setHeader("origin", ENDPOINT_PROXY_ORIGIN)

  //     //const requestId = greq.headers[HEADER_REQUEST_ID] // passed from fetch (Browser) to keep request id in browser too
  //     const endpoint = req.url
  //     const { method } = req

  //     console.info(`REQ ${endpoint} ${method} dest: ${API_ROOT}`)
  //   },
  //   onProxyRes(proxyRes, req: any, res) {
  //     //const requestId = greq.headers[HEADER_REQUEST_ID] // passed from fetch (Browser) to keep request id in browser too
  //     const endpoint = req.url
  //     const { method } = req
  //     const status = proxyRes.statusCode

  //     console.info(`(RES ${endpoint} ${method} ${status}  dest: ${API_ROOT}`)
  //   },
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
