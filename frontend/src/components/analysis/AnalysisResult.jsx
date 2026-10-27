import React from 'react';
import RiskBadge from './RiskBadge';
import ClauseCard from './ClauseCard';

function riskLevel(score) {
  if (score >= 75) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 25) return 'medium';
  return 'low';
}

function riskDesc(score) {
  if (score >= 75) return 'High risk — review carefully before signing.';
  if (score >= 50) return 'Moderate-high risk — several clauses need attention.';
  if (score >= 25) return 'Moderate risk — a few areas to watch.';
  return 'Low risk — contract appears relatively safe.';
}

export default function AnalysisResult({ analysis }) {
  const level = riskLevel(analysis.riskScore ?? 0);

  return (
    <div className="analysis-scroll">

      {/* Summary */}
      <div className="chat-block">
        <div className="chat-label">📋 Summary</div>
        <div className="chat-bubble ai">
          <p className="summary-text">{analysis.summary}</p>
        </div>
      </div>

      {/* Risk Score */}
      <div className="chat-block">
        <div className="chat-label">🔴 Risk Assessment</div>
        <div className="chat-bubble ai">
          <div className="risk-score-block">
            <div className={`risk-score-number ${level}`}>{analysis.riskScore ?? 0}</div>
            <div className="risk-score-bar-wrap">
              <div className="risk-score-bar-track">
                <div className={`risk-score-bar-fill ${level}`} style={{ width: `${analysis.riskScore ?? 0}%` }} />
              </div>
              <div className="risk-score-desc">{riskDesc(analysis.riskScore ?? 0)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Risks */}
      {analysis.risks?.length > 0 && (
        <div className="chat-block">
          <div className="chat-label">⚠️ Detected Risks ({analysis.risks.length})</div>
          <div className="chat-bubble ai">
            <div className="risk-list">
              {analysis.risks.map((r, i) => (
                <div key={i} className="risk-item">
                  <div className="risk-item-header">
                    <span className="risk-clause-name">{r.clause}</span>
                    <RiskBadge level={r.level} />
                  </div>
                  <p className="risk-explanation">{r.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Important Clauses */}
      {analysis.importantClauses?.length > 0 && (
        <div className="chat-block">
          <div className="chat-label">📌 Important Clauses ({analysis.importantClauses.length})</div>
          <div className="chat-bubble ai">
            <div className="clause-list">
              {analysis.importantClauses.map((c, i) => (
                <ClauseCard key={i} clause={c} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Q&A History */}
      {analysis.qaHistory?.length > 0 && (
        <div className="chat-block">
          <div className="chat-label">💬 Q&A History</div>
          {[...analysis.qaHistory].reverse().map((item, i) => (
            <React.Fragment key={i}>
              <div className="chat-bubble user" style={{ marginBottom: '.5rem' }}>
                <strong>You:</strong> {item.question}
              </div>
              <div className="chat-bubble ai" style={{ marginBottom: '.75rem' }}>
                {item.answer}
              </div>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
