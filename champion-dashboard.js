// Dashboard functionality with gamification and enhanced features

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Check authentication first
    if (!supabaseClient) {
      console.error('Supabase client not initialized');
      window.location.href = 'champion-login.html';
      return;
    }

    // Check if user is authenticated
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.log('User not authenticated, redirecting to login');
      window.location.href = 'champion-login.html';
      return;
    }

    console.log('Authenticated user:', user.id, user.email);

    // Get current champion (async)
    const currentChampion = await DB.getCurrentChampion();
    
    if (!currentChampion) {
      console.error('Champion profile not found for user:', user.id);
      await supabaseClient.auth.signOut();
      window.location.href = 'champion-login.html';
      return;
    }

    console.log('Current champion loaded:', currentChampion);

    // Load champion name
    const firstName = currentChampion.first_name || currentChampion.firstName || '';
    const lastName = currentChampion.last_name || currentChampion.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim() || 'Champion';
    const nameEl = document.getElementById('champion-name');
    if (nameEl) nameEl.textContent = fullName;

    // ============================================
    // CALCULATE STIF SCORE
    // ============================================
    async function calculateSTIFScore() {
      try {
        // Get all reviews (accepted ones count more)
        const [reviewsResult, votesResult, commentsResult] = await Promise.all([
          supabaseClient
            .from('reviews')
            .select('id, status')
            .eq('champion_id', currentChampion.id),
          supabaseClient
            .from('votes')
            .select('id')
            .eq('champion_id', currentChampion.id),
          supabaseClient
            .from('comments')
            .select('id')
            .eq('champion_id', currentChampion.id)
        ]);

        const reviews = reviewsResult.data || [];
        const votes = votesResult.data || [];
        const comments = commentsResult.data || [];

        // Calculate score: base score from activity
        // Accepted reviews: 10 points each
        // Pending reviews: 5 points each
        // Votes: 2 points each
        // Comments: 3 points each
        const acceptedReviews = reviews.filter(r => r.status === 'accepted').length;
        const pendingReviews = reviews.filter(r => r.status === 'pending').length;
        
        const score = (acceptedReviews * 10) + (pendingReviews * 5) + (votes.length * 2) + (comments.length * 3);
        const normalizedScore = Math.min(100, Math.round(score / 2)); // Normalize to 0-100

        // Calculate improvement (compare with previous week)
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        const [oldReviewsResult] = await Promise.all([
          supabaseClient
            .from('reviews')
            .select('id, status')
            .eq('champion_id', currentChampion.id)
            .lt('created_at', oneWeekAgo.toISOString())
        ]);

        const oldReviews = oldReviewsResult.data || [];
        const oldAccepted = oldReviews.filter(r => r.status === 'accepted').length;
        const oldScore = (oldAccepted * 10) + (oldReviews.length * 5);
        const oldNormalizedScore = Math.min(100, Math.round(oldScore / 2));
        
        const improvement = normalizedScore - oldNormalizedScore;

        return { score: normalizedScore, improvement };
      } catch (error) {
        console.error('Error calculating STIF score:', error);
        return { score: 0, improvement: 0 };
      }
    }

    const { score, improvement } = await calculateSTIFScore();
    const scoreEl = document.getElementById('stif-score');
    if (scoreEl) scoreEl.textContent = score;
    const improvementEl = document.getElementById('stif-score-improvement');
    if (improvementEl) {
      improvementEl.textContent = improvement >= 0 ? `+${improvement}` : `${improvement}`;
    }

    // ============================================
    // CONTINUE WHERE YOU LEFT OFF
    // ============================================
    async function loadLastActivity() {
      try {
        // Get last active panel and indicator from database
        const { data: championData, error } = await supabaseClient
          .from('champions')
          .select('last_active_panel_id, last_active_indicator_id, last_activity_at')
          .eq('id', currentChampion.id)
          .single();

        // Handle column not existing error gracefully
        if (error) {
          if (error.code === '42703') {
            // Column doesn't exist - user needs to run SQL script
            console.warn('Progress tracking columns not found. Run add-user-progress-tracking.sql in Supabase.');
            const continueBtn = document.getElementById('continue-where-left-off-btn');
            if (continueBtn) {
              continueBtn.onclick = () => {
                window.location.href = 'champion-panels.html';
              };
            }
            return;
          }
          if (error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
        }

        const lastPanelId = championData?.last_active_panel_id;
        const lastIndicatorId = championData?.last_active_indicator_id;
        const lastActivityAt = championData?.last_activity_at;

        const continueBtn = document.getElementById('continue-where-left-off-btn');
        const continueBtnText = document.getElementById('continue-btn-text');
        
        if (continueBtn && lastPanelId) {
          // Load panel and indicator info
          const [panel, indicator] = await Promise.all([
            lastPanelId ? DB.getPanel(lastPanelId) : null,
            lastIndicatorId ? DB.getIndicator(lastIndicatorId) : null
          ]);

          if (panel) {
            // Update button text
            if (continueBtnText) {
              const panelName = panel.title || 'Panel';
              const indicatorName = indicator ? ` - ${indicator.title}` : '';
              continueBtnText.textContent = `Continue: ${panelName}${indicatorName}`;
            }

            // Update button click handler
            continueBtn.onclick = () => {
              if (lastIndicatorId) {
                // Go directly to the specific indicator
                window.location.href = `champion-indicators.html?panel=${lastPanelId}&indicator=${lastIndicatorId}`;
              } else {
                // Go to panel indicators page
                window.location.href = `champion-indicators.html?panel=${lastPanelId}`;
              }
            };
          } else {
            // No last activity, default behavior
            if (continueBtnText) {
              continueBtnText.textContent = 'Continue where you left off';
            }
            continueBtn.onclick = () => {
              window.location.href = 'champion-panels.html';
            };
          }
        } else if (continueBtn) {
          // No last activity, default behavior
          continueBtn.onclick = () => {
            window.location.href = 'champion-panels.html';
          };
        }
      } catch (error) {
        console.error('Error loading last activity:', error);
        const continueBtn = document.getElementById('continue-where-left-off-btn');
        if (continueBtn) {
          continueBtn.onclick = () => {
            window.location.href = 'champion-panels.html';
          };
        }
      }
    }

    await loadLastActivity();

    // ============================================
    // CALCULATE MISSION PROGRESS
    // ============================================
    async function calculateMissionProgress() {
      try {
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
        weekStart.setHours(0, 0, 0, 0);

        const [reviewsResult] = await Promise.all([
          supabaseClient
            .from('reviews')
            .select('indicator_id, created_at, indicators:indicator_id(panel_id)')
            .eq('champion_id', currentChampion.id)
            .gte('created_at', weekStart.toISOString())
        ]);

        // Get unique panels
        const panelIds = new Set();
        if (reviewsResult.data) {
          reviewsResult.data.forEach(r => {
            if (r.indicators && r.indicators.panel_id) {
              panelIds.add(r.indicators.panel_id);
            }
          });
        }

        const panelsCompleted = panelIds.size;
        const indicatorsValidated = reviewsResult.data?.length || 0;

        // Mission 1: Complete 3 panels
        const mission1Progress = Math.min(100, (panelsCompleted / 3) * 100);
        const mission1Text = `Panels completed: ${panelsCompleted}/3`;

        // Mission 2: Validate 10 indicators
        const mission2Progress = Math.min(100, (indicatorsValidated / 10) * 100);
        const mission2Text = `Indicators validated: ${indicatorsValidated}/10`;
        const mission2Points = indicatorsValidated * 15; // 15 points per indicator

        return {
          mission1: { progress: mission1Progress, text: mission1Text },
          mission2: { progress: mission2Progress, text: mission2Text, points: mission2Points }
        };
      } catch (error) {
        console.error('Error calculating mission progress:', error);
        return {
          mission1: { progress: 0, text: 'Panels completed: 0/3' },
          mission2: { progress: 0, text: 'Indicators validated: 0/10', points: 0 }
        };
      }
    }

    const missionProgress = await calculateMissionProgress();
    const progress1El = document.getElementById('mission-progress-1');
    if (progress1El) progress1El.style.width = `${missionProgress.mission1.progress}%`;
    const text1El = document.getElementById('mission-progress-text-1');
    if (text1El) text1El.textContent = missionProgress.mission1.text;
    const progress2El = document.getElementById('mission-progress-2');
    if (progress2El) progress2El.style.width = `${missionProgress.mission2.progress}%`;
    const text2El = document.getElementById('mission-progress-text-2');
    if (text2El) text2El.textContent = missionProgress.mission2.text;

    // ============================================
    // LOAD RECOMMENDED PANELS
    // ============================================
    async function loadRecommendedPanels() {
      try {
        const panels = await DB.getPanels();
        if (!Array.isArray(panels) || panels.length === 0) return;

        // Get panels with most indicators (recommended)
        const panelsWithCounts = await Promise.all(panels.map(async (panel) => {
          const indicators = await DB.getIndicators(panel.id);
          return { ...panel, indicatorCount: indicators?.length || 0 };
        }));

        // Sort by indicator count and take top 3
        const recommended = panelsWithCounts
          .sort((a, b) => b.indicatorCount - a.indicatorCount)
          .slice(0, 3);

        const container = document.getElementById('recommended-panels');
        if (!container) return;

        container.innerHTML = recommended.map(panel => {
          const status = 'Not Started';
          const impact = panel.category === 'environmental' ? 'High' : panel.category === 'social' ? 'Medium' : 'Low';
          const impactClass = impact.toLowerCase() === 'high' ? 'impact-high' : impact.toLowerCase() === 'medium' ? 'impact-medium' : 'impact-low';
          const statusClass = status.toLowerCase().replace(' ', '-');
          const estimatedTime = '10-13 min';
          const points = panel.indicatorCount * 10;

          return `
            <div class="panel-card-dashboard" data-panel-id="${panel.id}">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                <div>
                  <h3 style="margin-bottom: 0.5rem; font-size: 1.125rem;">${panel.icon || '📋'} ${panel.title}</h3>
                  <span class="impact-badge ${impactClass}">Impact: ${impact}</span>
                </div>
              </div>
              <div style="margin-bottom: 1rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                  <span style="font-size: 0.875rem; color: #6b7280;">Estimated time</span>
                  <span style="font-size: 0.875rem; color: #6b7280;">${estimatedTime}</span>
                </div>
                <div class="mission-progress" style="height: 6px;">
                  <div class="mission-progress-fill" style="width: 0%;"></div>
                </div>
                <div style="display: flex; justify-content: space-between; margin-top: 0.5rem;">
                  <span class="status-badge status-${statusClass}">${status}</span>
                  <span style="font-size: 0.875rem; color: #0D4D6C; font-weight: 600;">+${points} points</span>
                </div>
              </div>
              <button class="btn-primary panel-select-btn" style="width: 100%; padding: 0.5rem; font-size: 0.875rem;" data-panel-id="${panel.id}">
                ${status === 'Not Started' ? 'Select Indicators' : 'View details >'}
              </button>
            </div>
          `;
        }).join('');
      } catch (error) {
        console.error('Error loading recommended panels:', error);
      }
    }

    // ============================================
    // LOAD ALL PANELS
    // ============================================
    async function loadAllPanels() {
      try {
        const panels = await DB.getPanels();
        if (!Array.isArray(panels) || panels.length === 0) return;

        const container = document.getElementById('all-panels-grid');
        if (!container) return;

        // Get panel progress for each panel
        const panelsWithProgress = await Promise.all(panels.map(async (panel) => {
          const indicators = await DB.getIndicators(panel.id);
          const indicatorIds = indicators?.map(i => i.id) || [];
          
          if (indicatorIds.length === 0) {
            return { ...panel, progress: 0, status: 'Not Started', reviewedCount: 0 };
          }

          const reviewsResult = await supabaseClient
            .from('reviews')
            .select('indicator_id')
            .eq('champion_id', currentChampion.id)
            .in('indicator_id', indicatorIds);

          const reviewedCount = reviewsResult.data?.length || 0;
          const progress = (reviewedCount / indicatorIds.length) * 100;
          let status = 'Not Started';
          if (progress === 100) status = 'Completed';
          else if (progress > 0) status = 'In Progress';

          return { ...panel, progress, status, reviewedCount, totalIndicators: indicatorIds.length };
        }));

        container.innerHTML = panelsWithProgress.map(panel => {
          const impact = panel.category === 'environmental' ? 'High' : panel.category === 'social' ? 'Medium' : 'Low';
          const impactClass = impact.toLowerCase() === 'high' ? 'impact-high' : impact.toLowerCase() === 'medium' ? 'impact-medium' : 'impact-low';
          const statusClass = panel.status.toLowerCase().replace(' ', '-');
          const estimatedTime = '10-15 min';
          const points = panel.reviewedCount * 10;

          return `
            <div class="panel-card-dashboard" data-panel-id="${panel.id}">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                <div>
                  <h3 style="margin-bottom: 0.5rem; font-size: 1.125rem;">${panel.icon || '📋'} ${panel.title}</h3>
                  <span class="impact-badge ${impactClass}">Impact ${impact}</span>
                </div>
              </div>
              <div style="margin-bottom: 1rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                  <span style="font-size: 0.875rem; color: #6b7280;">Estimated time</span>
                  <span style="font-size: 0.875rem; color: #6b7280;">${estimatedTime}</span>
                </div>
                <div class="mission-progress" style="height: 6px;">
                  <div class="mission-progress-fill" style="width: ${panel.progress}%;"></div>
                </div>
                <div style="display: flex; justify-content: space-between; margin-top: 0.5rem;">
                  <span class="status-badge status-${statusClass}">${panel.status}</span>
                  ${points > 0 ? `<span style="font-size: 0.875rem; color: #0D4D6C; font-weight: 600;">+${points} pts</span>` : ''}
                </div>
              </div>
              <button class="btn-primary panel-select-btn" style="width: 100%; padding: 0.5rem; font-size: 0.875rem;" data-panel-id="${panel.id}">
                ${panel.status === 'Completed' ? 'View details' : 'Select Indicators'}
              </button>
            </div>
          `;
        }).join('');
      } catch (error) {
        console.error('Error loading all panels:', error);
      }
    }

    // ============================================
    // LOAD ACTIVITY
    // ============================================
    async function loadActivity() {
      try {
        const [recentVotesResult, recentCommentsResult] = await Promise.all([
          supabaseClient
            .from('votes')
            .select('*, indicators:indicator_id(id, title, panel_id)')
            .eq('champion_id', currentChampion.id)
            .order('created_at', { ascending: false })
            .limit(10),
          supabaseClient
            .from('comments')
            .select('*, indicators:indicator_id(id, title, panel_id)')
            .eq('champion_id', currentChampion.id)
            .order('created_at', { ascending: false })
            .limit(10)
        ]);

        const recentVotes = recentVotesResult.data || [];
        const recentComments = recentCommentsResult.data || [];

        const allActivity = [
          ...recentVotes.map(v => ({ ...v, type: 'vote', created_at: v.created_at })),
          ...recentComments.map(c => ({ ...c, type: 'comment', created_at: c.created_at }))
        ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10);

        const container = document.getElementById('recent-activity-list');
        if (!container) return;

        if (allActivity.length === 0) {
          container.innerHTML = '<p class="text-gray" style="text-align: center; padding: 2rem;">No recent activity</p>';
          return;
        }

        container.innerHTML = await Promise.all(allActivity.map(async (activity) => {
          const indicator = activity.indicators || (activity.indicator_id ? await DB.getIndicator(activity.indicator_id) : null);
          const panel = indicator && indicator.panel_id ? await DB.getPanel(indicator.panel_id) : null;
          const isVote = activity.type === 'vote';
          
          return `
            <div style="padding: 1rem; border-bottom: 1px solid #f3f4f6;">
              <div class="flex justify-between items-start">
                <div>
                  <p class="text-gray-dark" style="font-size: 0.875rem;">
                    ${isVote ? 'Voted on' : 'Commented on'} 
                    <strong>${indicator ? indicator.title : 'Unknown Indicator'}</strong>
                    ${panel ? `in ${panel.title || panel.id}` : ''}
                  </p>
                  ${!isVote && activity.comment ? `<p class="text-gray" style="font-size: 0.875rem; margin-top: 0.25rem;">${activity.comment.substring(0, 100)}${activity.comment.length > 100 ? '...' : ''}</p>` : ''}
                </div>
                <span class="text-gray" style="font-size: 0.75rem;">
                  ${new Date(activity.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          `;
        })).then(html => html.join(''));
      } catch (error) {
        console.error('Error loading activity:', error);
      }
    }

    // ============================================
    // CALCULATE CREDITS
    // ============================================
    async function calculateCredits() {
      try {
        const reviewsResult = await supabaseClient
          .from('reviews')
          .select('*')
          .eq('champion_id', currentChampion.id);

        const reviews = reviewsResult.data || [];
        const totalCredits = reviews.length * 22; // 22 credits per complete review

        const creditsEl = document.getElementById('total-credits-display');
        if (creditsEl) creditsEl.textContent = totalCredits;
        const modalCreditsEl = document.getElementById('modal-total-credits');
        if (modalCreditsEl) modalCreditsEl.textContent = totalCredits;
      } catch (error) {
        console.error('Error calculating credits:', error);
      }
    }

    // ============================================
    // TAB SWITCHING
    // ============================================
    const activityRewardsTabs = document.querySelectorAll('.activity-rewards-tab');
    activityRewardsTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetTab = tab.dataset.tab;
        
        activityRewardsTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        document.querySelectorAll('.tab-content-panel').forEach(content => {
          content.classList.remove('active');
          if (content.id === `${targetTab}-tab`) {
            content.classList.add('active');
          }
        });

        if (targetTab === 'activity') {
          loadActivity();
        }
      });
    });

    // ============================================
    // SCORING MODAL
    // ============================================
    const scoringBtn = document.getElementById('scoring-calculated-btn');
    const scoringModal = document.getElementById('scoring-modal');
    const closeScoringModal = document.getElementById('close-scoring-modal');

    if (scoringBtn && scoringModal) {
      scoringBtn.addEventListener('click', () => {
        scoringModal.classList.remove('hidden');
      });
    }

    if (closeScoringModal) {
      closeScoringModal.addEventListener('click', () => {
        scoringModal.classList.add('hidden');
      });
    }

    if (scoringModal) {
      scoringModal.addEventListener('click', (e) => {
        if (e.target === scoringModal) {
          scoringModal.classList.add('hidden');
        }
      });
    }

    // ============================================
    // INDICATOR SELECTION MODAL
    // ============================================
    let currentPanelId = null;

    async function showIndicatorSelectionModal(panelId) {
      try {
        console.log('Loading indicators for panel:', panelId);
        const [panel, indicators] = await Promise.all([
          DB.getPanel(panelId),
          DB.getIndicators(panelId)
        ]);
        
        if (!panel) {
          console.error('Panel not found:', panelId);
          alert('Panel not found. Please refresh the page.');
          return;
        }
        
        const modalTitle = document.getElementById('selection-modal-title');
        if (modalTitle) {
          modalTitle.textContent = `Select Indicators - ${panel.title}`;
        }
        
        const indicatorsList = document.getElementById('indicators-selection-list');
        if (!indicatorsList) {
          console.error('Indicators selection list element not found');
          return;
        }
        
        if (!Array.isArray(indicators) || indicators.length === 0) {
          indicatorsList.innerHTML = '<p class="text-gray">No indicators found for this panel.</p>';
        } else {
          indicatorsList.innerHTML = indicators.map((indicator) => {
            const importance = indicator.importance || 'High';
            const difficulty = indicator.difficulty || 'Moderate';
            const estimatedTime = indicator.estimated_time || '3-5 min';
            const frameworks = indicator.frameworks || 'GRI 305-1';
            const impactStars = indicator.impact_stars || 5;
            const stars = '★'.repeat(impactStars) + '☆'.repeat(5 - impactStars);
            const importanceClass = importance.toLowerCase() === 'high' ? 'tag-high' : importance.toLowerCase() === 'medium' ? 'tag-medium' : 'tag-low';
            const difficultyClass = difficulty.toLowerCase() === 'easy' ? 'tag-easy' : difficulty.toLowerCase() === 'moderate' ? 'tag-moderate' : difficulty.toLowerCase() === 'difficult' ? 'tag-difficult' : 'tag-complex';
            
            return `
              <div style="padding: 1rem; border-bottom: 1px solid #f3f4f6; display: flex; align-items: flex-start; gap: 0.75rem;">
                <input type="checkbox" id="indicator-${indicator.id}" value="${indicator.id}" 
                       class="indicator-checkbox" style="margin-top: 0.25rem; width: 1.25rem; height: 1.25rem; cursor: pointer;">
                <label for="indicator-${indicator.id}" style="flex: 1; cursor: pointer;">
                  <div style="font-weight: 500; margin-bottom: 0.5rem; font-size: 1rem;">${indicator.title}</div>
                  <div class="text-gray" style="font-size: 0.875rem; margin-bottom: 0.75rem;">${indicator.description || ''}</div>
                  <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.5rem;">
                    <span class="indicator-tag ${importanceClass}">${importance} Importance</span>
                    <span class="indicator-tag ${difficultyClass}">${difficulty}</span>
                    <span class="indicator-tag tag-time">${estimatedTime}</span>
                    <span class="indicator-tag tag-framework">${frameworks}</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 0.5rem; color: #fbbf24; font-size: 0.875rem;">
                    <span>Impact:</span>
                    <span style="font-size: 1rem;">${stars}</span>
                  </div>
                </label>
              </div>
            `;
          }).join('');
        }

        const modal = document.getElementById('indicator-selection-modal');
        if (modal) {
          modal.classList.remove('hidden');
          currentPanelId = panelId;
        }
      } catch (error) {
        console.error('Error showing indicator selection modal:', error);
        alert('Error loading indicators. Please try again.');
      }
    }

    // Modal controls
    const closeSelectionModal = document.getElementById('close-selection-modal');
    const cancelSelectionBtn = document.getElementById('cancel-selection-btn');
    const selectAllBtn = document.getElementById('select-all-indicators');
    const deselectAllBtn = document.getElementById('deselect-all-indicators');
    const proceedReviewBtn = document.getElementById('proceed-review-btn');
    const selectionModal = document.getElementById('indicator-selection-modal');

    if (closeSelectionModal) {
      closeSelectionModal.addEventListener('click', () => {
        if (selectionModal) selectionModal.classList.add('hidden');
        currentPanelId = null;
      });
    }

    if (cancelSelectionBtn) {
      cancelSelectionBtn.addEventListener('click', () => {
        if (selectionModal) selectionModal.classList.add('hidden');
        currentPanelId = null;
      });
    }

    if (selectAllBtn) {
      selectAllBtn.addEventListener('click', () => {
        document.querySelectorAll('.indicator-checkbox').forEach(cb => {
          cb.checked = true;
        });
      });
    }

    if (deselectAllBtn) {
      deselectAllBtn.addEventListener('click', () => {
        document.querySelectorAll('.indicator-checkbox').forEach(cb => {
          cb.checked = false;
        });
      });
    }

    if (proceedReviewBtn) {
      proceedReviewBtn.addEventListener('click', async () => {
        const selectedIndicators = Array.from(document.querySelectorAll('.indicator-checkbox:checked'))
          .map(cb => cb.value);
        
        if (selectedIndicators.length === 0) {
          alert('Please select at least one indicator to review');
          return;
        }

        // Save last activity
        if (currentPanelId && selectedIndicators.length > 0) {
          try {
            await supabaseClient
              .from('champions')
              .update({
                last_active_panel_id: currentPanelId,
                last_active_indicator_id: selectedIndicators[0],
                last_activity_at: new Date().toISOString()
              })
              .eq('id', currentChampion.id);
          } catch (error) {
            console.error('Error saving last activity:', error);
          }
        }

        // Store selected indicators and navigate to review page
        localStorage.setItem('selected-indicators', JSON.stringify(selectedIndicators));
        if (selectionModal) selectionModal.classList.add('hidden');
        window.location.href = `champion-indicators.html?panel=${currentPanelId}`;
      });
    }

    // Attach click handlers to panel buttons
    function attachPanelClickHandlers() {
      document.querySelectorAll('.panel-select-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const panelId = btn.dataset.panelId;
          if (panelId) {
            await showIndicatorSelectionModal(panelId);
          }
        });
      });
    }

    // Also make panel cards clickable
    function attachPanelCardClickHandlers() {
      document.querySelectorAll('.panel-card-dashboard').forEach(card => {
        card.addEventListener('click', async (e) => {
          // Don't trigger if clicking on button
          if (e.target.closest('.panel-select-btn')) return;
          
          const panelId = card.dataset.panelId || card.querySelector('.panel-select-btn')?.dataset.panelId;
          if (panelId) {
            await showIndicatorSelectionModal(panelId);
          }
        });
      });
    }

    // Load all data
    await loadRecommendedPanels();
    await loadAllPanels();
    await loadActivity();
    await calculateCredits();
    
    // Attach handlers after panels are loaded
    setTimeout(() => {
      attachPanelClickHandlers();
      attachPanelCardClickHandlers();
    }, 500);

    // Re-attach handlers when panels are re-rendered
    const observer = new MutationObserver(() => {
      attachPanelClickHandlers();
      attachPanelCardClickHandlers();
    });
    
    const panelsContainer = document.getElementById('all-panels-grid');
    const recommendedContainer = document.getElementById('recommended-panels');
    if (panelsContainer) {
      observer.observe(panelsContainer, { childList: true, subtree: true });
    }
    if (recommendedContainer) {
      observer.observe(recommendedContainer, { childList: true, subtree: true });
    }

  } catch (error) {
    console.error('Error loading dashboard:', error);
    const nameEl = document.getElementById('champion-name');
    if (nameEl) nameEl.textContent = 'Error loading profile';
  }
});
