import React, { useState, useEffect, useCallback } from 'react';
import useAuth from '../../hooks/useAuth';
import {
  uploadContract,
  getContracts,
} from '../../services/contractService';

function statusLabel(status) {
  switch (status) {
    case 'pending':
      return 'Pending (Processing)';
    case 'processing':
      return 'Processing';
    case 'completed':
      return 'Completed';
    case 'failed':
      return 'Failed';
    default:
      return status;
  }
}

export default function Dashboard() {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const [isError, setIsError] = useState(false);
  const [contracts, setContracts] = useState([]);
  const [loadingContracts, setLoadingContracts] = useState(true);

  const loadContracts = useCallback(async () => {
    try {
      const response = await getContracts();
      if (response && response.success) {
        setContracts(response.contracts || []);
      }
    } catch (error) {
      console.error('Failed to load contracts:', error);
    } finally {
      setLoadingContracts(false);
    }
  }, []);

  useEffect(() => {
    loadContracts();
  }, [loadContracts]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMessage(null);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage('Please select a file first.');
      setIsError(true);
      return;
    }

    setUploading(true);
    setMessage(null);
    setIsError(false);

    try {
      const response = await uploadContract(file);
      if (response && response.success) {
        if (response.contract && response.contract.processingStatus === 'failed') {
          setMessage(
            response.contract.extractionError ||
              'Contract uploaded, but text extraction failed.'
          );
          setIsError(true);
        } else {
          setMessage('Contract uploaded successfully for processing!');
        }
        setFile(null);
        const fileInput = document.getElementById('contract-file-input');
        if (fileInput) fileInput.value = '';
        loadContracts();
      } else {
        setMessage(response.message || 'Upload failed.');
        setIsError(true);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'An error occurred during upload.';
      setMessage(errorMsg);
      setIsError(true);
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className="dashboard">
      <p className="eyebrow">Your workspace</p>
      <h1>Welcome, {user.name}</h1>
      <p className="muted">Your account is successfully authenticated.</p>
      <p className="muted">You are now ready to use the Legal Contract Summarizer.</p>

      <section className="contract-upload-section" style={{ marginTop: '2rem', padding: '1.5rem', border: '1px solid var(--border-color, #eaeaea)', borderRadius: '8px' }}>
        <h2>Legal Contract Upload</h2>
        <p className="muted" style={{ marginBottom: '1rem' }}>Upload your PDF or DOCX contract for processing.</p>

        <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
          <div>
            <input
              id="contract-file-input"
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileChange}
              disabled={uploading}
              style={{ display: 'block', width: '100%' }}
            />
          </div>

          <button
            type="submit"
            disabled={uploading || !file}
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#4A90E2',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: uploading || !file ? 'not-allowed' : 'pointer',
              opacity: uploading || !file ? 0.6 : 1
            }}
          >
            {uploading ? 'Processing...' : 'Upload Contract'}
          </button>
        </form>

        {message && (
          <p style={{ marginTop: '1rem', color: isError ? '#D0021B' : '#00875A', fontWeight: 'bold' }}>
            {message}
          </p>
        )}
      </section>

      <section className="contract-list-section" style={{ marginTop: '2rem', padding: '1.5rem', border: '1px solid var(--border-color, #eaeaea)', borderRadius: '8px' }}>
        <h2>Your Contracts</h2>
        {loadingContracts ? (
          <p className="muted">Loading contracts...</p>
        ) : contracts.length === 0 ? (
          <p className="muted">No contracts uploaded yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #eaeaea' }}>File Name</th>
                <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #eaeaea' }}>Type</th>
                <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #eaeaea' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((contract) => (
                <tr key={contract._id}>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #eaeaea' }}>{contract.originalFileName}</td>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #eaeaea', textTransform: 'uppercase' }}>{contract.fileType}</td>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #eaeaea' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '0.15rem 0.6rem',
                        borderRadius: '999px',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        color: '#fff',
                        backgroundColor:
                          contract.processingStatus === 'completed'
                            ? '#00875A'
                            : contract.processingStatus === 'failed'
                            ? '#D0021B'
                            : '#F0A500'
                      }}
                    >
                      {statusLabel(contract.processingStatus)}
                    </span>
                    {contract.processingStatus === 'failed' && contract.extractionError && (
                      <div style={{ marginTop: '0.25rem', color: '#D0021B', fontSize: '0.85rem' }}>
                        {contract.extractionError}
                      </div>
                    )}
                    {contract.processingStatus === 'completed' && contract.extractedText && (
                      <div style={{ marginTop: '0.25rem', color: '#666', fontSize: '0.85rem', maxWidth: '400px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {contract.extractedText}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
