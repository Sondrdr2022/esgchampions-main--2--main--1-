// Account completion percentage on the dashboard "Complete Your Account" card
// Calculates how much of the Account Settings the user has filled and updates the UI.

document.addEventListener('DOMContentLoaded', async () => {
  const card = document.getElementById('account-completion-card');
  const percentEl = document.getElementById('completion-percent');
  const messageEl = document.getElementById('completion-message');
  const ctaEl = document.getElementById('completion-cta');
  const circleEl = document.querySelector('.completion-circle');

  // If the card isn't on this page, do nothing
  if (!card || !percentEl) return;

  // Ensure Supabase is available
  if (typeof supabaseClient === 'undefined' || !supabaseClient) {
    console.warn('Supabase client not found for account completion calculation.');
    return;
  }

  try {
    // Must be authenticated
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    if (error || !user) {
      // If not logged in, hide the card
      card.classList.add('hidden');
      return;
    }

    // Get champion profile
    const { data: champion, error: profileError } = await supabaseClient
      .from('champions')
      .select(`
        id,
        first_name,
        last_name,
        email,
        organization,
        role,
        mobile,
        office_phone,
        linkedin,
        website,
        competence,
        contributions,
        primary_sector,
        expertise_panels
      `)
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error loading champion for completion:', profileError);
      // Show the card with a default message to encourage completion
      percentEl.textContent = '0%';
      paintCircle(circleEl, 0);
      card.classList.remove('hidden');
      return;
    }

    // Fields tracked from Account Settings page (champion-profile.html)
    const fieldsToMeasure = [
      'first_name',
      'last_name',
      'organization',
      'role',
      'mobile',
      'office_phone',
      'linkedin',
      'website',
      'competence',
      'contributions',
      'primary_sector',
      'expertise_panels'
    ];

    // Helper: when is a field "filled"?
    const isFilled = (val) => {
      if (val === null || val === undefined) return false;
      if (typeof val === 'string') return val.trim().length > 0;
      return Boolean(val);
    };

    const totals = fieldsToMeasure.length;
    const filled = fieldsToMeasure.reduce((acc, key) => acc + (isFilled(champion?.[key]) ? 1 : 0), 0);

    // Compute percentage
    const percent = Math.round((filled / Math.max(1, totals)) * 100);

    // Update UI
    percentEl.textContent = `${percent}%`;
    paintCircle(circleEl, percent);

    // Message + CTA
    if (percent >= 100) {
      messageEl && (messageEl.textContent = 'Great job! Your profile is complete.');
      ctaEl && (ctaEl.textContent = 'View Account');
    } else {
      const remaining = totals - filled;
      messageEl && (messageEl.textContent = `Add information to finish setting up your account. ${remaining} field${remaining === 1 ? '' : 's'} remaining.`);
      ctaEl && (ctaEl.textContent = 'Continue');
    }

    // Show the card (it has "hidden" by default in HTML)
    card.classList.remove('hidden');

    // Navigate to Account Settings
    if (ctaEl) {
      ctaEl.onclick = () => {
        window.location.href = 'champion-profile.html';
      };
    }
  } catch (e) {
    console.error('Account completion error:', e);
    // Best effort: show card with 0%
    percentEl.textContent = '0%';
    paintCircle(circleEl, 0);
    card.classList.remove('hidden');
  }
});

/**
 * Paint a circular progress background if the .completion-circle element exists.
 * Uses a conic-gradient from your brand color to a light gray.
 */
function paintCircle(el, percent) {
  if (!el) return;
  const pct = Math.max(0, Math.min(100, Number(percent) || 0));
  el.style.background = `conic-gradient(#0D4D6C ${pct}%, #e5e7eb ${pct}% 100%)`;
}