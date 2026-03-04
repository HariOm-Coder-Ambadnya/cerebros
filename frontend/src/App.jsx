import { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { Sidebar } from './components/Sidebar';
import { UploadPage } from './pages/UploadPage';
import { ChatPage } from './pages/ChatPage';
import { SearchPage } from './pages/SearchPage';
import './index.css';

export default function App() {
  const [activePage, setActivePage] = useState('chat');

  return (
    <ThemeProvider>
      <div className="min-h-screen flex bg-[var(--bg-primary)] font-body">
        <div className="grain-overlay" />
        <Sidebar activePage={activePage} setActivePage={setActivePage} />
        <main className="flex-1 min-h-screen overflow-hidden">
          {activePage === 'chat' && <ChatPage />}
          {activePage === 'search' && <SearchPage />}
          {activePage === 'upload' && <UploadPage />}
        </main>
      </div>
    </ThemeProvider>
  );
}
