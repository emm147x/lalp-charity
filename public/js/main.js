// Shared behaviour across all pages
document.addEventListener('DOMContentLoaded', () => {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Premium homepage carousel
  const heroCarousel = document.querySelector('.hero-carousel');
  if (heroCarousel) {
    const slides = [...heroCarousel.querySelectorAll('.hero-slide')];
    const dots = [...heroCarousel.querySelectorAll('.carousel-dot')];
    const prevBtn = heroCarousel.querySelector('.carousel-btn.prev');
    const nextBtn = heroCarousel.querySelector('.carousel-btn.next');

    let currentSlide = 0;
    let autoRotate;

    const showSlide = (index) => {
      currentSlide = (index + slides.length) % slides.length;

      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle('is-active', slideIndex === currentSlide);
      });

      dots.forEach((dot, dotIndex) => {
        dot.classList.toggle('is-active', dotIndex === currentSlide);
        dot.setAttribute('aria-current', dotIndex === currentSlide ? 'true' : 'false');
      });
    };

    const startAutoRotate = () => {
      clearInterval(autoRotate);
      autoRotate = setInterval(() => {
        showSlide(currentSlide + 1);
      }, 6000);
    };

    prevBtn?.addEventListener('click', () => {
      showSlide(currentSlide - 1);
      startAutoRotate();
    });

    nextBtn?.addEventListener('click', () => {
      showSlide(currentSlide + 1);
      startAutoRotate();
    });

    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        showSlide(index);
        startAutoRotate();
      });
    });

    heroCarousel.addEventListener('mouseenter', () => clearInterval(autoRotate));
    heroCarousel.addEventListener('mouseleave', startAutoRotate);
    showSlide(0);
    startAutoRotate();
  }

  // Mobile nav toggle
  const toggle = document.querySelector('.menu-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    const setMenuState = (open) => {
      links.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.classList.toggle('is-open', open);
    };

    toggle.addEventListener('click', () => {
      const isOpen = links.classList.contains('is-open');
      setMenuState(!isOpen);
    });

    links.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => setMenuState(false));
    });
  }

  // Contact form submit
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const status = document.getElementById('contact-status');
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const payload = {
        name: document.getElementById('c-name')?.value.trim() || '',
        email: document.getElementById('c-email')?.value.trim() || '',
        reason: document.getElementById('c-reason')?.value || '',
        message: document.getElementById('c-message')?.value.trim() || ''
      };

      if (!payload.name || !payload.email || !payload.message) {
        status.textContent = 'Please complete the required fields before sending your message.';
        status.className = 'status-msg show status-err';
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';
      status.textContent = '';
      status.className = 'status-msg';

      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.message || 'Could not send your message. Please try again.');
        }

        status.textContent = "Thanks — your message has been received. We'll reply within two business days.";
        status.className = 'status-msg show status-ok';
        contactForm.reset();
      } catch (err) {
        status.textContent = err.message || 'Something went wrong while sending your message. Please try again.';
        status.className = 'status-msg show status-err';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send message';
      }
    });
  }
});
