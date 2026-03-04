import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

export function useDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get('/documents');
      setDocuments(data.documents || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const deleteDocument = useCallback(async (name) => {
    await api.delete(`/documents/${encodeURIComponent(name)}`);
    setDocuments((prev) => prev.filter((d) => d.name !== name));
  }, []);

  return { documents, loading, error, refetch: fetchDocuments, deleteDocument };
}
