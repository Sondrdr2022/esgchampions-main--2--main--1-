// Supabase Service Layer
// This replaces localStorage calls with Supabase API calls

// Make sure supabase-config.js is loaded before this file
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
// <script src="supabase-config.js"></script>
// <script src="supabase-service.js"></script>

const SupabaseService = {
  // ============================================
  // AUTHENTICATION METHODS
  // ============================================

  /**
   * Sign up a new champion
   */
  async signUp(email, password, championData) {
    try {
      console.log('Starting sign up process for:', email);
      
      // 1. Create auth user
      const { data: authData, error: authError } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: championData.firstName,
            last_name: championData.lastName
          }
        }
      });

      if (authError) {
        console.error('Auth sign up error:', authError);
        throw authError;
      }
      
      if (!authData.user) {
        console.error('No user returned from auth signup');
        throw new Error('Failed to create user account');
      }

      console.log('Auth user created:', authData.user.id);

      // Wait a moment for the trigger to potentially create the profile
      // (if trigger is set up, it will create a basic profile)
      await new Promise(resolve => setTimeout(resolve, 500));

      // 2. Create or update champion profile
      const insertData = {
        id: authData.user.id,
        first_name: championData.firstName,
        last_name: championData.lastName,
        organization: championData.organization || null,
        role: championData.role || null,
        email: email,
        mobile: championData.mobile || null,
        office_phone: championData.officePhone || null,
        linkedin: championData.linkedin || null,
        website: championData.website || null,
        competence: championData.competence || null,
        contributions: championData.contributions || null,
        primary_sector: championData.primarySector || null,
        expertise_panels: championData.expertisePanels || null,
        cla_accepted: championData.claAccepted || false,
        nda_accepted: championData.ndaAccepted || false,
        nda_signature: championData.ndaSignature || null,
        terms_accepted: championData.termsAccepted || false,
        ip_policy_accepted: championData.ipPolicyAccepted || false
      };

      console.log('Inserting/updating champion profile:', insertData);

      // Use upsert to handle case where trigger already created a basic profile
      const { data: championProfile, error: profileError } = await supabaseClient
        .from('champions')
        .upsert(insertData, {
          onConflict: 'id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (profileError) {
        console.error('Champion profile insert/update error:', profileError);
        console.error('Error details:', {
          code: profileError.code,
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint
        });
        
        // If foreign key error, provide helpful message
        if (profileError.message && profileError.message.includes('foreign key')) {
          throw new Error('Registration failed: User account was not created properly. Please try again or contact support.');
        }
        
        throw new Error(`Failed to create champion profile: ${profileError.message}`);
      }

      console.log('Champion profile created/updated successfully:', championProfile);

      return { user: authData.user, champion: championProfile };
    } catch (error) {
      console.error('Sign up error:', error);
      // Provide more detailed error message
      const errorMessage = error.message || error.toString() || 'Registration failed';
      throw new Error(errorMessage);
    }
  },

  /**
   * Sign in a champion
   */
  async signIn(email, password) {
    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  },

  /**
   * Sign in with LinkedIn OAuth (Popup version)
   */
  async signInWithLinkedIn() {
    return new Promise((resolve, reject) => {
      try {
        // Get the OAuth URL from Supabase
        supabaseClient.auth.signInWithOAuth({
          provider: 'linkedin',
          options: {
            redirectTo: `${window.location.origin}/linkedin-callback.html`,
            scopes: 'openid profile email'
          }
        }).then(({ data, error }) => {
          if (error) {
            reject(error);
            return;
          }

          if (data?.url) {
            // Open LinkedIn OAuth in a popup window
            const width = 600;
            const height = 700;
            const left = (window.screen.width - width) / 2;
            const top = (window.screen.height - height) / 2;

            const popup = window.open(
              data.url,
              'LinkedIn Login',
              `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes,location=no,directories=no,status=no`
            );

            if (!popup) {
              reject(new Error('Popup blocked. Please allow popups for this site.'));
              return;
            }

            // Listen for messages from the popup
            const messageListener = async (event) => {
              // Security: Verify origin
              if (event.origin !== window.location.origin) {
                return;
              }

              if (event.data.type === 'LINKEDIN_OAUTH_SUCCESS') {
                // Remove listener
                window.removeEventListener('message', messageListener);
                
                // Close popup
                popup.close();

                // Handle the session
                try {
                  const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
                  
                  if (sessionError) throw sessionError;
                  
                  if (session) {
                    // Process LinkedIn callback
                    await this.handleOAuthCallback(session);
                    resolve(session);
                  } else {
                    reject(new Error('No session found after LinkedIn authentication'));
                  }
                } catch (error) {
                  reject(error);
                }
              } else if (event.data.type === 'LINKEDIN_OAUTH_ERROR') {
                window.removeEventListener('message', messageListener);
                popup.close();
                reject(new Error(event.data.error || 'LinkedIn authentication failed'));
              }
            };

            window.addEventListener('message', messageListener);

            // Check if popup is closed manually
            const checkClosed = setInterval(() => {
              if (popup.closed) {
                clearInterval(checkClosed);
                window.removeEventListener('message', messageListener);
                reject(new Error('LinkedIn authentication was cancelled'));
              }
            }, 1000);
          } else {
            reject(new Error('Failed to get OAuth URL'));
          }
        });
      } catch (error) {
        console.error('LinkedIn OAuth error:', error);
        reject(error);
      }
    });
  },

  /**
   * Handle OAuth callback and create/update champion profile
   */
  async handleOAuthCallback() {
    try {
      // Check if this is an OAuth callback
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');
      const errorDescription = urlParams.get('error_description');

      if (error) {
        console.error('OAuth error:', error, errorDescription);
        throw new Error(errorDescription || 'OAuth authentication failed');
      }

      if (!code) {
        // Not an OAuth callback
        return null;
      }

      // Get the current session (Supabase handles the OAuth exchange)
      const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw sessionError;
      }

      if (!session || !session.user) {
        console.log('No session found after OAuth callback');
        return null;
      }

      console.log('OAuth callback successful, user:', session.user);

      // Get user metadata from LinkedIn
      const userMetadata = session.user.user_metadata || {};
      const linkedinData = session.user.app_metadata?.provider === 'linkedin' ? userMetadata : null;

      // Extract LinkedIn profile information
      const firstName = linkedinData?.first_name || userMetadata?.first_name || userMetadata?.full_name?.split(' ')[0] || '';
      const lastName = linkedinData?.last_name || userMetadata?.last_name || userMetadata?.full_name?.split(' ').slice(1).join(' ') || '';
      const email = session.user.email || linkedinData?.email || '';
      const linkedinProfile = linkedinData?.avatar_url || userMetadata?.avatar_url || null;
      const linkedinId = linkedinData?.sub || userMetadata?.sub || null;

      // Check if champion profile exists
      let champion = await this.getCurrentChampion();

      if (champion) {
        // Update existing champion profile with LinkedIn data
        console.log('Updating existing champion profile with LinkedIn data');
        const updateData = {
          email: email || champion.email,
          linkedin: linkedinId || champion.linkedin,
          ...(firstName && { first_name: firstName }),
          ...(lastName && { last_name: lastName })
        };

        const { data: updatedChampion, error: updateError } = await supabaseClient
          .from('champions')
          .update(updateData)
          .eq('id', session.user.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating champion profile:', updateError);
          // Continue anyway - user is authenticated
        } else {
          champion = updatedChampion;
        }
      } else {
        // Create new champion profile from LinkedIn data
        console.log('Creating new champion profile from LinkedIn data');
        const insertData = {
          id: session.user.id,
          email: email,
          first_name: firstName,
          last_name: lastName,
          linkedin: linkedinId,
          // Set defaults for required fields
          cla_accepted: false,
          nda_accepted: false,
          terms_accepted: false,
          ip_policy_accepted: false
        };

        const { data: newChampion, error: insertError } = await supabaseClient
          .from('champions')
          .upsert(insertData, {
            onConflict: 'id',
            ignoreDuplicates: false
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating champion profile:', insertError);
          // Continue anyway - user is authenticated, profile might be created by trigger
          champion = await this.getCurrentChampion();
        } else {
          champion = newChampion;
        }
      }

      // Store session info
      localStorage.setItem('current-champion-id', session.user.id);

      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);

      return { user: session.user, champion };
    } catch (error) {
      console.error('OAuth callback error:', error);
      throw error;
    }
  },

  /**
   * Sign out current user
   */
  async signOut() {
    try {
      const { error } = await supabaseClient.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  },

  /**
   * Get current authenticated user
   */
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabaseClient.auth.getUser();
      if (error) throw error;
      return user;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  /**
   * Get current champion profile
   */
  async getCurrentChampion() {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        console.log('No authenticated user found');
        return null;
      }

      console.log('Fetching champion profile for user:', user.id);

      const { data, error } = await supabaseClient
        .from('champions')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching champion profile:', error);
        // If profile doesn't exist, return null
        if (error.code === 'PGRST116') {
          console.log('Champion profile not found in database');
          return null;
        }
        throw error;
      }

      if (!data) {
        console.log('No champion data returned');
        return null;
      }

      console.log('Champion profile fetched successfully:', data);
      return data;
    } catch (error) {
      console.error('Get current champion error:', error);
      return null;
    }
  },

  /**
   * Update champion profile
   */
  async updateChampion(championId, updates) {
    try {
      const { data, error } = await supabaseClient
        .from('champions')
        .update(updates)
        .eq('id', championId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Update champion error:', error);
      throw error;
    }
  },

  // ============================================
  // PANELS METHODS
  // ============================================

  /**
   * Get all panels
   */
  async getPanels() {
    try {
      console.log('Fetching panels from Supabase...');
      const { data, error } = await supabaseClient
        .from('panels')
        .select('*')
        .order('id');

      if (error) {
        console.error('Get panels error:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        throw error;
      }
      
      console.log('Panels fetched successfully:', data?.length || 0, 'panels');
      return data || [];
    } catch (error) {
      console.error('Get panels error:', error);
      console.error('Error message:', error?.message);
      console.error('Error code:', error?.code);
      return [];
    }
  },

  /**
   * Get panel by ID
   */
  async getPanel(panelId) {
    try {
      const { data, error } = await supabaseClient
        .from('panels')
        .select('*')
        .eq('id', panelId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get panel error:', error);
      return null;
    }
  },

  /**
   * Initialize panels (seed data)
   */
  async initPanels(panelsData) {
    try {
      const { data, error } = await supabaseClient
        .from('panels')
        .upsert(panelsData, { onConflict: 'id' })
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Init panels error:', error);
      throw error;
    }
  },

  // ============================================
  // INDICATORS METHODS
  // ============================================

  /**
   * Get indicators for a panel
   */
  async getIndicators(panelId) {
    try {
      console.log('Fetching indicators for panel:', panelId);
      const { data, error } = await supabaseClient
        .from('indicators')
        .select('*')
        .eq('panel_id', panelId)
        .order('id');

      if (error) {
        console.error('Get indicators error:', error);
        throw error;
      }
      
      console.log('Indicators fetched successfully:', data?.length || 0, 'indicators');
      return data || [];
    } catch (error) {
      console.error('Get indicators error:', error);
      console.error('Error message:', error?.message);
      console.error('Error code:', error?.code);
      return [];
    }
  },

  /**
   * Get indicator by ID
   */
  async getIndicator(indicatorId) {
    try {
      const { data, error } = await supabaseClient
        .from('indicators')
        .select('*')
        .eq('id', indicatorId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get indicator error:', error);
      return null;
    }
  },

  /**
   * Initialize indicators (seed data)
   */
  async initIndicators(indicatorsData) {
    try {
      const { data, error } = await supabaseClient
        .from('indicators')
        .upsert(indicatorsData, { onConflict: 'id' })
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Init indicators error:', error);
      throw error;
    }
  },

  // ============================================
  // VOTES METHODS
  // ============================================

  /**
   * Save or update a vote
   */
  async saveVote(championId, indicatorId, vote) {
    try {
      const { data, error } = await supabaseClient
        .from('votes')
        .upsert({
          champion_id: championId,
          indicator_id: indicatorId,
          vote: vote
        }, {
          onConflict: 'champion_id,indicator_id'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Save vote error:', error);
      throw error;
    }
  },

  /**
   * Get votes for an indicator
   */
  async getVotes(indicatorId) {
    try {
      const { data, error } = await supabaseClient
        .from('votes')
        .select('*')
        .eq('indicator_id', indicatorId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get votes error:', error);
      return [];
    }
  },

  /**
   * Get vote by champion and indicator
   */
  async getChampionVote(championId, indicatorId) {
    try {
      const { data, error } = await supabaseClient
        .from('votes')
        .select('*')
        .eq('champion_id', championId)
        .eq('indicator_id', indicatorId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      return data || null;
    } catch (error) {
      console.error('Get champion vote error:', error);
      return null;
    }
  },

  // ============================================
  // COMMENTS METHODS
  // ============================================

  /**
   * Save a comment
   */
  async saveComment(championId, indicatorId, comment) {
    try {
      const { data, error } = await supabaseClient
        .from('comments')
        .insert({
          champion_id: championId,
          indicator_id: indicatorId,
          comment: comment
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Save comment error:', error);
      throw error;
    }
  },

  /**
   * Get comments for an indicator
   */
  async getComments(indicatorId) {
    try {
      const { data, error } = await supabaseClient
        .from('comments')
        .select(`
          *,
          champions:champion_id (
            first_name,
            last_name
          )
        `)
        .eq('indicator_id', indicatorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Format the response to match expected structure
      return (data || []).map(comment => ({
        id: comment.id,
        championId: comment.champion_id,
        championName: comment.champions 
          ? `${comment.champions.first_name} ${comment.champions.last_name}`
          : 'Anonymous',
        indicatorId: comment.indicator_id,
        comment: comment.comment,
        timestamp: comment.created_at
      }));
    } catch (error) {
      console.error('Get comments error:', error);
      return [];
    }
  },

  // ============================================
  // REVIEWS METHODS
  // ============================================

  /**
   * Save or update a review
   */
  async saveReview(championId, indicatorId, reviewData) {
    try {
      const { data, error } = await supabaseClient
        .from('reviews')
        .upsert({
          champion_id: championId,
          indicator_id: indicatorId,
          necessary: reviewData.necessary,
          rating: reviewData.rating,
          comments: reviewData.comments,
          status: reviewData.status || 'pending' // Default to pending for admin review
        }, {
          onConflict: 'champion_id,indicator_id'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Save review error:', error);
      throw error;
    }
  },

  /**
   * Get review by champion and indicator
   */
  async getReview(championId, indicatorId) {
    try {
      const { data, error } = await supabaseClient
        .from('reviews')
        .select('*')
        .eq('champion_id', championId)
        .eq('indicator_id', indicatorId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error) {
      console.error('Get review error:', error);
      return null;
    }
  },

  /**
   * Get all reviews for an indicator
   */
  async getIndicatorReviews(indicatorId) {
    try {
      const { data, error } = await supabaseClient
        .from('reviews')
        .select('*')
        .eq('indicator_id', indicatorId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get indicator reviews error:', error);
      return [];
    }
  },

  // ============================================
  // INVITATIONS METHODS
  // ============================================

  /**
   * Save an invitation
   */
  async saveInvitation(fromChampionId, toEmail, panelId, message) {
    try {
      const { data, error } = await supabaseClient
        .from('invitations')
        .insert({
          from_champion_id: fromChampionId,
          to_email: toEmail,
          panel_id: panelId,
          message: message || null,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Save invitation error:', error);
      throw error;
    }
  },

  /**
   * Get invitations for a champion (by email)
   */
  async getInvitations(championEmail) {
    try {
      const { data, error } = await supabaseClient
        .from('invitations')
        .select('*')
        .eq('to_email', championEmail)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get invitations error:', error);
      return [];
    }
  },

  // ============================================
  // PARTICIPATION & STATS METHODS
  // ============================================

  /**
   * Get participation history for a champion
   */
  async getParticipationHistory(championId) {
    try {
      // Get all votes and comments for this champion
      const [votesData, commentsData] = await Promise.all([
        supabaseClient
          .from('votes')
          .select('indicator_id, created_at')
          .eq('champion_id', championId),
        supabaseClient
          .from('comments')
          .select('indicator_id, created_at')
          .eq('champion_id', championId)
      ]);

      if (votesData.error) throw votesData.error;
      if (commentsData.error) throw commentsData.error;

      const votes = votesData.data || [];
      const comments = commentsData.data || [];

      // Get unique panel IDs from indicators
      const indicatorIds = [...new Set([
        ...votes.map(v => v.indicator_id),
        ...comments.map(c => c.indicator_id)
      ])];

      if (indicatorIds.length === 0) return [];

      // Get indicators to find panel IDs
      const { data: indicators, error: indicatorsError } = await supabaseClient
        .from('indicators')
        .select('id, panel_id')
        .in('id', indicatorIds);

      if (indicatorsError) throw indicatorsError;

      // Group by panel
      const panelMap = new Map();
      indicators.forEach(ind => {
        if (!panelMap.has(ind.panel_id)) {
          panelMap.set(ind.panel_id, {
            panelId: ind.panel_id,
            votes: [],
            comments: []
          });
        }
      });

      // Count votes and comments per panel
      votes.forEach(vote => {
        const indicator = indicators.find(i => i.id === vote.indicator_id);
        if (indicator && panelMap.has(indicator.panel_id)) {
          panelMap.get(indicator.panel_id).votes.push(vote);
        }
      });

      comments.forEach(comment => {
        const indicator = indicators.find(i => i.id === comment.indicator_id);
        if (indicator && panelMap.has(indicator.panel_id)) {
          panelMap.get(indicator.panel_id).comments.push(comment);
        }
      });

      // Get panel details
      const panelIds = Array.from(panelMap.keys());
      const { data: panels, error: panelsError } = await supabaseClient
        .from('panels')
        .select('*')
        .in('id', panelIds);

      if (panelsError) throw panelsError;

      // Format response
      return Array.from(panelMap.entries()).map(([panelId, data]) => {
        const panel = panels.find(p => p.id === panelId);
        const allActivities = [...data.votes, ...data.comments];
        const lastActivity = allActivities.length > 0
          ? allActivities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0].created_at
          : null;

        return {
          panel: panel,
          votesCount: data.votes.length,
          commentsCount: data.comments.length,
          lastActivity: lastActivity
        };
      }).sort((a, b) => {
        if (!a.lastActivity) return 1;
        if (!b.lastActivity) return -1;
        return new Date(b.lastActivity) - new Date(a.lastActivity);
      });
    } catch (error) {
      console.error('Get participation history error:', error);
      return [];
    }
  },

  // ============================================
  // NOTIFICATIONS METHODS
  // ============================================

  /**
   * Get notifications for current champion
   */
  async getNotifications(limit = 50) {
    try {
      const champion = await this.getCurrentChampion();
      if (!champion) return [];

      const { data, error } = await supabaseClient
        .from('notifications')
        .select('*')
        .eq('champion_id', champion.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get notifications error:', error);
      return [];
    }
  },

  /**
   * Mark notification as read
   */
  async markNotificationRead(notificationId) {
    try {
      const { data, error } = await supabaseClient
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Mark notification read error:', error);
      throw error;
    }
  },

  /**
   * Get unread notification count
   */
  async getUnreadNotificationCount() {
    try {
      const champion = await this.getCurrentChampion();
      if (!champion) return 0;

      const { data, error } = await supabaseClient
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('champion_id', champion.id)
        .eq('read', false);

      if (error) throw error;
      return data?.length || 0;
    } catch (error) {
      console.error('Get unread notification count error:', error);
      return 0;
    }
  },

  /**
   * Get reviews with status for current champion
   */
  async getChampionReviews() {
    try {
      const champion = await this.getCurrentChampion();
      if (!champion) return [];

      const { data, error } = await supabaseClient
        .from('reviews')
        .select(`
          *,
          indicators:indicator_id (
            id,
            title,
            panel_id
          )
        `)
        .eq('champion_id', champion.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Get panel info for each review
      const reviewsWithPanels = await Promise.all(
        (data || []).map(async (review) => {
          if (review.indicators && review.indicators.panel_id) {
            const panel = await this.getPanel(review.indicators.panel_id);
            return {
              ...review,
              panel: panel
            };
          }
          return review;
        })
      );

      return reviewsWithPanels;
    } catch (error) {
      console.error('Get champion reviews error:', error);
      return [];
    }
  }
};

// Listen for auth state changes
supabaseClient.auth.onAuthStateChange((event, session) => {
  console.log('Auth state changed:', event, session?.user?.id);
  // You can dispatch custom events here if needed
  window.dispatchEvent(new CustomEvent('supabase:auth', { detail: { event, session } }));
});

