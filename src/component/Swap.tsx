import { useState, useEffect } from 'react';
import { performSwapWithPrivy, getSwapQuote } from '../utils/jupiterSwap';
import { getAllTokenData } from '../utils/tokenUtils';
import { useTransactionService } from '../provider/transactionService';
import { useSendTransaction, useSignTransaction } from '@privy-io/react-auth/solana';
import { usePrivy } from '@privy-io/react-auth';
import { Connection } from '@solana/web3.js';
import { useTheme } from '../contexts/ThemeContext';


interface WalletToken {
  address: string;
  mint: string;
  amount: number;
  decimals: number;
  uiAmount: number | null;
  info: {
    symbol: string;
    name: string;
    decimals: number;
    logoURI?: string;
  } | null;
}

interface JupiterToken {
  id: string;
  address?: string;
  symbol: string;
  name: string;
  decimals: number;
  icon?: string;
  logoURI?: string;
  tags?: string[];
  chainId?: number;
}

interface PopularToken {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  icon?: string;
}

type AnyToken = WalletToken | JupiterToken | PopularToken;

export default function Swap() {
  const { isDarkMode } = useTheme();
  const { wallets } = useTransactionService(); // Use original wallet service
  const { sendTransaction } = useSendTransaction();
  const { signTransaction } = useSignTransaction();
  const { ready, authenticated } = usePrivy();
  
  // State
  const [tokens, setTokens] = useState<WalletToken[]>([]);
  const [fromToken, setFromToken] = useState<string>('');
  const [toToken, setToToken] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [error, setError] = useState<string>('');
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<JupiterToken[]>([]);
  const [selectedSearchTokens, setSelectedSearchTokens] = useState<{[key: string]: JupiterToken}>({});
  const [isSearching, setIsSearching] = useState(false);

  const walletAddress = wallets[0]?.address; // Use original wallet access pattern
  

  // Effects
  useEffect(() => {
    if (walletAddress) {
      loadTokens();
    } else {
      setTokens([]);
    }
  }, [walletAddress]);

  // Token loading
  const loadTokens = async () => {
    if (!walletAddress) return;
    
    try {
      const tokenData = await getAllTokenData(walletAddress);
      const tokensWithBalance = tokenData.tokenAccounts.filter(token => token.amount > 0);
      setTokens(tokensWithBalance);
    } catch (error) {
      console.error('Error loading tokens:', error);
      setError('Failed to load tokens');
    }
  };

  // Token search
  const searchTokens = async (query: string): Promise<JupiterToken[]> => {
    try {
      const response = await fetch(`https://lite-api.jup.ag/tokens/v2/search?query=${query}`, {
        headers: { 'Accept': 'application/json' }
      });
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error searching tokens:', error);
      return [];
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchQuery.trim().length > 1) {
        performSearch(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    setIsSearching(true);
    const results = await searchTokens(query);
    setSearchResults(results);
    setIsSearching(false);
  };

  // Swap operations
  const handleAmountChange = async (value: string) => {
    setAmount(value);
    setQuote(null);
    setError('');

    if (value && fromToken && toToken && parseFloat(value) > 0) {
      await fetchQuote(fromToken, toToken, value);
    }
  };

  const fetchQuote = async (inputMint: string, outputMint: string, amountStr: string) => {
    setLoading(true);
    try {
      const decimals = getTokenDecimals(inputMint);
      const amountInSmallestUnit = Math.floor(parseFloat(amountStr) * Math.pow(10, decimals));
      const quoteResponse = await getSwapQuote(inputMint, outputMint, amountInSmallestUnit);
      setQuote(quoteResponse);
    } catch (error) {
      console.error('Error fetching quote:', error);
      setError('Failed to fetch quote');
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = async () => {
    if (!ready || !authenticated) {
      setError('Please wait for authentication to complete');
      return;
    }

    if (!walletAddress || !fromToken || !toToken || !amount || !quote) {
      setError('Please fill in all fields and get a quote first');
      return;
    }

    if (!wallets[0]) {
      setError('Wallet not properly connected. Please refresh and try again.');
      return;
    }

    console.log('=== Wallet State Debug ===');
    console.log('Ready:', ready);
    console.log('Authenticated:', authenticated);
    console.log('Wallets count:', wallets.length);
    console.log('Connected wallet:', wallets[0]);
    console.log('Wallet address:', walletAddress);

    const decimals = getTokenDecimals(fromToken);
    const amountInSmallestUnit = Math.floor(parseFloat(amount) * Math.pow(10, decimals));

    const inputToken = tokens.find(token => token.mint === fromToken);
    if (inputToken && amountInSmallestUnit > inputToken.amount) {
      const maxDisplay = (inputToken.amount / Math.pow(10, decimals)).toFixed(6);
      setError(`Insufficient balance. Max: ${maxDisplay}`);
      return;
    }

    setSwapping(true);
    setError('');

    // Small delay to ensure wallet is fully ready
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const connection = new Connection('https://mainnet.helius-rpc.com/?api-key=4c4a4f43-145d-4406-b89c-36ad977bb738', 'confirmed');

      const txid = await performSwapWithPrivy({
        inputMint: fromToken,
        outputMint: toToken,
        amount: amountInSmallestUnit,
        userPublicKey: walletAddress!,
        signTransaction: async (transaction) => {
          const result = await signTransaction({ transaction, connection });
          return result;
        },
        sendTransaction: async ({ transaction, connection }) => {
          const result = await sendTransaction({ transaction, connection });
          return { signature: result.signature };
        },
        slippageBps: 50
      });

      alert(`Swap successful! Transaction: ${txid}`);
      resetForm();
      await loadTokens();
    } catch (error) {
      handleSwapError(error);
    } finally {
      setSwapping(false);
    }
  };

  const resetForm = () => {
    setAmount('');
    setQuote(null);
    setFromToken('');
    setToToken('');
    setSearchQuery('');
    setSearchResults([]);
    setSelectedSearchTokens({});
  };

  const handleSwapError = (error: unknown) => {
    console.error('Swap failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Swap failed';
    
    if (errorMessage.includes('insufficient funds')) {
      setError('Insufficient funds for this transaction');
    } else if (errorMessage.includes('slippage')) {
      setError('Price moved too much. Try increasing slippage or reducing amount.');
    } else {
      setError(errorMessage);
    }
  };

  // Token display helpers
  const getTokenIcon = (token: AnyToken) => {
    // Check for logoURI, icon, or info.logoURI field
    const imageUrl = ('logoURI' in token && token.logoURI) || 
                     ('icon' in token && token.icon) ||
                     ('info' in token && token.info?.logoURI);
    
    const symbol = getTokenSymbol(token);
    
    if (imageUrl) {
      return <img src={imageUrl} alt={symbol} className="w-6 h-6 rounded-full" />;
    }
    
    if (symbol) {
      const letter = symbol[0].toUpperCase();
      const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-red-500'];
      const id = 'mint' in token ? token.mint : ('id' in token ? token.id : token.address);
      const colorClass = colors[id.charCodeAt(0) % colors.length];
      
      return (
        <div className={`w-6 h-6 ${colorClass} rounded-full flex items-center justify-center`}>
          <span className="text-white text-xs font-bold">{letter}</span>
        </div>
      );
    }
    return null;
  };

  const getTokenSymbol = (token: AnyToken): string => {
    if ('info' in token && token.info) return token.info.symbol || '';
    if ('symbol' in token) return token.symbol;
    return '';
  };

  const getTokenName = (token: AnyToken): string => {
    if ('info' in token && token.info) return token.info.name || '';
    if ('name' in token) return token.name;
    return '';
  };

  const formatBalance = (token: WalletToken) => {
    const decimals = token.info?.decimals || token.decimals || 9;
    return (token.amount / Math.pow(10, decimals)).toFixed(6);
  };

  const getSelectedFromToken = (): WalletToken | undefined => {
    return tokens.find(t => t.mint === fromToken);
  };

  const getSelectedToToken = (): AnyToken | null => {
    if (!toToken) return null;
    
    // Popular tokens
    if (toToken === 'So11111111111111111111111111111111111111112') {
      return { 
        address: 'So11111111111111111111111111111111111111112',
        symbol: 'SOL', 
        name: 'Solana',
        decimals: 9,
        icon: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png'
      };
    }
    if (toToken === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v') {
      return { 
        address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        symbol: 'USDC', 
        name: 'USD Coin',
        decimals: 6,
        icon: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png'
      };
    }
    
    // Wallet tokens
    const walletToken = tokens.find(t => t.mint === toToken);
    if (walletToken) {
      return walletToken;
    }
    
    // Search results (both current and previously selected)
    const searchToken = searchResults.find(t => t.id === toToken) || selectedSearchTokens[toToken];
    if (searchToken) {
      return searchToken;
    }
    
    return null;
  };

  const getTokenDecimals = (mint: string): number => {
    if (mint === 'So11111111111111111111111111111111111111112') return 9; // SOL
    if (mint === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v') return 6; // USDC
    
    const walletToken = tokens.find(t => t.mint === mint);
    if (walletToken) return walletToken.info?.decimals || walletToken.decimals || 9;
    
    const searchToken = searchResults.find(t => t.id === mint) || selectedSearchTokens[mint];
    if (searchToken) return searchToken.decimals;
    
    return 9; // Default
  };

  const formatAmount = (amount: string, decimals: number) => {
    const num = parseFloat(amount);
    return (num / Math.pow(10, decimals)).toFixed(6);
  };

  // Render
  if (!ready) {
    return (
      <div className={`flex-[0.3] ${isDarkMode ? 'shadow-lg' : 'bg-gray-200'} rounded-2xl p-4 h-150 flex flex-col`} 
           style={isDarkMode ? {backgroundColor: '#0d0e14'} : {}}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className={`text-gray-400 mb-2`}>Loading...</div>
            <div className={`text-sm text-gray-500`}>Initializing wallet connection</div>
          </div>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className={`flex-[0.3] ${isDarkMode ? 'shadow-lg' : 'bg-gray-200'} rounded-2xl p-4 h-150 flex flex-col`} 
           style={isDarkMode ? {backgroundColor: '#0d0e14'} : {}}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className={`text-gray-400 mb-2`}>Not Authenticated</div>
            <div className={`text-sm text-gray-500`}>Please log in to continue</div>
          </div>
        </div>
      </div>
    );
  }

  if (!walletAddress) {
    return (
      <div className={`flex-[0.3] ${isDarkMode ? 'shadow-lg' : 'bg-gray-200'} rounded-2xl p-4 h-150 flex flex-col`} 
           style={isDarkMode ? {backgroundColor: '#0d0e14'} : {}}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className={`text-gray-400 mb-2`}>Wallet Not Connected</div>
            <div className={`text-sm text-gray-500`}>Connect your wallet to swap tokens</div>
            <div className={`text-xs text-gray-400 mt-2`}>
              Debug: {wallets.length} wallets found
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-[0.3] ${isDarkMode ? 'shadow-lg' : 'border border-gray-300'} rounded-2xl p-4 h-150 flex flex-col`} 
         style={isDarkMode ? {backgroundColor: '#0d0e14'} : {backgroundColor: '#f9f9f8'}}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>Quick Swap</h3>
        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
      </div>
      
      {error && (
        <div className="mb-3 p-2 bg-red-100 border border-red-300 rounded text-red-700 text-xs">
          {error}
        </div>
      )}
      
      <div className="flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          {/* From Token */}
          <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'} rounded-xl p-4 relative`}>
            <label className="text-gray-400 text-xs mb-1 block">From</label>
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  setShowFromDropdown(!showFromDropdown);
                  setShowToDropdown(false);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="flex items-center space-x-2 flex-1"
              >
                {getSelectedFromToken() ? (
                  <>
                    {getTokenIcon(getSelectedFromToken()!)}
                    <div>
                      <div className={`font-medium text-xs ${isDarkMode ? 'text-white' : 'text-black'}`}>
                        {getTokenSymbol(getSelectedFromToken()!)}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Select token</div>
                )}
              </button>
              <div className="text-right">
                <input 
                  type="text" 
                  placeholder="0.00" 
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className={`bg-transparent text-right text-lg font-semibold outline-none w-24 ${isDarkMode ? 'text-white placeholder-gray-400' : 'text-black placeholder-gray-500'}`}
                />
              </div>
            </div>
            
            {showFromDropdown && (
              <div className={`absolute top-full left-0 right-0 mt-1 ${isDarkMode ? 'bg-gray-800' : 'border border-gray-300'} border rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto`} style={isDarkMode ? {} : {backgroundColor: '#f9f9f8'}}>
                <div className="p-2 border-b">
                  <input
                    type="text"
                    placeholder="Search token..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full p-2 text-xs rounded ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-black'}`}
                  />
                </div>
                
                {isSearching ? (
                  <div className="p-2 text-center text-xs text-gray-400">Searching...</div>
                ) : (
                  <>
                    <div className="p-2 text-xs text-gray-400">Your Tokens</div>
                    {tokens.map((token) => (
                      <button
                        key={token.mint}
                        onClick={() => {
                          setFromToken(token.mint);
                          setShowFromDropdown(false);
                          setSearchQuery('');
                          setSearchResults([]);
                          setAmount('');
                          setQuote(null);
                        }}
                        className={`w-full p-2 text-left hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} flex items-center space-x-2`}
                      >
                        {getTokenIcon(token)}
                        <div>
                          <div className={`text-xs ${isDarkMode ? 'text-white' : 'text-black'}`}>
                            {getTokenSymbol(token)}
                          </div>
                          <div className="text-xs text-gray-400">{formatBalance(token)}</div>
                        </div>
                      </button>
                    ))}

                    {searchResults.length > 0 && (
                      <>
                        <div className="p-2 text-xs text-gray-400">Search Results</div>
                        {searchResults.map((token) => (
                          <button
                            key={token.id || token.address}
                            onClick={() => {
                              setSelectedSearchTokens(prev => ({...prev, [token.id]: token}));
                              setFromToken(token.id);
                              setShowFromDropdown(false);
                              setSearchQuery('');
                              setSearchResults([]);
                              setAmount('');
                              setQuote(null);
                            }}
                            className={`w-full p-2 text-left hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} flex items-center space-x-2`}
                          >
                            {getTokenIcon(token)}
                            <div>
                              <div className={`text-xs ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                {getTokenSymbol(token)}
                              </div>
                              <div className="text-xs text-gray-400">{getTokenName(token)}</div>
                            </div>
                          </button>
                        ))}
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Swap Direction Button */}
          <div className="flex justify-center">
            <button 
              className={`p-1 rounded-full transition-colors ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
              onClick={() => {
                const currentFrom = fromToken;
                const currentTo = toToken;
                setFromToken(currentTo);
                setToToken(currentFrom);
                setAmount('');
                setQuote(null);
              }}
            >
              <svg className={`w-3 h-3 ${isDarkMode ? 'text-white' : 'text-black'}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* To Token */}
          <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'} rounded-xl p-4 relative`}>
            <label className="text-gray-400 text-xs mb-1 block">To</label>
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  setShowToDropdown(!showToDropdown);
                  setShowFromDropdown(false);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="flex items-center space-x-2 flex-1"
              >
                {getSelectedToToken() ? (
                  <>
                    {getTokenIcon(getSelectedToToken()!)}
                    <div>
                      <div className={`font-medium text-xs ${isDarkMode ? 'text-white' : 'text-black'}`}>
                        {getTokenSymbol(getSelectedToToken()!)}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Select token</div>
                )}
              </button>
              <div className="text-right">
                <div className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  {quote ? formatAmount(quote.outAmount, getTokenDecimals(toToken)) : '0.00'}
                </div>
              </div>
            </div>
            
            {showToDropdown && (
              <div className={`absolute top-full left-0 right-0 mt-1 ${isDarkMode ? 'bg-gray-800' : 'border border-gray-300'} border rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto`} style={isDarkMode ? {} : {backgroundColor: '#f9f9f8'}}>
                <div className="p-2 border-b">
                  <input
                    type="text"
                    placeholder="Search token..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full p-2 text-xs rounded ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-black'}`}
                  />
                </div>
                
                {isSearching ? (
                  <div className="p-2 text-center text-xs text-gray-400">Searching...</div>
                ) : (
                  <>
                    <div className="p-2 text-xs text-gray-400">Popular</div>
                    {(() => {
                      const solToken = { 
                        address: 'So11111111111111111111111111111111111111112',
                        symbol: 'SOL', 
                        name: 'Solana',
                        decimals: 9,
                        icon: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png'
                      };
                      const usdcToken = { 
                        address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
                        symbol: 'USDC', 
                        name: 'USD Coin',
                        decimals: 6,
                        icon: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png'
                      };
                      
                      return (
                        <>
                          <button
                            onClick={() => {
                              setToToken(solToken.address);
                              setShowToDropdown(false);
                              setSearchQuery('');
                              setSearchResults([]);
                              setQuote(null);
                            }}
                            className={`w-full p-2 text-left hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} flex items-center space-x-2`}
                          >
                            {getTokenIcon(solToken)}
                            <div className={`text-xs ${isDarkMode ? 'text-white' : 'text-black'}`}>SOL</div>
                          </button>
                          <button
                            onClick={() => {
                              setToToken(usdcToken.address);
                              setShowToDropdown(false);
                              setSearchQuery('');
                              setSearchResults([]);
                              setQuote(null);
                            }}
                            className={`w-full p-2 text-left hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} flex items-center space-x-2`}
                          >
                            {getTokenIcon(usdcToken)}
                            <div className={`text-xs ${isDarkMode ? 'text-white' : 'text-black'}`}>USDC</div>
                          </button>
                        </>
                      );
                    })()}

                    {searchResults.length > 0 && (
                      <>
                        <div className="p-2 text-xs text-gray-400">Search Results</div>
                        {searchResults.map((token) => (
                          <button
                            key={token.id || token.address}
                            onClick={() => {
                              setSelectedSearchTokens(prev => ({...prev, [token.id]: token}));
                              setToToken(token.id);
                              setShowToDropdown(false);
                              setSearchQuery('');
                              setSearchResults([]);
                              setQuote(null);
                            }}
                            className={`w-full p-2 text-left hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} flex items-center space-x-2`}
                          >
                            {getTokenIcon(token)}
                            <div>
                              <div className={`text-xs ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                {getTokenSymbol(token)}
                              </div>
                              <div className="text-xs text-gray-400">{getTokenName(token)}</div>
                            </div>
                          </button>
                        ))}
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Quote Information */}
          {quote && fromToken && toToken && (
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg p-3 mt-2`}>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Rate
                  </span>
                  <span className={`text-xs font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    1 {(() => {
                      const selectedFromToken = getSelectedFromToken();
                      return selectedFromToken ? getTokenSymbol(selectedFromToken) : 'Token';
                    })()} ≈ {
                      (() => {
                        const toDecimals = getTokenDecimals(toToken);
                        const inputAmount = parseFloat(amount) || 1;
                        const outputAmount = parseFloat(formatAmount(quote.outAmount, toDecimals));
                        const rate = outputAmount / inputAmount;
                        return rate.toFixed(6);
                      })()
                    } {(() => {
                      const selectedToToken = getSelectedToToken();
                      return selectedToToken ? getTokenSymbol(selectedToToken) : 'Token';
                    })()}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Minimum Received
                  </span>
                  <span className={`text-xs font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    {(() => {
                      const toDecimals = getTokenDecimals(toToken);
                      const outputAmount = parseFloat(formatAmount(quote.outAmount, toDecimals));
                      const slippageAmount = outputAmount * 0.005; // 0.5% slippage
                      const minReceived = outputAmount - slippageAmount;
                      return minReceived.toFixed(6);
                    })()} {(() => {
                      const selectedToken = getSelectedToToken();
                      return selectedToken ? getTokenSymbol(selectedToken) : 'Token';
                    })()}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Price Impact
                  </span>
                  <span className={`text-xs font-medium ${quote.priceImpactPct && parseFloat(quote.priceImpactPct) > 5 ? 'text-orange-500' : isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                    {quote.priceImpactPct ? `${parseFloat(quote.priceImpactPct).toFixed(2)}%` : '< 0.01%'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <button 
          onClick={handleSwap}
          disabled={!fromToken || !toToken || !amount || !quote || loading || swapping}
          className={`w-full py-2 rounded-xl font-medium transition-colors text-sm mt-4 ${
            (!fromToken || !toToken || !amount || !quote || loading || swapping)
              ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
              : isDarkMode 
                ? 'bg-white text-black hover:bg-gray-200' 
                : 'bg-black text-white hover:bg-gray-800'
          }`}
        >
          {swapping ? 'Swapping...' : loading ? 'Getting Quote...' : 'Swap'}
        </button>
      </div>
    </div>
  );
}