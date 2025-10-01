# cf_ai_resume_coach

An AI resume and job-description coach built on Cloudflare Workers AI with memory via Durable Objects.  
It focuses on three tasks instead of open-ended chat:

- **Match JD** → generate tailored bullets that map your experience to a job description  
- **Rewrite bullet** → tighten one resume bullet with metrics and action verbs  
- **STAR** → turn a situation into a short STAR story (Situation, Task, Action, Result)

## Why this isn’t “just chat”
- Task modes, not open prompts  
- Short, recruiter-friendly outputs  
- Per-session memory (recent context stored in a Durable Object)  

## Stack
- Workers AI: Llama 3.3 Instruct (`@cf/meta/llama-3.3-70b-instruct` if available, falls back to 8B)
- Cloudflare Worker + Durable Object for state
- Minimal HTML UI served by the Worker

## Run locally
1) Install Wrangler  
```bash
npm install -g wrangler
