import { Routes, Route } from 'react-router-dom';
import { EditorPage } from './pages/EditorPage';
import { SharedViewPage } from './pages/SharedViewPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<EditorPage />} />
      <Route path="/shared" element={<SharedViewPage />} />
    </Routes>
  );
}

export default App;
