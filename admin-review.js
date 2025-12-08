// Admin Review Page Functionality

document.addEventListener('DOMContentLoaded', async () => {
  // Check if user is admin
  try {
    const isAdmin = await AdminService.isAdmin();
    if (!isAdmin) {
      // Get current user info for debugging
      const champion = await SupabaseService.getCurrentChampion();
      const user = await SupabaseService.getCurrentUser();
      
      console.log('Current user:', user?.email);
      console.log('Champion profile:', champion);
      console.log('Is admin check result:', isAdmin);
      
      alert('Access denied. Admin privileges required.\n\nIf you just set yourself as admin, please:\n1. Log out\n2. Log back in\n3. Try accessing this page again.');
      window.location.href = 'index.html';
      return;
    }
  } catch (error) {
    console.error('Error checking admin status:', error);
    alert('Error checking admin status. Please check the console for details.');
    window.location.href = 'index.html';
    return;
  }

  let allReviews = [];
  let currentFilters = {
    status: 'pending', // Default to pending reviews queue
    panelCategory: 'all',
    search: ''
  };

  // Load and render reviews
  async function loadReviews() {
    try {
      const container = document.getElementById('reviews-container');
      container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⏳</div><p>Loading reviews...</p></div>';

      allReviews = await AdminService.getAllReviews(currentFilters);
      await renderReviews(allReviews);
      updateStats();
    } catch (error) {
      console.error('Load reviews error:', error);
      document.getElementById('reviews-container').innerHTML = 
        '<div class="empty-state"><div class="empty-state-icon">❌</div><p>Error loading reviews. Please try again.</p></div>';
    }
  }

  // Render reviews
  async function renderReviews(reviews) {
    const container = document.getElementById('reviews-container');

    if (reviews.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📭</div>
          <p>No reviews found matching your filters.</p>
        </div>
      `;
      return;
    }

    // Fetch votes and comments for each review's indicator
    const reviewsWithActivity = await Promise.all(reviews.map(async (review) => {
      if (!review.indicators || !review.indicators.id) return review;
      
      const [votesResult, commentsResult] = await Promise.all([
        supabaseClient
          .from('votes')
          .select('id, vote, created_at, champions:champion_id(first_name, last_name)')
          .eq('indicator_id', review.indicators.id),
        supabaseClient
          .from('comments')
          .select('id, comment, created_at, champions:champion_id(first_name, last_name)')
          .eq('indicator_id', review.indicators.id)
          .order('created_at', { ascending: false })
          .limit(5) // Show last 5 comments
      ]);

      return {
        ...review,
        votes: votesResult.data || [],
        indicatorComments: commentsResult.data || [] // Renamed to avoid conflict with review.comments
      };
    }));

    container.innerHTML = reviewsWithActivity.map(review => {
      const champion = review.champions;
      const indicator = review.indicators;
      const panel = review.panel;
      
      const championName = champion 
        ? `${champion.first_name} ${champion.last_name}`
        : 'Unknown Champion';
      
      const organization = champion?.organization || 'N/A';
      const indicatorTitle = indicator?.title || 'Unknown Indicator';
      const panelTitle = panel?.title || 'Unknown Panel';
      const panelCategory = panel?.category || 'unknown';
      const panelIcon = panel?.icon || '📋';

      const statusClass = `status-${review.status}`;
      const statusText = review.status.charAt(0).toUpperCase() + review.status.slice(1);

      const ratingStars = '★'.repeat(review.rating || 0) + '☆'.repeat(5 - (review.rating || 0));
      const necessaryText = review.necessary === 'yes' ? 'Yes' : 
                           review.necessary === 'no' ? 'No' : 
                           review.necessary === 'not-sure' ? 'Not Sure' : 'N/A';

      const submissionDate = new Date(review.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      return `
        <div class="review-card" data-review-id="${review.id}">
          <div class="review-header">
            <div>
              <h3 style="margin-bottom: 0.5rem;">${panelIcon} ${panelTitle}</h3>
              <p class="text-gray" style="font-size: 0.875rem;">${indicatorTitle}</p>
            </div>
            <span class="status-badge ${statusClass}">${statusText}</span>
          </div>

          <div class="review-meta">
            <div class="meta-item">
              <span class="meta-label">Champion</span>
              <span class="meta-value">${championName}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Organization</span>
              <span class="meta-value">${organization}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Panel Category</span>
              <span class="meta-value" style="text-transform: capitalize;">${panelCategory}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Submission Date</span>
              <span class="meta-value">${submissionDate}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Necessary?</span>
              <span class="meta-value">${necessaryText}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Rating</span>
              <span class="meta-value" style="color: #fbbf24;">${ratingStars}</span>
            </div>
          </div>

          ${review.comments && typeof review.comments === 'string' && review.comments.trim() ? `
            <div style="margin-top: 1rem; padding: 1rem; background-color: #f9fafb; border-radius: 0.375rem;">
              <span class="meta-label" style="margin-bottom: 0.5rem; display: block;">Review Comments</span>
              <p style="color: #374151; line-height: 1.6;">${review.comments}</p>
            </div>
          ` : ''}

          <!-- Votes and Comments Activity -->
          <div style="margin-top: 1rem; padding: 1rem; background-color: #f0f9ff; border-radius: 0.375rem; border: 1px solid #bae6fd;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div>
                <span class="meta-label" style="margin-bottom: 0.5rem; display: block; font-weight: 600;">Votes: ${review.votes?.length || 0}</span>
                ${review.votes && review.votes.length > 0 ? `
                  <div style="font-size: 0.875rem;">
                    ${review.votes.slice(0, 3).map(v => {
                      const voteIcon = v.vote === 'up' ? '👍' : v.vote === 'down' ? '👎' : '➖';
                      const voterName = v.champions ? `${v.champions.first_name} ${v.champions.last_name}` : 'Anonymous';
                      return `<div style="margin-bottom: 0.25rem;">${voteIcon} ${voterName}</div>`;
                    }).join('')}
                    ${review.votes.length > 3 ? `<div style="color: #6b7280; font-size: 0.75rem;">+${review.votes.length - 3} more</div>` : ''}
                  </div>
                ` : '<div style="color: #6b7280; font-size: 0.875rem;">No votes yet</div>'}
              </div>
              <div>
                <span class="meta-label" style="margin-bottom: 0.5rem; display: block; font-weight: 600;">Comments: ${review.indicatorComments?.length || 0}</span>
                ${review.indicatorComments && review.indicatorComments.length > 0 ? `
                  <div style="font-size: 0.875rem; max-height: 100px; overflow-y: auto;">
                    ${review.indicatorComments.map(c => {
                      const commenterName = c.champions ? `${c.champions.first_name} ${c.champions.last_name}` : 'Anonymous';
                      const commentText = typeof c.comment === 'string' ? c.comment : (c.comment?.text || JSON.stringify(c.comment));
                      return `<div style="margin-bottom: 0.5rem; padding-bottom: 0.5rem; border-bottom: 1px solid #e5e7eb;">
                        <div style="font-weight: 500; margin-bottom: 0.25rem;">${commenterName}</div>
                        <div style="color: #374151; font-size: 0.8125rem;">${commentText.substring(0, 100)}${commentText.length > 100 ? '...' : ''}</div>
                      </div>`;
                    }).join('')}
                  </div>
                ` : '<div style="color: #6b7280; font-size: 0.875rem;">No comments yet</div>'}
              </div>
            </div>
          </div>

          ${review.status === 'pending' ? `
            <div class="review-actions">
              <button class="btn-primary accept-review-btn" data-review-id="${review.id}" 
                      style="flex: 1; padding: 0.75rem;">
                ✓ Accept
              </button>
              <button class="btn-secondary delete-review-btn" data-review-id="${review.id}" 
                      style="flex: 1; padding: 0.75rem; background-color: #ef4444; color: white; border-color: #ef4444;">
                ✕ Delete
              </button>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    // Attach event listeners
    attachEventListeners();
  }

  // Update statistics
  async function updateStats() {
    const stats = await AdminService.getReviewStats();
    document.getElementById('stat-pending').textContent = stats.pending;
    document.getElementById('stat-accepted').textContent = stats.accepted;
    document.getElementById('stat-deleted').textContent = stats.deleted;
    document.getElementById('stat-total').textContent = stats.total;
  }

  // Attach event listeners
  function attachEventListeners() {
    // Accept buttons
    document.querySelectorAll('.accept-review-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const reviewId = e.target.dataset.reviewId;
        await handleAcceptReview(reviewId);
      });
    });

    // Delete buttons
    document.querySelectorAll('.delete-review-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const reviewId = e.target.dataset.reviewId;
        await handleDeleteReview(reviewId);
      });
    });
  }

  // Handle accept review
  async function handleAcceptReview(reviewId) {
    const review = allReviews.find(r => r.id === reviewId);
    if (!review) return;

    const indicator = review.indicators;
    const panel = review.panel;
    const champion = review.champions;

    const confirmModal = document.getElementById('confirm-modal');
    const confirmTitle = document.getElementById('confirm-title');
    const confirmMessage = document.getElementById('confirm-message');
    const confirmBtn = document.getElementById('confirm-btn');

    confirmTitle.textContent = 'Accept Review';
    confirmMessage.innerHTML = `
      Are you sure you want to accept this review?<br><br>
      <strong>Champion:</strong> ${champion ? `${champion.first_name} ${champion.last_name}` : 'Unknown'}<br>
      <strong>Panel:</strong> ${panel?.title || 'Unknown'}<br>
      <strong>Indicator:</strong> ${indicator?.title || 'Unknown'}<br><br>
      This review will be added to the ranking page.
    `;

    confirmModal.classList.remove('hidden');

    // Remove existing listeners
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

    newConfirmBtn.addEventListener('click', async () => {
      try {
        newConfirmBtn.disabled = true;
        newConfirmBtn.textContent = 'Processing...';

        await AdminService.acceptReview(reviewId);

        confirmModal.classList.add('hidden');
        
        // Show success modal
        showSuccessModal('Review accepted successfully! It has been added to the ranking page.');
        
        // Refresh page after delay
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } catch (error) {
        console.error('Accept review error:', error);
        alert('Error accepting review: ' + (error.message || 'Unknown error'));
        newConfirmBtn.disabled = false;
        newConfirmBtn.textContent = 'Confirm';
      }
    });
  }

  // Handle delete review
  async function handleDeleteReview(reviewId) {
    const review = allReviews.find(r => r.id === reviewId);
    if (!review) return;

    const indicator = review.indicators;
    const panel = review.panel;
    const champion = review.champions;

    const confirmModal = document.getElementById('confirm-modal');
    const confirmTitle = document.getElementById('confirm-title');
    const confirmMessage = document.getElementById('confirm-message');
    const confirmBtn = document.getElementById('confirm-btn');

    confirmTitle.textContent = 'Delete Review';
    confirmMessage.innerHTML = `
      Are you sure you want to delete this review?<br><br>
      <strong>Champion:</strong> ${champion ? `${champion.first_name} ${champion.last_name}` : 'Unknown'}<br>
      <strong>Panel:</strong> ${panel?.title || 'Unknown'}<br>
      <strong>Indicator:</strong> ${indicator?.title || 'Unknown'}<br><br>
      This action cannot be undone.
    `;

    confirmModal.classList.remove('hidden');

    // Remove existing listeners
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

    newConfirmBtn.addEventListener('click', async () => {
      try {
        newConfirmBtn.disabled = true;
        newConfirmBtn.textContent = 'Deleting...';

        await AdminService.deleteReview(reviewId);

        confirmModal.classList.add('hidden');
        
        // Show success modal
        showSuccessModal('Review deleted successfully.');
        
        // Refresh page after delay
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } catch (error) {
        console.error('Delete review error:', error);
        alert('Error deleting review: ' + (error.message || 'Unknown error'));
        newConfirmBtn.disabled = false;
        newConfirmBtn.textContent = 'Confirm';
      }
    });
  }

  // Filter handlers
  document.getElementById('status-filter').addEventListener('change', (e) => {
    currentFilters.status = e.target.value;
    loadReviews();
  });

  document.getElementById('panel-filter').addEventListener('change', (e) => {
    currentFilters.panelCategory = e.target.value;
    loadReviews();
  });

  document.getElementById('search-input').addEventListener('input', (e) => {
    currentFilters.search = e.target.value;
    loadReviews();
  });

  // Modal close handlers
  document.getElementById('close-confirm-modal').addEventListener('click', () => {
    document.getElementById('confirm-modal').classList.add('hidden');
  });

  document.getElementById('cancel-confirm-btn').addEventListener('click', () => {
    document.getElementById('confirm-modal').classList.add('hidden');
  });

  // Close modal on outside click
  document.getElementById('confirm-modal').addEventListener('click', (e) => {
    if (e.target.id === 'confirm-modal') {
      document.getElementById('confirm-modal').classList.add('hidden');
    }
  });

  // Show success modal function
  function showSuccessModal(message) {
    const successModal = document.getElementById('success-modal');
    const successMessage = document.getElementById('success-message');
    
    if (successMessage) {
      successMessage.textContent = message;
    }
    
    if (successModal) {
      successModal.classList.remove('hidden');
    }
  }

  // Initial load
  await loadReviews();
  await updateStats();
});

