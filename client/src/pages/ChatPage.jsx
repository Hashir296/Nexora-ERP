import { useEffect, useState } from 'react';
import { PageHeader } from '../components/ui';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function ChatPage() {
  const [room, setRoom] = useState('general');
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState('');
  const [announcements, setAnnouncements] = useState([]);

  const load = async () => {
    const [chat, ann] = await Promise.all([
      api.get(`/platform/chat/${room}`),
      api.get('/platform/announcements'),
    ]);
    setMessages(chat.data.data.items || []);
    setAnnouncements(ann.data.data.items || []);
  };

  useEffect(() => { load().catch(() => {}); }, [room]);

  const send = async () => {
    if (!body.trim()) return;
    try {
      await api.post(`/platform/chat/${room}`, { body });
      setBody('');
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Send failed');
    }
  };

  return (
    <div>
      <PageHeader title="Communication" subtitle="Internal chat, groups, and announcements." />
      <div className="grid grid-2">
        <div className="card chat-box">
          <div className="tabs">
            {['general', 'engineering', 'sales'].map((r) => (
              <button key={r} className={`tab${room === r ? ' active' : ''}`} onClick={() => setRoom(r)}>{r}</button>
            ))}
          </div>
          <div className="chat-messages">
            {messages.map((m) => (
              <div key={m._id} className="bubble assistant">
                <strong>{m.sender?.name || 'User'}: </strong>{m.body}
              </div>
            ))}
          </div>
          <div className="chat-input">
            <input value={body} onChange={(e) => setBody(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Message…" />
            <button className="btn" onClick={send}>Send</button>
          </div>
        </div>
        <div className="card">
          <h3>Announcements</h3>
          {announcements.map((a) => (
            <div key={a._id} style={{ marginBottom: '0.85rem' }}>
              <strong>{a.title}</strong>
              <p style={{ margin: '0.25rem 0', color: 'var(--text-muted)' }}>{a.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
