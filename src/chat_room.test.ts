import assert from "node:assert/strict";
import { chatBody, moderationDecision } from "./chat_room.ts";

assert.equal(moderationDecision(chatBody.parse({ channel: "match-42", playerId: "p1", message: "hello team" })), "publish");
assert.equal(moderationDecision(chatBody.parse({ channel: "match-42", playerId: "p1", message: "use this hack" })), "queue");
console.log("chat moderation decisions pass");
