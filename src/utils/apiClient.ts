interface UserData {
  privy_id: string;
  email?: string;
  address: string;
}

interface QuestData {
  title: string;
  image_url?: string;
  description: string;
  answer_options: string[];
  correct_answer: string;
  xp_points: number;
  expires_at: string;
  created_by_privy_id: string;
}

interface CreateQuestFormData {
  title: string;
  img_url?: string;
  description: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correct_option: string;
  expire: string;
  point_value: number;
  created_by_privy_id: string;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

export const storeUserDetails = async (userData: UserData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        privy_id: userData.privy_id,
        email: userData.email,
        address: userData.address
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to store user');
    }

    console.log('User stored successfully:', data);
    return data;
  } catch (error) {
    console.error('Error storing user:', error);
    throw error;
  }
};

export const getUserByPrivyId = async (privyId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${privyId}`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get user');
    }
    return data;
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
};


export const checkAdminStatus = async (userData: { privy_id?: string; email?: string }) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to check admin status');
    }

    return data;
  } catch (error) {
    console.error('Error checking admin status:', error);
    throw error;
  }
};

// Create quest function
export const createQuest = async (formData: CreateQuestFormData) => {
  try {
    // Transform the form data to match backend expectations
    const questData: QuestData = {
      title: formData.title,
      image_url: formData.img_url,
      description: formData.description,
      answer_options: [
        formData.options.A,
        formData.options.B,
        formData.options.C,
        formData.options.D
      ],
      correct_answer: formData.options[formData.correct_option as keyof typeof formData.options],
      xp_points: formData.point_value,
      expires_at: formData.expire,
      created_by_privy_id: formData.created_by_privy_id
    };

    const response = await fetch(`${API_BASE_URL}/quests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(questData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create quest');
    }

    console.log('Quest created successfully:', data);
    return {
      success: true,
      data: data.data,
      message: data.message
    };
  } catch (error) {
    console.error('Error creating quest:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Check if user is admin function
export const isUserAdmin = async (privyId: string) => {
  try {
    const response = await checkAdminStatus({ privy_id: privyId });
    return {
      isAdmin: response.isAdmin || false,
      adminData: response.data || null
    };
  } catch (error) {
    console.error('Error checking admin status:', error);
    return {
      isAdmin: false,
      adminData: null
    };
  }
};

// Get all quests
export const getAllQuests = async (page: number = 1, limit: number = 10) => {
  try {
    const response = await fetch(`${API_BASE_URL}/quests?page=${page}&limit=${limit}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get quests');
    }

    return data;
  } catch (error) {
    console.error('Error getting quests:', error);
    throw error;
  }
};

// Submit quest answer
export const submitQuestAnswer = async (questId: string, userPrivyId: string, selectedAnswer: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/quests/${questId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_privy_id: userPrivyId,
        selected_answer: selectedAnswer
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to submit answer');
    }

    return data;
  } catch (error) {
    console.error('Error submitting quest answer:', error);
    throw error;
  }
};

// Get user submissions
export const getUserSubmissions = async (privyId: string, page: number = 1, limit: number = 10) => {
  try {
    const response = await fetch(`${API_BASE_URL}/quests/user/${privyId}/submissions?page=${page}&limit=${limit}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get user submissions');
    }

    return data;
  } catch (error) {
    console.error('Error getting user submissions:', error);
    throw error;
  }
};

