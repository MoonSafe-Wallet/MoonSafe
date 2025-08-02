import { PrivyProvider } from '@privy-io/react-auth';


export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <PrivyProvider
            appId="cmdqfufdf00ldju0j23vgov02"
            config={{
                appearance: {
                    theme: 'light',
                    logo: 'https://i.postimg.cc/vZ075YCF/Qube.png',
                    loginMessage: 'Hey there! Welcome to Qube Mobile, please login to continue.',
                    walletChainType: 'solana-only',
                },
                solanaClusters: [{ name: 'mainnet-beta', rpcUrl: 'hhttps://mainnet.helius-rpc.com/?api-key=4c4a4f43-145d-4406-b89c-36ad977bb738' }],
                embeddedWallets: {
                    solana: {
                        createOnLogin: "users-without-wallets",
                    },
                },
            }}
        >
            {children}
        </PrivyProvider>
    );
}