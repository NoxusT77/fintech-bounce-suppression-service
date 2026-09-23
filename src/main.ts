import { createServer } from "node:http";
import { handlePaymentEvent } from "./suppression_service.js";

const server = createServer(async (request, response) => {
  if (request.method !== "POST" || request.url !== "/payment-events") { response.writeHead(404).end(); return; }
  let raw = "";
  for await (const chunk of request) raw += chunk;
  try {
    const result = await handlePaymentEvent(JSON.parse(raw));
    response.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(result));
  } catch (error) {
    response.writeHead(400, { "content-type": "application/json" }).end(JSON.stringify({ error: error instanceof Error ? error.message : "invalid request" }));
  }
});

server.listen(Number(process.env.PORT ?? 3000), () => console.log("payment event service listening"));
