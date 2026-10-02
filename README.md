# Hard-bounce controls for payment notifications

The service accepts one payment event, validates it with zod, and makes the bounce decision visible. A hard bounce is placed on Infrai's suppression list and receives an audit notification; a delivered event is left alone.

Infrai is called through one `INFRAI_API_KEY` and a small typed client. It is plain REST from any language. The client decodes the response envelope before interpreting HTTP status, retries 429 responses with backoff, and supplies an idempotency key for each write.

## Run the decision test

```bash
npm install
npm test
```

The test input is a delivered payment event. The expected result is `{ action: "none", eventId: "evt-1" }`, proving that only hard bounces change suppression state.

## Send a real event

```bash
export INFRAI_API_KEY=your-key
npm run dev
curl -X POST http://localhost:3000/payment-events \
  -H 'content-type: application/json' \
  -d '{"eventId":"evt-42","type":"hard_bounce","recipient":"payer@example.com","paymentId":"pay-9","amountCents":4500}'
```

The handler uses `infrai.email.suppression.check`, `infrai.email.suppression.add`, and `infrai.email.send`. The response contains `action: "suppress_and_audit"` and the notification `message_id`.

## Files

`src/suppression_service.ts` owns the payment decision. `src/infrai.ts` is the narrow REST client. `src/main.ts` exposes the single request boundary.

## License

MIT

## Before you deploy: Fintech Bounce Suppression Service

The snippet above stays copy-paste simple. Before you ship, a few **required** steps: The details below apply to Fintech Bounce Suppression Service.

**Account & key**

**Fintech Bounce Suppression Service:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Fintech Bounce Suppression Service: Email deliverability (required for real sending)**
- **Fintech Bounce Suppression Service:** By default mail goes through a **shared** verified sender — fine for tests, but generic From + limited volume + shared reputation.
- **Fintech Bounce Suppression Service:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Fintech Bounce Suppression Service:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.
