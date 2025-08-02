import {
  Connection,
  PublicKey,
  VersionedTransaction,
  TransactionInstruction,
  TransactionMessage,
  AddressLookupTableAccount,
  ComputeBudgetProgram,
  SendTransactionError,
  Transaction
} from "@solana/web3.js";

type SupportedSolanaTransaction = Transaction | VersionedTransaction;

const SOLANA_RPC_URL = import.meta.env.VITE_RPC_URL;
const connection = new Connection(SOLANA_RPC_URL, 'confirmed');

export interface SwapParams {
  inputMint: string;
  outputMint: string;
  amount: number;
  slippageBps: number;
  userPublicKey: string;
}

export interface PrivySwapParams {
  inputMint: string;
  outputMint: string;
  amount: number;
  userPublicKey: string;
  signTransaction: (transaction: VersionedTransaction) => Promise<SupportedSolanaTransaction>;
  sendTransaction: (params: {
    transaction: SupportedSolanaTransaction;
    connection: Connection;
    uiOptions?: any;
    transactionOptions?: any;
    fundWalletConfig?: any;
    address?: string;
  }) => Promise<{ signature: string }>;
  slippageBps?: number;
}

export async function getSwapQuote(
  inputMint: string,
  outputMint: string,
  amount: number,
  slippageBps: number = 50
) {
  try {
    const url = `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippageBps}&restrictIntermediateTokens=true`;

    const response = await fetch(url);
    const quoteResponse = await response.json();

    if (quoteResponse.error) {
      throw new Error(`Quote error: ${quoteResponse.error}`);
    }

    return quoteResponse;
  } catch (error) {
    console.error('Error fetching swap quote:', error);
    throw new Error('Failed to fetch swap quote');
  }
}

export async function getSwapInstructions(quoteResponse: any, userPublicKey: string) {
  try {
    const response = await fetch('https://quote-api.jup.ag/v6/swap-instructions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        quoteResponse,
        userPublicKey,
        dynamicComputeUnitLimit: true,
        dynamicSlippage: true,
        prioritizationFeeLamports: {
          priorityLevelWithMaxLamports: {
            maxLamports: 10000000,
            global: false,
            priorityLevel: "veryHigh"
          }
        }
      })
    });

    const instructions = await response.json();

    if (instructions.error) {
      throw new Error("Failed to get swap instructions: " + instructions.error);
    }

    return instructions;
  } catch (error) {
    console.error('Error getting swap instructions:', error);
    throw new Error('Failed to get swap instructions');
  }
}

const deserializeInstruction = (instruction: any) => {
  return new TransactionInstruction({
    programId: new PublicKey(instruction.programId),
    keys: instruction.accounts.map((key: any) => ({
      pubkey: new PublicKey(key.pubkey),
      isSigner: key.isSigner,
      isWritable: key.isWritable,
    })),
    data: Buffer.from(instruction.data, "base64"),
  });
};

const getAddressLookupTableAccounts = async (
  keys: string[]
): Promise<AddressLookupTableAccount[]> => {
  const addressLookupTableAccountInfos = await connection.getMultipleAccountsInfo(
    keys.map((key) => new PublicKey(key))
  );

  return addressLookupTableAccountInfos.reduce((acc, accountInfo, index) => {
    const addressLookupTableAddress = keys[index];
    if (accountInfo) {
      const addressLookupTableAccount = new AddressLookupTableAccount({
        key: new PublicKey(addressLookupTableAddress),
        state: AddressLookupTableAccount.deserialize(accountInfo.data),
      });
      acc.push(addressLookupTableAccount);
    }

    return acc;
  }, new Array<AddressLookupTableAccount>());
};

// Helper function to check if blockhash is still valid
async function isBlockhashValid(blockhash: string, lastValidBlockHeight: number): Promise<boolean> {
  try {
    const currentBlockHeight = await connection.getBlockHeight();
    return currentBlockHeight <= lastValidBlockHeight;
  } catch (error) {
    console.error('Error checking blockhash validity:', error);
    return false;
  }
}

// New Privy-compatible swap function
export async function performSwapWithPrivy({
  inputMint,
  outputMint,
  amount,
  userPublicKey,
  signTransaction,
  sendTransaction,
  slippageBps = 50
}: PrivySwapParams): Promise<string> {
  const maxRetries = 3;
  let retryCount = 0;

  console.log('=== Privy Swap Configuration ===');
  console.log('User Public Key:', userPublicKey);
  console.log('Input Mint:', inputMint);
  console.log('Output Mint:', outputMint);
  console.log('Amount:', amount);

  while (retryCount < maxRetries) {
    try {
      console.log(`\n--- Attempt ${retryCount + 1}/${maxRetries} ---`);

      // Get fresh quote for each retry
      console.log('Getting fresh quote...');
      const quoteResponse = await getSwapQuote(inputMint, outputMint, amount, slippageBps);
      console.log('✓ Quote received');

      // Get swap instructions
      console.log('Getting swap instructions...');
      const instructions = await getSwapInstructions(quoteResponse, userPublicKey);
      console.log('✓ Instructions received');

      const {
        setupInstructions,
        swapInstruction: swapInstructionPayload,
        cleanupInstruction,
        addressLookupTableAddresses,
      } = instructions;

      // Get address lookup table accounts
      const addressLookupTableAccounts: AddressLookupTableAccount[] = [];
      if (addressLookupTableAddresses && addressLookupTableAddresses.length > 0) {
        console.log('Processing lookup tables...');
        addressLookupTableAccounts.push(
          ...(await getAddressLookupTableAccounts(addressLookupTableAddresses))
        );
        console.log('✓ Lookup tables processed');
      }

      // Get fresh blockhash
      console.log('Getting fresh blockhash...');
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
      console.log('✓ Blockhash obtained');

      // Build instruction list
      const instructionList = [];

      // Add compute budget instructions
      instructionList.push(
        ComputeBudgetProgram.setComputeUnitLimit({
          units: 400000,
        })
      );

      instructionList.push(
        ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: 1000000,
        })
      );

      if (setupInstructions) {
        instructionList.push(...setupInstructions.map(deserializeInstruction));
      }
      instructionList.push(deserializeInstruction(swapInstructionPayload));
      if (cleanupInstruction) {
        instructionList.push(deserializeInstruction(cleanupInstruction));
      }

      console.log('✓ Built transaction with', instructionList.length, 'instructions');

      // Create transaction message
      const messageV0 = new TransactionMessage({
        payerKey: new PublicKey(userPublicKey),
        recentBlockhash: blockhash,
        instructions: instructionList,
      }).compileToV0Message(addressLookupTableAccounts);

      const transaction = new VersionedTransaction(messageV0);

      // Try signing first, but if it fails, skip to direct send
      let signedTransaction: SupportedSolanaTransaction = transaction;
      try {
        console.log('Attempting to sign transaction...');
        signedTransaction = await signTransaction(transaction);
        console.log('✓ Transaction signed');
      } catch (signError) {
        console.log('⚠️ Signing failed, will use sendTransaction directly:', signError);
        signedTransaction = transaction; // Use unsigned transaction for Privy's sendTransaction
      }

      // Double-check blockhash validity before sending
      const isValid = await isBlockhashValid(blockhash, lastValidBlockHeight);
      if (!isValid) {
        console.log('❌ Blockhash expired before sending, retrying...');
        retryCount++;
        continue;
      }

      console.log('✓ Blockhash still valid');

      // Send transaction using Privy (will sign internally if needed)
      console.log('Sending transaction with Privy...');
      const { signature } = await sendTransaction({
        transaction: signedTransaction,
        connection
      });

      console.log('✓ Transaction sent:', signature);

      // Confirm transaction
      console.log('Confirming transaction...');
      const confirmationPromise = connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      }, "confirmed");

      // Add timeout to avoid hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Transaction confirmation timeout')), 60000);
      });

      const confirmation = await Promise.race([confirmationPromise, timeoutPromise]) as any;

      if (confirmation.value.err) {
        console.error('❌ Transaction failed:', confirmation.value.err);
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}\nhttps://solscan.io/tx/${signature}/`);
      }

      console.log('✅ Transaction successful!');
      console.log('🔗 View on Solscan:', `https://solscan.io/tx/${signature}/`);
      return signature;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      console.error(`❌ Attempt ${retryCount + 1} failed:`, errorMessage);

      // Check for various retry-able errors
      const retryableErrors = [
        'block height exceeded',
        'Blockhash not found',
        'Transaction was not confirmed',
        'confirmation timeout',
        'Max retries exceeded',
        'Network request failed',
        'Internal error'
      ];

      const shouldRetry = retryableErrors.some(err => errorMessage.toLowerCase().includes(err.toLowerCase()));

      if (shouldRetry && retryCount < maxRetries - 1) {
        retryCount++;
        console.log(`⏳ Retrying in ${2 ** retryCount} seconds...`);

        // Exponential backoff with jitter
        const delay = Math.min(1000 * Math.pow(2, retryCount - 1) + Math.random() * 1000, 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      throw error;
    }
  }

  throw new Error('Max retries reached - unable to complete swap');
}

// DEPRECATED: Use performSwapWithPrivy instead
// This function uses private keys and should not be used in production
export async function performSwap(
  inputMint: string,
  outputMint: string,
  amount: number,
  userPublicKey: string,
  wallet?: any, // Optional wallet parameter for compatibility
  slippageBps: number = 50
): Promise<string> {
  console.warn('⚠️ DEPRECATED: performSwap uses private keys. Use performSwapWithPrivy instead.');
  throw new Error('This function is deprecated. Please use performSwapWithPrivy with Privy auth instead.');
}