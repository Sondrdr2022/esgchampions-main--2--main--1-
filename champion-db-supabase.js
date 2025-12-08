// ESG Champions Database System with Supabase
// This replaces champion-db.js and uses Supabase instead of localStorage

const DB = {
  // Initialize database structure
  // Note: With Supabase, initialization happens via SQL schema
  // This function can be used to seed initial data if needed
  init: async function() {
    // Check if panels and indicators need to be seeded
    const panels = await SupabaseService.getPanels();
    if (panels.length === 0) {
      console.log('No panels found. Run seed script to initialize data.');
    }
  },

  // Get current champion
  getCurrentChampion: async function() {
    return await SupabaseService.getCurrentChampion();
  },

  // Get all panels
  getPanels: async function() {
    return await SupabaseService.getPanels();
  },

  // Get panel by ID
  getPanel: async function(panelId) {
    return await SupabaseService.getPanel(panelId);
  },

  // Get indicators for a panel
  getIndicators: async function(panelId) {
    return await SupabaseService.getIndicators(panelId);
  },

  // Get indicator by ID
  getIndicator: async function(indicatorId) {
    return await SupabaseService.getIndicator(indicatorId);
  },

  // Save vote
  saveVote: async function(championId, indicatorId, vote) {
    return await SupabaseService.saveVote(championId, indicatorId, vote);
  },

  // Get votes for an indicator
  getVotes: async function(indicatorId) {
    return await SupabaseService.getVotes(indicatorId);
  },

  // Get vote by champion and indicator
  getChampionVote: async function(championId, indicatorId) {
    return await SupabaseService.getChampionVote(championId, indicatorId);
  },

  // Save comment
  saveComment: async function(championId, indicatorId, comment) {
    return await SupabaseService.saveComment(championId, indicatorId, comment);
  },

  // Get comments for an indicator
  getComments: async function(indicatorId) {
    return await SupabaseService.getComments(indicatorId);
  },

  // Save invitation
  saveInvitation: async function(fromChampionId, toEmail, panelId, message) {
    return await SupabaseService.saveInvitation(fromChampionId, toEmail, panelId, message);
  },

  // Get invitations for a champion
  getInvitations: async function(championEmail) {
    return await SupabaseService.getInvitations(championEmail);
  },

  // Get panel participation history for a champion
  getParticipationHistory: async function(championId) {
    return await SupabaseService.getParticipationHistory(championId);
  },

  // Additional helper methods for reviews (used in champion-indicators.js)
  getReview: async function(championId, indicatorId) {
    return await SupabaseService.getReview(championId, indicatorId);
  },

  saveReview: async function(championId, indicatorId, reviewData) {
    return await SupabaseService.saveReview(championId, indicatorId, reviewData);
  }
};

// Initialize database on load
DB.init();

