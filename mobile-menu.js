// Mobile Menu Toggle Functionality
// Handles hamburger menu for responsive navigation

document.addEventListener('DOMContentLoaded', () => {
  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  const nav = document.querySelector('nav');
  const body = document.body;
  
  if (!mobileMenuToggle || !nav) return;
  
  // Toggle mobile menu
  mobileMenuToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isActive = nav.classList.contains('mobile-nav-active');
    
    if (isActive) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  });
  
  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (nav.classList.contains('mobile-nav-active')) {
      if (!nav.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
        closeMobileMenu();
      }
    }
  });
  
  // Close menu when clicking on a link
  nav.addEventListener('click', (e) => {
    if (e.target.tagName === 'A' && nav.classList.contains('mobile-nav-active')) {
      // Small delay to allow navigation
      setTimeout(() => {
        closeMobileMenu();
      }, 100);
    }
  });
  
  // Close menu on window resize (if resizing to desktop)
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (window.innerWidth > 768 && nav.classList.contains('mobile-nav-active')) {
        closeMobileMenu();
      }
    }, 250);
  });
  
  // Close menu on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('mobile-nav-active')) {
      closeMobileMenu();
    }
  });
  
  function openMobileMenu() {
    nav.classList.add('mobile-nav-active');
    mobileMenuToggle.classList.add('active');
    body.style.overflow = 'hidden';
  }
  
  function closeMobileMenu() {
    nav.classList.remove('mobile-nav-active');
    mobileMenuToggle.classList.remove('active');
    body.style.overflow = '';
  }
  
  // Expose close function globally for use in other scripts
  window.closeMobileMenu = closeMobileMenu;
});

