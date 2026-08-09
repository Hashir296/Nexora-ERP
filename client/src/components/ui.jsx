export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="page-header">
      <div>
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {actions ? <div style={{ display: 'flex', gap: '0.5rem' }}>{actions}</div> : null}
    </div>
  );
}

export function EmptyState({ text = 'No records yet' }) {
  return <div className="empty">{text}</div>;
}

export function LoadingBlock() {
  return (
    <div className="grid" style={{ gap: '0.6rem' }}>
      <div className="skeleton" style={{ height: 18 }} />
      <div className="skeleton" style={{ height: 18, width: '80%' }} />
      <div className="skeleton" style={{ height: 18, width: '65%' }} />
    </div>
  );
}

export function Modal({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function StatusBadge({ value }) {
  const v = String(value || '').toLowerCase();
  let cls = 'badge';
  if (['paid', 'approved', 'active', 'won', 'done', 'completed', 'present', 'open'].includes(v)) cls += ' success';
  else if (['pending', 'draft', 'late', 'review', 'qualified'].includes(v)) cls += ' warning';
  else if (['rejected', 'lost', 'cancelled', 'overdue', 'critical'].includes(v)) cls += ' danger';
  else cls += ' info';
  return <span className={cls}>{value}</span>;
}
