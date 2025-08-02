import { useSendTransaction, useSignTransaction, useSolanaWallets } from '@privy-io/react-auth/solana';
import { Connection, Transaction, PublicKey, SystemProgram } from '@solana/web3.js';
import { 
  createTransferInstruction, 
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount
} from '@solana/spl-token';

const connection = new Connection('https://mainnet.helius-rpc.com/?api-key=4c4a4f43-145d-4406-b89c-36ad977bb738', 'confirmed');

export interface SendTokenParams {
  tokenMint: string;
  destinationAddress: string;
  amount: number;
  decimals?: number;
}

export interface SendSolParams {
  destinationAddress: string;
  amount: number; // in SOL
}

export const useTransactionService = () => {
  const { sendTransaction } = useSendTransaction();
  const { signTransaction } = useSignTransaction();
  const { wallets } = useSolanaWallets();

  const sendSol = async ({ destinationAddress, amount }: SendSolParams) => {
    try {
      if (!wallets[0]) {
        throw new Error('No wallet connected');
      }

      const transaction = new Transaction();
      const transferInstruction = SystemProgram.transfer({
        fromPubkey: new PublicKey(wallets[0].address),
        toPubkey: new PublicKey(destinationAddress),
        lamports: amount * 1000000000 // Convert SOL to lamports
      });
      
      transaction.add(transferInstruction);
      
      const latestBlockhash = await connection.getLatestBlockhash();
      transaction.recentBlockhash = latestBlockhash.blockhash;
      transaction.feePayer = new PublicKey(wallets[0].address);

      const receipt = await sendTransaction({
        transaction,
        connection
      });

      return {
        success: true,
        signature: receipt.signature,
        message: `Successfully sent ${amount} SOL to ${destinationAddress}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'SOL transfer failed'
      };
    }
  };

  const sendToken = async ({ tokenMint, destinationAddress, amount, decimals = 9 }: SendTokenParams) => {
    try {
      if (!wallets[0]) {
        throw new Error('No wallet connected');
      }

      const sourceTokenAccount = await getAssociatedTokenAddress(
        new PublicKey(tokenMint),
        new PublicKey(wallets[0].address)
      );
      
      const destinationTokenAccount = await getAssociatedTokenAddress(
        new PublicKey(tokenMint),
        new PublicKey(destinationAddress)
      );

      // Check if destination token account exists
      let destinationAccountExists = false;
      try {
        await getAccount(connection, destinationTokenAccount);
        destinationAccountExists = true;
      } catch {
        destinationAccountExists = false;
      }

      const tokenAmount = BigInt(amount * Math.pow(10, decimals));
      const transaction = new Transaction();

      // Create destination token account if needed
      if (!destinationAccountExists) {
        const createAccountInstruction = createAssociatedTokenAccountInstruction(
          new PublicKey(wallets[0].address), // payer
          destinationTokenAccount,
          new PublicKey(destinationAddress), // owner
          new PublicKey(tokenMint)
        );
        transaction.add(createAccountInstruction);
      }

      // Create transfer instruction
      const transferInstruction = createTransferInstruction(
        sourceTokenAccount,
        destinationTokenAccount,
        new PublicKey(wallets[0].address),
        tokenAmount
      );
      transaction.add(transferInstruction);

      const latestBlockhash = await connection.getLatestBlockhash();
      transaction.recentBlockhash = latestBlockhash.blockhash;
      transaction.feePayer = new PublicKey(wallets[0].address);

      const receipt = await sendTransaction({
        transaction,
        connection
      });

      return {
        success: true,
        signature: receipt.signature,
        message: `Successfully transferred ${amount} tokens to ${destinationAddress}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Token transfer failed'
      };
    }
  };

  const signCustomTransaction = async (transaction: Transaction) => {
    try {
      if (!wallets[0]) {
        throw new Error('No wallet connected');
      }

      const latestBlockhash = await connection.getLatestBlockhash();
      transaction.recentBlockhash = latestBlockhash.blockhash;
      transaction.feePayer = new PublicKey(wallets[0].address);

      const signedTransaction = await signTransaction({
        transaction,
        connection
      });

      return {
        success: true,
        signedTransaction,
        message: 'Transaction signed successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Transaction signing failed'
      };
    }
  };

  return {
    sendSol,
    sendToken,
    signTransaction: signCustomTransaction,
    wallets,
    connection
  };
};