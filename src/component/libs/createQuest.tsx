import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useTheme } from '../../contexts/ThemeContext';
import { createQuest, isUserAdmin } from '../../utils/apiClient'; // Updated import
import { useNavigate } from 'react-router-dom';

interface CreateQuestProps {
    onQuestCreated?: () => void;
}

const CreateQuest: React.FC<CreateQuestProps> = ({ onQuestCreated }) => {
    const { user } = usePrivy();
    const { isDarkMode } = useTheme();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        title: '',
        img_url: '',
        description: '',
        options: {
            A: '',
            B: '',
            C: '',
            D: ''
        },
        correct_option: 'A',
        expire: '',
        point_value: 10
    });

    const [loading, setLoading] = useState(false);
    const [adminCheckLoading, setAdminCheckLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminData, setAdminData] = useState<any>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const checkAdminStatus = async () => {
            if (user?.id) {
                setAdminCheckLoading(true);
                try {
                    const { isAdmin: adminStatus, adminData } = await isUserAdmin(user.id);
                    setIsAdmin(adminStatus);
                    setAdminData(adminData);
                    
                    if (adminStatus) {
                        console.log('User is admin:', adminData);
                    }
                } catch (err) {
                    console.error('Admin check failed:', err);
                    setIsAdmin(false);
                    setAdminData(null);
                } finally {
                    setAdminCheckLoading(false);
                }
            } else {
                setIsAdmin(false);
                setAdminData(null);
                setAdminCheckLoading(false);
            }
        };
        checkAdminStatus();
    }, [user?.id]);

    const handleInputChange = (field: string, value: string | number) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleOptionChange = (option: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            options: {
                ...prev.options,
                [option]: value
            }
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isAdmin) {
            setError('Unauthorized: Only admins can create quests');
            return;
        }

        if (!user?.id) {
            setError('User not authenticated');
            return;
        }

        // Validate required fields
        if (!formData.title || !formData.description || !formData.expire) {
            setError('Please fill in all required fields');
            return;
        }

        // Validate options
        const hasEmptyOption = Object.values(formData.options).some(option => !option.trim());
        if (hasEmptyOption) {
            setError('Please fill in all answer options');
            return;
        }

        // Validate expire date is in the future
        const expireDate = new Date(formData.expire);
        if (expireDate <= new Date()) {
            setError('Expiration date must be in the future');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const questData = {
                title: formData.title,
                img_url: formData.img_url || undefined,
                description: formData.description,
                options: formData.options,
                correct_option: formData.correct_option,
                expire: expireDate.toISOString(),
                point_value: formData.point_value,
                created_by_privy_id: user.id
            };

            const result = await createQuest(questData);

            if (result.success) {
                setSuccess('Quest created successfully!');
                // Reset form
                setFormData({
                    title: '',
                    img_url: '',
                    description: '',
                    options: { A: '', B: '', C: '', D: '' },
                    correct_option: 'A',
                    expire: '',
                    point_value: 10
                });

                if (onQuestCreated) {
                    onQuestCreated();
                }

                setTimeout(() => {
                    navigate('/dashboard');
                    setSuccess('');
                }, 2000);
            } else {
                setError(typeof result.error === 'string' ? result.error : 'Failed to create quest');
            }
        } catch (err) {
            setError('An unexpected error occurred');
            console.error('Quest creation error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (adminCheckLoading) {
        return (
            <div className={`flex-1 h-screen pt-15 pl-25 pr-25 pb-4 ${isDarkMode ? 'text-white' : 'bg-white text-black'}`} style={isDarkMode ? { backgroundColor: '#02050a' } : {}}>
                <div className="w-full h-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex-1 h-screen pt-15 pl-25 pr-25 pb-4 ${isDarkMode ? 'text-white' : 'bg-white text-black'}`} style={isDarkMode ? { backgroundColor: '#02050a' } : {}}>
            <div className="w-full h-full flex flex-col">
                <div className={`w-full h-full ${isDarkMode ? 'shadow-lg' : 'border border-gray-300'} rounded-2xl p-6 flex flex-col`} style={isDarkMode ? { backgroundColor: '#0d0e14' } : { backgroundColor: '#f9f9f8' }}>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className={`text-2xl font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                            Create Quest
                        </h2>
                        {isAdmin && adminData && (
                            <div className={`text-sm px-3 py-1 rounded-full ${isDarkMode ? 'bg-green-900/20 text-green-300' : 'bg-green-100 text-green-700'}`}>
                                {adminData.role} Access
                            </div>
                        )}
                    </div>

                    {!isAdmin ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-12">
                            <div className="text-center">
                                <div className="text-red-500 mb-4">
                                    <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className={`text-xl font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                    Access Denied
                                </div>
                                <div className={`text-sm text-center mb-8 max-w-md ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Only administrators can create quests. Please contact an admin to request access.
                                </div>
                                <button 
                                    onClick={() => navigate('/dashboard')}
                                    className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                                        isDarkMode
                                            ? 'bg-white hover:bg-gray-300 text-black'
                                            : 'bg-black hover:bg-gray-800 text-white'
                                    }`}
                                >
                                    Back to Dashboard
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-auto">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Title */}
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Quest Title *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => handleInputChange('title', e.target.value)}
                                        className={`w-full p-3 rounded-lg border transition-colors ${isDarkMode
                                            ? 'bg-gray-800/50 border-gray-600/30 text-white placeholder-gray-400 focus:border-gray-500'
                                            : 'bg-white border-gray-300 text-black placeholder-gray-500 focus:border-gray-400'
                                        }`}
                                        placeholder="Enter an engaging quest title..."
                                        required
                                    />
                                </div>

                                {/* Image URL */}
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Image URL (optional)
                                    </label>
                                    <input
                                        type="url"
                                        value={formData.img_url}
                                        onChange={(e) => handleInputChange('img_url', e.target.value)}
                                        className={`w-full p-3 rounded-lg border transition-colors ${isDarkMode
                                            ? 'bg-gray-800/50 border-gray-600/30 text-white placeholder-gray-400 focus:border-gray-500'
                                            : 'bg-white border-gray-300 text-black placeholder-gray-500 focus:border-gray-400'
                                        }`}
                                        placeholder="https://example.com/quest-image.jpg"
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Description *
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => handleInputChange('description', e.target.value)}
                                        className={`w-full p-3 rounded-lg border h-24 resize-none transition-colors ${isDarkMode
                                            ? 'bg-gray-800/50 border-gray-600/30 text-white placeholder-gray-400 focus:border-gray-500'
                                            : 'bg-white border-gray-300 text-black placeholder-gray-500 focus:border-gray-400'
                                        }`}
                                        placeholder="Describe your quest in detail..."
                                        required
                                    />
                                </div>

                                {/* Answer Options */}
                                <div>
                                    <label className={`block text-sm font-medium mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Answer Options *
                                    </label>
                                    <div className="space-y-3">
                                        {Object.entries(formData.options).map(([key, value]) => (
                                            <div key={key} className="flex items-center space-x-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-black'
                                                }`}>
                                                    {key}
                                                </div>
                                                <input
                                                    type="text"
                                                    value={value}
                                                    onChange={(e) => handleOptionChange(key, e.target.value)}
                                                    className={`flex-1 p-3 rounded-lg border transition-colors ${isDarkMode
                                                        ? 'bg-gray-800/50 border-gray-600/30 text-white placeholder-gray-400 focus:border-gray-500'
                                                        : 'bg-white border-gray-300 text-black placeholder-gray-500 focus:border-gray-400'
                                                    }`}
                                                    placeholder={`Enter option ${key}...`}
                                                    required
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Correct Answer */}
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Correct Answer *
                                    </label>
                                    <select
                                        value={formData.correct_option}
                                        onChange={(e) => handleInputChange('correct_option', e.target.value)}
                                        className={`w-full p-3 rounded-lg border transition-colors ${isDarkMode
                                            ? 'bg-gray-800/50 border-gray-600/30 text-white focus:border-gray-500'
                                            : 'bg-white border-gray-300 text-black focus:border-gray-400'
                                        }`}
                                        required
                                    >
                                        {Object.keys(formData.options).map(option => (
                                            <option key={option} value={option}>
                                                Option {option}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Point Value and Expiration */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Point Value *
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={formData.point_value}
                                            onChange={(e) => handleInputChange('point_value', parseInt(e.target.value))}
                                            className={`w-full p-3 rounded-lg border transition-colors ${isDarkMode
                                                ? 'bg-gray-800/50 border-gray-600/30 text-white focus:border-gray-500'
                                                : 'bg-white border-gray-300 text-black focus:border-gray-400'
                                            }`}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Expires At *
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={formData.expire}
                                            onChange={(e) => handleInputChange('expire', e.target.value)}
                                            className={`w-full p-3 rounded-lg border transition-colors ${isDarkMode
                                                ? 'bg-gray-800/50 border-gray-600/30 text-white focus:border-gray-500'
                                                : 'bg-white border-gray-300 text-black focus:border-gray-400'
                                            }`}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Error/Success Messages */}
                                {error && (
                                    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-red-900/20 border border-red-600/30' : 'bg-red-50 border border-red-200'}`}>
                                        <p className={`${isDarkMode ? 'text-red-200' : 'text-red-700'}`}>
                                            <strong>Error:</strong> {error}
                                        </p>
                                    </div>
                                )}

                                {success && (
                                    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-green-900/20 border border-green-600/30' : 'bg-green-50 border border-green-200'}`}>
                                        <p className={`${isDarkMode ? 'text-green-200' : 'text-green-700'}`}>
                                            <strong>Success:</strong> {success}
                                        </p>
                                    </div>
                                )}

                                {/* Submit Button */}
                                <div className="flex justify-end space-x-3 pt-4">

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className={`px-6 py-3 rounded-lg font-medium transition-colors ${loading
                                            ? 'bg-gray-400 cursor-not-allowed text-white'
                                            : isDarkMode
                                                ? 'bg-white hover:bg-gray-300 text-black'
                                                : 'bg-black hover:bg-gray-800 text-white'
                                        }`}
                                    >
                                        {loading ? 'Creating Quest...' : 'Create Quest'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CreateQuest;