import { usePrivy } from '@privy-io/react-auth';
import { useSolanaWallets } from '@privy-io/react-auth/solana';
import { useTheme } from '../contexts/ThemeContext';
import { useState, useEffect } from 'react';
import { getUserByPrivyId } from '../utils/apiClient'; // Add this import

interface ProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserData {
  _id: string;
  email?: string;
  privy_id: string;
  publickey: string;
  user_xp: number;
  created_at: string;
  createdAt: string;
  updatedAt: string;
}

export default function Profile({ isOpen, onClose }: ProfileProps) {
  const { isDarkMode } = useTheme();
  const { user, logout } = usePrivy();
  const { wallets } = useSolanaWallets();
  const [copiedText, setCopiedText] = useState<string>('');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loadingXP, setLoadingXP] = useState(false);
  const [xpError, setXpError] = useState<string>('');

  // Fetch user data when profile opens
  useEffect(() => {
    if (isOpen && user?.id) {
      fetchUserData();
    }
  }, [isOpen, user?.id]);

  const fetchUserData = async () => {
    if (!user?.id) return;
    
    setLoadingXP(true);
    setXpError('');
    
    try {
      const response = await getUserByPrivyId(user.id);
      if (response.success) {
        setUserData(response.data);
      } else {
        setXpError('Failed to load XP data');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setXpError('Failed to load XP data');
    } finally {
      setLoadingXP(false);
    }
  };

  if (!isOpen) return null;

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      setTimeout(() => setCopiedText(''), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const formatXP = (xp: number) => {
    if (xp >= 1000000) {
      return `${(xp / 1000000).toFixed(1)}M`;
    } else if (xp >= 1000) {
      return `${(xp / 1000).toFixed(1)}K`;
    }
    return xp.toString();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0  bg-opacity-50 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      
      {/* Sidebar Container with Padding */}
      <div className={`fixed right-4 top-4 bottom-4 w-96 z-50 transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        
        {/* Sidebar Content */}
        <div className={`w-full h-full ${isDarkMode ? 'text-white shadow-lg' : 'text-black border border-gray-300'} flex flex-col rounded-2xl`} style={isDarkMode ? {backgroundColor: '#0d0e14'} : {backgroundColor: '#f9f9f8'}}>
          
          {/* Header */}
          <div className={`p-6 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  Profile
                </h2>
              </div>
              <button
                onClick={onClose}
                className={`absolute top-4 right-4 p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
              >
                <svg className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-black'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* XP Display */}
            <div className="space-y-4">
              <h3 className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                Experience Points
              </h3>
              
              <div className={`p-4 rounded-lg border-2 ${isDarkMode ? 'border-blue-500/30 bg-blue-900/20' : 'border-blue-200 bg-blue-50'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                    <div>
                      <div className={`text-sm font-medium ${isDarkMode ? 'text-blue-200' : 'text-blue-700'}`}>
                        Total XP
                      </div>
                      <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                        {loadingXP ? (
                          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                        ) : xpError ? (
                          <span className="text-red-500 text-sm">Error</span>
                        ) : userData ? (
                          formatXP(userData.user_xp)
                        ) : (
                          '0'
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Refresh XP Button */}
                  <button
                    onClick={fetchUserData}
                    disabled={loadingXP}
                    className={`p-2 rounded-lg transition-colors ${
                      isDarkMode 
                        ? 'hover:bg-blue-800/30 text-blue-200' 
                        : 'hover:bg-blue-100 text-blue-600'
                    } ${loadingXP ? 'cursor-not-allowed opacity-50' : ''}`}
                    title="Refresh XP"
                  >
                    <svg className={`w-4 h-4 ${loadingXP ? 'animate-spin' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                
                {userData && (
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className={`${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                      Exact: {userData.user_xp.toLocaleString()} XP
                    </span>
                    <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Member since {new Date(userData.created_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* User Info */}
            {user && (
              <div className="space-y-4">
                <h3 className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  Personal Information
                </h3>
                
                {/* Email */}
                {user.email?.address && (
                  <div className="space-y-2">
                    <label className="text-xs text-gray-400 block">Email Address</label>
                    <div className={`flex items-center justify-between p-3 border ${isDarkMode ? 'border-gray-700' : 'border-gray-300'} rounded-lg`}>
                      <span className={`text-sm ${isDarkMode ? 'text-white' : 'text-black'}`}>
                        {user.email.address}
                      </span>
                      <button
                        onClick={() => copyToClipboard(user.email?.address || '')}
                        className={`p-1 rounded ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'} transition-colors`}
                        title="Copy email address"
                      >
                        {copiedText === user.email?.address ? (
                          <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                            <path d="M3 5a2 2 0 012-2 3 3 0 003 3h6a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L14.586 13H19v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2v2h-2v-2z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                )}



                {/* User ID */}
                <div className="space-y-2">
                  <label className="text-xs text-gray-400 block">User ID</label>
                  <div className={`flex items-center justify-between p-3 border ${isDarkMode ? 'border-gray-700' : 'border-gray-300'} rounded-lg`}>
                    <span className={`text-sm font-mono ${isDarkMode ? 'text-white' : 'text-black'}`}>
                      {formatAddress(user.id)}
                    </span>
                    <button
                      onClick={() => copyToClipboard(user.id)}
                      className={`p-1 rounded ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'} transition-colors`}
                      title="Copy user ID"
                    >
                      {copiedText === user.id ? (
                        <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                          <path d="M3 5a2 2 0 012-2 3 3 0 003 3h6a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L14.586 13H19v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2v2h-2v-2z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Wallet Info - Show all wallet details */}
            {wallets.length > 0 && (
              <div className="space-y-4">
                <h3 className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  Wallet
                </h3>
                
                {wallets.map((wallet) => (
                  <div key={wallet.address} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-.257-.257A6 6 0 1118 8zM2 8a6 6 0 1010.743 5.743L12 14l-.257-.257A6 6 0 012 8z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                            Solana Wallet
                          </span>
                          <div className="flex items-center space-x-1 mt-1">
                            <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                            <span className="text-green-400 text-xs font-medium">Connected</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs text-gray-400 block">Wallet Address</label>
                      <div className={`flex items-center justify-between p-3 border ${isDarkMode ? 'border-gray-700' : 'border-gray-300'} rounded-lg`}>
                        <span className={`text-sm font-mono ${isDarkMode ? 'text-white' : 'text-black'}`}>
                          {formatAddress(wallet.address)}
                        </span>
                        <button
                          onClick={() => copyToClipboard(wallet.address)}
                          className={`p-1 rounded ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'} transition-colors`}
                          title="Copy wallet address"
                        >
                          {copiedText === wallet.address ? (
                            <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                              <path d="M3 5a2 2 0 012-2 3 3 0 003 3h6a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L14.586 13H19v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2v2h-2v-2z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className={`space-y-3 pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
              <button
                onClick={handleLogout}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  isDarkMode 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                Disconnect Wallet
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}