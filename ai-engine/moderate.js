/**
 * MonM AI Moderation — Groq API content check
 * Run as worker or from backend
 */
import 'dotenv/config';
import fetch from 'node-fetch';

const GROQ_API = 'https://api.groq.com/openai/v1/chat/completions';
const API_KEY = process.env.GROQ_API_KEY;

export async function moderateContent(text) {
  if (!API_KEY) return { safe: true, reason: 'no_api_key' };
  try {
    const res = await fetch(GROQ_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'You are a content moderator. Reply ONLY with JSON: {"safe": true/false, "reason": "brief reason"}. Consider hate speech, violence, illegal content, harassment.',
          },
          { role: 'user', content: text.substring(0, 2000) },
        ],
        max_tokens: 100,
        temperature: 0,
      }),
    });
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '{}';
    const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, '').trim());
    return { safe: parsed.safe !== false, reason: parsed.reason || '' };
  } catch (e) {
    return { safe: true, reason: 'moderation_error: ' + e.message };
  }
}

if (process.argv[2]) {
  moderateContent(process.argv[2]).then(console.log);
}
