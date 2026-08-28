import React, { useState } from 'react';
import useAuth from '../../hooks/useAuth';
import { uploadContract } from '../../services/contractService';

export default function Dashboard() {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const [isError, setIsError] = useState(false);

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
        setMessage('Contract uploaded successfully for processing!');
        setFile(null);
        const fileInput = document.getElementById('contract-file-input');
        if (fileInput) fileInput.value = '';
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
              accept=".pdf,.docx,.doc"
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
    </main>
  );
}
