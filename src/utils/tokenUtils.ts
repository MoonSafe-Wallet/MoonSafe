import { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import axios from 'axios';

const SOLANA_RPC_URL = import.meta.env.VITE_RPC_URL;
const connection = new Connection(SOLANA_RPC_URL, 'confirmed');

// Find associated token account address
export async function findAssociatedTokenAddress(
  walletAddress: PublicKey,
  tokenMintAddress: PublicKey
): Promise<PublicKey> {
  return PublicKey.findProgramAddressSync(
    [
      walletAddress.toBuffer(),
      TOKEN_PROGRAM_ID.toBuffer(),
      tokenMintAddress.toBuffer(),
    ],
    ASSOCIATED_TOKEN_PROGRAM_ID
  )[0];
}

// Get all token accounts with their info
export async function getAllTokenAccounts(walletAddress: PublicKey) {
  try {
    const response = await connection.getParsedTokenAccountsByOwner(walletAddress, {
      programId: TOKEN_PROGRAM_ID,
    });

    // Fetch token metadata for each mint in parallel
    const tokenAccountsWithInfo = await Promise.all(
      response.value.map(async ({ pubkey, account }) => {
        if (!account.data.parsed) {
          throw new Error('Token account data is not parsed');
        }

        const mintAddress = account.data.parsed.info.mint;
        let tokenInfo = null;
        
        try {
          const infoResponse = await axios.get(
            `https://token.jup.ag/strict`,
            { timeout: 5000 }
          );
          const tokenList = infoResponse.data;
          tokenInfo = tokenList.find((token: any) => token.address === mintAddress);
        } catch (error) {
          console.warn(`Could not fetch info for token ${mintAddress}`);
        }

        const tokenAmount = account.data.parsed.info.tokenAmount;
        
        return {
          address: pubkey.toString(),
          mint: mintAddress,
          amount: parseInt(tokenAmount.amount), // Always use raw amount
          decimals: tokenAmount.decimals,
          uiAmount: tokenAmount.uiAmount,
          info: tokenInfo
        };
      })
    );

    return tokenAccountsWithInfo;
  } catch (error) {
    console.error('Error fetching token accounts:', error);
    throw error;
  }
}

// Get SOL balance
export async function getSolBalance(walletAddress: PublicKey) {
  try {
    const balance = await connection.getBalance(walletAddress);
    return {
      address: 'native-sol',
      mint: 'So11111111111111111111111111111111111111112', // Native SOL mint
      amount: balance,
      decimals: 9,
      uiAmount: balance / 1000000000, // Convert lamports to SOL
      info: {
        name: 'Solana',
        symbol: 'SOL',
        decimals: 9,
        logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png'
      }
    };
  } catch (error) {
    console.error('Error fetching SOL balance:', error);
    return null;
  }
}

// Main function to get all token data
export async function getAllTokenData(walletAddress: string) {
  if (!walletAddress || walletAddress.trim() === '') {
    throw new Error('Wallet address is required');
  }

  try {
    const walletPubkey = new PublicKey(walletAddress);
    
    // Get both SOL balance and SPL tokens
    const [solBalance, splTokens] = await Promise.all([
      getSolBalance(walletPubkey),
      getAllTokenAccounts(walletPubkey)
    ]);

    // Combine SOL and SPL tokens, only include tokens with positive balances
    const tokenAccounts = [];
    if (solBalance && solBalance.amount > 0) {
      tokenAccounts.push(solBalance);
    }
    
    // Filter SPL tokens to only include those with positive balances
    const nonZeroSplTokens = splTokens.filter(token => 
      token.uiAmount && token.uiAmount > 0
    );
    tokenAccounts.push(...nonZeroSplTokens);

    return {
      walletAddress: walletAddress,
      tokenAccounts
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('Invalid public key input')) {
      throw new Error(`Invalid wallet address format: ${walletAddress}`);
    }
    throw error;
  }
}