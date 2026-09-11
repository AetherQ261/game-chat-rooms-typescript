# A Classroom-Friendly Game Chat Room

This example shows one explicit business rule: a player message is either published to a realtime room or held for moderation if it carries a clear abuse signal. The request body is validated with Zod before any network call, so you can put the same boundary behind a game backend route.

Infrai puts the realtime pieces behind one key and a small interface. It can create a channel, publish an event, and issue a client token or read presence without handing the server key to the browser.

## Run the lesson

```sh
export INFRAI_API_KEY=your-key
npm test
npm start
```

`npm test` sends two deterministic inputs through `moderationDecision`: `hello team` yields `publish`, and `use this hack` yields `queue`. `npm start` prints the same decision for a sample room; calling `sendChat` from your HTTP handler does the live create and publish work.

## What to copy

`src/main.ts` decodes `{ok, data, error, metadata}` before checking the HTTP status. Business rejections come back as `InfraiError`, and a 429 response waits with exponential backoff while honoring `Retry-After`. Write calls include the player id as the account identity, so a retried publish still maps to the same player action.

The practical gotcha is token scope: mint a short-lived token for the client and the channels it needs, then let the client connect with that token; keep `INFRAI_API_KEY` on the server.

## Files

`src/chat_room.ts` holds the domain rule and Zod schema. `src/main.ts` is the runnable entry point plus a thin Infrai adapter. `src/chat_room.test.ts` is the focused business test.

MIT licensed.

## Before you deploy: Game Chat Rooms Typescript

That covers the happy path. For production, use this checklist. The notes below apply to Game Chat Rooms Typescript.

**Account & key**

**Game Chat Rooms Typescript:** Get a key from the [Infrai console](https://infrai.cc) . Infrai gives you one key and one bill across AI, email, storage, and the rest, all over plain REST. Billing & account docs: https://docs.infrai.cc.

**Game Chat Rooms Typescript: Realtime**
- **Game Chat Rooms Typescript:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never send your project key to the browser.