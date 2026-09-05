import React, { Suspense, useEffect } from 'react';
import ReactGA from 'react-ga4';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import AuthModal from './components/AuthModal';
import ActivateAccount from './components/ActivateAccount';
import usePageTracking from './usePageTracking';
import LoadingSpinner from './components/LoadingSpinner';
import { AuthProvider, useAuth } from './AuthContext';

// One canonical tag for every route, built from the path. Each page used to declare
// its own and they all named `yourdomain.com`, which told search engines the real
// copy of the site lived somewhere we don't own. Same env var the sitemap uses.
const SITE_URL = (process.env.REACT_APP_SITE_URL ?? 'https://aiartarena.com').replace(/\/$/, '');

const ArenaGenerator = React.lazy(() => import('./components/ArenaGenerator'));
const FreeImageGenerator = React.lazy(() => import('./components/FreeImageGenerator'));
const PremiumGenerator = React.lazy(() => import('./components/PremiumGenerator'));
const EditGenerator = React.lazy(() => import('./components/EditGenerator'));
const Gallery = React.lazy(() => import('./components/Gallery'));
const Info = React.lazy(() => import('./components/Info'));
const Home = React.lazy(() => import('./components/Home'));
const Billing = React.lazy(() => import('./components/Billing'));
const BillingSuccess = React.lazy(() => import('./components/BillingSuccess'));
const BillingCancel = React.lazy(() => import('./components/BillingCancel'));

function AppContent(): JSX.Element {
  // One modal for the whole app: the navbar used to mount a second copy of its own,
  // so which instance you were looking at depended on where you clicked.
  const { isAuthModalOpen, authModalMessage, closeAuthModal } = useAuth();
  const { pathname } = useLocation();

  usePageTracking();

  return (
    <div className="App min-h-screen bg-gradient-to-br from-purple-400 to-indigo-600 p-4 font-sans sm:p-8">
      <Helmet>
        <title>AI Art Arena – AI Image Generator</title>
        <meta
          name="description"
          content="Generate AI images, compare models, and explore the gallery."
        />
        <link rel="canonical" href={`${SITE_URL}${pathname}`} />
      </Helmet>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/arena" element={<ArenaGenerator />} />
          <Route path="/generate" element={<FreeImageGenerator />} />
          <Route path="/premium" element={<PremiumGenerator />} />
          <Route path="/edit" element={<EditGenerator />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/billing" element={<Billing />} />
          {/* Stripe Checkout returns the browser to these two. */}
          <Route path="/billing/success" element={<BillingSuccess />} />
          <Route path="/billing/cancel" element={<BillingCancel />} />
          <Route path="/info" element={<Info />} />
          <Route path="/activate/:token" element={<ActivateAccount />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} message={authModalMessage} />
    </div>
  );
}

function App(): JSX.Element {
  useEffect(() => {
    ReactGA.initialize('G-EKLE5ZL133');
  }, []);

  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
