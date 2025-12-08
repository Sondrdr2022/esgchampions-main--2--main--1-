// Logout functionality with Supabase support

// Create logout confirmation modal dynamically
function createLogoutModal() {
  // Check if modal already exists
  if (document.getElementById('logout-confirm-modal')) {
    return;
  }

  const modalHTML = `
    <div id="logout-confirm-modal" class="modal hidden">
      <div class="modal-content" style="max-width: 450px; text-align: center;">
        <div style="width: 80px; height: 80px; background-color: #fef3c7; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem;">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#92400e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </div>
        <h2 style="margin-bottom: 1rem; font-size: 1.5rem; color: #111827;">Confirm Logout</h2>
        <p style="color: #6b7280; margin-bottom: 2rem; font-size: 1rem; line-height: 1.6;">
          Are you sure you want to logout?<br>
          You will need to authenticate again to access your account.
        </p>
        <div class="flex gap-4" style="justify-content: center;">
          <button id="logout-confirm-btn" class="btn-primary" style="flex: 1; max-width: 150px; padding: 0.75rem 1.5rem;">Continue</button>
          <button id="logout-cancel-btn" class="btn-secondary" style="flex: 1; max-width: 150px; padding: 0.75rem 1.5rem;">Cancel</button>
        </div>
      </div>
    </div>
  `;

  // Insert modal into body
  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // Close modal when clicking outside
  const modal = document.getElementById('logout-confirm-modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target.id === 'logout-confirm-modal') {
        modal.classList.add('hidden');
        // Redirect to champion dashboard when clicking outside
        window.location.href = 'champion-dashboard.html';
      }
    });
  }
}

async function performLogout() {
  // Sign out from Supabase if available
  if (typeof supabaseClient !== 'undefined' && supabaseClient) {
    try {
      await supabaseClient.auth.signOut();
    } catch (error) {
      console.error('Error signing out from Supabase:', error);
    }
  }
  
  // Remove session data from localStorage
  localStorage.removeItem('current-champion');
  localStorage.removeItem('current-champion-id');
  
  // Dispatch logout event for navigation system
  window.dispatchEvent(new CustomEvent('logout'));
  
  // Update navigation immediately (if dynamic navigation is loaded)
  if (typeof window.DynamicNavigation !== 'undefined') {
    await window.DynamicNavigation.update();
  }
  
  // Redirect to index.html and refresh
  window.location.href = 'index.html';
}

async function initLogout() {
  // Create the modal first
  createLogoutModal();

  const logoutBtn = document.getElementById('logout-btn');
  const modal = document.getElementById('logout-confirm-modal');
  const confirmBtn = document.getElementById('logout-confirm-btn');
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      
      // Check if user is logged in (try Supabase first, fallback to localStorage)
      let isLoggedIn = false;
      
      if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        try {
          const { data: { user } } = await supabaseClient.auth.getUser();
          isLoggedIn = !!user;
        } catch (error) {
          console.error('Error checking auth:', error);
        }
      }
      
      // Fallback to localStorage check
      if (!isLoggedIn) {
        const currentChampion = localStorage.getItem('current-champion') || localStorage.getItem('current-champion-id');
        isLoggedIn = !!currentChampion;
      }
      
      if (!isLoggedIn) {
        // User is not logged in, redirect to login page
        window.location.href = 'champion-login.html';
        return;
      }
      
      // Show logout confirmation modal
      if (modal) {
        modal.classList.remove('hidden');
      }
    });
  }

  // Handle confirm button click
  if (confirmBtn) {
    confirmBtn.addEventListener('click', async () => {
      if (modal) {
        modal.classList.add('hidden');
      }
      await performLogout();
    });
  }

  // Handle cancel button click
  const cancelBtn = document.getElementById('logout-cancel-btn');
  if (cancelBtn) {
    // Remove any existing listeners by cloning the button
    const newCancelBtn = cancelBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
    
    newCancelBtn.addEventListener('click', () => {
      if (modal) {
        modal.classList.add('hidden');
      }
      // Redirect to champion dashboard
      window.location.href = 'champion-dashboard.html';
    });
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initLogout);

