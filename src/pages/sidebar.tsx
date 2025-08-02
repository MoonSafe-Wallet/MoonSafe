import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import { useTheme } from '../contexts/ThemeContext';
import { checkAdminStatus } from '../utils/apiClient'; // Updated import

const Sidebar: React.FC = () => {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckLoading, setAdminCheckLoading] = useState(true);
  const { user } = usePrivy();

  useEffect(() => {
    const checkUserAdminStatus = async () => {
      if (user?.id) {
        setAdminCheckLoading(true);
        try {
          const response = await checkAdminStatus({ privy_id: user.id });
          setIsAdmin(response.isAdmin || false);
          
          if (response.isAdmin) {
            console.log('User is admin:', response.data);
          }
        } catch (err) {
          console.error('Admin check failed:', err);
          setIsAdmin(false);
        } finally {
          setAdminCheckLoading(false);
        }
      } else {
        setIsAdmin(false);
        setAdminCheckLoading(false);
      }
    };
    checkUserAdminStatus();
  }, [user?.id]);

  return (
    <>
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0  bg-opacity-50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Hamburger Menu Button - Mobile Only */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className={`fixed top-4 left-4 z-50 p-2 rounded-lg md:hidden ${isDarkMode ? 'bg-gray-800 text-white' : 'text-black border border-gray-300'} shadow-lg`} style={isDarkMode ? {} : { backgroundColor: '#f9f9f8' }}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isMobileMenuOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      <div className={`
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 
        fixed md:static 
        w-70 md:w-70 lg:w-20 xl:w-70 
        h-screen 
        p-4 lg:p-2 xl:p-4 
        transition-transform duration-400 ease-in-out 
        z-40 md:z-auto
        ${isDarkMode ? 'text-white' : 'bg-white text-black'}
      `} style={isDarkMode ? { backgroundColor: '#02050a' } : {}}>
        <div className={`w-full h-full ${isDarkMode ? 'text-white shadow-lg' : 'text-black border border-gray-300'} flex flex-col rounded-2xl`} style={isDarkMode ? { backgroundColor: '#0d0e14' } : { backgroundColor: '#f9f9f8' }}>
          {/* Header with Logo and Theme Toggle - Desktop: Top, Mobile: Rearranged */}
          <div className={`p-6 lg:p-3 xl:p-6 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'} order-1 md:order-1`}>
            <div className="flex items-center justify-between lg:justify-center xl:justify-between">
              <span className={`font-semibold text-lg ${isDarkMode ? 'text-white' : 'text-black'} lg:hidden xl:block`}>MoonSafe</span>
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'} lg:mx-auto xl:mx-0`}
                title="Toggle theme"
              >
                {isDarkMode ? (
                  <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 p-5 lg:p-2 xl:p-5 order-2 md:order-2">
            <div className="space-y-4">
              <div className={`text-xs uppercase tracking-wide mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} lg:hidden xl:block`}>Menu</div>

              <Link to="/" className={`flex items-center lg:justify-center xl:justify-start space-x-3 lg:space-x-0 xl:space-x-3 p-3 lg:p-2 xl:p-3 rounded-lg transition-colors ${isDarkMode ? 'text-gray-300 hover:text-white hover:bg-gray-800' : 'text-gray-700 hover:text-black hover:bg-gray-100'}`} title="Dashboard">
                <svg className="w-5 h-5 lg:w-6 lg:h-6 xl:w-5 xl:h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
                <span className="lg:hidden xl:block">Dashboard</span>
              </Link>

              <Link to="/tokens" className={`flex items-center lg:justify-center xl:justify-start space-x-3 lg:space-x-0 xl:space-x-3 p-3 rounded-lg transition-colors ${isDarkMode ? 'text-gray-300 hover:text-white hover:bg-gray-800' : 'text-gray-700 hover:text-black hover:bg-gray-100'}`} title="Tokens">
                <svg className="w-5 h-5 " fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
                  <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
                  <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
                </svg>
                <span className="lg:hidden xl:block">Tokens</span>
              </Link>

              <Link to="/quests" className={`flex items-center lg:justify-center xl:justify-start space-x-3 lg:space-x-0 xl:space-x-3 p-3 rounded-lg transition-colors ${isDarkMode ? 'text-gray-300 hover:text-white hover:bg-gray-800' : 'text-gray-700 hover:text-black hover:bg-gray-100'}`} title="Quests">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="lg:hidden xl:block">Quests</span>
              </Link>

              <Link to="#" className={`flex items-center lg:justify-center xl:justify-start space-x-3 lg:space-x-0 xl:space-x-3 p-3 rounded-lg transition-colors ${isDarkMode ? 'text-gray-300 hover:text-white hover:bg-gray-800' : 'text-gray-700 hover:text-black hover:bg-gray-100'}`} title="Quests">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="lg:hidden xl:block">Dapps</span>
              </Link>

              {/* Only show Create Quest link if user is admin and not loading */}
              {!adminCheckLoading && isAdmin && (
                <Link to="/create-quest" className={`flex items-center lg:justify-center xl:justify-start space-x-3 lg:space-x-0 xl:space-x-3 p-3 rounded-lg transition-colors ${isDarkMode ? 'text-gray-300 hover:text-white hover:bg-gray-800' : 'text-gray-700 hover:text-black hover:bg-gray-100'} relative`} title="Create Quest">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  <span className="lg:hidden xl:block">Create Quest</span>
                  {/* Admin badge */}
                  <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${isDarkMode ? 'bg-green-500' : 'bg-green-600'} lg:hidden xl:block`} title="Admin only"></div>
                </Link>
              )}

              {/* Loading state for admin check */}
              {adminCheckLoading && (
                <div className={`flex items-center lg:justify-center xl:justify-start space-x-3 lg:space-x-0 xl:space-x-3 p-3 rounded-lg opacity-50`}>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-gray-400"></div>
                  <span className="lg:hidden xl:block text-gray-400">Checking permissions...</span>
                </div>
              )}

              <a href="#" className={`flex items-center lg:justify-center xl:justify-start space-x-3 lg:space-x-0 xl:space-x-3 p-3 rounded-lg transition-colors ${isDarkMode ? 'text-gray-300 hover:text-white hover:bg-gray-800' : 'text-gray-700 hover:text-black hover:bg-gray-100'}`} title="Stake">
                <svg className="w-5 h-5 lg:mx-auto xl:mx-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
                </svg>
                <span className="lg:hidden xl:block">Stake</span>
              </a>
            </div>
          </nav>

          {/* Logo at bottom for mobile */}
          <div className={`p-6 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-200'} order-3 md:hidden`}>
            <div className="flex items-center justify-center">
              <span className={`font-semibold text-lg ${isDarkMode ? 'text-white' : 'text-black'}`}>MoonSafe</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;