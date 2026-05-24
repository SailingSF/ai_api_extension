import React, { Suspense, useEffect, useState } from 'react';
import ReactGA from 'react-ga4';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import AuthModal from './components/AuthModal';
import ActivateAccount from './components/ActivateAccount';
import usePageTracking from './usePageTracking';
import LoadingSpinner from './components/LoadingSpinner';

const ArenaGenerator = React.lazy(() => import('./components/ArenaGenerator'));
const FreeImageGenerator = React.lazy(() => import('./components/FreeImageGenerator'));
const PremiumGenerator = React.lazy(() => import('./components/PremiumGenerator'));
const Gallery = React.lazy(() => import('./components/Gallery'));
const Info = React.lazy(() => import('./components/Info'));
const Home = React.lazy(() => import('./components/Home'));

function AppContent(): JSX.Element {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMessage, setAuthModalMessage] = useState<string>('');

  usePageTracking();

  const handleOpenAuthModal = (message: string = ''): void => {
    setAuthModalMessage(message);
    setIsAuthModalOpen(true);
  };

  const handleLogout = (): void => {
    localStorage.removeItem('token');
    // Intentionally keep console for developer feedback
    // eslint-disable-next-line no-console
    console.log('User logged out');
  };

  const handleAuthenticate = (success: boolean): void => {
    if (success) {
      setIsAuthModalOpen(false);
    }
  };

  return (
    <div className="App min-h-screen bg-gradient-to-br from-purple-400 to-indigo-600 p-4 font-sans sm:p-8">
      <Helmet>
        <title>AI Art Arena – AI Image Generator</title>
        <meta
          name="description"
          content="Generate AI images, compare models, and explore the gallery."
        />
      </Helmet>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route
            path="/"
            element={<Home onOpenAuthModal={handleOpenAuthModal} onLogout={handleLogout} />}
          />
          <Route path="/arena" element={<ArenaGenerator openAuthModal={handleOpenAuthModal} />} />
          <Route path="/generate" element={<FreeImageGenerator />} />
          <Route
            path="/premium"
            element={<PremiumGenerator openAuthModal={handleOpenAuthModal} />}
          />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/info" element={<Info />} />
          <Route path="/activate/:token" element={<ActivateAccount />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthenticate={handleAuthenticate}
        message={authModalMessage}
      />
    </div>
  );
}

function App(): JSX.Element {
  useEffect(() => {
    ReactGA.initialize('G-EKLE5ZL133');
  }, []);

  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
