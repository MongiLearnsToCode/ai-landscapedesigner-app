import { httpRouter } from "convex/server";
import { polarWebhook } from "./polar";

const http = httpRouter();

http.route({
  path: "/webhooks/polar",
  method: "POST",
  handler: polarWebhook,
});

export default http;