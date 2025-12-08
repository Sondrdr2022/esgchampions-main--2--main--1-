// Ranking Page with Supabase Integration
// Displays community rankings with peer reviews, indicators, and credits

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Calculate date 7 days ago (for weekly leaderboard)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get all champions with their activity
    const [championsResult, reviewsResult, votesResult, commentsResult, invitationsResult] = await Promise.all([
      supabaseClient
        .from('champions')
        .select('id, first_name, last_name, email, organization'),
      supabaseClient
        .from('reviews')
        .select('id, champion_id, indicator_id, created_at, status')
        .gte('created_at', thirtyDaysAgo.toISOString()),
      supabaseClient
        .from('votes')
        .select('id, champion_id, indicator_id, created_at')
        .gte('created_at', thirtyDaysAgo.toISOString()),
      supabaseClient
        .from('comments')
        .select('id, champion_id, indicator_id, created_at')
        .gte('created_at', thirtyDaysAgo.toISOString()),
      supabaseClient
        .from('invitations')
        .select('id, from_champion_id, to_email, created_at')
        .gte('created_at', thirtyDaysAgo.toISOString())
    ]);

    const champions = championsResult.data || [];
    const reviews = reviewsResult.data || [];
    const votes = votesResult.data || [];
    const comments = commentsResult.data || [];
    const invitations = invitationsResult.data || [];

    // Get weekly data
    const weeklyReviews = reviews.filter(r => new Date(r.created_at) >= sevenDaysAgo);
    const weeklyVotes = votes.filter(v => new Date(v.created_at) >= sevenDaysAgo);
    const weeklyComments = comments.filter(c => new Date(c.created_at) >= sevenDaysAgo);
    const weeklyInvitations = invitations.filter(i => new Date(i.created_at) >= sevenDaysAgo);

    // Calculate stats for each champion
    const championStats = {};

    champions.forEach(champion => {
      const championId = champion.id;
      
      // Get unique indicators reviewed
      const reviewedIndicators = new Set(
        reviews
          .filter(r => r.champion_id === championId)
          .map(r => r.indicator_id)
      );

      // Count peer reviews (invitations sent by this champion that resulted in reviews)
      const sentInvitations = invitations.filter(i => i.from_champion_id === championId);
      const peerReviewCount = sentInvitations.length; // Simplified: count invitations as peer reviews

      // Calculate credits (22 credits per complete review)
      const acceptedReviews = reviews.filter(r => 
        r.champion_id === championId && r.status === 'accepted'
      ).length;
      const credits = acceptedReviews * 22;

      championStats[championId] = {
        champion,
        peerReviews: peerReviewCount,
        indicators: reviewedIndicators.size,
        credits,
        // For sorting
        totalActivity: reviewedIndicators.size + peerReviewCount
      };
    });

    // Convert to array and sort by credits (primary) and indicators (secondary)
    const championsRanked = Object.values(championStats)
      .sort((a, b) => {
        if (b.credits !== a.credits) return b.credits - a.credits;
        return b.indicators - a.indicators;
      })
      .map((stat, index) => ({
        rank: index + 1,
        name: `${stat.champion.first_name} ${stat.champion.last_name}`,
        peerReviews: stat.peerReviews,
        indicators: stat.indicators,
        credits: stat.credits,
        champion: stat.champion
      }));

    // Calculate weekly rankings
    const weeklyChampionStats = {};
    champions.forEach(champion => {
      const championId = champion.id;
      const weeklyReviewedIndicators = new Set(
        weeklyReviews
          .filter(r => r.champion_id === championId)
          .map(r => r.indicator_id)
      );
      const weeklySentInvitations = weeklyInvitations.filter(i => i.from_champion_id === championId);
      const weeklyAcceptedReviews = weeklyReviews.filter(r => 
        r.champion_id === championId && r.status === 'accepted'
      ).length;
      const weeklyCredits = weeklyAcceptedReviews * 22;

      weeklyChampionStats[championId] = {
        champion,
        peerReviews: weeklySentInvitations.length,
        indicators: weeklyReviewedIndicators.size,
        credits: weeklyCredits
      };
    });

    const weeklyRanked = Object.values(weeklyChampionStats)
      .sort((a, b) => {
        if (b.credits !== a.credits) return b.credits - a.credits;
        return b.indicators - a.indicators;
      })
      .map((stat, index) => ({
        rank: index + 1,
        name: `${stat.champion.first_name} ${stat.champion.last_name}`,
        peerReviews: stat.peerReviews,
        indicators: stat.indicators,
        credits: stat.credits
      }));

    // ============================================
    // RENDER TOP 3 CHAMPIONS
    // ============================================
    function renderTopChampions() {
      const container = document.getElementById('top-champions-container');
      if (!container) return;

      const top3 = championsRanked.slice(0, 3);
      
      if (top3.length === 0) {
        container.innerHTML = '<p class="text-gray">No champions yet. Be the first!</p>';
        return;
      }

      container.innerHTML = top3.map((champ, index) => {
        // Generate avatar initials
        const initials = champ.name
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);

        return `
          <div style="text-align: center;">
            <div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #0D4D6C 0%, #4A9FD8 100%); color: white; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 700; margin: 0 auto 1rem;">
              ${initials}
            </div>
            <h4 style="margin-bottom: 0.25rem; font-size: 1rem;">${champ.name}</h4>
            <p class="text-gray" style="font-size: 0.875rem;">${champ.credits} Credits</p>
          </div>
        `;
      }).join('');
    }

    // ============================================
    // RENDER LEADERBOARD TABLE
    // ============================================
    function renderLeaderboard(data, tbodyId) {
      const tbody = document.getElementById(tbodyId);
      if (!tbody) return;

      if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="padding: 2rem; text-align: center; color: #6b7280;">No data available</td></tr>';
        return;
      }

      tbody.innerHTML = data.map(champ => {
        return `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 1rem; font-weight: 600; color: #0D4D6C;">${champ.rank}</td>
            <td style="padding: 1rem;">${champ.name}</td>
            <td style="padding: 1rem;">${champ.peerReviews}</td>
            <td style="padding: 1rem;">${champ.indicators}</td>
            <td style="padding: 1rem; font-weight: 600; color: #0D4D6C;">${champ.credits.toLocaleString()}</td>
          </tr>
        `;
      }).join('');
    }

    // ============================================
    // TABLE SORTING
    // ============================================
    let currentSort = { column: 'rank', direction: 'asc' };
    const sortableHeaders = document.querySelectorAll('#leaderboard-table th[data-sort]');
    
    sortableHeaders.forEach(header => {
      header.addEventListener('click', () => {
        const column = header.dataset.sort;
        const direction = currentSort.column === column && currentSort.direction === 'asc' ? 'desc' : 'asc';
        currentSort = { column, direction };
        
        // Sort data
        const sorted = [...championsRanked].sort((a, b) => {
          let aVal, bVal;
          
          switch(column) {
            case 'rank':
              aVal = a.rank;
              bVal = b.rank;
              break;
            case 'name':
              aVal = a.name.toLowerCase();
              bVal = b.name.toLowerCase();
              break;
            case 'peer-reviews':
              aVal = a.peerReviews;
              bVal = b.peerReviews;
              break;
            case 'indicators':
              aVal = a.indicators;
              bVal = b.indicators;
              break;
            case 'credits':
              aVal = a.credits;
              bVal = b.credits;
              break;
            default:
              return 0;
          }
          
          if (direction === 'asc') {
            return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
          } else {
            return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
          }
        });
        
        renderLeaderboard(sorted, 'leaderboard-tbody');
        
        // Update header indicators
        sortableHeaders.forEach(h => {
          h.style.color = '';
          if (h === header) {
            h.style.color = '#0D4D6C';
            h.textContent = h.textContent.replace(' ↑', '').replace(' ↓', '');
            h.textContent += direction === 'asc' ? ' ↑' : ' ↓';
          }
        });
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
    // VIEW FULL LEADERBOARD BUTTON
    // ============================================
    const viewFullBtn = document.getElementById('view-full-leaderboard-btn');
    if (viewFullBtn) {
      viewFullBtn.addEventListener('click', () => {
        document.getElementById('leaderboard-table').scrollIntoView({ behavior: 'smooth' });
      });
    }

    // ============================================
    // CALCULATE TOTAL CREDITS
    // ============================================
    const totalCredits = championsRanked.reduce((sum, champ) => sum + champ.credits, 0);
    const totalCreditsEl = document.getElementById('total-credits-summary');
    if (totalCreditsEl) {
      totalCreditsEl.textContent = `${totalCredits.toLocaleString()} Credits`;
    }

    // Render all components
    renderTopChampions();
    renderLeaderboard(championsRanked, 'leaderboard-tbody');
    renderLeaderboard(weeklyRanked, 'weekly-leaderboard-tbody');

  } catch (error) {
    console.error('Error loading rankings:', error);
    const tbody = document.getElementById('leaderboard-tbody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="5" style="padding: 2rem; text-align: center; color: #ef4444;">Error loading rankings. Please refresh the page.</td></tr>';
    }
  }
});
