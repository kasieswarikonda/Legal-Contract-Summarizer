import React, { useState, useRef } from 'react';
import { askQuestion } from '../../services/analysisService';

export default function QAPanel({ contractId }) {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const textareaRef = useRef();

  async function handleAsk() {
    if (!question.trim() || loading) return;
    setLoading(true); setError('');
    try {
      await askQuestion(contractId, question.trim());
      setQuestion('');
      window.dispatchEvent(new CustomEvent('qa-answered'));
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to get answer.');
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAsk(); }
  }

  return (
    <div className="qa-bar">
      <div className="qa-bar-inner">
        <div className="qa-label-row">
          <span className="qa-label-icon">💬</span>
          <span className="qa-label-text">Ask a question about this contract</span>
          <span className="qa-label-hint">Press Enter to send</span>
        </div>
        <div className="qa-input-row">
          <textarea
            ref={textareaRef}
            className="qa-textarea"
            rows={2}
            placeholder="e.g. What are the termination conditions? What penalties apply for breach?"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={loading}
          />
          <button className="qa-send-btn" onClick={handleAsk} disabled={loading || !question.trim()}>
            {loading ? 'Asking...' : 'Ask AI'}
          </button>
        </div>
        {error && <p className="qa-error">{error}</p>}
      </div>
    </div>
  );
}
