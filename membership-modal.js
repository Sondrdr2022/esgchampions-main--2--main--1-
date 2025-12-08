// Membership modal functionality with login check

function initMembershipModal() {
  const membershipBtn = document.getElementById('membership-btn');
  const membershipModal = document.getElementById('membership-modal');
  const closeModal = document.getElementById('close-membership-modal');
  const businessBtn = document.getElementById('business-btn');
  const championBtn = document.getElementById('champion-btn');

  if (membershipBtn) {
    membershipBtn.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Check if user is logged in
      const currentChampion = localStorage.getItem('current-champion');
      
      if (currentChampion) {
        // User is logged in, redirect to dashboard
        window.location.href = 'champion-dashboard.html';
      } else {
        // User is not logged in, show modal to choose account type
        if (membershipModal) {
          membershipModal.classList.remove('hidden');
        }
      }
    });
  }

  if (closeModal) {
    closeModal.addEventListener('click', () => {
      if (membershipModal) {
        membershipModal.classList.add('hidden');
      }
    });
  }

  if (businessBtn) {
    businessBtn.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
  }

  if (championBtn) {
    championBtn.addEventListener('click', () => {
      window.location.href = 'champion-login.html';
    });
  }

  // Close modal when clicking outside
  if (membershipModal) {
    membershipModal.addEventListener('click', (e) => {
      if (e.target === membershipModal) {
        membershipModal.classList.add('hidden');
      }
    });
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initMembershipModal);

