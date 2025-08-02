import { useState, useEffect } from 'react';
import { useSolanaWallets } from '@privy-io/react-auth/solana';
import { useTheme } from '../contexts/ThemeContext';

interface ReceiveProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Receive({ isOpen, onClose }: ReceiveProps) {
  const { isDarkMode } = useTheme();
  const { wallets } = useSolanaWallets();
  const [copiedText, setCopiedText] = useState<string>('');
  const [qrCodeUrl, setQRCodeUrl] = useState<string>('');

  const walletAddress = wallets[0]?.address;

  // Generate QR code when component opens
  useEffect(() => {
    if (isOpen && walletAddress) {
      generateQRCode(walletAddress);
    }
  }, [isOpen, walletAddress, isDarkMode]);

  const generateQRCode = (address: string) => {
    try {
      // Use QR Server API for QR code generation
      const size = 256;
      const bgColor = isDarkMode ? '0d0e14' : 'ffffff';
      const fgColor = isDarkMode ? 'ffffff' : '000000';
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&bgcolor=${bgColor}&color=${fgColor}&data=${encodeURIComponent(address)}`;
      setQRCodeUrl(qrUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
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

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-opacity-50 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      
      {/* Sidebar Container with Padding */}
      <div className={`fixed right-4 top-4 bottom-4 w-96 z-50 transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        
        {/* Sidebar Content */}
        <div className={`w-full h-full ${isDarkMode ? 'text-white shadow-lg' : 'text-black border border-gray-300'} flex flex-col rounded-2xl`} style={isDarkMode ? {backgroundColor: '#02050a'} : {backgroundColor: '#f9f9f8'}}>
          
          {/* Header */}
          <div className={`p-6 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  Receive
                </h2>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                  Share your wallet address to receive crypto
                </p>
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
            {!walletAddress ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className={`text-gray-400 mb-2`}>No wallet connected</div>
                  <div className={`text-sm text-gray-500`}>Connect your wallet to receive crypto</div>
                </div>
              </div>
            ) : (
              <>
                {/* QR Code Section */}
                <div className="space-y-4">
                  <h3 className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    QR Code
                  </h3>
                  
                  <div className="flex justify-center">
                    <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-white border-gray-200' : 'border-gray-300'}`} style={isDarkMode ? {} : {backgroundColor: '#f9f9f8'}}>
                      {qrCodeUrl ? (
                        <img src={qrCodeUrl} alt="Wallet Address QR Code" className="w-48 h-48" />
                      ) : (
                        <div className="w-48 h-48 flex items-center justify-center bg-gray-200 rounded-lg">
                          <div className="text-gray-500">Generating QR...</div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <p className={`text-xs text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Scan this QR code to get your wallet address
                  </p>
                </div>

                {/* Wallet Address Section */}
                <div className="space-y-4">
                  <h3 className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    Wallet Address
                  </h3>
                  
                  <div className="space-y-2">
                    <label className="text-xs text-gray-400 block">Solana Address</label>
                    <div className={`flex items-center justify-between p-3 border rounded-lg ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-300'}`} style={isDarkMode ? {} : {backgroundColor: '#f9f9f8'}}>
                      <span className={`text-sm font-mono ${isDarkMode ? 'text-white' : 'text-black'} break-all mr-2`}>
                        {walletAddress}
                      </span>
                      <button
                        onClick={() => copyToClipboard(walletAddress)}
                        className={`p-2 rounded ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'} transition-colors flex-shrink-0`}
                        title="Copy wallet address"
                      >
                        {copiedText === walletAddress ? (
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

                  <div className="space-y-2">
                    <label className="text-xs text-gray-400 block">Short Address</label>
                    <div className={`flex items-center justify-between p-3 border rounded-lg ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-300'}`} style={isDarkMode ? {} : {backgroundColor: '#f9f9f8'}}>
                      <span className={`text-sm font-mono ${isDarkMode ? 'text-white' : 'text-black'}`}>
                        {formatAddress(walletAddress)}
                      </span>
                      <button
                        onClick={() => copyToClipboard(walletAddress)}
                        className={`p-2 rounded ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'} transition-colors`}
                        title="Copy full wallet address"
                      >
                        {copiedText === walletAddress ? (
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

                {/* Warning Section */}
                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-yellow-900/20 border border-yellow-700' : 'bg-yellow-50 border border-yellow-200'}`}>
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      <h4 className={`text-sm font-medium ${isDarkMode ? 'text-yellow-400' : 'text-yellow-800'}`}>
                        Important
                      </h4>
                      <p className={`text-xs mt-1 ${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                        Only send Solana (SOL) and SPL tokens to this address. Sending other cryptocurrencies may result in permanent loss.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}