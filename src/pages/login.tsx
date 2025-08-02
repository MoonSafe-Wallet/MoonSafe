import { usePrivy } from '@privy-io/react-auth';
import moneyWalletIcon from '../assets/money-wallet.png';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { ready, authenticated, login } = usePrivy();

  if (!ready) {
    return <div>Loading...</div>;
  }

  // Don't render anything if authenticated - let App.tsx handle the redirect
  if (authenticated) {
    return null;
  }

  return (
    <div className="flex h-screen">
      {/* Left 50% - Gray Square */}
      <div className="w-1/2 flex items-center justify-center p-8">
        <div className="w-200 h-200 bg-gray-900 rounded-lg flex items-center justify-center">
          <img src={moneyWalletIcon} alt="Money Wallet" className="w-100 h-100 object-contain" />
        </div>
      </div>
      
      {/* Right 50% - Login Section */}
      <div className="w-1/2 flex flex-col items-center justify-center p-8">
        <h2 className="text-2xl font-bold mb-6">Welcome to MoonSafe</h2>
        <p className="text-center mb-8 text-gray-600">Please log in with your Privy account to access your non-custodial wallet and send tokens.</p>
        <button
          onClick={login}
          className="w-150 py-3 px-6 bg-transparent border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors mb-4"
        >
          Log In with Privy
        </button>
        <p className="text-sm text-gray-500">Protected by Privy</p>
      </div>
    </div>
  );
};

export default Login;