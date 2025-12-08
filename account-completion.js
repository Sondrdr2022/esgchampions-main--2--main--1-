// account-completion.js
document.addEventListener('DOMContentLoaded', async () => {
  const card = document.getElementById('account-completion-card');
  const percentEl = document.getElementById('completion-percent');
  const messageEl = document.getElementById('completion-message');
  const ctaBtn = document.getElementById('completion-cta');

  // DOM elemanları yoksa çık
  if (!card || !percentEl || !messageEl || !ctaBtn) return;
  if (typeof supabaseClient === 'undefined') {
    console.warn('supabaseClient not found for account completion card');
    return;
  }

  // 1) Kullanıcıyı al
  const { data, error } = await supabaseClient.auth.getUser();
  if (error || !data?.user) {
    console.warn('No user for account completion card', error);
    return;
  }

  const user = data.user;

  // Sadece LinkedIn ile gelenler için göster
  const identities = user.identities || [];
  const isLinkedIn =
    user.app_metadata?.provider === 'linkedin' ||
    identities.some((id) => id.provider === 'linkedin');

  if (!isLinkedIn) {
    // LinkedIn değilse hiç gösterme
    return;
  }

  // 2) Profil satırını çek (TABLO / KOLON İSİMLERİ SENİN ŞEMANA GÖRE)
  const { data: profile, error: profileError } = await supabaseClient
    .from('champions')          // << tablo adı: gerekirse değiştir
    .select('full_name, company_name, country, sector, job_title') // << kolon isimleri
    .eq('auth_id', user.id)     // << user id ile join nasıl yapıyorsan ona göre değiştir
    .single();

  if (profileError) {
    console.error('Error loading profile for completion card', profileError);
    return;
  }

  // 3) Zorunlu alan listesi
  const REQUIRED_FIELDS = [
    'full_name',
    'company_name',
    'country',
    'sector',
    'job_title'
  ];

  const filled = REQUIRED_FIELDS.filter(
    (field) => profile && profile[field] && String(profile[field]).trim() !== ''
  );

  const completion = Math.round(
    (filled.length / REQUIRED_FIELDS.length) * 100
  );

  // Tamamı doluysa kartı hiç gösterme
  if (completion >= 100) {
    return;
  }

  // 4) UI’yi güncelle
  percentEl.textContent = `${completion}%`;

  const remaining = REQUIRED_FIELDS.length - filled.length;
  if (remaining <= 1) {
    messageEl.textContent =
      'Add one more detail to finish setting up your account.';
  } else {
    messageEl.textContent = `Add ${remaining} more details to finish setting up your account.`;
  }

  // 5) CTA’ye tıklayınca nereye gidecek?
  // Burayı senin onboarding / profil sayfanın URL’ine göre değiştir.
  ctaBtn.addEventListener('click', () => {
    window.location.href = 'champion-profile.html'; // gerekirse değiştir
  });

  // Son olarak kartı göster
  card.classList.remove('hidden');
});
