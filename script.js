const menuToggle = document.getElementById('menu-toggle');
const navLinks = document.querySelector('.nav-links');
const overlay = document.querySelector('.overlay');
const navItems = navLinks.querySelectorAll('li');

menuToggle.addEventListener('click', () => {
  const isActive = navLinks.classList.toggle('active');
  overlay.classList.toggle('active');
  menuToggle.classList.toggle('active');

  // Apply staggered fade-in for links
  navItems.forEach((item, i) => {
    if (isActive) {
      item.style.transition = `opacity 300ms ease ${i * 60}ms, transform 300ms ease ${i * 60}ms`;
      item.style.opacity = 1;
      item.style.transform = 'translateX(0)';
    } else {
      item.style.transition = 'none';
      item.style.opacity = 0;
      item.style.transform = 'translateX(8px)';
    }
  });
});

// Close menu when overlay clicked
overlay.addEventListener('click', closeMenu);

// Close menu when clicking outside nav
document.addEventListener('click', (e) => {
  if (!navLinks.contains(e.target) && !menuToggle.contains(e.target)) {
    closeMenu();
  }
});

function closeMenu() {
  navLinks.classList.remove('active');
  overlay.classList.remove('active');
  menuToggle.classList.remove('active');

  navItems.forEach(item => {
    item.style.transition = 'none';
    item.style.opacity = 0;
    item.style.transform = 'translateX(8px)';
  });
}



// Particle animation

function createParticles() {
  const particlesContainer = document.querySelector(".particles");
  const particleCount = 50;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement("div");
    particle.className = "particle";
    particle.style.left = Math.random() * 100 + "%";
    particle.style.animationDelay = Math.random() * 6 + "s";
    particle.style.animationDuration = Math.random() * 3 + 3 + "s";
    particlesContainer.appendChild(particle);
  }
}

// Counter animation
function animateCounters() {
  const counters = document.querySelectorAll(".stat-number");

  counters.forEach((counter) => {
    const target = parseInt(counter.getAttribute("data-target"));
    const increment = target / 100;
    let current = 0;

    const updateCounter = () => {
      if (current < target) {
        current += increment;
        counter.textContent = Math.floor(current).toLocaleString();
        requestAnimationFrame(updateCounter);
      } else {
        counter.textContent = target.toLocaleString();
      }
    };

    updateCounter();
  });
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  });
});

// Navbar background on scroll
window.addEventListener("scroll", () => {
  const navbar = document.querySelector(".navbar");
  if (window.scrollY > 100) {
    navbar.style.background = "rgba(0, 102, 153, 0.98)";
  } else {
    navbar.style.background = "rgba(0, 102, 153, 0.95)";
  }
});

// Intersection Observer for animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -50px 0px",
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = "1";
      entry.target.style.transform = "translateY(0)";
    }
  });
}, observerOptions);

// Observe all cards and sections
document
  .querySelectorAll(
    ".feature-card, .research-card, .event-card, .testimonial-card"
  )
  .forEach((el) => {
    el.style.opacity = "0";
    el.style.transform = "translateY(30px)";
    el.style.transition = "all 0.6s ease";
    observer.observe(el);
  });

// Initialize animations
document.addEventListener("DOMContentLoaded", () => {
  createParticles();

  // Trigger counter animation when stats section is visible
  const statsSection = document.querySelector(".stats");
  const statsObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounters();
          statsObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  statsObserver.observe(statsSection);
});

// Add cursor glow effect


(function () {
  function c() {
    var b = a.contentDocument || a.contentWindow.document;
    if (b) {
      var d = b.createElement("script");
      d.innerHTML =
        "window.__CF$cv$params={r:'9864420fc3e48a1e',t:'MTc1OTA3MzE3Ni4wMDAwMDA='};var a=document.createElement('script');a.nonce='';a.src='/cdn-cgi/challenge-platform/scripts/jsd/main.js';document.getElementsByTagName('head')[0].appendChild(a);";
      b.getElementsByTagName("head")[0].appendChild(d);
    }
  }
  if (document.body) {
    var a = document.createElement("iframe");
    a.height = 1;
    a.width = 1;
    a.style.position = "absolute";
    a.style.top = 0;
    a.style.left = 0;
    a.style.border = "none";
    a.style.visibility = "hidden";
    document.body.appendChild(a);
    if ("loading" !== document.readyState) c();
    else if (window.addEventListener)
      document.addEventListener("DOMContentLoaded", c);
    else {
      var e = document.onreadystatechange || function () {};
      document.onreadystatechange = function (b) {
        e(b);
        "loading" !== document.readyState &&
          ((document.onreadystatechange = e), c());
      };
    }
  }
})();

// Observe "Who We Are" fade-in elements
document.querySelectorAll(".fade-in").forEach((el) => {
  el.style.opacity = "0";
  el.style.transform = "translateY(30px)";
  el.style.transition = "all 0.8s ease";
  observer.observe(el);
});

// Intersection Observer for section titles
const titleObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible"); // show title
      }
    });
  },
  { threshold: 0.1 }
);

// Observe all section titles
document.querySelectorAll(".section-title").forEach((el) => {
  titleObserver.observe(el);
});

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".contact-form");
  form.classList.add("visible"); // makes it appear with animation
});

/* on progress for response

        emailjs.init('DMrlyW_6ctJ-7d53Z'); // Replace with your Public Key

document.getElementById('contactForm').addEventListener('submit', function(e) {
    e.preventDefault();

    emailjs.sendForm('ieeestb1146@gmail.com', 'template_cr31c3e', this)
    .then(function() {
        alert('Message sent successfully!');
        document.getElementById('contactForm').reset();
    }, function(error) {
        alert('Failed to send message. Please try again.\n' + JSON.stringify(error));
    });
});

*/