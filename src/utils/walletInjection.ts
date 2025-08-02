export interface WalletAdapter {
  publicKey: string;
  connected: boolean;
  connecting: boolean;
  signTransaction: (transaction: any) => Promise<any>;
  signAllTransactions: (transactions: any[]) => Promise<any[]>;
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

export const createWalletAdapter = (privyWallet: any): WalletAdapter => {
  return {
    publicKey: privyWallet?.address || '',
    connected: !!privyWallet?.address,
    connecting: false,
    signTransaction: async (transaction) => {
      if (!privyWallet) throw new Error('Wallet not connected');
      return await privyWallet.signTransaction(transaction);
    },
    signAllTransactions: async (transactions) => {
      if (!privyWallet) throw new Error('Wallet not connected');
      return await privyWallet.signAllTransactions(transactions);
    },
    signMessage: async (message) => {
      if (!privyWallet) throw new Error('Wallet not connected');
      return await privyWallet.signMessage(message);
    },
    connect: async () => {
      return Promise.resolve();
    },
    disconnect: async () => {
      return Promise.resolve();
    }
  };
};

