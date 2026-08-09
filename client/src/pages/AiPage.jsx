import { useEffect, useState } from 'react';
import api from '../services/api';
import { PageHeader } from '../components/ui';
import toast from 'react-hot-toast';

const SUGGESTIONS = [
  'How much leave do I have left?',
  'Who are the top 5 employees by salary?',
  "What is this month's profit?",
  "Compare this month's sales with last month",
  'Show low stock items and reorder suggestions',
  'Write a short CEO summary for this month',
];

export default function AiPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [provider, setProvider] = useState('');
  const [model, setModel] = useState('');
  const [warning, setWarning] = useState('');

  useEffect(() => {
    api.get('/ai/history').then((res) => setMessages(res.data.data.messages || [])).catch(() => {});
  }, []);

  const ask = async (text) => {
    const message = (text || input).trim();
    if (!message) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', content: message }]);
    setBusy(true);
    try {
      const { data } = await api.post('/ai/ask', { message });
      const payload = data.data;
      setProvider(payload.provider || '');
      setModel(payload.model || '');
      setWarning(payload.warning || '');
      if (payload.warning) toast(payload.warning, { icon: '⚠️', duration: 5000 });
      setMessages((m) => [...m, { role: 'assistant', content: payload.answer }]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Nexora AI Assistant"
        subtitle="Google Gemini + live MongoDB ERP data. Clean answers only — no raw API dumps."
        actions={(
          <>
            {provider ? (
              <span className={`badge ${provider === 'google-gemini' ? 'success' : 'warning'}`}>
                {provider}
              </span>
            ) : null}
            {model ? <span className="badge info">{model}</span> : null}
          </>
        )}
      />
      {warning ? (
        <div className="card" style={{ marginBottom: '0.85rem', borderColor: '#f59e0b' }}>
          <strong>Gemini note:</strong> {warning}
        </div>
      ) : null}
      <div className="card chat-box ai-shell">
        <div className="ai-suggestions">
          {SUGGESTIONS.map((s) => (
            <button key={s} className="tab" onClick={() => ask(s)}>{s}</button>
          ))}
        </div>
        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="empty">Ask in English. Answers use your real company data.</div>
          ) : null}
          {messages.map((m, i) => (
            <div key={i} className={`bubble ${m.role === 'user' ? 'user' : 'assistant'}`}>{m.content}</div>
          ))}
        </div>
        <div className="chat-input">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. Compare this month sales with last month…"
            onKeyDown={(e) => e.key === 'Enter' && ask()}
          />
          <button className="btn" disabled={busy} onClick={() => ask()}>
            {busy ? 'Thinking…' : 'Ask AI'}
          </button>
        </div>
      </div>
    </div>
  );
}
