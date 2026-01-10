import proxy from "express-http-proxy"

export function createProxy(target) {
  return proxy(target, {
    proxyReqPathResolver: req => req.originalUrl,

    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      // ✅ Supabase JWT uses 'sub' for user ID
      const userId = srcReq.user?.sub || srcReq.user?.userId
      if (userId) {
        proxyReqOpts.headers["x-user-id"] = userId
      }

      if (srcReq.user?.role) {
        proxyReqOpts.headers["x-user-role"] = srcReq.user.role
      }

      return proxyReqOpts
    }
  })
}
