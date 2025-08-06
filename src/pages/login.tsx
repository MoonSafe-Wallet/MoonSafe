import { usePrivy } from '@privy-io/react-auth';
import moonsafemobile from '../assets/moonsafemobile2.png';
import solana from '../assets/solanaLogo.png';

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
    <div className="flex h-screen bg-white">
      {/* Left 50% - Gray Square */}
      <div className="w-1/2 flex items-center justify-center p-8">
        <div className="w-250 h-220 bg-[#0c090f] rounded-2xl flex items-center justify-center shadow-2xl">
          <img src={moonsafemobile} alt="MoonSafe Mobile" className="w-200 h-200 object-contain" />
        </div>
      </div>
             
      {/* Right 50% - Login Section */}
      <div className="w-1/2 flex flex-col items-center p-8">
        <div className="max-w-md w-full flex flex-col h-full">
          <h2 className="text-4xl raleway-thin pt-24 text-gray-900 text-center">MoonSafe</h2>
          
          <div className="flex-1 flex flex-col justify-center space-y-8">
            <p className="text-center text-lg text-gray-600 leading-relaxed">
              Please log in with your Privy account to access your non-custodial wallet and send tokens.
            </p>
            
            <button
              onClick={login}
              className="w-full py-4 px-8 bg-gray-900 text-white raleway-medium font-semibold rounded-xl hover:bg-gray-800 transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
            >
              Log In with Privy
            </button>
            
            <p className="text-sm text-gray-500 text-center">Protected by Privy</p>
          </div>
          
          {/* Powered by Solana - Bottom of page */}
          <div className="flex items-center justify-center pb-8">
            <div className="bg-gray-900 px-4 py-2 rounded-lg flex items-center space-x-2">
              <span className="text-white text-sm font-medium">Powered by</span>
              <img src={solana} alt="Solana" className="w-20 h-20 object-contain" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;