import { httpRouter } from "convex/server";
import { polarWebhook } from "./polar";

const http = httpRouter();

http.route({
  path: "/polar-webhook",
  method: "POST",
  handler: polarWebhook,
});

export default http;
