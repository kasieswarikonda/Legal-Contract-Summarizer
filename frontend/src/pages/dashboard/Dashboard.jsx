import React, { useState, useEffect, useCallback } from 'react';
import useAuth from '../../hooks/useAuth';
import {
  uploadContract,
  getContracts,
  getContractById,
} from '../../services/contractService';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB, matches backend limit

function statusLabel(status) {
  switch (status) {
    case 'pending':
      return 'Pending';
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

function fileSizeLabel(bytes) {
  if (!bytes && bytes !== 0) return '\u2014';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

function formatDate(isoDate) {
  if (!isoDate) return '\u2014';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '\u2014';
  const datePart = date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const timePart = date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${datePart}, ${timePart}`;
}

function isSupportedFile(file) {
  if (!file) return false;
  return /\.(pdf|docx)$/i.test(file.name);
}

function fileTypeLabel(file) {
  if (!file) return '\u2014';
  return /\.pdf$/i.test(file.name) ? 'PDF' : 'DOCX';
}

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState(null);
  const [isError, setIsError] = useState(false);

  const [contracts, setContracts] = useState([]);
  const [loadingContracts, setLoadingContracts] = useState(true);
  const [contractsError, setContractsError] = useState(null);

  const [selectedContract, setSelectedContract] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  const loadContracts = useCallback(async () => {
    setLoadingContracts(true);
    setContractsError(null);
    try {
      const response = await getContracts();
      if (response && response.success) {
        setContracts(response.contracts || []);
      } else {
        setContractsError(
          response?.message || 'Failed to load your contracts.'
        );
      }
    } catch (error) {
      if (error?.response?.status === 401) {
        setContractsError(
          'Your session has expired. Please log in again and retry.'
        );
      } else {
        setContractsError(
          getErrorMessage(error, 'Failed to load your contracts. Please try again.')
        );
      }
    } finally {
      setLoadingContracts(false);
    }
  }, []);

  useEffect(() => {
    loadContracts();
  }, [loadContracts]);

  const handleFileChange = (e) => {
    const selected = e.target.files && e.target.files[0];
    if (!selected) return;

    if (!isSupportedFile(selected)) {
      setFile(null);
      setMessage('Invalid file type. Please select a PDF (.pdf) or Word (.docx) file.');
      setIsError(true);
      e.target.value = '';
      return;
    }

    if (selected.size > MAX_FILE_SIZE) {
      setFile(null);
      setMessage('File is too large. The maximum allowed size is 10 MB.');
      setIsError(true);
      e.target.value = '';
      return;
    }

    setFile(selected);
    setMessage(null);
    setIsError(false);
    setUploadProgress(0);
  };

  const clearFile = () => {
    setFile(null);
    const input = document.getElementById('contract-file-input');
    if (input) input.value = '';
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage('Please select a file first.');
      setIsError(true);
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setMessage(null);
    setIsError(false);

    try {
      const response = await uploadContract(file, (event) => {
        if (event && event.total) {
          setUploadProgress(Math.round((event.loaded * 100) / event.total));
        }
      });

      if (response && response.success) {
        if (response.contract && response.contract.processingStatus === 'failed') {
          setMessage(
            response.contract.extractionError ||
              'Contract uploaded, but text extraction failed.'
          );
          setIsError(true);
        } else {
          setMessage('Contract uploaded and processed successfully.');
        }
        clearFile();
        loadContracts();
      } else {
        setMessage(response?.message || 'Upload failed.');
        setIsError(true);
      }
    } catch (error) {
      if (error?.response?.status === 401) {
        setMessage('Your session has expired. Please log in again.');
      } else {
        setMessage(getErrorMessage(error, 'An error occurred during upload.'));
      }
      setIsError(true);
    } finally {
      setUploading(false);
    }
  };

  const handleCloseDetail = useCallback(() => {
    setSelectedContract(null);
    setDetailLoading(false);
    setDetailError(null);
  }, []);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') handleCloseDetail();
    }
    if (selectedContract) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedContract, handleCloseDetail]);

  const handleViewContract = async (contract) => {
    setSelectedContract(contract);
    setDetailLoading(true);
    setDetailError(null);
    try {
      const response = await getContractById(contract._id || contract.id);
      if (response && response.success) {
        setSelectedContract(response.contract);
      } else {
        setDetailError(response?.message || 'Could not load contract details.');
      }
    } catch (error) {
      if (error?.response?.status === 401) {
        setDetailError('Your session has expired. Please log in again.');
      } else {
        setDetailError(
          getErrorMessage(error, 'Could not load contract details. Please try again.')
        );
      }
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <main className="dashboard">
      <p className="eyebrow">Your workspace</p>
      <h1>Welcome, {user.name}</h1>
      <p className="muted">
        Upload and manage your legal contracts. Each contract is processed to
        extract its text.
      </p>

      <section className="dashboard-section">
        <h2>Upload a Contract</h2>
        <p className="muted">
          Select a PDF or Word (.docx) document (maximum 10 MB) to upload.
        </p>

        <div className="file-picker">
          <button
            type="button"
            className="file-picker-button"
            onClick={() => document.getElementById('contract-file-input').click()}
            disabled={uploading}
          >
            Browse File
          </button>
          <input
            id="contract-file-input"
            type="file"
            accept=".pdf,.docx"
            onChange={handleFileChange}
            disabled={uploading}
            className="file-picker-input"
          />
          <button
            type="button"
            className="btn-submit"
            onClick={handleUpload}
            disabled={uploading || !file}
          >
            {uploading
              ? uploadProgress >= 100
                ? 'Processing document...'
                : `Uploading ${uploadProgress}%`
              : 'Upload Contract'}
          </button>
        </div>

        {file && (
          <div className="file-selected">
            <span className="file-selected-icon">{fileTypeLabel(file)}</span>
            <span className="file-selected-name">{file.name}</span>
            <span className="file-selected-meta">{fileSizeLabel(file.size)}</span>
            <button
              type="button"
              className="file-clear"
              onClick={clearFile}
              disabled={uploading}
            >
              Remove
            </button>
          </div>
        )}

        {uploading && (
          <div
            className="upload-progress"
            role="progressbar"
            aria-valuenow={uploadProgress}
            aria-valuemin="0"
            aria-valuemax="100"
          >
            <div
              className="upload-progress-bar"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}

        {message && (
          <p className={`upload-message ${isError ? 'error' : 'success'}`}>
            {message}
          </p>
        )}
      </section>

      <section className="dashboard-section">
        <h2>Contract History</h2>
        <p className="muted">Every contract uploaded to your workspace.</p>

        {loadingContracts ? (
          <p className="loading-note">Loading your contracts...</p>
        ) : contractsError ? (
          <p className="error-note">{contractsError}</p>
        ) : contracts.length === 0 ? (
          <div className="empty-state">
            <p>No contracts uploaded yet.</p>
            <p className="muted">
              Upload a PDF or DOCX document above to see it here.
            </p>
          </div>
        ) : (
          <div className="contract-table-wrap">
            <table className="contract-table">
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Status</th>
                  <th>Uploaded</th>
                  <th className="contract-table-action">Actions</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((contract) => (
                  <tr key={contract._id || contract.id}>
                    <td>
                      <span className="contract-file-name">
                        {contract.originalFileName}
                      </span>
                    </td>
                    <td>
                      <span className="contract-type">{contract.fileType}</span>
                    </td>
                    <td className="contract-size">
                      {fileSizeLabel(contract.fileSize)}
                    </td>
                    <td>
                      <span
                        className={`status-badge status-badge-${contract.processingStatus}`}
                      >
                        {statusLabel(contract.processingStatus)}
                      </span>
                      {contract.processingStatus === 'failed' &&
                        contract.extractionError && (
                          <div className="status-error-note">
                            {contract.extractionError}
                          </div>
                        )}
                    </td>
                    <td className="contract-date">
                      {formatDate(contract.createdAt)}
                    </td>
                    <td className="contract-table-action">
                      <button
                        type="button"
                        className="btn-view"
                        onClick={() => handleViewContract(contract)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedContract && (
        <div className="modal-backdrop" onClick={handleCloseDetail}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="contract-detail-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 id="contract-detail-title">
                {selectedContract.originalFileName}
              </h3>
              <button
                type="button"
                className="modal-close"
                aria-label="Close"
                onClick={handleCloseDetail}
              >
                &times;
              </button>
            </div>
            <div className="modal-meta">
              <span>
                Type: {String(selectedContract.fileType || '').toUpperCase()}
              </span>
              <span>Size: {fileSizeLabel(selectedContract.fileSize)}</span>
              <span>
                Status: {statusLabel(selectedContract.processingStatus)}
              </span>
              <span>Uploaded: {formatDate(selectedContract.createdAt)}</span>
            </div>
            <div className="modal-body">
              {detailLoading ? (
                <p className="muted">Loading extracted text...</p>
              ) : detailError ? (
                <p className="form-error">{detailError}</p>
              ) : selectedContract.processingStatus === 'failed' ? (
                <p className="muted">
                  Text extraction failed for this contract.
                  {selectedContract.extractionError
                    ? ` Reason: ${selectedContract.extractionError}`
                    : ''}
                </p>
              ) : selectedContract.processingStatus === 'completed' ? (
                selectedContract.extractedText ? (
                  <pre className="contract-text">
                    {selectedContract.extractedText}
                  </pre>
                ) : (
                  <p className="muted">
                    No extracted text is available for this contract.
                  </p>
                )
              ) : (
                <p className="muted">
                  This contract is still processing. Extracted text is not
                  available yet.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}