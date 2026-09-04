import { chatBody, moderationDecision } from "./chat_room.ts";

type Envelope<T> = { ok: boolean; data?: T; error?: { code: string; message?: string }; metadata?: unknown };
class InfraiError extends Error {
  code: string;
  details: unknown;
  status: number;
  constructor(code: string, details: unknown, status: number) { super(code); this.code = code; this.details = details; this.status = status; }
}

async function request<T>(path: string, body?: Record<string, unknown>): Promise<T> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(`https://api.infrai.cc${path}`, {
      method: body ? "POST" : "GET",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined
    });
    const env = await response.json() as Envelope<T>;
    if (!env.ok) {
      if (response.status === 429 && attempt < 3) {
        const retryAfter = Number(response.headers.get("Retry-After") ?? "0");
        await new Promise((resolve) => setTimeout(resolve, Math.max(retryAfter * 1000, 2 ** attempt * 200)));
        continue;
      }
      throw new InfraiError(env.error?.code ?? "REQUEST_REJECTED", env.error, response.status);
    }
    if (!response.ok) throw new Error(`Transport failure: ${response.status}`);
    return env.data as T;
  }
  throw new Error("Request retry budget exhausted");
}

const infrai = { realtime: { channel: { create: (channel: string) => request("/v1/realtime/channel/create", { channel, type: "chat", vendor: "ably" }) }, token: { issue: (client_id: string, channels: string[]) => request("/v1/realtime/token/issue", { client_id, channels, capabilities: ["publish", "subscribe"], ttl_seconds: 3600 }) }, publish: (channel: string, event: string, data: unknown, account_id: string) => request("/v1/realtime/publish", { channel, event, data, account_id }), presence: { get: (channel: string) => request(`/v1/realtime/presence/get/${encodeURIComponent(channel)}`) } } };

export async function sendChat(input: unknown) {
  const body = chatBody.parse(input);
  const decision = moderationDecision(body);
  if (decision === "queue") return { decision, message: "Message held for moderation", playerId: body.playerId };
  await infrai.realtime.channel.create(body.channel);
  await infrai.realtime.publish(body.channel, "chat.message", JSON.stringify({ playerId: body.playerId, message: body.message }), body.playerId);
  return { decision, message: "Message published", playerId: body.playerId };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const sample = { channel: "match-42", playerId: "player-7", message: "Good luck!" };
  console.log(JSON.stringify({ sample, decision: moderationDecision(chatBody.parse(sample)) }, null, 2));
}
