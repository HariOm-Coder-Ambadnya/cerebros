import { useState, useRef } from 'react';
import { Search, FileText, Zap, AlertCircle, Clock, BarChart2, ChevronRight } from 'lucide-react';
import { api } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Separator } from '../components/ui/separator';

const EXAMPLE_QUERIES = [
  'What is the project deadline?',
  'Who is responsible for the backend?',
  'What are the budget requirements?',
  'Authentication and security requirements',
];

function ScoreBar({ score }) {
  const pct = Math.round((score || 0) * 100);
  const color =
    pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-[var(--accent)]' : 'bg-amber-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-mono text-[var(--text-muted)] w-9 text-right">{pct}%</span>
    </div>
  );
}

function ResultCard({ result, index }) {
  const [expanded, setExpanded] = useState(false);
  const preview = result.content.slice(0, 200);
  const hasMore = result.content.length > 200;

  return (
    <Card className="animate-slide-up hover:border-[var(--accent)]/40 transition-all duration-200"
      style={{ animationDelay: `${index * 60}ms` }}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-light)] flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-[var(--accent)]" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-sm truncate">{result.documentName}</CardTitle>
              <CardDescription className="text-xs">
                Chunk {(result.metadata?.chunkIndex ?? 0) + 1}
                {result.metadata?.totalChunks ? ` of ${result.metadata.totalChunks}` : ''}
              </CardDescription>
            </div>
          </div>
          <Badge variant="default" className="shrink-0">
            <BarChart2 className="w-3 h-3" />
            {Math.round((result.score || 0) * 100)}% match
          </Badge>
        </div>
        <ScoreBar score={result.score} />
      </CardHeader>

      <Separator />

      <CardContent className="pt-3">
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap font-body">
          {expanded ? result.content : preview}
          {!expanded && hasMore && '…'}
        </p>
        {hasMore && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="mt-2 flex items-center gap-1 text-xs text-[var(--accent)] hover:underline"
          >
            {expanded ? 'Show less' : 'Show full chunk'}
            <ChevronRight className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </button>
        )}
      </CardContent>
    </Card>
  );
}

export function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [latency, setLatency] = useState(null);
  const inputRef = useRef(null);

  const handleSearch = async (q) => {
    const searchQuery = (q || query).trim();
    if (!searchQuery) return;

    setLoading(true);
    setError(null);
    setResults(null);
    const start = Date.now();

    try {
      const data = await api.post('/search', { query: searchQuery, topK: 6 });
      setResults(data.results || []);
      setLatency(Date.now() - start);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleExample = (q) => {
    setQuery(q);
    handleSearch(q);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="h-16 border-b border-[var(--border)] flex items-center px-6 bg-[var(--bg-secondary)] shrink-0">
        <div>
          <h1 className="font-display font-bold text-lg text-[var(--text-primary)]">Semantic Search</h1>
          <p className="text-xs text-[var(--text-muted)]">Find content by meaning, not just keywords</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Search Bar Hero */}
        <div className="bg-[var(--bg-secondary)] border-b border-[var(--border)] px-6 py-6">
          <div className="max-w-2xl mx-auto">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <Input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder='Try: "project deadline" or "budget forecast"…'
                  className="pl-9 h-11 text-sm"
                  disabled={loading}
                />
              </div>
              <Button
                onClick={() => handleSearch()}
                disabled={!query.trim() || loading}
                size="lg"
                className="shrink-0 px-5"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Searching
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Search
                  </span>
                )}
              </Button>
            </div>

            {/* Example queries */}
            {!results && !loading && (
              <div className="mt-4">
                <p className="text-xs text-[var(--text-muted)] mb-2">Try an example:</p>
                <div className="flex flex-wrap gap-2">
                  {EXAMPLE_QUERIES.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleExample(q)}
                      className="px-3 py-1.5 text-xs rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[var(--accent-light)] transition-all duration-200"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results area */}
        <div className="px-6 py-6 max-w-2xl mx-auto w-full space-y-4">

          {/* Meta bar */}
          {results !== null && !loading && (
            <div className="flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {results.length} result{results.length !== 1 ? 's' : ''}
                </span>
                <span className="text-xs text-[var(--text-muted)]">for "{query}"</span>
              </div>
              {latency && (
                <Badge variant="secondary">
                  <Clock className="w-3 h-3" />
                  {latency}ms
                </Badge>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <Card className="border-red-500/20 animate-fade-in">
              <CardContent className="pt-5">
                <div className="flex items-center gap-3 text-red-400">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Search failed</p>
                    <p className="text-xs mt-0.5 opacity-75">{error}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-[var(--bg-tertiary)] rounded w-1/3" />
                    <div className="h-3 bg-[var(--bg-tertiary)] rounded w-1/4 mt-1" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-[var(--bg-tertiary)] rounded" />
                      <div className="h-3 bg-[var(--bg-tertiary)] rounded w-4/5" />
                      <div className="h-3 bg-[var(--bg-tertiary)] rounded w-3/5" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* No results */}
          {results !== null && results.length === 0 && !loading && (
            <Card className="animate-fade-in">
              <CardContent className="py-12 text-center">
                <Search className="w-10 h-10 mx-auto mb-3 text-[var(--text-muted)] opacity-40" />
                <p className="font-medium text-[var(--text-secondary)]">No matching chunks found</p>
                <p className="text-sm text-[var(--text-muted)] mt-1">
                  Try rephrasing your query or upload more documents
                </p>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {results && results.length > 0 && !loading && (
            <div className="space-y-3">
              {results.map((result, i) => (
                <ResultCard key={`${result.documentName}-${i}`} result={result} index={i} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {results === null && !loading && !error && (
            <div className="text-center py-20 text-[var(--text-muted)] animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] mx-auto mb-4 flex items-center justify-center">
                <Search className="w-7 h-7 opacity-30" />
              </div>
              <p className="font-medium text-[var(--text-secondary)]">Search your knowledge base</p>
              <p className="text-sm mt-1 max-w-xs mx-auto">
                Searches by <strong className="text-[var(--text-secondary)]">meaning</strong>, not keywords.
                "budget" will find "financial forecast".
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
