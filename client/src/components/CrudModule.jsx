import { useMemo, useState } from 'react';
import { useCrud } from '../hooks/useCrud';
import { PageHeader, EmptyState, LoadingBlock, Modal, StatusBadge } from './ui';

export default function CrudModule({
  title,
  subtitle,
  endpoint,
  columns,
  fields,
  mapRow,
  hideHeader = false,
}) {
  const [q, setQ] = useState('');
  const params = useMemo(() => (q ? { q } : {}), [q]);
  const { items, loading, total, create, update, remove, reload } = useCrud(endpoint, params);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setForm(Object.fromEntries(fields.map((f) => [f.name, f.defaultValue ?? ''])));
    setOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    const next = {};
    fields.forEach((f) => {
      next[f.name] = item[f.name] ?? '';
    });
    setForm(next);
    setOpen(true);
  };

  const onSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      fields.forEach((f) => {
        if (f.type === 'number') payload[f.name] = Number(payload[f.name] || 0);
      });
      if (editing) await update(editing._id, payload);
      else await create(payload);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {!hideHeader ? (
        <PageHeader
          title={title}
          subtitle={subtitle || `${total} records in MongoDB`}
          actions={(
            <>
              <button className="btn btn-ghost" onClick={reload}>Refresh</button>
              <button className="btn" onClick={openCreate}>Add new</button>
            </>
          )}
        />
      ) : (
        <div className="module-toolbar">
          <div>
            <strong>{title}</strong>
            <span className="badge info" style={{ marginLeft: 8 }}>{total} records</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={reload}>Refresh</button>
            <button className="btn btn-sm" onClick={openCreate}>Add</button>
          </div>
        </div>
      )}

      <div className="card table-wrap">
        <div className="table-tools">
          <input
            placeholder="Search…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ maxWidth: 280 }}
          />
          <span className="kpi-hint">Live from API · {endpoint}</span>
        </div>
        {loading ? <LoadingBlock /> : items.length === 0 ? <EmptyState text="No records in database yet" /> : (
          <table>
            <thead>
              <tr>
                {columns.map((c) => <th key={c}>{c}</th>)}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id}>
                  {(mapRow ? mapRow(item) : columns.map(() => '-')).map((cell, idx) => (
                    <td key={idx}>{cell}</td>
                  ))}
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(item)}>Edit</button>{' '}
                    <button className="btn btn-danger btn-sm" onClick={() => remove(item._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={open} title={editing ? `Edit ${title}` : `Create ${title}`} onClose={() => setOpen(false)}>
        <form className="form" onSubmit={onSave}>
          {fields.map((f) => (
            <label key={f.name}>
              {f.label}
              {f.type === 'select' ? (
                <select value={form[f.name]} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}>
                  {(f.options || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : f.type === 'textarea' ? (
                <textarea rows={3} value={form[f.name]} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} />
              ) : (
                <input
                  type={f.type || 'text'}
                  required={f.required}
                  value={form[f.name]}
                  onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                />
              )}
            </label>
          ))}
          <button className="btn" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save to database'}</button>
        </form>
      </Modal>
    </div>
  );
}

export { StatusBadge };
