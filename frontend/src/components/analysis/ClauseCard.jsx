import React, { useState } from 'react';

export default function ClauseCard({ clause }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="clause-card">
      <button className="clause-card-header" onClick={() => setOpen(o => !o)}>
        <span>{clause.title}</span>
        <span className="clause-toggle">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="clause-card-body">
          {clause.content && <p className="clause-content-text">"{clause.content}"</p>}
          {clause.explanation && <p className="clause-explanation-text">{clause.explanation}</p>}
        </div>
      )}
    </div>
  );
}
