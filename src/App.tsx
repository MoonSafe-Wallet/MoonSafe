import './App.css';
import { usePrivy } from '@privy-io/react-auth';
import { useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/login';
import Sidebar from './pages/sidebar';
import Dashboard from './pages/dashboard';
import TokenAccount from './component/tokenAccount';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { storeUserDetails } from './utils/apiClient';
import CreateQuest from './component/libs/createQuest';
import ActiveQuest from './component/libs/quest';
import Swap from './component/Swap';
import SwapPage from './pages/swapPage';

function AppContent() {
  const { ready, authenticated, user } = usePrivy();
  const { isDarkMode } = useTheme();
  const hasStoredUser = useRef(false);

  // Store user data to Supabase when authenticated
  useEffect(() => {
    if (ready && authenticated && user && !hasStoredUser.current) {
      hasStoredUser.current = true;

      const saveUserToBackend = async () => {
        try {
          const email = user?.email?.address || (typeof user?.email === 'string' ? user.email : undefined);
          let publicKey = user?.wallet?.address;

          if (!publicKey && user?.linkedAccounts) {
            const walletAccount = user.linkedAccounts.find((account: any) => account.type === 'wallet');
            publicKey = (walletAccount as any)?.address;
          }

          if (!publicKey && (user as any)?.embeddedWallet) {
            publicKey = (user as any).embeddedWallet.address;
          }

          const privyUserId = user?.id;

          if (!privyUserId || !publicKey) {
            return;
          }

          await storeUserDetails({
            privy_id: privyUserId,
            email: email,
            address: publicKey
          });
        } catch (error) {
          // Silent error handling
        }
      };

      saveUserToBackend();
    }
  }, [ready, authenticated, user]);


  // Reset flag when user logs out
  useEffect(() => {
    if (!authenticated) {
      hasStoredUser.current = false;
    }
  }, [authenticated]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!authenticated) {
    return <Login onLogin={() => { }} />;
  }

  return (
    <Router>
      <div className={`flex min-h-screen ${isDarkMode ? '' : 'bg-white'}`} style={isDarkMode ? { backgroundColor: '#02050a' } : {}}>
        <Sidebar />
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tokens" element={<TokenAccount />} />
            <Route path="/create-quest" element={<CreateQuest />} />
            <Route path="/quests" element={<ActiveQuest />} />
            <Route path="/swap" element={<SwapPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;