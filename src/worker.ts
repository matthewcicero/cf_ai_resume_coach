export interface Env {
  AI: Ai;
  SESSIONS: DurableObjectNamespace;
}

const MODEL_CANDIDATES = [
  "@cf/meta/llama-3.3-70b-instruct",
  "@cf/meta/llama-3.1-8b-instruct"
];

function pickModel(supported: string[] | undefined) {
  if (!supported || supported.length === 0) return MODEL_CANDIDATES[1];
  for (const m of MODEL_CANDIDATES) if (supported.includes(m)) return m;
  return supported?.[0] || MODEL_CANDIDATES[1];
}

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/generate" && request.method === "POST") {
      const cookie = request.headers.get("Cookie") || "";
      let sid = (cookie.match(/sid=([a-zA-Z0-9_-]+)/) || [])[1];
      if (!sid) sid = crypto.randomUUID();

      const id = env.SESSIONS.idFromName(sid);
      const stub = env.SESSIONS.get(id);
      const res = await stub.fetch(request.url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-sid": sid },
        body: await request.text(),
      });

      if (!cookie.includes("sid=")) {
        const r = new Response(res.body, res);
        r.headers.append("Set-Cookie", `sid=${sid}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`);
        return r;
      }
      return res;
    }

    return new Response("OK");
  }
};

export class SessionDO {
  state: DurableObjectState;
  env: Env;
  historyKey = "history";

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request) {
    const { mode, jd, resume, bullet, context } = await request.json<any>();

    const system = makeSystemPrompt(mode);
    const user = makeUserPrompt(mode, { jd, resume, bullet, context });

    const history: any[] = (await this.state.storage.get(this.historyKey)) || [];
    const messages = [{ role: "system", content: system }, ...history, { role: "user", content: user }].slice(-9);

    const list = await this.env.AI.models();
    const model = pickModel(list?.map(m => m.id));
    const result = await this.env.AI.run(model, { messages });
    const reply = (result as any)?.response ?? (result as any)?.output_text ?? "";

    const newHistory = [...history, { role: "user", content: user }, { role: "assistant", content: reply }].slice(-10);
    await this.state.storage.put(this.historyKey, newHistory);

    return new Response(JSON.stringify({ reply, model }), { headers: { "Content-Type": "application/json" } });
  }
}

function makeSystemPrompt(mode: string) {
  const base = `You are a concise resume and JD coach. Use numbers and outcomes. Avoid fluff. Keep answers short.`;
  switch (mode) {
    case "MATCH_JD":
      return `${base}
Task: Create 3 tailored bullets mapping the background to the JD. One line each. Start with a verb. Include a number/outcome.`;
    case "REWRITE_BULLET":
      return `${base}
Task: Rewrite one bullet to be tighter and more impactful. One line only. Prefer active voice. Add scope/number if missing.`;
    case "STAR":
      return `${base}
Task: Produce a 4-line STAR story (Situation, Task, Action, Result). Result must include a measurable outcome.`;
    default:
      return base;
  }
}

function makeUserPrompt(mode: string, data: any) {
  const { jd = "", resume = "", bullet = "", context = "" } = data || {};
  if (mode === "MATCH_JD") return `JOB DESCRIPTION:\n${jd}\n\nBACKGROUND:\n${resume}\n\nReturn exactly 3 bullet lines.`;
  if (mode === "REWRITE_BULLET") return `ORIGINAL BULLET:\n${bullet}\n\nConstraints: one line, stronger verb, add scope/number if missing.`;
  if (mode === "STAR") return `Context:\n${context}\n\nReturn exactly 4 lines: Situation, Task, Action, Result.`;
  return `User request:\n${context || bullet || resume || jd}`;
}
