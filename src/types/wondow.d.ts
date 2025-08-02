// types/window.d.ts
interface SolanaWallet {
  isPhantom?: boolean;
  connect: () => Promise<void>;
  signAndSendTransaction: (transaction: { message: Uint8Array } | any) => Promise<{ signature: string }>;
  signTransaction?: (transaction: any) => Promise<any>;
}

declare global {
  interface Window {
    solana?: SolanaWallet;
  }
}