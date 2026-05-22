// Landing Page Animations

function scrollToSection(sectionId) {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
}

function countUpAnimation(element, target) {
  const duration = 2000;
  const start = 0;
  const increment = target / (duration / 16);
  let current = start;

  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      element.textContent = target + (element.dataset.target.includes('K') ? 'K' : element.dataset.target.includes('M') ? 'M' : element.dataset.target.includes('.') ? '%' : '');
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(current) + (element.dataset.target.includes('K') ? 'K' : element.dataset.target.includes('M') ? 'M' : element.dataset.target.includes('.') ? '%' : '');
    }
  }, 16);
}

function initCountUpAnimation() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !entry.target.animated) {
        entry.target.animated = true;
        const target = parseFloat(entry.target.dataset.target.replace(/[^0-9.]/g, ''));
        countUpAnimation(entry.target, target);
      }
    });
  });

  document.querySelectorAll('.stat-number').forEach((element) => {
    observer.observe(element);
  });
}

function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('scroll-animate');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.feature-card, .step').forEach((element) => {
    observer.observe(element);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initCountUpAnimation();
  initScrollAnimations();

  // Smooth scroll behavior for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
});

// Navbar scroll effect
window.addEventListener('scroll', () => {
  const navbar = document.querySelector('.navbar');
  if (window.scrollY > 10) {
    navbar.style.borderBottomColor = 'var(--border-default)';
  } else {
    navbar.style.borderBottomColor = 'var(--border-subtle)';
  }
});
