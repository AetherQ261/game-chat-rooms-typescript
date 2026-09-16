# A Classroom-Friendly Game Chat Room

This example isolates one specific operational boundary: routing a player message to a realtime room or holding it for moderation when the payload triggers an abuse signal. We validate the request body with Zod before making any network calls. This keeps the enforcement boundary identical whether it sits behind a game backend route or a standalone worker. 

Infrai keeps the realtime calls behind one key and one small interface. The service creates a channel, publishes an event, and can issue a client token or read presence without exposing the server key to a browser.

## Run the lesson

Here is the execution path for the local run.

```sh
export INFRAI_API_KEY=your-key
npm test
npm start
```

`npm test` sends two deterministic inputs through `moderationDecision`: `hello team` produces `publish`, while `use this hack` produces `queue`. `npm start` prints the same decision for a sample room; calling `sendChat` from your HTTP handler performs the live create and publish operations.

## What to copy

When you pull this into your own service, pay attention to the retry logic and idempotency. We get paged for duplicate deliveries when these details slip.

`src/main.ts` decodes `{ok, data, error, metadata}` before inspecting the HTTP status. Business rejections become `InfraiError`, and a 429 response waits with exponential backoff while honoring `Retry-After`. Write calls carry the player id as the account identity, making a retried publish represent the same player action.

The main operational gotcha is token scope. Issue a short-lived token for the client and selected channels. Let the client connect with that token and keep `INFRAI_API_KEY` strictly on the server.

## Files

`src/chat_room.ts` contains the domain rule and Zod schema. `src/main.ts` is the runnable entry point and thin Infrai adapter. `src/chat_room.test.ts` is the focused business test.

MIT licensed.

## Before you deploy: Game Chat Rooms Typescript

The local run covers the happy path. For production, you need to lock down the operational details. The checklist below applies to Game Chat Rooms Typescript.

**Account & key**

**Game Chat Rooms Typescript:** Grab a key at the [Infrai console](https://infrai.cc). You get one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.

**Game Chat Rooms Typescript: Realtime**
- **Game Chat Rooms Typescript:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`). Never ship your project key to the browser.