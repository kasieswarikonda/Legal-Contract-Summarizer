import React, { useState, useRef } from 'react';
import { uploadContract } from '../../services/contractService';

const MAX = 10 * 1024 * 1024;

function sizeLabel(b) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(2)} MB`;
}

export default function UploadPanel({ onUploaded }) {
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState(null);
  const inputRef = useRef();

  function pick(f) {
    if (!f) return;
    if (!/\.(pdf|docx)$/i.test(f.name)) { setMsg({ type: 'error', text: 'Only PDF or DOCX files are allowed.' }); return; }
    if (f.size > MAX) { setMsg({ type: 'error', text: 'File must be under 10 MB.' }); return; }
    setFile(f); setMsg(null); setProgress(0);
  }

  function onDrop(e) {
    e.preventDefault(); setDrag(false);
    pick(e.dataTransfer.files?.[0]);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true); setProgress(0); setMsg(null);
    try {
      const res = await uploadContract(file, ev => {
        if (ev?.total) setProgress(Math.round((ev.loaded * 100) / ev.total));
      });
      if (res?.success) {
        setMsg({ type: 'success', text: 'Contract uploaded! Starting analysis...' });
        setFile(null);
        onUploaded(res.contract);
      } else {
        setMsg({ type: 'error', text: res?.message || 'Upload failed.' });
      }
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Upload error.' });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="welcome-screen">
      <div className="welcome-icon">⚖</div>
      <h2>Legal Contract Analyzer</h2>
      <p>Upload a contract to get an AI-powered summary, risk score, important clauses, and ask questions in plain English.</p>

      <div
        className={`upload-drop-zone${drag ? ' drag-over' : ''}`}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        onClick={() => !file && !uploading && inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" accept=".pdf,.docx" onChange={e => pick(e.target.files?.[0])} />
        <div className="upload-dz-icon">📂</div>
        <div className="upload-dz-title">Drop your contract here</div>
        <div className="upload-dz-sub">PDF or DOCX · Max 10 MB</div>

        {!file && (
          <button className="upload-choose-btn" onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}>
            Choose File
          </button>
        )}

        {file && (
          <div className="upload-file-preview" onClick={e => e.stopPropagation()}>
            <span className="upload-file-type">{/\.pdf$/i.test(file.name) ? 'PDF' : 'DOCX'}</span>
            <span className="upload-file-name">{file.name}</span>
            <span className="upload-file-size">{sizeLabel(file.size)}</span>
            <button className="upload-file-remove" onClick={() => { setFile(null); setMsg(null); }}>✕</button>
          </div>
        )}

        {uploading && (
          <div className="upload-progress-wrap" onClick={e => e.stopPropagation()}>
            <div className="upload-progress-track">
              <div className="upload-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="upload-progress-text">{progress >= 100 ? 'Processing...' : `Uploading ${progress}%`}</div>
          </div>
        )}
      </div>

      {file && !uploading && (
        <button className="upload-submit-btn" onClick={handleUpload}>
          Analyze Contract
        </button>
      )}

      {msg && <div className={`upload-msg ${msg.type}`}>{msg.text}</div>}
    </div>
  );
}
