import { z } from "zod";
import { infrai } from "./infrai.js";

export const paymentEvent = z.object({
  eventId: z.string().min(1),
  type: z.enum(["hard_bounce", "delivered"]),
  recipient: z.string().email(),
  paymentId: z.string().min(1),
  amountCents: z.number().int().nonnegative()
});
export type PaymentEvent = z.infer<typeof paymentEvent>;

export async function handlePaymentEvent(input: unknown) {
  const event = paymentEvent.parse(input);
  if (event.type !== "hard_bounce") return { action: "none" as const, eventId: event.eventId };

  const status = await infrai.email.suppression.check(event.recipient);
  const audit = await infrai.email.send({
    to: event.recipient,
    subject: `Payment ${event.paymentId} notification`,
    html: `<p>Payment ${event.paymentId} for ${event.amountCents} cents needs a verified contact channel.</p>`
  }, `audit:${event.eventId}`);
  if (!status.suppressed) await infrai.email.suppression.add(event.recipient, "hard_bounce", `bounce:${event.eventId}`);
  return { action: "suppress_and_audit" as const, eventId: event.eventId, messageId: audit.message_id };
}
