import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { AppProvider, useApp } from './contexts/AppContext';
import { Layout } from './components/Layout';
import { SplashScreen } from './components/SplashScreen';
import { LinksPage } from './pages/LinksPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { GroupsPage } from './pages/GroupsPage';
import { StatsPage } from './pages/StatsPage';

function AppContent() {
  const { state } = useApp();
  const [currentPage, setCurrentPage] = useState('links');

  // تسجيل service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('SW registered: ', registration);
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }
  }, []);

  // إخفاء شارة Bolt
  useEffect(() => {
    const hideBoltBadge = () => {
      const boltBadge = document.querySelector('div[style*="position: fixed"][style*="bottom: 1rem"][style*="right: 1rem"]');
      if (boltBadge) {
        (boltBadge as HTMLElement).style.display = 'none';
        (boltBadge as HTMLElement).id = 'bolt-badge-hidden';
      }
    };

    // تشغيل فوري
    hideBoltBadge();

    // تشغيل دوري كل ثانية
    const interval = setInterval(hideBoltBadge, 1000);

    return () => clearInterval(interval);
  }, []);
  const renderPage = () => {
    switch (currentPage) {
      case 'links':
        return <LinksPage />;
      case 'categories':
        return <CategoriesPage />;
      case 'groups':
        return <GroupsPage />;
      case 'stats':
        return <StatsPage />;
      default:
        return <LinksPage />;
    }
  };

  if (state.showSplash) {
    return <SplashScreen />;
  }

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}

function App() {
  return (
    <AppProvider>
      <div className="font-tajawal">
        <AppContent />
        <Toaster 
          position="top-left"
          toastOptions={{
            duration: 4000,
            style: {
              fontFamily: 'Tajawal, sans-serif',
              direction: 'rtl',
              textAlign: 'right'
            },
            success: {
              style: {
                background: '#10b981',
                color: 'white',
              },
            },
            error: {
              style: {
                background: '#ef4444',
                color: 'white',
              },
            },
          }}
        />
      </div>
    </AppProvider>
  );
}

export default App;