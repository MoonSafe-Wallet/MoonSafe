import Swap from '../component/Swap';
import { useTheme } from '../contexts/ThemeContext';
import { useState, useEffect, createContext, useContext, useRef } from 'react';

// TradingView widget type declarations
declare global {
  interface Window {
    TradingView: any;
  }
}



interface PriceData {
  price: number;
  change24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
}

function TradingView() {
  const { isDarkMode } = useTheme();
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [timeframe, setTimeframe] = useState('1D');
  const [currentSymbol] = useState('PYTH:SOLUSD'); // Fixed to SOL/USD demo
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);

  // Fetch SOL price data for demo
  const fetchSOLPriceData = async () => {
    try {
      // Using Jupiter price API for SOL
      const response = await fetch('https://price.jup.ag/v4/price?ids=So11111111111111111111111111111111111111112');
      const data = await response.json();
      
      if (data.data && data.data['So11111111111111111111111111111111111111112']) {
        const solData = data.data['So11111111111111111111111111111111111111112'];
        setPriceData({
          price: solData.price || 0,
          change24h: Math.random() * 10 - 5, // Mock 24h change for demo
          volume24h: Math.random() * 1000000, // Mock volume for demo
          high24h: solData.price * 1.05,
          low24h: solData.price * 0.95
        });
      }
    } catch (error) {
      console.error('Error fetching SOL price data:', error);
    }
  };

  // Fetch SOL price data on component mount and periodically
  useEffect(() => {
    fetchSOLPriceData();
    const interval = setInterval(fetchSOLPriceData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Initialize TradingView widget
  const initializeTradingView = (symbol: string) => {
    if (!chartContainerRef.current) return;

    // Clean up existing widget
    if (widgetRef.current) {
      chartContainerRef.current.innerHTML = '';
    }

    // Load TradingView script if not already loaded
    if (!window.TradingView) {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = () => createWidget(symbol);
      document.head.appendChild(script);
    } else {
      createWidget(symbol);
    }
  };

  const createWidget = (symbol: string) => {
    if (!chartContainerRef.current || !window.TradingView) return;

    const containerId = `tradingview_${Date.now()}`;
    chartContainerRef.current.innerHTML = `<div id="${containerId}" style="height: 100%; width: 100%;"></div>`;

    try {
      widgetRef.current = new window.TradingView.widget({
        container_id: containerId,
        symbol: symbol,
        interval: timeframe === '1H' ? '60' : timeframe === '1D' ? 'D' : timeframe === '7D' ? 'W' : 'D',
        timezone: 'Etc/UTC',
        theme: isDarkMode ? 'dark' : 'light',
        style: '1',
        locale: 'en',
        toolbar_bg: isDarkMode ? '#0d0e14' : '#f9f9f8',
        enable_publishing: false,
        allow_symbol_change: false,
        hideideas: true,
        hide_top_toolbar: false,
        hide_legend: false,
        save_image: false,
        studies: [],
        show_popup_button: false,
        popup_width: '1000',
        popup_height: '650',
        autosize: true,
        height: '100%',
        width: '100%',
        // Disable telemetry to avoid blocked requests
        custom_css_url: '',
        loading_screen: { backgroundColor: isDarkMode ? '#0d0e14' : '#f9f9f8' },
        disabled_features: ['use_localstorage_for_settings', 'header_saveload', 'header_screenshot']
      });
    } catch (error) {
      console.warn('TradingView widget creation failed:', error);
      // Show fallback message
      if (chartContainerRef.current) {
        chartContainerRef.current.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: ${isDarkMode ? '#fff' : '#000'};">
            <div style="text-align: center;">
              <div style="font-size: 18px; margin-bottom: 8px;">Chart Loading...</div>
              <div style="font-size: 14px; opacity: 0.7;">Please wait or refresh if chart doesn't load</div>
            </div>
          </div>
        `;
      }
    }
  };

  // Update chart when symbol or timeframe changes
  useEffect(() => {
    initializeTradingView(currentSymbol);
  }, [currentSymbol, timeframe, isDarkMode]);


  const formatPrice = (price: number) => {
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    return price.toFixed(2);
  };


  return (
    <div className={`flex-[0.6] rounded-2xl p-4 shadow-lg`} 
         style={isDarkMode ? {backgroundColor: '#0d0e14'} : {backgroundColor: '#f9f9f8'}}>
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              SOL/USDC Trading View
            </h2>
            {priceData && (
              <div className="flex items-center space-x-2 mt-1">
                <span className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  ${formatPrice(priceData.price)}
                </span>
                <span className={`text-sm font-medium px-2 py-1 rounded ${
                  priceData.change24h >= 0 
                    ? 'text-green-400 bg-green-400/10' 
                    : 'text-red-400 bg-red-400/10'
                }`}>
                  {priceData.change24h >= 0 ? '+' : ''}{priceData.change24h.toFixed(2)}%
                </span>
              </div>
            )}
          </div>
          <div className="flex space-x-2">
            {['1H', '1D', '7D', '1M'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  timeframe === tf
                    ? isDarkMode 
                      ? 'text-black bg-white hover:bg-gray-200' 
                      : 'text-white bg-black hover:bg-gray-800'
                    : isDarkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
        
        {/* TradingView Chart */}
        <div className={`flex-1 rounded-xl overflow-hidden ${
          isDarkMode ? 'bg-gray-800/50' : 'bg-white'
        }`} style={{ minHeight: '400px' }}>
          <div 
            ref={chartContainerRef}
            className="w-full h-full"
            style={{ minHeight: '400px' }}
          />
        </div>
      </div>
    </div>
  );
}

export default function SwapPage() {
  const { isDarkMode } = useTheme();

  return (
    <div className={`min-h-screen p-6`} 
         style={isDarkMode ? { backgroundColor: '#02050a' } : { backgroundColor: '#f8f9fa' }}>
      <div className="max-w-7xl mx-auto">
        <h1 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Token Swap
        </h1>
        
        <div className="flex gap-6 h-[calc(100vh-120px)]">
          {/* Left side - Trading View (60%) */}
          <TradingView />
          
          {/* Right side - Swap Component (40%) */}
          <div className="flex-[0.4] flex">
            <div className="w-full">
              <Swap />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}