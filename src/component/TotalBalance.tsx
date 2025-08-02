import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useSolanaWallets } from '@privy-io/react-auth/solana';
import { getAllTokenData } from '../utils/tokenUtils';
import axios from 'axios';

interface TokenData {
  address: string;
  mint: string;
  amount: number;
  uiAmount: number;
  info?: {
    name?: string;
    symbol?: string;
    logoURI?: string;
    decimals?: number;
  };
}

interface TotalBalanceProps {
  onReceiveClick?: () => void;
  onSendClick?: () => void;
}

export default function TotalBalance({ onReceiveClick, onSendClick }: TotalBalanceProps = {}) {
  const { isDarkMode } = useTheme();
  const { wallets } = useSolanaWallets();
  const [tokenData, setTokenData] = useState<{ tokenAccounts: TokenData[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [prices, setPrices] = useState<{ [key: string]: number }>({});

  // CoinGecko API mapping for Solana tokens
  const getCoinGeckoId = (symbol: string, mint?: string) => {
    const tokenMap: { [key: string]: string } = {
      'SOL': 'solana',
      'USDC': 'usd-coin',
      'USDT': 'tether',
      'RAY': 'raydium',
      'SRM': 'serum',
      'BONK': 'bonk',
      'ORCA': 'orca',
      'JUP': 'jupiter-exchange-solana',
      'MSOL': 'marinade-staked-sol',
      'JITOSOL': 'jito-staked-sol'
    };
    return tokenMap[symbol] || null;
  };

  // Fetch real-time prices from CoinGecko
  const fetchTokenPrices = async (symbols: string[]) => {
    try {
      const coinGeckoIds = symbols
        .map(symbol => getCoinGeckoId(symbol))
        .filter(id => id !== null);
      
      if (coinGeckoIds.length === 0) {
        console.log('TotalBalance - No valid CoinGecko IDs found');
        return {};
      }

      const response = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoIds.join(',')}&vs_currencies=usd`,
        { timeout: 10000 }
      );

      const priceData: { [key: string]: number } = {};
      
      // Map CoinGecko IDs back to symbols
      symbols.forEach(symbol => {
        const coinGeckoId = getCoinGeckoId(symbol);
        if (coinGeckoId && response.data[coinGeckoId]) {
          priceData[symbol] = response.data[coinGeckoId].usd;
          console.log(`TotalBalance - Real price for ${symbol}: $${priceData[symbol]}`);
        }
      });

      return priceData;
    } catch (error) {
      console.error('TotalBalance - Error fetching prices from CoinGecko:', error);
      return {};
    }
  };

  // Get price for a token (from cache or fallback)
  const getTokenPrice = (symbol: string) => {
    const price = prices[symbol] || 0;
    console.log(`TotalBalance - Price lookup for ${symbol}: $${price}`);
    return price;
  };

  const getTokenSymbol = (token: TokenData) => {
    if (token.address === 'native-sol') return 'SOL';
    if (token.info?.symbol) return token.info.symbol;
    return token.mint.slice(0, 4).toUpperCase();
  };

  useEffect(() => {
    async function fetchAllTokenData() {
      if (wallets[0]) {
        setLoading(true);
        try {
          const walletAddress = wallets[0].address;
          const data = await getAllTokenData(walletAddress);
          setTokenData(data);

          // Extract unique token symbols and fetch their prices
          if (data && data.tokenAccounts.length > 0) {
            const symbols = data.tokenAccounts
              .map(token => getTokenSymbol(token))
              .filter((symbol, index, arr) => arr.indexOf(symbol) === index); // Remove duplicates
            
            console.log('TotalBalance - Fetching prices for symbols:', symbols);
            const priceData = await fetchTokenPrices(symbols);
            setPrices(priceData);
          }
        } catch (error) {
          console.error('Error fetching token data:', error);
          setTokenData(null);
        } finally {
          setLoading(false);
        }
      } else {
        setTokenData(null);
        setPrices({});
      }
    }
    
    fetchAllTokenData();
  }, [wallets]);

  // Calculate total USD value using same method as WalletInfo
  const calculateTotalValue = () => {
    if (!tokenData || tokenData.tokenAccounts.length === 0) {
      console.log('TotalBalance - No token data available');
      return null;
    }
    
    console.log(`TotalBalance - Processing ${tokenData.tokenAccounts.length} tokens`);
    
    const total = tokenData.tokenAccounts.reduce((total, token) => {
      const symbol = getTokenSymbol(token);
      const price = getTokenPrice(symbol);
      const uiAmount = token.uiAmount || 0;
      
      // Only include tokens with positive balances
      if (uiAmount <= 0) {
        console.log(`TotalBalance - Skipping ${symbol} with zero/negative balance: ${uiAmount}`);
        return total;
      }
      
      // Skip tokens with no price data (unknown tokens)
      if (price <= 0) {
        console.log(`TotalBalance - Skipping ${symbol} with no price data: ${price}`);
        return total;
      }
      
      const tokenValue = uiAmount * price;
      console.log(`TotalBalance - Token: ${symbol}, Amount: ${uiAmount}, Price: $${price}, Value: $${tokenValue}, Running Total: $${total + tokenValue}`);
      return total + tokenValue;
    }, 0);
    
    console.log(`TotalBalance - Final calculated total: $${total}`);
    return total;
  };

  const totalUsdValue = calculateTotalValue();

  // Mock percentage change - in real app, calculate from historical data
  const percentageChange = 5.8;
  const dollarChange = totalUsdValue !== null && totalUsdValue > 0 ? totalUsdValue * (percentageChange / 100) : null;

  return (
    <div className={`flex-[0.7] ${isDarkMode ? 'shadow-lg' : 'border border-gray-300'} rounded-2xl p-5`} style={isDarkMode ? {backgroundColor: '#0d0e14'} : {backgroundColor: '#f9f9f8'}}>
      <div className="flex items-center space-x-2 mb-3">
        <span className="text-gray-400 text-sm">Total balance</span>
        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      </div>
      <div className="mb-6">
        <div className="flex items-center space-x-4 mb-4">
          {loading ? (
            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>Loading...</h1>
          ) : wallets[0] ? (
            <>
              <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                {totalUsdValue !== null ? `$${totalUsdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00'}
              </h1>
              <div className="flex items-center space-x-2">
                <span className="text-green-400 text-sm">▲ {percentageChange}%</span>
                {dollarChange !== null && (
                  <span className="text-green-400 text-sm">+${dollarChange.toFixed(2)}</span>
                )}
              </div>
            </>
          ) : (
            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>Connect Wallet</h1>
          )}
        </div>
        
        
        <div className="grid grid-cols-4 gap-3">
          <button 
            onClick={onSendClick}
            className={`px-4 py-2 rounded-xl transition-colors text-sm ${isDarkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-black hover:bg-gray-300'}`}
          >
            Send
          </button>
          <button className={`px-4 py-2 rounded-xl transition-colors text-sm ${isDarkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-black hover:bg-gray-300'}`}>
            Stake
          </button>
          <button className={`px-4 py-2 rounded-xl transition-colors text-sm ${isDarkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-black hover:bg-gray-300'}`}>
            Buy
          </button>
          <button 
            onClick={onReceiveClick}
            className={`px-4 py-2 rounded-xl transition-colors text-sm ${isDarkMode ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'}`}
          >
            Receive
          </button>
        </div>
      </div>
    </div>
  );
}