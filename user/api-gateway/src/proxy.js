import proxy from "express-http-proxy"
import http from "http"

// Keep-alive agent for connection reuse (reduces TCP handshake overhead)
const keepAliveAgent = new http.Agent({
  keepAlive: true,
  keepAliveMsecs: 30000,
  maxSockets: 100,
  maxFreeSockets: 10
})

export function createProxy(target) {
  return proxy(target, {
    proxyReqPathResolver: req => req.originalUrl,

    // Connection timeout settings
    timeout: 30000,
    proxyTimeout: 30000,

    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      // Use keep-alive agent for connection reuse
      proxyReqOpts.agent = keepAliveAgent

      // ✅ Only attach headers if user exists
      if (srcReq.user?.userId) {
        proxyReqOpts.headers["x-user-id"] = srcReq.user.userId
      }

      if (srcReq.user?.role) {
        proxyReqOpts.headers["x-user-role"] = srcReq.user.role
      }

      return proxyReqOpts
    }
  })
}
