import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { usePrivy } from '@privy-io/react-auth';
import { useSolanaWallets } from '@privy-io/react-auth/solana';
import TokenAccount from '../component/tokenAccount';
import TotalBalance from '../component/TotalBalance';
import Profile from '../component/Profile';
import Swap from '../component/Swap';
import Transactions from '../component/transactions';
import Receive from '../component/Receive';
import SendTokens from '../component/sendTokens';

const Dashboard: React.FC = () => {
  const { isDarkMode } = useTheme();
  const { user } = usePrivy();
  const { wallets } = useSolanaWallets();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [isSendOpen, setIsSendOpen] = useState(false);

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const getDisplayInfo = () => {
    const walletAddress = wallets[0]?.address;
    const email = user?.email?.address;
    
    if (email && walletAddress) {
      return {
        primary: formatAddress(walletAddress),
        secondary: email
      };
    } else if (walletAddress) {
      return {
        primary: formatAddress(walletAddress),
        secondary: 'Solana Wallet'
      };
    } else if (email) {
      return {
        primary: email,
        secondary: 'No Wallet Connected'
      };
    }
    
    return {
      primary: 'Not Connected',
      secondary: 'Connect Wallet'
    };
  };

  const displayInfo = getDisplayInfo();

  return (
    <div className={`flex-1 ${isDarkMode ? 'text-white' : 'bg-white text-black'}`} style={isDarkMode ? {backgroundColor: '#02050a'} : {}}>
      {/* Header with Connected Wallet Card on Right */}
      <div className="pt-5 pl-25 pr-25 pb-5">
        <div className="flex items-center justify-end mb-5">
          <button
            onClick={() => setIsProfileOpen(true)}
            className={`${isDarkMode ? 'shadow-lg hover:bg-gray-700/50' : 'border border-gray-300 hover:bg-gray-100'} rounded-2xl p-3 w-80 transition-colors`} 
            style={isDarkMode ? {backgroundColor: '#0d0e14'} : {backgroundColor: '#f9f9f8'}}
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {displayInfo.secondary.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="text-center">
                <div className={`font-medium text-sm ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  {displayInfo.primary}
                </div>
                <div className="text-gray-400 text-xs">{displayInfo.secondary}</div>
              </div>
            </div>
          </button>
        </div>
        {/* Portfolio Cards */}
        <div className="flex gap-4 mb-4">
          {/* Total Balance Card - 70% width */}
          <TotalBalance 
            onReceiveClick={() => setIsReceiveOpen(true)} 
            onSendClick={() => setIsSendOpen(true)} 
          />

          {/* Recent Transactions - 30% width, reduced height */}
          <Transactions limit={3} />
        </div>

        {/* Assets and Swap Grid */}
        <div className="flex gap-4">
          {/* Assets - 70% width to match total balance */}
          <TokenAccount showAsTable={true} />

          {/* Swap Component */}
          <Swap />
        </div>
      </div>

      {/* Profile Sidebar */}
      <Profile 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
      />

      {/* Receive Sidebar */}
      <Receive 
        isOpen={isReceiveOpen} 
        onClose={() => setIsReceiveOpen(false)} 
      />

      {/* Send Sidebar */}
      <SendTokens 
        isOpen={isSendOpen} 
        onClose={() => setIsSendOpen(false)} 
      />
    </div>
  );
};

export default Dashboard;