import React, { useState } from 'react';
import useAuth from '../../hooks/useAuth';

function statusBadgeClass(s) {
  if (s === 'completed') return 'badge-completed';
  if (s === 'failed') return 'badge-failed';
  return 'badge-pending';
}

function HistoryItem({ c, activeId, onSelect, onPin, onDelete }) {
  const [deleting, setDeleting] = useState(false);
  const [pinning, setPinning] = useState(false);

  async function handlePin(e) {
    e.stopPropagation();
    setPinning(true);
    try { await onPin(c._id); } finally { setPinning(false); }
  }

  async function handleDelete(e) {
    e.stopPropagation();
    if (!window.confirm('Delete this contract and its analysis?')) return;
    setDeleting(true);
    try { await onDelete(c._id); } finally { setDeleting(false); }
  }

  return (
    <div
      className={`history-item${activeId === c._id ? ' active' : ''}`}
      onClick={() => onSelect(c)}
    >
      <span className="history-item-icon">📄</span>
      <span className="history-item-name">{c.originalFileName}</span>
      <div className="history-item-actions">
        <button
          className={`history-action-btn${c.pinned ? ' pinned' : ''}`}
          onClick={handlePin}
          disabled={pinning}
          title={c.pinned ? 'Unpin' : 'Pin'}
        >
          📌
        </button>
        <button
          className="history-action-btn delete"
          onClick={handleDelete}
          disabled={deleting}
          title="Delete"
        >
          🗑
        </button>
      </div>
    </div>
  );
}

export default function Sidebar({ contracts, activeId, onSelect, onNewContract, onPin, onDelete, collapsed }) {
  const { user, logout } = useAuth();

  const pinned = contracts.filter(c => c.pinned);
  const recent = contracts.filter(c => !c.pinned);

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      <div className="sidebar-top">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">⚖</div>
          LegalAI
        </div>
        <button className="new-contract-btn" onClick={onNewContract}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Contract
        </button>
      </div>

      <div className="sidebar-history">
        {pinned.length > 0 && (
          <>
            <div className="sidebar-section-label">📌 Pinned</div>
            {pinned.map(c => (
              <HistoryItem key={c._id} c={c} activeId={activeId} onSelect={onSelect} onPin={onPin} onDelete={onDelete} />
            ))}
          </>
        )}

        {recent.length > 0 && (
          <>
            <div className="sidebar-section-label">Recent</div>
            {recent.map(c => (
              <HistoryItem key={c._id} c={c} activeId={activeId} onSelect={onSelect} onPin={onPin} onDelete={onDelete} />
            ))}
          </>
        )}

        {contracts.length === 0 && (
          <p className="sidebar-empty">No contracts yet. Upload one to get started.</p>
        )}
      </div>

      <div className="sidebar-bottom">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{user?.name?.[0]?.toUpperCase() || 'U'}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name}</div>
            <div className="sidebar-user-role">{user?.email}</div>
          </div>
          <button className="sidebar-logout" title="Logout" onClick={logout}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
