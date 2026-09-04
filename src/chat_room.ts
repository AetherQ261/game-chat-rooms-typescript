import { z } from "zod";

export const chatBody = z.object({
  channel: z.string().min(1),
  playerId: z.string().min(1),
  message: z.string().min(1).max(500)
});
export type ChatBody = z.infer<typeof chatBody>;

export function moderationDecision(body: ChatBody): "publish" | "queue" {
  return /\b(spam|cheat|hack)\b/i.test(body.message) ? "queue" : "publish";
}
