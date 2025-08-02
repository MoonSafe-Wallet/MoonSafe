import { useState, useEffect } from 'react';
import { getWalletBalance, getWalletInfo } from '../utils/checkBalance';
import { getAllTokenData } from '../utils/tokenUtils';
import { useSolanaWallets } from '@privy-io/react-auth/solana';
import axios from 'axios';

export default function WalletInfo() {
    const { wallets } = useSolanaWallets();
    const [balance, setBalance] = useState<number | null>(null);
    const [walletInfo, setWalletInfo] = useState<any>(null);
    const [tokenData, setTokenData] = useState<any>(null);
    const [totalValue, setTotalValue] = useState<number>(0);
    const [prices, setPrices] = useState<{ [key: string]: number }>({});

    // CoinGecko API mapping for Solana tokens
    const getCoinGeckoId = (symbol: string) => {
        const tokenMap: { [key: string]: string } = {
            'SOL': 'solana',
            'USDC': 'usd-coin',
            'USDT': 'tether',
            'RAY': 'raydium',
            'SRM': 'serum',
            'BONK': 'bonk',
            'ORCA': 'orca',
            'JUP': 'jupiter-exchange-solana',
            'MSOL': 'marinade-staked-sol',
            'JITOSOL': 'jito-staked-sol'
        };
        return tokenMap[symbol] || null;
    };

    // Fetch real-time prices from CoinGecko
    const fetchTokenPrices = async (symbols: string[]) => {
        try {
            const coinGeckoIds = symbols
                .map(symbol => getCoinGeckoId(symbol))
                .filter(id => id !== null);
            
            if (coinGeckoIds.length === 0) return {};

            const response = await axios.get(
                `https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoIds.join(',')}&vs_currencies=usd`,
                { timeout: 10000 }
            );

            const priceData: { [key: string]: number } = {};
            
            symbols.forEach(symbol => {
                const coinGeckoId = getCoinGeckoId(symbol);
                if (coinGeckoId && response.data[coinGeckoId]) {
                    priceData[symbol] = response.data[coinGeckoId].usd;
                }
            });

            return priceData;
        } catch (error) {
            console.error('WalletInfo - Error fetching prices from CoinGecko:', error);
            return {};
        }
    };

    // Get price for a token (from cache or fallback)
    const getTokenPrice = (symbol: string) => {
        return prices[symbol] || 0;
    };

    const getTokenSymbol = (token: any) => {
        if (token.address === 'native-sol') return 'SOL';
        if (token.info?.symbol) return token.info.symbol;
        return token.mint.slice(0, 4).toUpperCase();
    };

    useEffect(() => {
        async function fetchData() {
            try {
                // Use Privy wallet address if available
                if (wallets[0]) {
                    const walletAddress = wallets[0].address;
                    
                    // Fetch both basic balance and all token data
                    const [bal, info, allTokens] = await Promise.all([
                        getWalletBalance(walletAddress),
                        getWalletInfo(walletAddress),
                        getAllTokenData(walletAddress)
                    ]);
                    
                    setBalance(bal);
                    setWalletInfo(info);
                    setTokenData(allTokens);
                    
                    // Extract unique token symbols and fetch their prices
                    if (allTokens && allTokens.tokenAccounts && allTokens.tokenAccounts.length > 0) {
                        const symbols = allTokens.tokenAccounts
                            .map((token: any) => getTokenSymbol(token))
                            .filter((symbol: string, index: number, arr: string[]) => arr.indexOf(symbol) === index);
                        
                        console.log('WalletInfo - Fetching prices for symbols:', symbols);
                        const priceData = await fetchTokenPrices(symbols);
                        setPrices(priceData);
                        
                        // Calculate total value with real prices
                        const total = allTokens.tokenAccounts.reduce((sum: number, token: any) => {
                            const symbol = getTokenSymbol(token);
                            const price = priceData[symbol] || 0;
                            const uiAmount = token.uiAmount || 0;
                            
                            // Only include tokens with positive balances and valid prices
                            if (uiAmount <= 0 || price <= 0) {
                                console.log(`WalletInfo - Skipping ${symbol}, Amount: ${uiAmount}, Price: $${price}`);
                                return sum;
                            }
                            
                            const value = uiAmount * price;
                            console.log(`WalletInfo - Token: ${symbol}, Amount: ${uiAmount}, Price: $${price}, Value: $${value}`);
                            return sum + value;
                        }, 0);
                        setTotalValue(total);
                        console.log(`WalletInfo - Total calculated value: $${total}`);
                    }
                } else {
                    // Clear data if no wallet connected
                    setBalance(null);
                    setWalletInfo(null);
                    setTokenData(null);
                    setTotalValue(0);
                    setPrices({});
                }
            } catch (error) {
                console.error('Error:', error);
            }
        }
        fetchData();
    }, [wallets]);

    return (
        <div>
            {wallets[0] ? (
                <div>
                    <p>Privy Wallet Balance: {balance !== null ? `${balance} SOL` : 'Loading...'}</p>
                    <p>Total Portfolio Value: ${totalValue.toFixed(4)}</p>
                    <p>Privy Wallet Address: {wallets[0].address}</p>
                    
                    {/* Show token breakdown */}
                    {tokenData && tokenData.tokenAccounts && (
                        <div style={{ marginTop: '10px' }}>
                            <p><strong>Token Breakdown:</strong></p>
                            {tokenData.tokenAccounts.map((token: any) => {
                                const symbol = getTokenSymbol(token);
                                const price = getTokenPrice(symbol);
                                const uiAmount = token.uiAmount || 0;
                                const value = uiAmount * price;
                                return (
                                    <div key={token.address} style={{ fontSize: '12px', marginLeft: '10px' }}>
                                        {symbol}: {uiAmount.toFixed(6)} × ${price.toFixed(6)} = ${value.toFixed(4)}
                                        {price === 0 && ' (No price data)'}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    
                    {walletInfo && <pre style={{ fontSize: '10px' }}>{JSON.stringify(walletInfo, null, 2)}</pre>}
                </div>
            ) : (
                <p>No Privy wallet connected</p>
            )}
        </div>
    );
}