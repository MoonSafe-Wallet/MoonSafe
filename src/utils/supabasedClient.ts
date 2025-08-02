import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

// Remove the JWT auth function since we're not using it for Supabase auth
// Just store user details directly using anon key

export const storeUserDetails = async (userDetails: {
  privy_id: string;
  email?: string;
  address: string; // public key/wallet address
}) => {
  try {
    console.log('Storing user details:', userDetails);
    
    // Validate that address is not null/undefined
    if (!userDetails.address) {
      console.error('Address/public key is required but was null/undefined');
      return { success: false, error: 'Address is required' };
    }
    
    const { data, error } = await supabase
      .from('users')
      .upsert(
        {
          privy_id: userDetails.privy_id,
          email: userDetails.email  || 'external wallet',  // Required field
          public_key: userDetails.address, // Required field - matches your table
          wallet_address: userDetails.address, // Also populate this field
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'privy_id',
          ignoreDuplicates: false
        }
      );

    if (error) {
      console.error('Error storing user details:', error);
      return { success: false, error };
    }

    console.log('User details stored successfully:', data);
    return { success: true, data };
    
  } catch (error) {
    console.error('Error in storeUserDetails:', error);
    return { success: false, error };
  }
};

// Function to get user details by privy_id
export const getUserDetails = async (privyId: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('privy_id', privyId)
      .single();

    if (error) {
      console.error('Error fetching user details:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in getUserDetails:', error);
    return { success: false, error };
  }
};

// Function to update user details
export const updateUserDetails = async (privyId: string, updates: {
  email?: string;
  public_key?: string;
  wallet_address?: string;
  [key: string]: any;
}) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('privy_id', privyId);

    if (error) {
      console.error('Error updating user details:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in updateUserDetails:', error);
    return { success: false, error };
  }
};



/////////////////////////////////////////////////////////////QUest/////////////////////////////////////////////////////
// Create a new quest (admin only)
// Update your createQuest function to include admin validation:
export const createQuest = async (questData: {
  title: string;
  img_url?: string;
  description: string;
  options: { [key: string]: string };
  correct_option: string;
  expire: string;
  point_value: number;
  created_by_privy_id: string;
}) => {
  try {
    // Use service role client for admin check
    const { isAdmin } = await isUserAdmin(questData.created_by_privy_id);
    if (!isAdmin) {
      throw new Error('Unauthorized: Only admins can create quests');
    }

    // Use service role client for quest creation too
    const { data, error } = await supabaseAdmin
      .from('quests')
      .insert(questData)
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error creating quest:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Get today's active quest
export const getActiveQuest = async () => {
  try {
    const now = new Date().toISOString();
    
    // Don't use .single() - use regular query and handle empty results
    const { data, error } = await supabase
      .from('quests')
      .select('*')
      .gte('expire', now)
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    // Return the first item if it exists, otherwise null
    const quest = data && data.length > 0 ? data[0] : null;
    
    return { 
      success: true, 
      data: quest 
    };
  } catch (error: any) {
    console.error('Error fetching active quest:', error);
    return { 
      success: false, 
      error: error?.message || 'Unknown error',
      data: null 
    };
  }
};

// Add this function to your supabasedClient.ts
export const getAllQuests = async () => {
  try {
    const { data, error } = await supabase
      .from('quests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('Error fetching quests:', error);
    return { success: false, error: error?.message || 'Unknown error', data: [] };
  }
};

// Submit answer and update XP
// Simple submitAnswer function - just validate user exists
export const submitAnswer = async (
  user_privy_id: string,
  quest_id: number,
  selected_option: string
) => {
  try {
    // 1. Validate that the user exists in the database using your existing function
    const userResult = await getUserDetails(user_privy_id);
    
    if (!userResult.success) {
      console.error('User validation failed:', userResult.error);
      throw new Error('User not found. Please ensure your account is properly set up.');
    }

    if (!userResult.data) {
      throw new Error('User not found. Please ensure your account is properly set up.');
    }

    const user = userResult.data;

    // 2. Get the quest details
    const { data: quest, error: questError } = await supabase
      .from('quests')
      .select('correct_option, point_value, expire')
      .eq('id', quest_id)
      .single();

    if (questError) {
      console.error('Error fetching quest:', questError);
      throw new Error('Quest not found');
    }

    if (!quest) throw new Error('Quest not found');

    // 3. Check if question is still active
    if (new Date(quest.expire) < new Date()) {
      throw new Error('This question has expired');
    }

    // 4. Check if user already answered this question
    const { data: existingAnswer, error: answerCheckError } = await supabase
      .from('user_answers')
      .select('id')
      .eq('user_privy_id', user_privy_id)
      .eq('quest_id', quest_id)
      .maybeSingle();

    if (answerCheckError) {
      console.error('Error checking existing answer:', answerCheckError);
      throw new Error('Database error when checking previous answers');
    }

    if (existingAnswer) {
      throw new Error('You already answered this question');
    }

    const is_correct = selected_option === quest.correct_option;

    // 5. Record the answer in a transaction
    const { error: transactionError } = await supabase.rpc('handle_answer_submission', {
      p_user_privy_id: user_privy_id,
      p_quest_id: quest_id,
      p_selected_option: selected_option,
      p_is_correct: is_correct,
      p_point_value: is_correct ? quest.point_value : 0
    });

    if (transactionError) {
      console.error('Error in transaction:', transactionError);
      throw new Error('Failed to submit answer. Please try again.');
    }

    // 6. Return the result
    return { 
      success: true, 
      is_correct,
      points_earned: is_correct ? quest.point_value : 0,
      new_xp: is_correct ? (user.user_xp || 0) + quest.point_value : user.user_xp
    };
    
  } catch (error) {
    console.error('Error submitting answer:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};


export const addAdmin = async (newAdmin: { privy_id: string; email: string }) => {
  try {
    // Get current user's privy_id from the JWT
    const { data: { user } } = await supabase.auth.getUser();
    const privy_id = user?.user_metadata?.privy_id;
    
    if (!privy_id) throw new Error('User not authenticated');

    // Verify current user is super admin
    const { data: currentAdmin, error: adminError } = await supabase
      .from('admins')
      .select('is_super_admin')
      .eq('privy_id', privy_id)
      .single();

    if (adminError || !currentAdmin?.is_super_admin) {
      throw new Error('Only super admins can add new admins');
    }

    const { data, error } = await supabase
      .from('admins')
      .insert({ ...newAdmin, is_super_admin: false })
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error adding admin:', error);
    return { success: false, error };
  }
};

export const isUserAdmin = async (privyId: string) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('admins')
      .select('is_super_admin')
      .eq('privy_id', privyId)
      .single();

    if (error) {
      console.error('Admin check error:', error);
      return { isAdmin: false, isSuperAdmin: false };
    }

    return { 
      isAdmin: !!data, 
      isSuperAdmin: data?.is_super_admin || false 
    };
  } catch (error) {
    console.error('Error in isUserAdmin:', error);
    return { isAdmin: false, isSuperAdmin: false };
  }
};

// Add to supabasedClient.ts
export const debugCheckAdminRecords = async () => {
  const { data, error } = await supabase
    .from('admins')
    .select('*');
  
  console.log('Debug - All admin records:', { data, error });
  return { data, error };
};