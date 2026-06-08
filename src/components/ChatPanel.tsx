'use client';
import { useState, useRef, useEffect } from 'react';
import { useAndesStore } from '@/store';
import type { ChatMessage } from '@/types';

const QUICK_QUESTIONS = [
  '¿Cómo me preparo físicamente?',
  '¿Qué síntomas de altitud debo monitorear?',
  '¿Puedo negociar el precio con la agencia?',
  '¿Qué pasa si el tiempo es malo el día de cumbre?',
];

export default function ChatPanel() {
  const { profile, result, chatMessages, addChatMessage, user } = useAndesStore();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, streamingText]);

  // Add welcome message if empty
  useEffect(() => {
    if (chatMessages.length === 0) {
      addChatMessage({
        role: 'assistant',
        content: `¡Hola! Soy el agente de Andes Planner AI. Estoy al tanto de tu plan para ${(profile.targetMountains || []).join(' y ')} con ${profile.groupSize} personas. ¿En qué puedo ayudarte? Puedo explicar cualquier parte de la recomendación, darte consejos de preparación, o analizar alternativas.`,
        timestamp: new Date().toISOString(),
      });
    }
  }, []);

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || isLoading) return;
    setInput('');

    const userMsg: ChatMessage = { role: 'user', content: msg, timestamp: new Date().toISOString() };
    addChatMessage(userMsg);
    setIsLoading(true);
    setStreamingText('');

    try {
      const planContext = result ? JSON.stringify({
        recommendedAgency: result.recommendedAgency?.name,
        totalBudget: result.recommendation.totalBudget,
        safetyAlerts: result.recommendation.safetyAlerts,
      }) : undefined;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatMessages, userMsg].map(m => ({ role: m.role, content: m.content })),
          profile,
          planContext,
          planId: result?.id,
          userId: user?.id,
        }),
      });

      if (!response.ok || !response.body) throw new Error('Chat failed');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        fullText += chunk;
        setStreamingText(fullText);
      }

      addChatMessage({ role: 'assistant', content: fullText, timestamp: new Date().toISOString() });
      setStreamingText('');
    } catch (error) {
      addChatMessage({ role: 'assistant', content: 'Lo siento, tuve un problema al procesar tu consulta. Por favor intenta de nuevo.', timestamp: new Date().toISOString() });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-120px)] sticky top-20 bg-white rounded-2xl border border-stone-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-stone-100 flex items-center gap-2">
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #3B6D11, #639922)' }}>C</div>
        <div>
          <div className="text-xs font-semibold" style={{ color: '#2C2C2A' }}>Agente Claude</div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-xs" style={{ color: '#888780' }}>En línea</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {chatMessages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
              msg.role === 'user'
                ? 'text-white rounded-br-sm'
                : 'rounded-bl-sm border border-stone-100'
            }`} style={msg.role === 'user'
              ? { background: '#3B6D11' }
              : { background: '#fafaf9', color: '#2C2C2A' }}>
              {msg.content}
            </div>
          </div>
        ))}
        {streamingText && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl rounded-bl-sm px-3 py-2 text-xs leading-relaxed border border-stone-100"
              style={{ background: '#fafaf9', color: '#2C2C2A' }}>
              {streamingText}
              <span className="inline-block w-1 h-3 ml-0.5 animate-pulse" style={{ background: '#3B6D11' }} />
            </div>
          </div>
        )}
        {isLoading && !streamingText && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm px-3 py-2 border border-stone-100"
              style={{ background: '#fafaf9' }}>
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ background: '#3B6D11', animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick questions */}
      {chatMessages.length <= 1 && (
        <div className="px-3 pb-2">
          <div className="text-xs mb-2" style={{ color: '#888780' }}>Preguntas frecuentes</div>
          <div className="space-y-1">
            {QUICK_QUESTIONS.map((q, i) => (
              <button key={i} onClick={() => sendMessage(q)}
                className="w-full text-left text-xs px-2.5 py-2 rounded-lg border transition-all hover:border-stone-300 hover:bg-stone-50"
                style={{ borderColor: '#e7e5e4', color: '#444441' }}>
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-3 pb-3 pt-2 border-t border-stone-100">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Pregúntame sobre tu expedición..."
            disabled={isLoading}
            className="flex-1 px-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-1 disabled:opacity-50"
            style={{ borderColor: '#e7e5e4' }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
            style={{ background: '#3B6D11' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M12 7H2M8 3l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
