import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useTheme } from '../../contexts/ThemeContext';
import { getAllQuests, submitQuestAnswer } from '../../utils/apiClient'; // Updated import

interface Quest {
  _id: string;
  title: string;
  image_url?: string;
  description: string;
  answer_options: string[];
  xp_points: number;
  expires_at: string;
  created_by: {
    email: string;
    role: string;
  };
  is_active: boolean;
  total_submissions: number;
  correct_submissions: number;
  createdAt: string;
  updatedAt: string;
}

const QuestManagement: React.FC = () => {
  const { user } = usePrivy();
  const { isDarkMode } = useTheme();
  
  const [quests, setQuests] = useState<Quest[]>([]);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    submitted: boolean;
    is_correct?: boolean;
    correct_answer?: string;
    xp_earned?: number;
    user_total_xp?: number;
  }>({ submitted: false });

  useEffect(() => {
    fetchAllQuests();
  }, []);

  const fetchAllQuests = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await getAllQuests();
      if (response.success) {
        setQuests(response.data);
        // Auto-select first quest if available
        if (response.data.length > 0) {
          setSelectedQuest(response.data[0]);
          // Reset answer state when changing quests
          setSelectedOption('');
          setResult({ submitted: false });
        }
      } else {
        setError('Failed to load quests');
      }
    } catch (err) {
      console.error('Failed to fetch quests:', err);
      setError('Failed to load quests');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpired = (expireDate: string) => {
    return new Date(expireDate) < new Date();
  };

  const getStatusBadge = (quest: Quest) => {
    const expired = isExpired(quest.expires_at);
    const active = quest.is_active;

    if (expired) {
      return { text: 'Expired', color: 'red' };
    } else if (active) {
      return { text: 'Active', color: 'green' };
    } else {
      return { text: 'Inactive', color: 'gray' };
    }
  };

  const handleQuestSelect = (quest: Quest) => {
    setSelectedQuest(quest);
    // Reset answer state when changing quests
    setSelectedOption('');
    setResult({ submitted: false });
  };

  const handleSubmitAnswer = async () => {
    if (!user?.id || !selectedQuest || !selectedOption) return;

    setSubmitting(true);
    setError('');

    try {
      const response = await submitQuestAnswer(selectedQuest._id, user.id, selectedOption);
      
      if (response.success) {
        setResult({
          submitted: true,
          is_correct: response.data.is_correct,
          correct_answer: response.data.correct_answer,
          xp_earned: response.data.xp_earned,
          user_total_xp: response.data.user_total_xp
        });
      } else {
        setError(response.message || 'Failed to submit answer');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimeRemaining = (expireDate: string) => {
    const now = new Date();
    const expire = new Date(expireDate);
    const diff = expire.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  const getOptionLetter = (index: number) => {
    return String.fromCharCode(65 + index); // A, B, C, D, etc.
  };

  const getSuccessRate = (quest: Quest) => {
    if (quest.total_submissions === 0) return 0;
    return Math.round((quest.correct_submissions / quest.total_submissions) * 100);
  };

  return (
    <div className={`flex-1 h-screen pt-15 pl-25 pr-25 pb-4 ${isDarkMode ? 'text-white' : 'bg-white text-black'}`} style={isDarkMode ? { backgroundColor: '#02050a' } : {}}>
      <div className="w-full h-full flex gap-6">
        
        {/* Left Side - Quest List */}
        <div className={`w-1/3 h-full ${isDarkMode ? 'shadow-lg' : 'border border-gray-300'} rounded-2xl p-6 flex flex-col`} style={isDarkMode ? { backgroundColor: '#0d0e14' } : { backgroundColor: '#f9f9f8' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-2xl font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
              All Quests ({quests.length})
            </h2>
            <button
              onClick={fetchAllQuests}
              disabled={loading}
              className={`text-sm transition-colors ${loading
                ? 'text-gray-400 cursor-not-allowed'
                : isDarkMode
                  ? 'text-gray-400 hover:text-white'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-red-900/20 border border-red-600/30' : 'bg-red-50 border border-red-200'}`}>
              <p className={`text-sm ${isDarkMode ? 'text-red-200' : 'text-red-700'}`}>
                {error}
              </p>
            </div>
          ) : quests.length === 0 ? (
            <div className="text-center py-8">
              <div className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                No Quests Found
              </div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Create your first quest to get started!
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-auto space-y-3">
              {quests.map((quest) => {
                const status = getStatusBadge(quest);
                return (
                  <div
                    key={quest._id}
                    onClick={() => handleQuestSelect(quest)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedQuest?._id === quest._id
                        ? isDarkMode
                          ? 'border-blue-500 bg-blue-900/20'
                          : 'border-blue-500 bg-blue-50'
                        : isDarkMode
                          ? 'border-gray-600/30 bg-gray-800/30 hover:border-gray-500'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className={`font-medium truncate ${isDarkMode ? 'text-white' : 'text-black'}`}>
                        {quest.title}
                      </h3>
                      <div className={`px-2 py-1 rounded text-xs font-medium ml-2 flex-shrink-0 ${
                        status.color === 'green'
                          ? isDarkMode ? 'bg-green-900/30 text-green-200' : 'bg-green-100 text-green-700'
                          : status.color === 'red'
                            ? isDarkMode ? 'bg-red-900/30 text-red-200' : 'bg-red-100 text-red-700'
                            : isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {status.text}
                      </div>
                    </div>
                    
                    <p className={`text-sm mb-3 line-clamp-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {quest.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {quest.xp_points} XP
                      </span>
                      <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {getSuccessRate(quest)}% success rate
                      </span>
                    </div>
                    
                    <div className="text-xs">
                      <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Expires: {formatDate(quest.expires_at)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side - Quest Details */}
        <div className={`flex-1 h-full ${isDarkMode ? 'shadow-lg' : 'border border-gray-300'} rounded-2xl p-6 flex flex-col`} style={isDarkMode ? { backgroundColor: '#0d0e14' } : { backgroundColor: '#f9f9f8' }}>
          {selectedQuest ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-2xl font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  {selectedQuest.title}
                </h2>
                <div className="flex items-center space-x-2">
                  {(() => {
                    const status = getStatusBadge(selectedQuest);
                    return (
                      <div className={`px-3 py-1 rounded-lg text-sm font-medium ${
                        status.color === 'green'
                          ? isDarkMode ? 'bg-green-900/20 border border-green-600/30 text-green-200' : 'bg-green-50 border border-green-200 text-green-700'
                          : status.color === 'red'
                            ? isDarkMode ? 'bg-red-900/20 border border-red-600/30 text-red-200' : 'bg-red-50 border border-red-200 text-red-700'
                            : isDarkMode ? 'bg-gray-800 border border-gray-600 text-gray-300' : 'bg-gray-100 border border-gray-200 text-gray-600'
                      }`}>
                        {status.text}
                      </div>
                    );
                  })()}
                  <div className={`px-3 py-1 rounded-lg text-sm ${isDarkMode ? 'bg-blue-900/20 border border-blue-600/30 text-blue-200' : 'bg-blue-50 border border-blue-200 text-blue-700'}`}>
                    {selectedQuest.xp_points} XP
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-auto space-y-6">
                {/* Quest Image */}
                {selectedQuest.image_url && (
                  <div className="mb-6">
                    <img
                      src={selectedQuest.image_url}
                      alt={selectedQuest.title}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                )}

                {/* Quest Description */}
                <div className="mb-6">
                  <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {selectedQuest.description}
                  </p>
                </div>

                {/* Quest Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-100'}`}>
                    <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Submissions</div>
                    <div className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                      {selectedQuest.total_submissions}
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-100'}`}>
                    <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Success Rate</div>
                    <div className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                      {getSuccessRate(selectedQuest)}%
                    </div>
                  </div>
                </div>

                {/* Time Remaining */}
                <div className={`mb-6 p-3 rounded-lg ${isDarkMode ? 'bg-blue-900/20 border border-blue-600/30' : 'bg-blue-50 border border-blue-200'}`}>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V5z" clipRule="evenodd" />
                    </svg>
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-blue-200' : 'text-blue-700'}`}>
                      {formatTimeRemaining(selectedQuest.expires_at)}
                    </span>
                  </div>
                </div>

                {/* Answer Options or Result */}
                {!result.submitted ? (
                  <div className="space-y-4">
                    <h4 className={`font-medium mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Choose your answer:
                    </h4>
                    
                    <div className="space-y-3">
                      {selectedQuest.answer_options.map((option, index) => {
                        const optionLetter = getOptionLetter(index);
                        return (
                          <button
                            key={index}
                            onClick={() => setSelectedOption(option)}
                            className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                              selectedOption === option
                                ? isDarkMode
                                  ? 'border-blue-500 bg-blue-900/20'
                                  : 'border-blue-500 bg-blue-50'
                                : isDarkMode
                                  ? 'border-gray-600/30 bg-gray-800/30 hover:border-gray-500'
                                  : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium mr-3 ${
                                selectedOption === option
                                  ? 'bg-blue-500 text-white'
                                  : isDarkMode
                                    ? 'bg-gray-700 text-white'
                                    : 'bg-gray-200 text-black'
                              }`}>
                                {optionLetter}
                              </div>
                              <span className={isDarkMode ? 'text-white' : 'text-black'}>
                                {option}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4">
                      <button
                        onClick={handleSubmitAnswer}
                        disabled={!selectedOption || submitting || !user || isExpired(selectedQuest.expires_at)}
                        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                          !selectedOption || submitting || !user || isExpired(selectedQuest.expires_at)
                            ? 'bg-gray-400 cursor-not-allowed text-white'
                            : isDarkMode
                              ? 'bg-white hover:bg-gray-300 text-black'
                              : 'bg-black hover:bg-gray-800 text-white'
                        }`}
                      >
                        {submitting 
                          ? 'Submitting...' 
                          : !user 
                            ? 'Please connect wallet' 
                            : isExpired(selectedQuest.expires_at)
                              ? 'Quest Expired'
                              : 'Submit Answer'
                        }
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Result Display */
                  <div className={`p-6 rounded-lg ${
                    result.is_correct
                      ? isDarkMode
                        ? 'bg-green-900/20 border border-green-600/30'
                        : 'bg-green-50 border border-green-200'
                      : isDarkMode
                        ? 'bg-red-900/20 border border-red-600/30'
                        : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className="text-center">
                      <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                        result.is_correct ? 'bg-green-500' : 'bg-red-500'
                      }`}>
                        {result.is_correct ? (
                          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      
                      <h3 className={`text-xl font-semibold mb-2 ${
                        result.is_correct
                          ? isDarkMode ? 'text-green-200' : 'text-green-700'
                          : isDarkMode ? 'text-red-200' : 'text-red-700'
                      }`}>
                        {result.is_correct ? 'Correct!' : 'Incorrect'}
                      </h3>
                      
                      <p className={`text-sm mb-4 ${
                        result.is_correct
                          ? isDarkMode ? 'text-green-300' : 'text-green-600'
                          : isDarkMode ? 'text-red-300' : 'text-red-600'
                      }`}>
                        {result.is_correct 
                          ? `Great job! You earned ${result.xp_earned} XP.`
                          : `Better luck next time! The correct answer was "${result.correct_answer}".`
                        }
                      </p>

                      {result.is_correct && (
                        <div className="space-y-2">
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            isDarkMode ? 'bg-green-800 text-green-200' : 'bg-green-100 text-green-700'
                          }`}>
                            +{result.xp_earned} XP
                          </div>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Total XP: {result.user_total_xp}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-red-900/20 border border-red-600/30' : 'bg-red-50 border border-red-200'}`}>
                    <p className={`text-sm ${isDarkMode ? 'text-red-200' : 'text-red-700'}`}>
                      <strong>Error:</strong> {error}
                    </p>
                  </div>
                )}

                {/* Creator Info */}
                <div className={`mt-6 p-3 rounded-lg border-t ${isDarkMode ? 'border-gray-600/30 bg-gray-800/30' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="flex items-center justify-between text-xs">
                    <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Created by: {selectedQuest.created_by?.email || 'Unknown'}
                    </span>
                    <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {formatDate(selectedQuest.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-500/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className={`text-xl font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  Select a Quest
                </div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Click on a quest from the list to view its details
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestManagement;