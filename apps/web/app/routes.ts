import { index, type RouteConfig, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("search", "routes/search.tsx"),
  route("check/:id", "routes/check.tsx"),
  route("profile/:id", "routes/profile.tsx"),
  route("methodology", "routes/methodology.tsx"),
  route("data", "routes/data.tsx"),
  route("request", "routes/request.tsx"),
] satisfies RouteConfig;
