// Champion Authentication System with Supabase
// This replaces champion-auth.js functionality with Supabase

// Handle OAuth callback on page load
document.addEventListener('DOMContentLoaded', async () => {
  // Check if this is an OAuth callback
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const error = urlParams.get('error');

  if (code || error) {
    // This is an OAuth callback
    try {
      const result = await SupabaseService.handleOAuthCallback();
      
      if (result && result.user) {
        console.log('LinkedIn login successful');
        
        // Dispatch login event for navigation system
        window.dispatchEvent(new CustomEvent('login', { detail: { champion: result.champion } }));
        
        // Redirect to dashboard
        window.location.href = 'champion-dashboard.html';
        return;
      }
    } catch (error) {
      console.error('OAuth callback error:', error);
      alert(error.message || 'LinkedIn login failed. Please try again.');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }

  // Password toggle functionality
  const passwordToggles = document.querySelectorAll('.password-toggle');
  passwordToggles.forEach(toggle => {
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      const input = toggle.previousElementSibling;
      if (input && input.type === 'password') {
        input.type = 'text';
        toggle.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';
      } else if (input) {
        input.type = 'password';
        toggle.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
      }
    });
  });

  // Login form
  const loginForm = document.getElementById('champion-login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;

      if (!email || !password) {
        alert('Please fill in all required fields');
        return;
      }

      try {
        // Show loading state
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Signing in...';

        console.log('Attempting login for:', email);

        // Sign in with Supabase
        const { data, error } = await SupabaseService.signIn(email, password);

        if (error) {
          console.error('Login error:', error);
          
          // Provide more specific error messages
          if (error.message.includes('Invalid login credentials')) {
            // Check if user exists in auth but not in champions table
            const { data: authUsers } = await supabaseClient.auth.admin.listUsers();
            const userExists = authUsers?.users?.some(u => u.email === email);
            
            if (userExists) {
              alert('Invalid login credentials. Your account exists but may not be fully set up. Please contact support or try registering again.');
            } else {
              alert('Invalid login credentials. Please check your email and password, or register a new account.');
            }
          } else {
            alert(error.message || 'Login failed. Please try again.');
          }
          
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
          return;
        }

        console.log('Auth successful, fetching champion profile...');

        // Get champion profile
        const champion = await SupabaseService.getCurrentChampion();
        
        if (!champion) {
          console.error('Champion profile not found for user:', email);
          alert('Your account exists but profile is incomplete. Please contact support.');
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
          return;
        }

        console.log('Champion profile found:', champion.email);

        // Store session info in localStorage for quick access (optional)
        localStorage.setItem('current-champion-id', champion.id);

        // Dispatch login event for navigation system
        window.dispatchEvent(new CustomEvent('login', { detail: { champion } }));

        // Redirect to dashboard
        window.location.href = 'champion-dashboard.html';
      } catch (error) {
        console.error('Login error:', error);
        
        // Better error handling
        let errorMessage = 'Invalid email or password';
        
        if (error.message) {
          if (error.message.includes('Invalid login credentials') || 
              error.message.includes('Email not confirmed')) {
            errorMessage = 'Invalid email or password. Please check your credentials.';
          } else if (error.message.includes('profile')) {
            errorMessage = 'Your account exists but profile is incomplete. Please contact support.';
          } else {
            errorMessage = error.message;
          }
        }
        
        alert(errorMessage);
        
        // Reset button
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }

  // LinkedIn Login Button
  const linkedinLoginBtn = document.getElementById('linkedin-login-btn');
  if (linkedinLoginBtn) {
    linkedinLoginBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      
      try {
        // Show loading state
        linkedinLoginBtn.disabled = true;
        const originalText = linkedinLoginBtn.innerHTML;
        linkedinLoginBtn.innerHTML = '<span>Opening LinkedIn...</span>';
        
        // Initiate LinkedIn OAuth popup
        await SupabaseService.signInWithLinkedIn();
        
        // If successful, redirect to dashboard
        window.location.href = 'champion-dashboard.html';
      } catch (error) {
        console.error('LinkedIn login error:', error);
        
        // Show user-friendly error message
        const errorMessage = error.message || 'Failed to initiate LinkedIn login. Please try again.';
        if (errorMessage.includes('blocked')) {
          alert('Popup was blocked. Please allow popups for this site and try again.');
        } else if (errorMessage.includes('cancelled')) {
          // User cancelled, don't show error
          console.log('LinkedIn authentication cancelled by user');
        } else {
          alert(errorMessage);
        }
        
        // Reset button
        linkedinLoginBtn.disabled = false;
        linkedinLoginBtn.innerHTML = originalText;
      }
    });
  }

  // Check if email already exists (redirect to login if registered)
  async function checkEmailExists(email) {
    try {
      // Check if email exists in champions table
      const { data, error } = await supabaseClient
        .from('champions')
        .select('email')
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned (email doesn't exist - this is OK)
        console.error('Error checking email:', error);
        return false; // Allow registration if check fails
      }

      // If data exists, email is already registered
      return !!data;
    } catch (error) {
      console.error('Error checking email:', error);
      return false; // Allow registration if check fails
    }
  }

  // Registration form (if on register page)
  const registerForm = document.getElementById('champion-register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = {
        firstName: document.getElementById('champion-firstName').value.trim(),
        lastName: document.getElementById('champion-lastName').value.trim(),
        organization: document.getElementById('champion-organization').value.trim(),
        role: document.getElementById('champion-role').value.trim(),
        email: document.getElementById('champion-email').value.trim(),
        mobile: document.getElementById('champion-mobile').value.trim(),
        officePhone: document.getElementById('champion-office-phone').value.trim(),
        linkedin: document.getElementById('champion-linkedin').value.trim(),
        website: document.getElementById('champion-website').value.trim(),
        competence: document.getElementById('champion-competence').value,
        contributions: document.getElementById('champion-contributions').value.trim(),
        primarySector: document.getElementById('champion-primary-sector').value,
        expertisePanels: document.getElementById('champion-expertise-panels').value,
        password: document.getElementById('champion-password').value,
        confirmPassword: document.getElementById('champion-confirmPassword').value,
        claAccepted: document.getElementById('champion-cla').checked,
        ndaAccepted: document.getElementById('champion-nda-check').checked,
        ndaSignature: document.getElementById('champion-nda-signature').value.trim(),
        termsAccepted: document.getElementById('champion-acceptedTerms').checked,
        ipPolicyAccepted: document.getElementById('champion-ip-policy').checked
      };

      // Validation
      if (!formData.firstName || !formData.lastName || !formData.organization || !formData.role || 
          !formData.email || !formData.mobile || !formData.primarySector || !formData.expertisePanels || 
          !formData.password || !formData.claAccepted || !formData.ndaAccepted || !formData.ndaSignature || !formData.termsAccepted) {
        alert('Please fill in all required fields');
        return;
      }

      if (formData.password.length < 8) {
        alert('Password must be at least 8 characters');
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        alert('Passwords do not match');
        return;
      }

      try {
        // Show loading state
        const submitBtn = registerForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Checking email...';

        // Check if email already exists
        const emailExists = await checkEmailExists(formData.email);
        if (emailExists) {
          alert('An account with this email already exists. Redirecting to login page...');
          // Pre-fill email in login page
          window.location.href = `champion-login.html?email=${encodeURIComponent(formData.email)}`;
          return;
        }

        submitBtn.textContent = 'Registering...';

        // Sign up with Supabase
        const { user, champion } = await SupabaseService.signUp(
          formData.email,
          formData.password,
          {
            firstName: formData.firstName,
            lastName: formData.lastName,
            organization: formData.organization,
            role: formData.role,
            mobile: formData.mobile,
            officePhone: formData.officePhone,
            linkedin: formData.linkedin,
            website: formData.website,
            competence: formData.competence,
            contributions: formData.contributions,
            primarySector: formData.primarySector,
            expertisePanels: formData.expertisePanels,
            claAccepted: formData.claAccepted,
            ndaAccepted: formData.ndaAccepted,
            ndaSignature: formData.ndaSignature,
            termsAccepted: formData.termsAccepted,
            ipPolicyAccepted: formData.ipPolicyAccepted
          }
        );

        // Store session info
        localStorage.setItem('current-champion-id', champion.id);

        // Dispatch login event for navigation system
        window.dispatchEvent(new CustomEvent('login', { detail: { champion } }));

        alert('Registration successful! Redirecting to dashboard...');
        window.location.href = 'champion-dashboard.html';
      } catch (error) {
        console.error('Registration error:', error);
        
        // Check if error is about existing user
        if (error.message && (
          error.message.includes('already registered') ||
          error.message.includes('User already registered') ||
          error.message.includes('already exists')
        )) {
          alert('An account with this email already exists. Redirecting to login page...');
          window.location.href = `champion-login.html?email=${encodeURIComponent(formData.email)}`;
          return;
        }
        
        alert(error.message || 'Registration failed. Please try again.');
        
        // Reset button
        const submitBtn = registerForm.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }
});

