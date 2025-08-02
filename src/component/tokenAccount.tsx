import { useState, useEffect } from 'react';
import { getAllTokenData } from '../utils/tokenUtils';
import { useTransactionService } from '../provider/transactionService';
import { useTheme } from '../contexts/ThemeContext';
import AssetsTable from './AssetsTable';
import CoinSvg from '../assets/coin.svg';

interface TokenAccountProps {
  showAsTable?: boolean;
}

export default function TokenAccount({ showAsTable = false }: TokenAccountProps) {
  const { wallets } = useTransactionService();
  const { isDarkMode } = useTheme();
  const [tokenData, setTokenData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load data when wallet connects or changes
  useEffect(() => {
    const fetchData = async () => {
      const walletAddress = wallets[0]?.address;

      if (!walletAddress) {
        console.log('No wallet connected yet');
        setTokenData(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        console.log('Fetching token accounts for wallet:', walletAddress);
        const data = await getAllTokenData(walletAddress);
        console.log('Token account data received:', data);
        setTokenData(data);
      } catch (err) {
        console.error('Failed to fetch token accounts:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setTokenData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [wallets]);

  const walletAddress = wallets[0]?.address;

  const refreshTokens = async () => {
    if (!walletAddress) return;

    console.log('Manual refresh token accounts for wallet:', walletAddress);
    setLoading(true);
    setError('');
    try {
      const data = await getAllTokenData(walletAddress);
      console.log('Manual refresh - Token account data received:', data);
      setTokenData(data);
    } catch (err) {
      console.error('Manual refresh failed:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setTokenData(null);
    } finally {
      setLoading(false);
    }
  };

  // If showing as table (for dashboard), return the AssetsTable component
  if (showAsTable) {
    return (
      <AssetsTable
        tokenData={tokenData}
        loading={loading}
        showControls={true}
        onRefresh={refreshTokens}
      />
    );
  }

  // Default table view for the token account route
  return (
    <div className={`flex-1 h-screen pt-15 pl-25 pr-25 pb-4 ${isDarkMode ? 'text-white' : 'bg-white text-black'}`} style={isDarkMode ? { backgroundColor: '#02050a' } : {}}>
      <div className="w-full h-full flex flex-col">
        <div className={`w-full h-full ${isDarkMode ? 'shadow-lg' : 'border border-gray-300'} rounded-2xl p-6 flex flex-col`} style={isDarkMode ? { backgroundColor: '#0d0e14' } : { backgroundColor: '#f9f9f8' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-2xl font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
              Token Accounts {tokenData && `(${tokenData.tokenAccounts.length})`}
            </h2>
            {walletAddress && (
              <button
                onClick={refreshTokens}
                disabled={loading}
                className={`text-sm transition-colors ${loading
                    ? 'text-gray-400 cursor-not-allowed'
                    : isDarkMode
                      ? 'text-gray-400 hover:text-white'
                      : 'text-gray-600 hover:text-black'
                  }`}
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            )}
          </div>

          {!walletAddress ? (
            <div className={`p-4 rounded-lg mb-6 ${isDarkMode ? 'bg-yellow-900/20 border border-yellow-600/30' : 'bg-yellow-50 border border-yellow-200'}`}>
              <h3 className={`font-medium mb-2 ${isDarkMode ? 'text-yellow-300' : 'text-yellow-800'}`}>Wallet Not Connected</h3>
              <p className={`${isDarkMode ? 'text-yellow-200' : 'text-yellow-700'}`}>Please connect your Privy wallet to view your token accounts.</p>
            </div>
          ) : (
            <div className="flex justify-end mb-6">
              <div className={`px-3 py-2 rounded-lg text-sm ${isDarkMode ? 'bg-green-900/20 border border-green-600/30 text-green-200' : 'bg-green-50 border border-green-200 text-green-700'}`}>
                <strong>Connected:</strong> {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
              </div>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-8">
              <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading token accounts...</p>
            </div>
          )}

          {error && (
            <div className={`p-4 rounded-lg mb-6 ${isDarkMode ? 'bg-red-900/20 border border-red-600/30' : 'bg-red-50 border border-red-200'}`}>
              <p className={`${isDarkMode ? 'text-red-200' : 'text-red-700'}`}>
                <strong>Error:</strong> {error}
              </p>
            </div>
          )}

          {tokenData && tokenData.tokenAccounts.length > 0 && (
            <div className="flex-1 overflow-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className={`text-left py-3 px-4 font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Asset</th>
                    <th className={`text-right py-3 px-4 font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Balance</th>
                    <th className={`text-right py-3 px-4 font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Mint Address</th>
                    <th className={`text-right py-3 px-4 font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Account</th>
                  </tr>
                </thead>
                <tbody>
                  {tokenData.tokenAccounts.map((account: any) => (
                    <tr key={account.address} className={`${isDarkMode ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50'}`}>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          {account.info?.logoURI ? (
                            <img
                              src={account.info.logoURI}
                              alt={account.info.name}
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-bold">
                                {(account.info?.symbol?.[0] || account.address[0]).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div>
                            <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                              {account.info?.name || 'Unknown Token'}
                            </div>
                            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {account.info?.symbol || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className={`py-4 px-4 text-right ${isDarkMode ? 'text-white' : 'text-black'}`}>
                        <div className="font-medium">
                          {account.uiAmount?.toFixed(6) || 'N/A'} {account.info?.symbol}
                        </div>
                        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Raw: {account.amount}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <code className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                          {account.mint.slice(0, 8)}...{account.mint.slice(-8)}
                        </code>
                      </td>
                      <td className="py-4 px-4 text-right">
                        {account.address !== 'native-sol' ? (
                          <code className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                            {account.address.slice(0, 8)}...{account.address.slice(-8)}
                          </code>
                        ) : (
                          <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Native</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tokenData && tokenData.tokenAccounts.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center py-12">
              <img 
                src={CoinSvg} 
                alt="Coin" 
                className="w-80 h-80 mb-6 opacity-80"
              />
              <div className={`text-xl font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                Get Started With SOL
              </div>
              <div className={`text-sm text-center mb-8 max-w-md ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Buy SOL to start trading, staking, and exploring. You'll need a tiny amount of SOL for each Solana transaction.
              </div>
              <button 
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  isDarkMode
                    ? 'bg-white hover:bg-gray-300 text-black'
                    : 'bg-black hover:bg-gray-800 text-white'
                }`}
                onClick={() => {
                  // Demo button - add your buy SOL logic here
                  console.log('Buy SOL clicked');
                }}
              >
                Buy SOL
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}