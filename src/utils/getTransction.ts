// transactionHistoryService.ts

interface Transaction {
  signature: string;
  blockTime?: number;
  slot: number;
  memo?: string;
  err?: any;
  meta?: {
    fee: number;
    preBalances: number[];
    postBalances: number[];
    preTokenBalances?: any[];
    postTokenBalances?: any[];
  };
  transaction?: {
    message: {
      instructions: any[];
      accountKeys: string[];
    };
  };
}

interface TransactionHistoryResponse {
  transactions: Transaction[];
  oldestSlot?: number;
}

interface FetchOptions {
  before?: string; // Signature of the transaction to start searching backwards from
  limit?: number; // Maximum number of transaction signatures to return (default: 1000, max: 1000)
}

const RPC_URL = import.meta.env.VITE_RPC_URL || 'https://mainnet.helius-rpc.com/?api-key=4c4a4f43-145d-4406-b89c-36ad977bb738';

/**
 * Fetches the transaction history for a given wallet address
 * @param address The wallet address to fetch transactions for
 * @param options Optional parameters for the request
 * @returns Promise<TransactionHistoryResponse>
 */
export async function getTransactionHistory(
  address: string,
  options: FetchOptions = {}
): Promise<TransactionHistoryResponse> {
  try {
    const { before, limit = 1000 } = options;
    
    const response = await fetch(RPC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: '1',
        method: 'getSignaturesForAddress',
        params: [
          address,
          {
            before,
            limit,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`RPC request failed with status ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || 'RPC error occurred');
    }

    // If you need to fetch the actual transaction details for each signature,
    // you would need to make additional RPC calls here using getTransaction

    return {
      transactions: data.result || [],
      oldestSlot: data.result?.length ? data.result[data.result.length - 1].slot : undefined,
    };
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    throw error;
  }
}

/**
 * Fetches detailed transaction information for a given transaction signature
 * @param signature The transaction signature to fetch details for
 * @returns Promise<Transaction>
 */
export async function getTransactionDetails(signature: string): Promise<Transaction> {
  try {
    const response = await fetch(RPC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: '1',
        method: 'getTransaction',
        params: [
          signature,
          {
            encoding: 'json',
            maxSupportedTransactionVersion: 0,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`RPC request failed with status ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || 'RPC error occurred');
    }

    return data.result;
  } catch (error) {
    console.error('Error fetching transaction details:', error);
    throw error;
  }
}

export const TransactionType = {
  SENT: 'sent',
  RECEIVED: 'received',
  STAKED: 'staked',
  UNSTAKED: 'unstaked',
  SWAPPED: 'swapped',
  UNKNOWN: 'unknown'
} as const;

export type TransactionType = typeof TransactionType[keyof typeof TransactionType];

export interface ParsedTransaction extends Transaction {
  type: TransactionType;
  amount?: number;
  description: string;
}

/**
 * Analyzes a transaction to determine its type and create human-readable description
 */
export function parseTransactionType(transaction: Transaction, userWallet: string): ParsedTransaction {
  if (!transaction.meta || !transaction.transaction) {
    return {
      ...transaction,
      signature: transaction.signature || 'unknown',
      type: TransactionType.UNKNOWN,
      description: 'Unknown transaction'
    };
  }

  const { meta, transaction: txData } = transaction;
  const { preBalances, postBalances } = meta;
  const accountKeys = txData.message.accountKeys;
  
  // Find user's account index
  const userAccountIndex = accountKeys.findIndex(key => key === userWallet);
  
  if (userAccountIndex === -1) {
    return {
      ...transaction,
      signature: transaction.signature || 'unknown',
      type: TransactionType.UNKNOWN,
      description: 'Transaction not involving this wallet'
    };
  }

  const balanceChange = postBalances[userAccountIndex] - preBalances[userAccountIndex];
  const balanceChangeSOL = Math.abs(balanceChange) / 1e9; // Convert lamports to SOL

  // Check instructions for specific program IDs
  const instructions = txData.message.instructions;
  
  // Common Solana program IDs
  const STAKE_PROGRAM = 'Stake11111111111111111111111111111111111112';
  const TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

  // Check for staking operations
  const hasStakeInstruction = instructions.some(ix => 
    accountKeys[ix.programIdIndex] === STAKE_PROGRAM
  );

  if (hasStakeInstruction) {
    if (balanceChange < 0) {
      return {
        ...transaction,
        signature: transaction.signature || 'unknown',
        type: TransactionType.STAKED,
        amount: balanceChangeSOL,
        description: `Staked ${balanceChangeSOL.toFixed(4)} SOL`
      };
    } else {
      return {
        ...transaction,
        signature: transaction.signature || 'unknown',
        type: TransactionType.UNSTAKED,
        amount: balanceChangeSOL,
        description: `Unstaked ${balanceChangeSOL.toFixed(4)} SOL`
      };
    }
  }

  // Check for token operations (swaps, etc.)
  const hasTokenInstruction = instructions.some(ix => 
    accountKeys[ix.programIdIndex] === TOKEN_PROGRAM
  );

  if (hasTokenInstruction && meta.preTokenBalances && meta.postTokenBalances) {
    return {
      ...transaction,
      signature: transaction.signature || 'unknown',
      type: TransactionType.SWAPPED,
      description: 'Token swap/transfer'
    };
  }

  // Simple SOL transfer
  if (Math.abs(balanceChange) > meta.fee) {
    if (balanceChange > 0) {
      return {
        ...transaction,
        signature: transaction.signature || 'unknown',
        type: TransactionType.RECEIVED,
        amount: balanceChangeSOL,
        description: `Received ${balanceChangeSOL.toFixed(4)} SOL`
      };
    } else {
      return {
        ...transaction,
        signature: transaction.signature || 'unknown',
        type: TransactionType.SENT,
        amount: balanceChangeSOL,
        description: `Sent ${balanceChangeSOL.toFixed(4)} SOL`
      };
    }
  }

  return {
    ...transaction,
    signature: transaction.signature || 'unknown',
    type: TransactionType.UNKNOWN,
    description: 'Unknown transaction type'
  };
}