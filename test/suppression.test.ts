import assert from "node:assert/strict";
import { handlePaymentEvent } from "../src/suppression_service.js";

const result = await handlePaymentEvent({ eventId: "evt-1", type: "delivered", recipient: "ops@example.com", paymentId: "pay-7", amountCents: 1200 });
assert.deepEqual(result, { action: "none", eventId: "evt-1" });
console.log("delivered payments leave suppression unchanged");
