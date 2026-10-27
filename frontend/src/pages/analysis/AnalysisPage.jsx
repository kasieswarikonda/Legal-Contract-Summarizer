import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { triggerAnalysis, getAnalysis, getReport } from '../../services/analysisService';
import { getContractById } from '../../services/contractService';
import AnalysisResult from '../../components/analysis/AnalysisResult';
import QAPanel from '../../components/analysis/QAPanel';

function downloadTextReport(report) {
  const lines = [
    `LEGAL CONTRACT ANALYSIS REPORT`,
    `Generated: ${new Date(report.generatedAt).toLocaleString()}`,
    ``,
    `FILE: ${report.contract.fileName} (${report.contract.fileType?.toUpperCase()})`,
    `UPLOADED: ${new Date(report.contract.uploadedAt).toLocaleString()}`,
    ``,
    `━━━ SUMMARY ━━━`,
    report.summary,
    ``,
    `━━━ RISK SCORE: ${report.riskScore}/100 ━━━`,
    ``,
    `━━━ DETECTED RISKS ━━━`,
    ...(report.risks || []).map(r => `[${r.level?.toUpperCase()}] ${r.clause}\n  ${r.explanation}`),
    ``,
    `━━━ IMPORTANT CLAUSES ━━━`,
    ...(report.importantClauses || []).map(c => `• ${c.title}\n  ${c.explanation}`),
    ``,
    `━━━ Q&A HISTORY ━━━`,
    ...(report.qaHistory || []).map(q => `Q: ${q.question}\nA: ${q.answer}`),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${report.contract.fileName}-analysis.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AnalysisPage() {
  const { contractId } = useParams();
  const navigate = useNavigate();

  const [contract, setContract] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | analyzing | done | error
  const [errorMsg, setErrorMsg] = useState('');
  const [reportLoading, setReportLoading] = useState(false);

  const loadExisting = useCallback(async () => {
    try {
      const res = await getAnalysis(contractId);
      if (res.success && res.analysis?.status === 'completed') {
        setAnalysis(res.analysis);
        setStatus('done');
        return true;
      }
    } catch { /* no existing analysis */ }
    return false;
  }, [contractId]);

  useEffect(() => {
    async function init() {
      try {
        const cRes = await getContractById(contractId);
        if (!cRes.success) { setErrorMsg('Contract not found.'); setStatus('error'); return; }
        setContract(cRes.contract);

        const found = await loadExisting();
        if (found) return;

        setStatus('analyzing');
        const aRes = await triggerAnalysis(contractId);
        if (aRes.success) {
          setAnalysis(aRes.analysis);
          setStatus('done');
        } else {
          setErrorMsg(aRes.message || 'Analysis failed.');
          setStatus('error');
        }
      } catch (err) {
        setErrorMsg(err?.response?.data?.message || 'Something went wrong.');
        setStatus('error');
      }
    }
    init();
  }, [contractId, loadExisting]);

  async function handleReanalyze() {
    setStatus('analyzing');
    setErrorMsg('');
    try {
      const aRes = await triggerAnalysis(contractId);
      if (aRes.success) { setAnalysis(aRes.analysis); setStatus('done'); }
      else { setErrorMsg(aRes.message || 'Analysis failed.'); setStatus('error'); }
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'Something went wrong.');
      setStatus('error');
    }
  }

  async function handleDownloadReport() {
    setReportLoading(true);
    try {
      const res = await getReport(contractId);
      if (res.success) downloadTextReport(res.report);
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to generate report.');
    } finally {
      setReportLoading(false);
    }
  }

  return (
    <main className="dashboard">
      <button className="btn-back" onClick={() => navigate('/dashboard')}>← Back to Dashboard</button>

      {contract && (
        <div className="analysis-header">
          <p className="eyebrow">Contract Analysis</p>
          <h1>{contract.originalFileName}</h1>
          <p className="muted">{contract.fileType?.toUpperCase()} · {contract.fileSize ? (contract.fileSize / 1024).toFixed(1) + ' KB' : ''}</p>
        </div>
      )}

      {status === 'loading' && <p className="loading-note">Loading contract...</p>}

      {status === 'analyzing' && (
        <div className="analyzing-state">
          <div className="analyzing-spinner" />
          <p>Analyzing contract with AI... This may take a moment.</p>
        </div>
      )}

      {status === 'error' && (
        <div className="dashboard-section">
          <p className="error-note">{errorMsg}</p>
          <button className="btn-submit" style={{ marginTop: '1rem' }} onClick={() => navigate('/dashboard')}>Go Back</button>
        </div>
      )}

      {status === 'done' && analysis && (
        <>
          <div className="analysis-actions">
            <button className="btn-submit" onClick={handleDownloadReport} disabled={reportLoading}>
              {reportLoading ? 'Generating...' : '⬇ Download Report'}
            </button>
            <button className="btn-view" onClick={handleReanalyze}>Re-analyze</button>
          </div>
          <div className="dashboard-section">
            <AnalysisResult analysis={analysis} />
          </div>
          <div className="dashboard-section">
            <QAPanel contractId={contractId} initialHistory={analysis.qaHistory || []} />
          </div>
        </>
      )}
    </main>
  );
}
