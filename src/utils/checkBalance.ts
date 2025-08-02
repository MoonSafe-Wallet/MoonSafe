import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

// Vite automatically makes VITE_* variables available
const SOLANA_RPC_URL = import.meta.env.VITE_RPC_URL;

if (!SOLANA_RPC_URL) {
    throw new Error('VITE_RPC_URL is not defined in environment variables');
}

const connection = new Connection(SOLANA_RPC_URL, 'confirmed');

export async function getWalletBalance(walletAddress: string): Promise<number> {
    try {
        const publicKey = new PublicKey(walletAddress);
        const balanceInLamports = await connection.getBalance(publicKey);
        return balanceInLamports / LAMPORTS_PER_SOL;
    } catch (error) {
        console.error('Error fetching wallet balance:', error);
        throw error;
    }
}

export async function getWalletInfo(walletAddress: string) {
    try {
        const publicKey = new PublicKey(walletAddress);
        const accountInfo = await connection.getAccountInfo(publicKey);

        if (!accountInfo) {
            throw new Error('Account not found or has no balance');
        }

        return {
            balance: accountInfo.lamports / LAMPORTS_PER_SOL,
            balanceInLamports: accountInfo.lamports,
            executable: accountInfo.executable,
            owner: accountInfo.owner.toString(),
            rentEpoch: accountInfo.rentEpoch ?? 0
        };
    } catch (error) {
        console.error('Error fetching wallet info:', error);
        throw error;
    }
}