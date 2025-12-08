// Scroll to top on page load
window.addEventListener('load', () => {
  window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
});

// FAQ Accordion functionality
function initFAQ() {
  const faqItems = document.querySelectorAll('.faq-item');
  
  faqItems.forEach((item, index) => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    
    if (question) {
      question.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        
        // Close all other items
        faqItems.forEach((otherItem, otherIndex) => {
          if (otherIndex !== index) {
            otherItem.classList.remove('active');
            const otherAnswer = otherItem.querySelector('.faq-answer');
            if (otherAnswer) {
              otherAnswer.classList.remove('active');
            }
          }
        });
        
        // Toggle current item
        if (isActive) {
          item.classList.remove('active');
          if (answer) {
            answer.classList.remove('active');
          }
        } else {
          item.classList.add('active');
          if (answer) {
            answer.classList.add('active');
          }
        }
      });
    }
  });
}

// Cookie Consent functionality
function initCookieConsent() {
  const consent = localStorage.getItem('stif-cookie-consent');
  const banner = document.getElementById('cookie-banner');
  
  if (!consent && banner) {
    banner.classList.remove('hidden');
  }
  
  // Accept All
  const acceptAllBtn = document.getElementById('accept-all-cookies');
  if (acceptAllBtn) {
    acceptAllBtn.addEventListener('click', () => {
      const consentData = {
        necessary: true,
        analytics: true,
        marketing: true,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('stif-cookie-consent', JSON.stringify(consentData));
      if (banner) {
        banner.classList.add('hidden');
      }
    });
  }
  
  // Decline Optional
  const declineBtn = document.getElementById('decline-cookies');
  if (declineBtn) {
    declineBtn.addEventListener('click', () => {
      const consentData = {
        necessary: true,
        analytics: false,
        marketing: false,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('stif-cookie-consent', JSON.stringify(consentData));
      if (banner) {
        banner.classList.add('hidden');
      }
    });
  }
  
  // Close banner
  const closeBtn = document.getElementById('close-cookie-banner');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      if (banner) {
        banner.classList.add('hidden');
      }
    });
  }
}

// Form validation for signup
function initSignupForm() {
  const form = document.getElementById('signup-form');
  if (!form) return;
  
  const errors = {};
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Clear previous errors
    document.querySelectorAll('.error-message').forEach(el => el.remove());
    document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
    
    const formData = {
      firstName: document.getElementById('firstName').value.trim(),
      lastName: document.getElementById('lastName').value.trim(),
      email: document.getElementById('email').value.trim(),
      password: document.getElementById('password').value,
      confirmPassword: document.getElementById('confirmPassword').value,
      acceptedTerms: document.getElementById('acceptedTerms').checked,
      acceptedPrivacy: document.getElementById('acceptedPrivacy').checked
    };
    
    // Validation
    if (!formData.firstName) {
      showError('firstName', 'First name is required');
    }
    
    if (!formData.lastName) {
      showError('lastName', 'Last name is required');
    }
    
    if (!formData.email) {
      showError('email', 'Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      showError('email', 'Please enter a valid email address');
    }
    
    if (!formData.password) {
      showError('password', 'Password is required');
    } else if (formData.password.length < 8) {
      showError('password', 'Password must be at least 8 characters');
    }
    
    if (!formData.confirmPassword) {
      showError('confirmPassword', 'Please confirm your password');
    } else if (formData.password !== formData.confirmPassword) {
      showError('confirmPassword', 'Passwords do not match');
    }
    
    if (!formData.acceptedTerms) {
      showError('terms', 'You must accept the Terms & Conditions');
    }
    
    if (!formData.acceptedPrivacy) {
      showError('privacy', 'You must accept the Privacy Policy');
    }
    
    // If no errors, submit form
    if (Object.keys(errors).length === 0 && 
        formData.firstName && formData.lastName && formData.email && 
        formData.password && formData.password === formData.confirmPassword &&
        formData.acceptedTerms && formData.acceptedPrivacy) {
      alert('Registration successful! Welcome to STIF.');
      // Here you would typically send the data to your backend
      form.reset();
    }
  });
  
  // Password toggle
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
  
  function showError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (field) {
      field.classList.add('error');
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error-message';
      errorDiv.textContent = message;
      field.parentElement.appendChild(errorDiv);
    } else if (fieldId === 'terms' || fieldId === 'privacy') {
      const checkbox = document.getElementById(fieldId === 'terms' ? 'acceptedTerms' : 'acceptedPrivacy');
      if (checkbox) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.marginLeft = '2rem';
        errorDiv.style.marginTop = '0.25rem';
        checkbox.closest('.checkbox-group').appendChild(errorDiv);
      }
    }
  }
}

// Email signup form
function initEmailSignup() {
  const emailForm = document.getElementById('email-signup-form');
  if (emailForm) {
    emailForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('email-signup').value;
      if (email) {
        alert('Thank you for signing up! We\'ll be in touch soon.');
        emailForm.reset();
      }
    });
  }
}

// Initialize all functionality when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initFAQ();
  initCookieConsent();
  initSignupForm();
  initEmailSignup();
  
  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
});

