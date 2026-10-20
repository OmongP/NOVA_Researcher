import { onRequestGet as __api_auth_status_js_onRequestGet } from "/Users/a453039/Documents/박혜영/AIResearchAgent/finance-auto-ux-finder/functions/api/auth/status.js"
import { onRequestPost as __api_dark_search_js_onRequestPost } from "/Users/a453039/Documents/박혜영/AIResearchAgent/finance-auto-ux-finder/functions/api/dark/search.js"
import { onRequest as __api_ai___path___js_onRequest } from "/Users/a453039/Documents/박혜영/AIResearchAgent/finance-auto-ux-finder/functions/api/ai/[[path]].js"
import { onRequestPost as __api_search_js_onRequestPost } from "/Users/a453039/Documents/박혜영/AIResearchAgent/finance-auto-ux-finder/functions/api/search.js"

export const routes = [
    {
      routePath: "/api/auth/status",
      mountPath: "/api/auth",
      method: "GET",
      middlewares: [],
      modules: [__api_auth_status_js_onRequestGet],
    },
  {
      routePath: "/api/dark/search",
      mountPath: "/api/dark",
      method: "POST",
      middlewares: [],
      modules: [__api_dark_search_js_onRequestPost],
    },
  {
      routePath: "/api/ai/:path*",
      mountPath: "/api/ai",
      method: "",
      middlewares: [],
      modules: [__api_ai___path___js_onRequest],
    },
  {
      routePath: "/api/search",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_search_js_onRequestPost],
    },
  ]