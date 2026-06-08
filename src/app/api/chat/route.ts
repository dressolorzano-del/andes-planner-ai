import { NextRequest } from 'next/server';
import { chatWithAgent } from '@/lib/agent';

export async function POST(req: NextRequest) {
  try {
    const { messages, profile, planContext, planId, userId } = await req.json();
    const stream = await chatWithAgent(messages, profile, planContext, planId, userId);
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Chat error:', error);
    return new Response('Error en el agente', { status: 500 });
  }
}
