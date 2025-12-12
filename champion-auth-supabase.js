// Champion Authentication System with Supabase
// This replaces champion-auth.js functionality with Supabase

// Handle email confirmation callback
async function handleEmailConfirmation() {
  const urlParams = new URLSearchParams(window.location.search);
  const verified = urlParams.get('verified');
  const email = urlParams.get('email');
  
  if (verified === 'true') {
    try {
      // Show success message
      const messageContainer = document.getElementById('email-confirmation-message');
      if (messageContainer) {
        messageContainer.innerHTML = `
          <div class="alert alert-success">
            <h4>Email Confirmed Successfully!</h4>
            <p>Your email ${email ? `(${email})` : ''} has been verified. You can now log in to your account.</p>
          </div>
        `;
        messageContainer.style.display = 'block';
      }
      
      // Clean URL
      const cleanUrl = window.location.pathname + (email ? `?email=${encodeURIComponent(email)}` : '');
      window.history.replaceState({}, document.title, cleanUrl);
      
      console.log('Email confirmed for:', email);
    } catch (error) {
      console.error('Email confirmation handling error:', error);
    }
  }
}

// Handle OAuth callback on page load
async function handleOAuthCallback() {
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
}

// Check if email already exists (for registration)
async function checkEmailExists(email) {
  try {
    // First check if email exists in auth system
    const { data: { users }, error: authError } = await supabaseClient.auth.admin.listUsers();
    
    if (!authError && users) {
      const userExists = users.some(u => u.email === email);
      if (userExists) {
        // Check if email is confirmed
        const user = users.find(u => u.email === email);
        if (user?.email_confirmed_at) {
          return { exists: true, confirmed: true, user: user };
        } else {
          return { exists: true, confirmed: false, user: user };
        }
      }
    }
    
    return { exists: false, confirmed: false, user: null };
  } catch (error) {
    console.error('Error checking email:', error);
    return { exists: false, confirmed: false, user: null };
  }
}

// Initialize authentication system
document.addEventListener('DOMContentLoaded', async () => {
  // Handle email confirmation first
  await handleEmailConfirmation();
  
  // Handle OAuth callback
  await handleOAuthCallback();

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

  // Resend confirmation email functionality
  const resendConfirmationBtn = document.getElementById('resend-confirmation-btn');
  if (resendConfirmationBtn) {
    resendConfirmationBtn.addEventListener('click', async () => {
      const emailInput = document.getElementById('login-email');
      const email = emailInput ? emailInput.value.trim() : '';
      
      if (!email) {
        alert('Please enter your email address first');
        return;
      }
      
      try {
        resendConfirmationBtn.disabled = true;
        const originalText = resendConfirmationBtn.textContent;
        resendConfirmationBtn.textContent = 'Sending...';
        
        await SupabaseService.resendConfirmationEmail(email);
        
        alert('Confirmation email sent! Please check your inbox and spam folder.');
        resendConfirmationBtn.disabled = false;
        resendConfirmationBtn.textContent = originalText;
      } catch (error) {
        console.error('Resend confirmation error:', error);
        alert(error.message || 'Failed to resend confirmation email. Please try again.');
        resendConfirmationBtn.disabled = false;
        resendConfirmationBtn.textContent = originalText;
      }
    });
  }

  // Login form
  const loginForm = document.getElementById('champion-login-form');
  if (loginForm) {
    // Pre-fill email if provided in URL
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email');
    if (emailParam) {
      const emailInput = document.getElementById('login-email');
      if (emailInput) {
        emailInput.value = decodeURIComponent(emailParam);
      }
    }

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

        // First check if email is confirmed
        const emailCheck = await checkEmailExists(email);
        if (emailCheck.exists && !emailCheck.confirmed) {
          // Email exists but not confirmed
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
          
          const resend = confirm('Your email has not been confirmed yet. Would you like us to resend the confirmation email?');
          if (resend) {
            try {
              await SupabaseService.resendConfirmationEmail(email);
              alert('Confirmation email resent! Please check your inbox and confirm your email before logging in.');
            } catch (resendError) {
              alert('Failed to resend confirmation email. Please try again or contact support.');
            }
          }
          return;
        }

        // Sign in with Supabase
        const { data, error } = await SupabaseService.signIn(email, password);

        if (error) {
          console.error('Login error:', error);
          
          // Provide more specific error messages
          if (error.message.includes('Invalid login credentials')) {
            alert('Invalid email or password. Please check your credentials.');
          } else if (error.message.includes('Email not confirmed')) {
            const resend = confirm('Your email has not been confirmed yet. Would you like us to resend the confirmation email?');
            if (resend) {
              try {
                await SupabaseService.resendConfirmationEmail(email);
                alert('Confirmation email resent! Please check your inbox and confirm your email before logging in.');
              } catch (resendError) {
                alert('Failed to resend confirmation email. Please try again or contact support.');
              }
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
          
          // Check if we need to complete profile setup
          const user = await SupabaseService.getCurrentUser();
          if (user) {
            // Get stored champion data from user metadata
            const championData = user.user_metadata?.champion_data;
            
            if (championData) {
              try {
                // Complete profile setup
                const parsedData = JSON.parse(championData);
                const completedChampion = await SupabaseService.completeProfileSetup(
                  user.id,
                  email,
                  parsedData
                );
                
                if (completedChampion) {
                  champion = completedChampion;
                }
              } catch (profileError) {
                console.error('Profile completion error:', profileError);
                // Continue with basic profile
              }
            }
          }
          
          if (!champion) {
            alert('Your account exists but profile is incomplete. Please contact support.');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            return;
          }
        }

        console.log('Champion profile found:', champion.email);

        // Store session info in localStorage for quick access
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
        
        // Use OAuth with redirect
        const redirectUrl = `${window.location.origin}/linkedin-callback.html`;
        await supabaseClient.auth.signInWithOAuth({
          provider: 'linkedin_oidc',
          options: {
            redirectTo: redirectUrl,
            scopes: 'openid profile email'
          }
        });

        // If successful, Supabase will redirect to linkedin-callback.html
      } catch (error) {
        console.error('LinkedIn login error:', error);
        
        const errorMessage = error.message || 'Failed to initiate LinkedIn login. Please try again.';
        if (errorMessage.includes('blocked')) {
          alert('Popup was blocked. Please allow popups for this site and try again.');
        } else if (errorMessage.includes('cancelled')) {
          console.log('LinkedIn authentication cancelled by user');
        } else {
          alert(errorMessage);
        }
        
        linkedinLoginBtn.disabled = false;
        linkedinLoginBtn.innerHTML = originalText;
      }
    });
  }

  // Registration form (if on register page)
  const registerForm = document.getElementById('champion-register-form');
  if (registerForm) {
    // Pre-fill email if provided in URL
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email');
    if (emailParam) {
      const emailInput = document.getElementById('champion-email');
      if (emailInput) {
        emailInput.value = decodeURIComponent(emailParam);
        emailInput.readOnly = true;
      }
    }

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
        const emailCheck = await checkEmailExists(formData.email);
        if (emailCheck.exists) {
          if (emailCheck.confirmed) {
            alert('An account with this email already exists. Redirecting to login page...');
            window.location.href = `champion-login.html?email=${encodeURIComponent(formData.email)}`;
          } else {
            const resend = confirm('An account with this email already exists but is not confirmed. Would you like us to resend the confirmation email?');
            if (resend) {
              try {
                await SupabaseService.resendConfirmationEmail(formData.email);
                alert('Confirmation email resent! Please check your inbox and confirm your email before logging in.');
              } catch (resendError) {
                alert('Failed to resend confirmation email. Please try again or contact support.');
              }
            }
            window.location.href = `champion-login.html?email=${encodeURIComponent(formData.email)}`;
          }
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
          return;
        }

        submitBtn.textContent = 'Registering...';

        // Sign up with Supabase (requires email confirmation)
        const result = await SupabaseService.signUp(
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

        if (result.requiresEmailConfirmation) {
          // Show success message and redirect to login
          alert(result.message || 'Registration successful! Please check your email to confirm your account. After confirmation, you can log in.');
          window.location.href = 'champion-login.html';
          return;
        }
        
        // If no email confirmation required (shouldn't happen with current setup)
        alert('Registration successful! You can now log in.');
        window.location.href = 'champion-login.html';
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