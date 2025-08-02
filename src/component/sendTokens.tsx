import { useState, useEffect } from 'react';
import { useTransactionService } from '../provider/transactionService';
import { getAllTokenData } from '../utils/tokenUtils';
import { useTheme } from '../contexts/ThemeContext';

interface SendTokensProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SendTokens({ isOpen, onClose }: SendTokensProps) {
  const { isDarkMode } = useTheme();
  const { sendToken, sendSol, wallets } = useTransactionService();
  const [formData, setFormData] = useState({
    selectedToken: '',
    tokenMint: '',
    destinationAddress: '',
    amount: '',
    decimals: '9'
  });
  const [tokenData, setTokenData] = useState<any>(null);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    signature?: string;
    error?: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    const fetchTokens = async () => {
      const walletAddress = wallets[0]?.address;
      
      if (!walletAddress) {
        setTokenData(null);
        setLoadingTokens(false);
        return;
      }

      setLoadingTokens(true);
      try {
        const data = await getAllTokenData(walletAddress);
        setTokenData(data);
      } catch (error) {
        console.error('Failed to fetch tokens:', error);
        setTokenData(null);
      } finally {
        setLoadingTokens(false);
      }
    };

    fetchTokens();
  }, [wallets]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTokenSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTokenAddress = e.target.value;
    if (selectedTokenAddress && tokenData) {
      const selectedToken = tokenData.tokenAccounts.find(
        (token: any) => token.address === selectedTokenAddress
      );
      
      if (selectedToken) {
        setFormData(prev => ({
          ...prev,
          selectedToken: selectedTokenAddress,
          tokenMint: selectedToken.mint,
          decimals: selectedToken.info?.decimals?.toString() || '9'
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        selectedToken: '',
        tokenMint: '',
        decimals: '9'
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const isNativeSOL = formData.tokenMint === 'So11111111111111111111111111111111111111112';
      
      let result;
      if (isNativeSOL) {
        result = await sendSol({
          destinationAddress: formData.destinationAddress,
          amount: parseFloat(formData.amount)
        });
      } else {
        result = await sendToken({
          tokenMint: formData.tokenMint,
          destinationAddress: formData.destinationAddress,
          amount: parseFloat(formData.amount),
          decimals: parseInt(formData.decimals)
        });
      }
      
      setResult(result);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Transfer failed'
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshTokens = async () => {
    const walletAddress = wallets[0]?.address;
    if (!walletAddress) return;

    setLoadingTokens(true);
    try {
      const data = await getAllTokenData(walletAddress);
      setTokenData(data);
    } catch (error) {
      console.error('Manual refresh failed:', error);
      setTokenData(null);
    } finally {
      setLoadingTokens(false);
    }
  };

  const walletAddress = wallets[0]?.address;

  const getTokenSymbol = (token: any) => {
    if (token.address === 'native-sol') return 'SOL';
    if (token.info?.symbol) return token.info.symbol;
    return token.mint.slice(0, 4).toUpperCase();
  };

  const formatBalance = (token: any) => {
    const decimals = token.info?.decimals || token.decimals || 9;
    return (token.amount / Math.pow(10, decimals)).toFixed(6);
  };

  const selectedToken = tokenData?.tokenAccounts?.find((t: any) => t.address === formData.selectedToken);
  const tokenBalance = selectedToken ? formatBalance(selectedToken) : '0';
  const tokenSymbol = selectedToken ? getTokenSymbol(selectedToken) : '';

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-opacity-50 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      
      {/* Sidebar Container */}
      <div className={`fixed right-4 top-4 bottom-4 w-96 z-50 transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        
        {/* Sidebar Content */}
        <div className={`w-full h-full ${isDarkMode ? 'text-white shadow-lg' : 'text-black border border-gray-300'} flex flex-col rounded-2xl`} style={isDarkMode ? {backgroundColor: '#0d0e14'} : {backgroundColor: '#f9f9f8'}}>
          
          {/* Header */}
          <div className={`p-6 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  Send Tokens
                </h2>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                  Transfer crypto to any wallet
                </p>
              </div>
              <button
                onClick={onClose}
                className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
              >
                <svg className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {!walletAddress ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className={`text-gray-400 mb-2`}>No wallet connected</div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Connect your wallet to send tokens</div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Token Selection */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Token
                    </label>
                    <button
                      type="button"
                      onClick={refreshTokens}
                      disabled={loadingTokens}
                      className={`px-2 py-1 text-xs rounded-full ${
                        loadingTokens 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : isDarkMode 
                            ? 'bg-gray-700 hover:bg-gray-600' 
                            : 'bg-gray-200 hover:bg-gray-300'
                      } text-gray-100 transition-colors`}
                    >
                      {loadingTokens ? 'Refreshing...' : 'Refresh'}
                    </button>
                  </div>
                  
                  {loadingTokens ? (
                    <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} animate-pulse`}>
                      <div className="h-6 w-full"></div>
                    </div>
                  ) : tokenData?.tokenAccounts?.length === 0 ? (
                    <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        No tokens found in your wallet
                      </div>
                    </div>
                  ) : (
                    <select
                      value={formData.selectedToken}
                      onChange={handleTokenSelect}
                      required
                      className={`w-full p-3 rounded-lg border ${
                        isDarkMode 
                          ? 'bg-gray-800 border-gray-700 text-white' 
                          : 'bg-white border-gray-300 text-black'
                      } focus:outline-none focus:ring-2 ${isDarkMode ? 'focus:ring-blue-600' : 'focus:ring-blue-500'}`}
                    >
                      <option value="">Select token</option>
                      {tokenData?.tokenAccounts?.map((token: any) => (
                        <option key={token.address} value={token.address}>
                          {getTokenSymbol(token)} - {formatBalance(token)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Amount Field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Amount
                    </label>
                    {selectedToken && (
                      <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Balance: {tokenBalance} {tokenSymbol}
                      </span>
                    )}
                  </div>
                  <div className={`relative rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} p-1`}>
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      placeholder="0.0"
                      step="0.000001"
                      min="0"
                      required
                      className={`w-full p-3 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-50 text-black'} focus:outline-none`}
                    />
                    {selectedToken && (
                      <div className={`absolute right-3 top-3 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {tokenSymbol}
                      </div>
                    )}
                  </div>
                </div>

                {/* Destination Address */}
                <div className="space-y-2">
                  <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Recipient Address
                  </label>
                  <input
                    type="text"
                    name="destinationAddress"
                    value={formData.destinationAddress}
                    onChange={handleInputChange}
                    placeholder="Enter wallet address"
                    required
                    className={`w-full p-3 rounded-lg border ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' 
                        : 'bg-white border-gray-300 text-black placeholder-gray-400'
                    } focus:outline-none focus:ring-2 ${isDarkMode ? 'focus:ring-blue-600' : 'focus:ring-blue-500'}`}
                  />
                </div>

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={loading || !formData.selectedToken || !formData.destinationAddress || !formData.amount}
                  className={`w-full py-3 px-4 rounded-full font-medium transition-colors ${
                    loading || !formData.selectedToken || !formData.destinationAddress || !formData.amount
                      ? isDarkMode 
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : isDarkMode 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  {loading ? 'Sending...' : 'Send'}
                </button>
              </form>
            )}

            {/* Result Display */}
            {result && (
              <div className={`mt-6 p-4 rounded-lg ${
                result.success 
                  ? isDarkMode 
                    ? 'bg-green-900/20 border border-green-700' 
                    : 'bg-green-50 border border-green-200'
                  : isDarkMode 
                    ? 'bg-red-900/20 border border-red-700' 
                    : 'bg-red-50 border border-red-200'
              }`}>
                <h4 className={`font-medium mb-2 ${
                  result.success 
                    ? isDarkMode ? 'text-green-400' : 'text-green-800'
                    : isDarkMode ? 'text-red-400' : 'text-red-800'
                }`}>
                  {result.success ? 'Transaction Successful!' : 'Transaction Failed'}
                </h4>
                <p className={`text-sm mb-3 ${
                  result.success 
                    ? isDarkMode ? 'text-green-300' : 'text-green-700'
                    : isDarkMode ? 'text-red-300' : 'text-red-700'
                }`}>
                  {result.message}
                </p>
                {result.signature && (
                  <div className="space-y-2">
                    <div className={`text-xs font-medium ${
                      isDarkMode ? 'text-green-400' : 'text-green-800'
                    }`}>
                      Transaction Signature:
                    </div>
                    <div className={`p-2 rounded text-xs font-mono break-all ${
                      isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {result.signature}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}