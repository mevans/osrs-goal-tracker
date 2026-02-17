import { Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { EditorPage } from './pages/EditorPage';
import { SharedViewPage } from './pages/SharedViewPage';

function ErrorFallback({ error }: { error: unknown }) {
  return (
    <div className="h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="text-center max-w-md px-4">
        <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
        <p className="text-gray-400 mb-4 text-sm">
          {error instanceof Error ? error.message : 'An unexpected error occurred.'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white text-sm"
        >
          Reload
        </button>
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Routes>
        <Route path="/" element={<EditorPage />} />
        <Route path="/shared" element={<SharedViewPage />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
