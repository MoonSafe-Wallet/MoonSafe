import React, { useState, useEffect } from 'react';
import { getTransactionHistory, getTransactionDetails, parseTransactionType, TransactionType } from '../utils/getTransction';
import type { ParsedTransaction } from '../utils/getTransction';
import { useTransactionService } from '../provider/transactionService';
import { useTheme } from '../contexts/ThemeContext';
import EmptyBoxSvg from '../assets/emptyBox.svg';

interface TransactionsProps {
  limit?: number;
}

const Transactions: React.FC<TransactionsProps> = ({ limit = 3 }) => {
  const { isDarkMode } = useTheme();
  const { wallets } = useTransactionService();
  const walletAddress = wallets[0]?.address;
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async () => {
    if (!walletAddress) {
      console.log('No wallet address provided');
      return;
    }
    
    console.log('Fetching transactions for:', walletAddress);
    setLoading(true);
    setError(null);
    
    try {
      console.log('Getting transaction history...');
      const history = await getTransactionHistory(walletAddress, { limit });
      console.log('Transaction history received:', history);
      
      if (!history.transactions || history.transactions.length === 0) {
        console.log('No transactions found');
        setTransactions([]);
        setLoading(false);
        return;
      }
      
      // Fetch detailed info for each transaction and parse it
      const detailedTransactions: ParsedTransaction[] = [];
      console.log(`Processing ${Math.min(history.transactions.length, 5)} transactions...`);
      
      for (const tx of history.transactions.slice(0, limit)) { // Limit for performance
        try {
          console.log(`Fetching details for transaction: ${tx.signature}`);
          const details = await getTransactionDetails(tx.signature);
          console.log('Transaction details:', details);
          
          const parsedTx = parseTransactionType(details, walletAddress);
          console.log('Parsed transaction:', parsedTx);
          detailedTransactions.push(parsedTx);
        } catch (err) {
          console.error(`Error fetching details for ${tx.signature}:`, err);
          // Add unparsed transaction as fallback
          detailedTransactions.push({
            ...tx,
            type: TransactionType.UNKNOWN,
            description: 'Failed to load transaction details'
          });
        }
      }
      
      console.log('Final transactions array:', detailedTransactions);
      setTransactions(detailedTransactions);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch transactions';
      setError(errorMessage);
      console.error('Error fetching transactions:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (walletAddress) {
      fetchTransactions();
    }
  }, [walletAddress, limit]);

  const getTypeColor = (type: TransactionType): string => {
    switch (type) {
      case TransactionType.RECEIVED: return '#4CAF50'; // Green
      case TransactionType.SENT: return '#F44336'; // Red
      case TransactionType.STAKED: return '#2196F3'; // Blue
      case TransactionType.UNSTAKED: return '#FF9800'; // Orange
      case TransactionType.SWAPPED: return '#9C27B0'; // Purple
      default: return '#757575'; // Gray
    }
  };

  const getTypeIcon = (type: TransactionType) => {
    switch (type) {
      case TransactionType.RECEIVED: 
        return (
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
          </svg>
        );
      case TransactionType.SENT:
        return (
          <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
          </svg>
        );
      case TransactionType.SWAPPED:
        return (
          <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const renderTransaction = (item: ParsedTransaction, index: number) => {
    if (!item) {
      console.error('Invalid transaction item:', item);
      return null;
    }
    
    const signature = item.signature || 'No signature';
    const uniqueKey = item.signature || `tx-${index}-${item.slot || Date.now()}`;
    console.log('Rendering transaction with signature:', signature);
    
    return (
      <div key={uniqueKey} className="flex items-center justify-between mb-3 last:mb-0">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center bg-opacity-20" 
               style={{ backgroundColor: getTypeColor(item.type) + '33' }}>
            {getTypeIcon(item.type)}
          </div>
          <div>
            <div className={`text-xs font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
              {item.type.charAt(0).toUpperCase() + item.type.slice(1).toLowerCase()}
            </div>
            <div className="text-xs text-gray-400">
              {item.blockTime ? new Date(item.blockTime * 1000).toLocaleDateString() : 'Recent'}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-xs font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
            {item.amount ? `${item.amount > 0 ? '+' : ''}${item.amount.toFixed(4)} SOL` : '—'}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex-[0.3] ${isDarkMode ? 'shadow-lg' : 'border border-gray-300'} rounded-2xl p-4 h-49 flex flex-col`} 
         style={isDarkMode ? {backgroundColor: '#0d0e14'} : {backgroundColor: '#f9f9f8'}}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>Recent Transactions</h3>
        <button className={`text-gray-400 ${isDarkMode ? 'hover:text-white' : 'hover:text-black'} transition-colors`}>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      <div className="flex-1 flex flex-col">
        {!walletAddress ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>No wallet connected</div>
            </div>
          </div>
        ) : loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading...</div>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-xs text-red-400">Error loading transactions</div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <img 
              src={EmptyBoxSvg} 
              alt="No transactions" 
              className="w-25 h-25 mb-3 opacity-60"
            />
            <div className={`text-xs text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>No transactions found</div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {transactions.map((transaction, index) => {
              const uniqueKey = transaction.signature || `tx-${index}-${transaction.slot || transaction.blockTime || Date.now()}-${Math.random()}`;
              return (
                <React.Fragment key={uniqueKey}>
                  {renderTransaction(transaction, index)}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};


export default Transactions;