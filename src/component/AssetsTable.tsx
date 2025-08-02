import { useTheme } from '../contexts/ThemeContext';
import CoinSvg from '../assets/coin.svg';

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

interface AssetsTableProps {
  tokenData: {
    tokenAccounts: TokenData[];
  } | null;
  loading?: boolean;
  showControls?: boolean;
  onRefresh?: () => void;
}

export default function AssetsTable({ tokenData, loading = false, showControls = false, onRefresh }: AssetsTableProps) {
  const { isDarkMode } = useTheme();

  const getTokenIcon = (token: TokenData) => {
    if (token.info?.logoURI) {
      return (
        <img 
          src={token.info.logoURI} 
          alt={token.info.name || token.info.symbol}
          className="w-8 h-8 rounded-full"
          onError={(e) => {
            // Fallback to letter icon if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
      );
    }
    
    // Fallback letter icon
    const letter = token.info?.symbol?.[0]?.toUpperCase() || token.address[0].toUpperCase();
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-red-500', 'bg-yellow-500'];
    const colorClass = colors[token.address.charCodeAt(0) % colors.length];
    
    return (
      <div className={`w-8 h-8 ${colorClass} rounded-full flex items-center justify-center`}>
        <span className="text-white text-xs font-bold">{letter}</span>
      </div>
    );
  };

  const formatBalance = (token: TokenData) => {
    if (token.address === 'native-sol') {
      return token.uiAmount?.toFixed(4) || '0.0000';
    }
    return token.uiAmount?.toFixed(6) || '0.000000';
  };

  const getTokenName = (token: TokenData) => {
    if (token.address === 'native-sol') return 'Solana';
    return token.info?.name || 'Unknown Token';
  };

  const getTokenSymbol = (token: TokenData) => {
    if (token.address === 'native-sol') return 'SOL';
    return token.info?.symbol || 'UNK';
  };

  // Mock price data - in a real app, you'd fetch this from a price API
  const getMockPrice = (symbol: string) => {
    const prices: { [key: string]: number } = {
      'SOL': 148.54,
      'USDC': 1.00,
      'USDT': 0.9999,
      'RAY': 3.42,
      'SRM': 0.45,
    };
    return prices[symbol] || 0.01;
  };

  const getMockPriceChange = (symbol: string) => {
    const changes: { [key: string]: number } = {
      'SOL': 5.8,
      'USDC': 0.01,
      'USDT': -0.02,
      'RAY': -2.1,
      'SRM': 12.5,
    };
    return changes[symbol] || Math.random() * 20 - 10; // Random between -10 and 10
  };

  if (!tokenData || tokenData.tokenAccounts.length === 0) {
    return (
      <div className={`flex-[0.7] h-150 ${isDarkMode ? 'shadow-lg' : 'border border-gray-300'} rounded-2xl p-5`} style={isDarkMode ? {backgroundColor: '#0d0e14'} : {backgroundColor: '#f9f9f8'}}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>Assets (0)</h3>
          {showControls && onRefresh && (
            <button 
              onClick={onRefresh}
              disabled={loading}
              className={`text-gray-400 text-sm ${isDarkMode ? 'hover:text-white' : 'hover:text-black'} disabled:opacity-50`}
            >
              {loading ? 'Loading...' : 'Refresh +'}
            </button>
          )}
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center">
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
      </div>
    );
  }

  const totalValue = tokenData.tokenAccounts.reduce((sum, token) => {
    const symbol = getTokenSymbol(token);
    const price = getMockPrice(symbol);
    return sum + (token.uiAmount * price);
  }, 0);

  return (
    <div className={`flex-[0.7] h-150 ${isDarkMode ? 'shadow-lg' : 'border border-gray-300'} rounded-2xl p-5 flex flex-col`} style={isDarkMode ? {backgroundColor: '#0d0e14'} : {backgroundColor: '#f9f9f8'}}>
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
          Assets ({tokenData.tokenAccounts.length})
        </h3>
        {showControls && onRefresh && (
          <button 
            onClick={onRefresh}
            disabled={loading}
            className={`text-gray-400 text-sm ${isDarkMode ? 'hover:text-white' : 'hover:text-black'} disabled:opacity-50`}
          >
            {loading ? 'Loading...' : 'Refresh +'}
          </button>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent hover:scrollbar-thumb-gray-300" style={{
        scrollbarWidth: 'thin',
        scrollbarColor: isDarkMode ? '#4B5563 transparent' : '#9CA3AF transparent'
      }}>
        <table className="w-full">
          <thead>
            <tr className={`text-gray-400 text-xs border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
              <th className="text-left py-2">Asset</th>
              <th className="text-right py-2">Amount</th>
              <th className="w-6"></th>
            </tr>
          </thead>
          <tbody className={`${isDarkMode ? 'text-white' : 'text-black'}`}>
            {tokenData.tokenAccounts.map((token, index) => {
              const symbol = getTokenSymbol(token);
              const price = getMockPrice(symbol);
              
              return (
                <tr key={token.address} className={`${isDarkMode ? 'hover:bg-gray-700/30' : 'hover:bg-gray-200/30'} h-12`}>
                  <td className="py-2">
                    <div className="flex items-center space-x-3">
                      {getTokenIcon(token)}
                      <div>
                        <div className={`font-medium text-sm ${isDarkMode ? 'text-white' : 'text-black'}`}>
                          {getTokenName(token)}
                        </div>
                        <div className="text-gray-400 text-xs">{symbol}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2 text-right">
                    <div className="font-medium text-sm">{formatBalance(token)} {symbol}</div>
                    <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      ${price.toFixed(2)}
                    </div>
                  </td>
                  <td className="py-2 text-right">
                    <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}