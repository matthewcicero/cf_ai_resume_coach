export default {
  async fetch(request: Request) {
    const url = new URL(request.url);

    if (url.pathname === "/api/generate" && request.method === "POST") {
      // For the smoke test, just echo something back
      return new Response(JSON.stringify({ reply: "Hello from Resume Coach (local test)!" }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response("OK, worker is running");
  }
}
