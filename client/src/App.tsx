import React, { useState } from 'react';
import { ResumeProvider } from './context/ResumeContext';
import { useResume } from './context/useResume';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardPage } from './pages/DashboardPage';
import { UploadPage } from './pages/UploadPage';
import { AnalysisPage } from './pages/AnalysisPage';
import { ChatPage } from './pages/ChatPage';
import { ComingSoonPage } from './pages/ComingSoonPage';

const MainLayout: React.FC = () => {
  const { activeTab } = useResume();
  const [mobileOpen, setMobileOpen] = useState(false);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage />;
      case 'upload':
        return <UploadPage />;
      case 'analysis':
        return <AnalysisPage />;
      case 'chat':
        return <ChatPage />;
      case 'jd-match':
      case 'ats-checker':
      case 'editor':
      case 'interview-prep':
      case 'settings':
        return <ComingSoonPage module={activeTab} />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="main-wrapper">
        <Header onOpenMobile={() => setMobileOpen(true)} />
        <main className="content-body" id="main-content">
          {renderActiveTab()}
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ResumeProvider>
      <MainLayout />
    </ResumeProvider>
  );
};

export default App;
