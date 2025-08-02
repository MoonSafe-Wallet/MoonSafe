import { 
  Connection, 
  PublicKey, 
  Transaction, 
  Keypair, 
  sendAndConfirmTransaction 
} from "@solana/web3.js";
import { 
  createTransferInstruction, 
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount,
  TOKEN_PROGRAM_ID
} from "@solana/spl-token";
import bs58 from "bs58";

//use the private key for testing purposes only 
const privateKey = import.meta.env.VITE_PRIVATE_KEY;

const SOLANA_RPC_URL = import.meta.env.VITE_RPC_URL;
const connection = new Connection(SOLANA_RPC_URL, 'confirmed');

export interface TransferTokenParams {
  tokenMint: string;
  destinationAddress: string;
  amount: number;
  decimals?: number;
}

export const transferToken = async ({ 
  tokenMint, 
  destinationAddress, 
  amount, 
  decimals = 9 
}: TransferTokenParams) => {
  try {
    // Convert private key from base58 string to Uint8Array
    const privateKeyBytes = bs58.decode(privateKey);
    
    const keypair = Keypair.fromSecretKey(privateKeyBytes);
    
    // Get source and destination token accounts
    const sourceTokenAccount = await getAssociatedTokenAddress(
      new PublicKey(tokenMint),
      keypair.publicKey
    );
    
    const destinationTokenAccount = await getAssociatedTokenAddress(
      new PublicKey(tokenMint),
      new PublicKey(destinationAddress)
    );

    // Check if source token account exists
    let sourceAccountExists = false;
    try {
      await getAccount(connection, sourceTokenAccount);
      sourceAccountExists = true;
    } catch (error) {
      return {
        success: false,
        error: `Source token account does not exist for mint ${tokenMint}`,
        message: 'Token transfer failed - source account not found'
      };
    }

    // Check if destination token account exists
    let destinationAccountExists = false;
    try {
      await getAccount(connection, destinationTokenAccount);
      destinationAccountExists = true;
    } catch (error) {
      // Account doesn't exist, we'll create it
      destinationAccountExists = false;
    }

    // Convert amount to proper token units (multiply by 10^decimals)
    const tokenAmount = BigInt(amount * Math.pow(10, decimals));

    // Create transaction
    const transaction = new Transaction();

    // Add create destination token account instruction if needed
    if (!destinationAccountExists) {
      const createAccountInstruction = createAssociatedTokenAccountInstruction(
        keypair.publicKey, // payer
        destinationTokenAccount, // associated token account
        new PublicKey(destinationAddress), // owner
        new PublicKey(tokenMint) // mint
      );
      transaction.add(createAccountInstruction);
    }

    // Create the transfer instruction
    const transferInstruction = createTransferInstruction(
      sourceTokenAccount,
      destinationTokenAccount,
      keypair.publicKey,
      tokenAmount
    );

    transaction.add(transferInstruction);
    
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [keypair],
      {
        commitment: 'confirmed',
        skipPreflight: false
      }
    );
    
    return {
      success: true,
      signature,
      message: `Successfully transferred ${amount} tokens to ${destinationAddress}`
    };
    
  } catch (error) {
    console.error('Transaction failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      message: 'Token transfer failed'
    };
  }
};