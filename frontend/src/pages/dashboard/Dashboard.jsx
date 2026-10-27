import React, { useState, useEffect, useCallback } from 'react';
import useAuth from '../../hooks/useAuth';
import { getContracts, deleteContract, pinContract } from '../../services/contractService';
import { triggerAnalysis, getAnalysis, getReport } from '../../services/analysisService';
import Sidebar from '../../components/common/Sidebar';
import UploadPanel from '../../components/analysis/UploadPanel';
import AnalysisResult from '../../components/analysis/AnalysisResult';
import QAPanel from '../../components/analysis/QAPanel';

function downloadReport(report) {
  const lines = [
    'LEGAL CONTRACT ANALYSIS REPORT',
    `Generated: ${new Date(report.generatedAt).toLocaleString()}`,
    '',
    `FILE: ${report.contract.fileName} (${report.contract.fileType?.toUpperCase()})`,
    '',
    '━━━ SUMMARY ━━━',
    report.summary,
    '',
    `━━━ RISK SCORE: ${report.riskScore}/100 ━━━`,
    '',
    '━━━ DETECTED RISKS ━━━',
    ...(report.risks || []).map(r => `[${r.level?.toUpperCase()}] ${r.clause}\n  ${r.explanation}`),
    '',
    '━━━ IMPORTANT CLAUSES ━━━',
    ...(report.importantClauses || []).map(c => `• ${c.title}\n  ${c.explanation}`),
    '',
    '━━━ Q&A HISTORY ━━━',
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

export default function Dashboard() {
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [contracts, setContracts] = useState([]);
  const [activeContract, setActiveContract] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [viewStatus, setViewStatus] = useState('welcome'); // welcome | analyzing | done | error
  const [errorMsg, setErrorMsg] = useState('');
  const [reportLoading, setReportLoading] = useState(false);

  const loadContracts = useCallback(async () => {
    try {
      const res = await getContracts();
      if (res?.success) setContracts(res.contracts || []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { loadContracts(); }, [loadContracts]);

  // Listen for Q&A answers to reload analysis
  useEffect(() => {
    async function onQaAnswered() {
      if (!activeContract) return;
      try {
        const res = await getAnalysis(activeContract._id);
        if (res.success) setAnalysis(res.analysis);
      } catch { /* silent */ }
    }
    window.addEventListener('qa-answered', onQaAnswered);
    return () => window.removeEventListener('qa-answered', onQaAnswered);
  }, [activeContract]);

  async function openContract(contract) {
    setActiveContract(contract);
    setAnalysis(null);
    setErrorMsg('');

    if (contract.processingStatus !== 'completed') {
      setViewStatus('error');
      setErrorMsg('This contract failed to process. Please upload it again.');
      return;
    }

    // Check for existing analysis
    try {
      const res = await getAnalysis(contract._id);
      if (res.success && res.analysis?.status === 'completed') {
        setAnalysis(res.analysis);
        setViewStatus('done');
        return;
      }
    } catch { /* no existing */ }

    // Trigger new analysis
    setViewStatus('analyzing');
    try {
      const res = await triggerAnalysis(contract._id);
      if (res.success) { setAnalysis(res.analysis); setViewStatus('done'); }
      else { setErrorMsg(res.message || 'Analysis failed.'); setViewStatus('error'); }
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'AI analysis failed.');
      setViewStatus('error');
    }
  }

  async function handleReanalyze() {
    if (!activeContract) return;
    setViewStatus('analyzing'); setAnalysis(null); setErrorMsg('');
    try {
      const res = await triggerAnalysis(activeContract._id);
      if (res.success) { setAnalysis(res.analysis); setViewStatus('done'); }
      else { setErrorMsg(res.message || 'Analysis failed.'); setViewStatus('error'); }
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'AI analysis failed.');
      setViewStatus('error');
    }
  }

  async function handleDownloadReport() {
    if (!activeContract) return;
    setReportLoading(true);
    try {
      const res = await getReport(activeContract._id);
      if (res.success) downloadReport(res.report);
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to generate report.');
    } finally { setReportLoading(false); }
  }

  function handleUploaded(contract) {
    loadContracts().then(() => {
      // Auto-open the newly uploaded contract for analysis
      openContract({ ...contract, _id: contract.id || contract._id, processingStatus: contract.processingStatus });
    });
  }

  async function handlePin(contractId) {
    try {
      await pinContract(contractId);
      await loadContracts();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to pin contract.');
    }
  }

  async function handleDelete(contractId) {
    try {
      await deleteContract(contractId);
      // If the deleted contract is currently open, go back to welcome
      if (activeContract?._id === contractId) handleNewContract();
      await loadContracts();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to delete contract.');
    }
  }

  function handleNewContract() {
    setActiveContract(null);
    setAnalysis(null);
    setViewStatus('welcome');
    setErrorMsg('');
  }

  const topbarTitle = activeContract ? activeContract.originalFileName : `Welcome, ${user?.name}`;

  return (
    <div className="app-shell">
      <Sidebar
        contracts={contracts}
        activeId={activeContract?._id}
        onSelect={openContract}
        onNewContract={handleNewContract}
        onPin={handlePin}
        onDelete={handleDelete}
        collapsed={sidebarCollapsed}
      />

      <div className="main-content">
        {/* Topbar */}
        <div className="main-topbar">
          <button className="topbar-toggle" onClick={() => setSidebarCollapsed(c => !c)} title="Toggle sidebar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <span className="topbar-title">{topbarTitle}</span>
          {viewStatus === 'done' && (
            <div className="topbar-actions">
              <button className="topbar-btn" onClick={handleReanalyze}>Re-analyze</button>
              <button className="topbar-btn primary" onClick={handleDownloadReport} disabled={reportLoading}>
                {reportLoading ? 'Generating...' : '⬇ Report'}
              </button>
            </div>
          )}
        </div>

        {/* Main area */}
        {viewStatus === 'welcome' && (
          <UploadPanel onUploaded={handleUploaded} />
        )}

        {viewStatus === 'analyzing' && (
          <div className="analyzing-state">
            <div className="analyzing-dots">
              <span /><span /><span />
            </div>
            <p className="analyzing-text">Analyzing contract with AI...</p>
          </div>
        )}

        {viewStatus === 'error' && (
          <div className="error-state">
            <div className="error-state-icon">⚠️</div>
            <h3>Analysis Failed</h3>
            <p>{errorMsg}</p>
            <button className="error-state-btn" onClick={handleNewContract}>Upload New Contract</button>
          </div>
        )}

        {viewStatus === 'done' && analysis && (
          <div className="analysis-view">
            <AnalysisResult analysis={analysis} />
            <QAPanel contractId={activeContract._id} />
          </div>
        )}
      </div>
    </div>
  );
}
