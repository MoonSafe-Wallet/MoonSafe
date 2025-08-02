/// <reference types="vite/client" />

interface Window {
  solana?: {
    isPhantom?: boolean;
    connect: () => Promise<{ publicKey: { toString: () => string } }>;
    signTransaction: (transaction: any) => Promise<any>;
    signAndSendTransaction: (transaction: any) => Promise<{
      serialized(serialized: any): unknown; signature: string 
}>;
    signAllTransactions: (transactions: any[]) => Promise<any[]>;
  };
}
