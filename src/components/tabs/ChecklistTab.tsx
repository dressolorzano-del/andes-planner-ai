'use client';
import { useState } from 'react';
import { useAndesStore } from '@/store';
import type { ChecklistItem } from '@/types';

const PRIORITY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  essential: { bg: '#fcebeb', text: '#A32D2D', label: 'Esencial' },
  recommended: { bg: '#faeeda', text: '#BA7517', label: 'Recomendado' },
  optional: { bg: '#f1efe8', text: '#5F5E5A', label: 'Opcional' },
};

export default function ChecklistTab() {
  const { result, setResult } = useAndesStore();
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('all');
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});

  if (!result) return null;

  const toggleItem = (itemId: string) => {
    const updated = {
      ...result,
      checklist: result.checklist.map(item =>
        item.id === itemId ? { ...item, checked: !item.checked } : item
      ),
    };
    setResult(updated);
  };

  const checklist = result.checklist.filter(item => {
    if (filter === 'pending') return !item.checked;
    if (filter === 'done') return item.checked;
    return true;
  });

  const categories = Array.from(new Set(result.checklist.map(i => i.category)));
  const doneCount = result.checklist.filter(i => i.checked).length;
  const total = result.checklist.length;
  const pct = Math.round((doneCount / total) * 100);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Checklist personalizada</h2>
        <span className="text-xs" style={{ color: '#888780' }}>{doneCount}/{total} completados</span>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium" style={{ color: '#2C2C2A' }}>Preparación</span>
          <span className="text-sm font-bold" style={{ color: '#3B6D11' }}>{pct}%</span>
        </div>
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: '#f1efe8' }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: pct >= 80 ? '#3B6D11' : pct >= 50 ? '#639922' : '#BA7517' }} />
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {[['all', 'Todos'], ['pending', 'Pendientes'], ['done', 'Completados']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val as any)}
            className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: filter === val ? '#3B6D11' : 'white',
              color: filter === val ? 'white' : '#5F5E5A',
              border: `1px solid ${filter === val ? '#3B6D11' : '#e7e5e4'}`,
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* Items by category */}
      {categories.map(cat => {
        const catItems = checklist.filter(i => i.category === cat);
        if (catItems.length === 0) return null;
        const isExpanded = expandedCats[cat] !== false; // default expanded
        const catDone = result.checklist.filter(i => i.category === cat && i.checked).length;
        const catTotal = result.checklist.filter(i => i.category === cat).length;

        return (
          <div key={cat} className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-5 py-3 hover:bg-stone-50 transition-all"
              onClick={() => setExpandedCats(s => ({ ...s, [cat]: !isExpanded }))}>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold" style={{ color: '#2C2C2A' }}>{cat}</span>
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: catDone === catTotal ? '#f0f7e6' : '#f1efe8', color: catDone === catTotal ? '#3B6D11' : '#888780' }}>
                  {catDone}/{catTotal}
                </span>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                <path d="M4 6l4 4 4-4" stroke="#888780" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {isExpanded && (
              <div className="border-t border-stone-100">
                {catItems.map((item, i) => (
                  <div key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className={`flex items-start gap-3 px-5 py-3 cursor-pointer transition-all hover:bg-stone-50 ${
                      i < catItems.length - 1 ? 'border-b border-stone-100' : ''
                    } ${item.checked ? 'opacity-60' : ''}`}>
                    <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
                      style={{
                        background: item.checked ? '#3B6D11' : 'white',
                        border: `1.5px solid ${item.checked ? '#3B6D11' : '#d6d3d1'}`,
                      }}>
                      {item.checked && (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 flex-wrap">
                        <span className={`text-sm ${item.checked ? 'line-through' : ''}`} style={{ color: '#2C2C2A' }}>
                          {item.item}
                        </span>
                        <span className="text-xs px-1.5 py-0.5 rounded flex-shrink-0"
                          style={{ background: PRIORITY_STYLES[item.priority]?.bg, color: PRIORITY_STYLES[item.priority]?.text }}>
                          {PRIORITY_STYLES[item.priority]?.label}
                        </span>
                        {item.coveredByAgency && (
                          <span className="text-xs px-1.5 py-0.5 rounded flex-shrink-0"
                            style={{ background: '#e1f5ee', color: '#0F6E56' }}>
                            Agencia lo provee
                          </span>
                        )}
                      </div>
                      {item.notes && <p className="text-xs mt-0.5" style={{ color: '#888780' }}>{item.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
