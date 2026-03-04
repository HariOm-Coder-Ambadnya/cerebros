import { useState, useRef, useCallback } from 'react';
import {
  Upload, FileText, File, Trash2, CheckCircle2, XCircle,
  RefreshCw, FileUp, HardDrive, Layers
} from 'lucide-react';
import { api } from '../lib/api';
import { useDocuments } from '../hooks/useDocuments';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';

function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1048576).toFixed(1)}MB`;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
}

export function UploadPage() {
  const { documents, loading, refetch, deleteDocument } = useDocuments();
  const [dragActive, setDragActive] = useState(false);
  const [uploads, setUploads] = useState([]); // {file, status, progress, result, error}
  const fileRef = useRef(null);

  const processFile = useCallback(async (file) => {
    const id = Date.now() + Math.random();
    setUploads((prev) => [...prev, { id, file, status: 'uploading', progress: 0 }]);

    try {
      const result = await api.uploadFile(file, (progress) => {
        setUploads((prev) =>
          prev.map((u) => (u.id === id ? { ...u, progress } : u))
        );
      });

      setUploads((prev) =>
        prev.map((u) => (u.id === id ? { ...u, status: 'success', result, progress: 100 } : u))
      );
      refetch();
    } catch (err) {
      setUploads((prev) =>
        prev.map((u) => (u.id === id ? { ...u, status: 'error', error: err.message } : u))
      );
    }
  }, [refetch]);

  const handleFiles = useCallback((files) => {
    Array.from(files).forEach((file) => {
      const ext = file.name.split('.').pop().toLowerCase();
      if (!['pdf', 'txt'].includes(ext)) {
        alert(`Unsupported file type: ${file.name}. Only .pdf and .txt allowed.`);
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        alert(`File too large: ${file.name}. Max 20MB.`);
        return;
      }
      processFile(file);
    });
  }, [processFile]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const onDragOver = (e) => { e.preventDefault(); setDragActive(true); };
  const onDragLeave = () => setDragActive(false);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="h-16 border-b border-[var(--border)] flex items-center justify-between px-6 bg-[var(--bg-secondary)]">
        <div>
          <h1 className="font-display font-bold text-lg text-[var(--text-primary)]">Document Library</h1>
          <p className="text-xs text-[var(--text-muted)]">Upload and manage knowledge base documents</p>
        </div>
        <Button variant="outline" size="sm" onClick={refetch}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Upload Zone */}
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => fileRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
            dragActive
              ? 'border-[var(--accent)] bg-[var(--accent-light)] scale-[1.01]'
              : 'border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent-light)]'
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            multiple
            accept=".pdf,.txt"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-all duration-300 ${
            dragActive ? 'bg-[var(--accent)] scale-110' : 'bg-[var(--bg-tertiary)]'
          }`}>
            <FileUp className={`w-7 h-7 transition-colors duration-300 ${dragActive ? 'text-white' : 'text-[var(--text-muted)]'}`} />
          </div>
          <p className="font-display font-semibold text-[var(--text-primary)] mb-1">
            {dragActive ? 'Release to upload' : 'Drop files here or click to browse'}
          </p>
          <p className="text-sm text-[var(--text-muted)]">
            Supports .pdf and .txt files — up to 20MB each
          </p>
        </div>

        {/* Upload Queue */}
        {uploads.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-semibold text-sm text-[var(--text-secondary)] uppercase tracking-wider">
                Upload Queue
              </h2>
              <button
                onClick={() => setUploads((p) => p.filter((u) => u.status === 'uploading'))}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              >
                Clear done
              </button>
            </div>
            {uploads.map((u) => (
              <div
                key={u.id}
                className="flex items-center gap-4 p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] animate-slide-up"
              >
                <div className="w-10 h-10 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center shrink-0">
                  {u.file.name.endsWith('.pdf') ? (
                    <File className="w-5 h-5 text-red-400" />
                  ) : (
                    <FileText className="w-5 h-5 text-blue-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{u.file.name}</p>
                    <span className="text-xs text-[var(--text-muted)] ml-2 shrink-0">
                      {formatSize(u.file.size)}
                    </span>
                  </div>
                  {u.status === 'uploading' && (
                    <div className="h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--accent)] rounded-full transition-all duration-300"
                        style={{ width: `${u.progress}%` }}
                      />
                    </div>
                  )}
                  {u.status === 'success' && (
                    <p className="text-xs text-emerald-500">
                      ✓ {u.result?.stats?.chunksCreated} chunks indexed
                    </p>
                  )}
                  {u.status === 'error' && (
                    <p className="text-xs text-red-400 truncate">{u.error}</p>
                  )}
                </div>
                <div className="shrink-0">
                  {u.status === 'uploading' && (
                    <RefreshCw className="w-4 h-4 text-[var(--accent)] animate-spin" />
                  )}
                  {u.status === 'success' && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  )}
                  {u.status === 'error' && (
                    <XCircle className="w-5 h-5 text-red-400" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Document Library */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-sm text-[var(--text-secondary)] uppercase tracking-wider">
              Knowledge Base
            </h2>
            <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
              <span className="flex items-center gap-1">
                <HardDrive className="w-3.5 h-3.5" />
                {documents.length} docs
              </span>
              <span className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
                {documents.reduce((acc, d) => acc + (d.chunkCount || 0), 0)} chunks
              </span>
            </div>
          </div>

          {loading && documents.length === 0 && (
            <div className="text-center py-12 text-[var(--text-muted)]">
              <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin opacity-50" />
              <p className="text-sm">Loading documents...</p>
            </div>
          )}

          {!loading && documents.length === 0 && (
            <div className="text-center py-16 text-[var(--text-muted)]">
              <div className="w-16 h-16 rounded-2xl bg-[var(--bg-secondary)] mx-auto mb-4 flex items-center justify-center border border-[var(--border)]">
                <FileText className="w-7 h-7 opacity-40" />
              </div>
              <p className="font-medium text-[var(--text-secondary)]">No documents yet</p>
              <p className="text-sm mt-1">Upload your first document to get started</p>
            </div>
          )}

          <div className="grid gap-2">
            {documents.map((doc) => (
              <div
                key={doc.name}
                className="flex items-center gap-4 p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-[var(--accent)] transition-all duration-200 group"
              >
                <div className="w-10 h-10 rounded-xl bg-[var(--accent-light)] flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-[var(--accent)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">{doc.name}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-[var(--text-muted)]">
                      {doc.chunkCount} chunks
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      {formatDate(doc.createdAt)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (confirm(`Delete "${doc.name}"?`)) deleteDocument(doc.name);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-400/10 transition-all duration-200"
                  title="Delete document"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
