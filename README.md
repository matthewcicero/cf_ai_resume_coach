# cf_ai_resume_coach

An AI resume and job-description coach built on Cloudflare Workers AI with memory via Durable Objects.  
It focuses on three tasks instead of open-ended chat:

- **Match JD** → generate tailored bullets that map your experience to a job description  
- **Rewrite bullet** → tighten one resume bullet with metrics and action verbs  
- **STAR** → turn a situation into a short STAR story (Situation, Task, Action, Result)

## Stack
- Workers AI (Llama 3.3 Instruct)
- Cloudflare Worker + Durable Object for state
- Minimal HTML UI served by the Worker

## Run locally
```bash
npm install
npx wrangler dev
