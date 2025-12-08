// Dynamic Navigation System with Role-Based Visibility
// Handles: Admin button, Membership/Dashboard toggle, Logout
// Works across all pages with consistent behavior

let navigationState = {
  isLoggedIn: false,
  isAdmin: false,
  championId: null
};

/**
 * Check authentication status
 */
async function checkAuthStatus() {
  let isLoggedIn = false;
  let championId = null;
  
  // Check Supabase authentication first
  if (typeof supabaseClient !== 'undefined' && supabaseClient) {
    try {
      const { data: { user }, error } = await supabaseClient.auth.getUser();
      if (user && !error) {
        isLoggedIn = true;
        championId = user.id;
      }
    } catch (error) {
      console.error('Error checking Supabase auth:', error);
    }
  }
  
  // Fallback to localStorage check
  if (!isLoggedIn) {
    const currentChampion = localStorage.getItem('current-champion');
    if (currentChampion) {
      try {
        const championData = JSON.parse(currentChampion);
        isLoggedIn = true;
        championId = championData.id || championData.championId;
      } catch (e) {
        // If it's just an ID string
        const championIdStr = localStorage.getItem('current-champion-id');
        if (championIdStr) {
          isLoggedIn = true;
          championId = championIdStr;
        }
      }
    }
  }
  
  return { isLoggedIn, championId };
}

/**
 * Check if current user is admin
 */
async function checkAdminStatus(championId) {
  if (!championId) return false;
  
  try {
    if (typeof AdminService !== 'undefined' && AdminService.isAdmin) {
      return await AdminService.isAdmin();
    }
    
    // Fallback: Check directly via Supabase
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('champions')
        .select('is_admin')
        .eq('id', championId)
        .single();
      
      if (!error && data) {
        return data.is_admin === true;
      }
    }
  } catch (error) {
    console.error('Error checking admin status:', error);
  }
  
  return false;
}

/**
 * Update navigation buttons based on authentication and admin status
 */
async function updateNavigation() {
  const nav = document.querySelector('nav');
  if (!nav) {
    console.warn('Navigation element not found');
    return;
  }

  // Check authentication status
  const { isLoggedIn, championId } = await checkAuthStatus();
  navigationState.isLoggedIn = isLoggedIn;
  navigationState.championId = championId;

  // Check admin status if logged in
  if (isLoggedIn && championId) {
    navigationState.isAdmin = await checkAdminStatus(championId);
  } else {
    navigationState.isAdmin = false;
  }

  console.log('Navigation state:', navigationState);

  // Get or create navigation buttons
  let membershipBtn = document.getElementById('membership-btn');
  // Check for existing Dashboard button by ID or href
  let dashboardBtn = document.getElementById('dashboard-btn') || 
                     nav.querySelector('a[href="champion-dashboard.html"]');
  let adminBtn = document.getElementById('admin-btn');
  let rankingsBtn = document.getElementById('nav-rankings-btn') || 
                    nav.querySelector('a[href="ranking.html"]');
  let logoutBtn = document.getElementById('logout-btn');

  // ============================================
  // MEMBERSHIP / DASHBOARD TOGGLE
  // ============================================
  
  if (isLoggedIn) {
    // User IS logged in: Hide Membership, Show Dashboard
    
    // Hide Membership button
    if (membershipBtn) {
      membershipBtn.style.display = 'none';
    }
    
    // Create or show Dashboard button
    if (!dashboardBtn) {
      dashboardBtn = document.createElement('a');
      dashboardBtn.href = 'champion-dashboard.html';
      dashboardBtn.className = 'btn-primary';
      dashboardBtn.id = 'dashboard-btn';
      dashboardBtn.textContent = 'Dashboard';
      
      // Insert Dashboard button where Membership was (or before Rankings/Logout)
      if (membershipBtn) {
        membershipBtn.parentNode.insertBefore(dashboardBtn, membershipBtn.nextSibling);
      } else if (rankingsBtn) {
        nav.insertBefore(dashboardBtn, rankingsBtn);
      } else if (logoutBtn) {
        nav.insertBefore(dashboardBtn, logoutBtn);
      } else {
        nav.appendChild(dashboardBtn);
      }
    } else {
      // Ensure existing Dashboard button has correct ID and is visible
      if (!dashboardBtn.id) {
        dashboardBtn.id = 'dashboard-btn';
      }
      dashboardBtn.style.display = '';
      dashboardBtn.href = 'champion-dashboard.html';
      dashboardBtn.className = 'btn-primary';
      dashboardBtn.textContent = 'Dashboard';
    }
    
    // Remove any duplicate Dashboard buttons
    const allDashboardLinks = nav.querySelectorAll('a[href="champion-dashboard.html"]');
    if (allDashboardLinks.length > 1) {
      // Keep the first one (which should be dashboardBtn), remove others
      allDashboardLinks.forEach((link, index) => {
        if (index > 0 && link !== dashboardBtn) {
          link.remove();
        }
      });
    }
  } else {
    // User is NOT logged in: Show Membership, Hide Dashboard
    
    // Show Membership button
    if (membershipBtn) {
      membershipBtn.style.display = '';
    }
    
    // Hide Dashboard button
    if (dashboardBtn) {
      dashboardBtn.style.display = 'none';
    }
  }

  // ============================================
  // ADMIN BUTTON
  // ============================================
  
  if (navigationState.isAdmin) {
    // User is admin: Show Admin button
    if (!adminBtn) {
      adminBtn = document.createElement('a');
      adminBtn.href = 'admin-review.html';
      adminBtn.className = 'btn-primary';
      adminBtn.id = 'admin-btn';
      adminBtn.textContent = 'Admin';
      
      // Insert Admin button before Dashboard (or after Membership if not logged in)
      if (dashboardBtn && dashboardBtn.style.display !== 'none') {
        nav.insertBefore(adminBtn, dashboardBtn);
      } else if (membershipBtn && membershipBtn.style.display !== 'none') {
        membershipBtn.parentNode.insertBefore(adminBtn, membershipBtn.nextSibling);
      } else if (rankingsBtn) {
        nav.insertBefore(adminBtn, rankingsBtn);
      } else if (logoutBtn) {
        nav.insertBefore(adminBtn, logoutBtn);
      } else {
        nav.appendChild(adminBtn);
      }
    } else {
      adminBtn.style.display = '';
    }
  } else {
    // User is not admin: Hide Admin button
    if (adminBtn) {
      adminBtn.style.display = 'none';
    }
  }

  // ============================================
  // RANKINGS BUTTON
  // ============================================
  
  if (!rankingsBtn) {
    rankingsBtn = document.createElement('a');
    rankingsBtn.href = 'ranking.html';
    rankingsBtn.className = 'btn-primary';
    rankingsBtn.id = 'nav-rankings-btn';
    rankingsBtn.textContent = 'Rankings';
    
    // Insert Rankings button before Logout (or at end)
    if (logoutBtn) {
      nav.insertBefore(rankingsBtn, logoutBtn);
    } else {
      nav.appendChild(rankingsBtn);
    }
  }
  
  // Show Rankings only if logged in
  if (rankingsBtn) {
    rankingsBtn.style.display = isLoggedIn ? '' : 'none';
  }

  // ============================================
  // LOGOUT BUTTON
  // ============================================
  
  if (!logoutBtn) {
    logoutBtn = document.createElement('a');
    logoutBtn.href = '#';
    logoutBtn.className = 'btn-secondary';
    logoutBtn.id = 'logout-btn';
    logoutBtn.textContent = 'Logout';
    nav.appendChild(logoutBtn);
  }
  
  // Show Logout only if logged in
  if (logoutBtn) {
    logoutBtn.style.display = isLoggedIn ? '' : 'none';
  }
}

/**
 * Listen for auth state changes and update navigation
 */
function setupAuthListener() {
  // Listen to Supabase auth changes
  if (typeof supabaseClient !== 'undefined' && supabaseClient) {
    supabaseClient.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed, updating navigation:', event);
      await updateNavigation();
    });
  }
  
  // Listen to custom logout events
  window.addEventListener('logout', async () => {
    console.log('Logout event detected, updating navigation');
    navigationState.isLoggedIn = false;
    navigationState.isAdmin = false;
    navigationState.championId = null;
    await updateNavigation();
  });
  
  // Listen to custom login events
  window.addEventListener('login', async () => {
    console.log('Login event detected, updating navigation');
    await updateNavigation();
  });
}

/**
 * Initialize navigation system
 */
async function initDynamicNavigation() {
  // Wait for Supabase client to be available
  if (typeof supabaseClient === 'undefined' || !supabaseClient) {
    // Wait a bit and try again
    setTimeout(initDynamicNavigation, 100);
    return;
  }
  
  // Update navigation on page load
  await updateNavigation();
  
  // Setup listeners for auth changes
  setupAuthListener();
  
  // Update navigation periodically (every 30 seconds) to catch any state changes
  setInterval(async () => {
    await updateNavigation();
  }, 30000);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDynamicNavigation);
} else {
  initDynamicNavigation();
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.DynamicNavigation = {
    update: updateNavigation,
    getState: () => ({ ...navigationState })
  };
}

