// Flag that JS is running so CSS can animate the skill bars.
document.documentElement.classList.add("js");

// ---------- Active nav icon ----------
const navLinks = [...document.querySelectorAll(".nav-icons a")];

// Map each nav link to the section it points to (if that section exists).
const targets = new Map(
    navLinks.map((link) => [
        link,
        link.hash.length > 1 ? document.querySelector(link.hash) : null,
    ])
);

function setActive(activeLink) {
    navLinks.forEach((link) => {
        const isActive = link === activeLink;
        link.classList.toggle("active", isActive);
        if (isActive) {
            link.setAttribute("aria-current", "page");
        } else {
            link.removeAttribute("aria-current");
        }
    });
}

navLinks.forEach((link) => {
    link.addEventListener("click", () => setActive(link));
});

// Scroll-spy: track which sections cross the middle of the screen. If more
// than one does (e.g. Experience and Education side by side), the one that
// comes first in the nav wins.
const visible = new Set();
const spy = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) visible.add(entry.target);
            else visible.delete(entry.target);
        });
        const match = navLinks.find((link) => visible.has(targets.get(link)));
        if (match) setActive(match);
    },
    { rootMargin: "-50% 0px -50% 0px" }
);
targets.forEach((target) => {
    if (target) spy.observe(target);
});

// ---------- Skill bars fill when About scrolls into view ----------
const about = document.querySelector(".about");
if (about) {
    const reveal = new IntersectionObserver(
        (entries, obs) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    about.classList.add("in-view");
                    obs.disconnect();
                }
            });
        },
        { threshold: 0.25 }
    );
    reveal.observe(about);
}

// ---------- Recent works filter (only runs if the filter buttons exist) ----------
const filterButtons = document.querySelectorAll(".work-filters button");
const workCards = document.querySelectorAll(".work-card");

filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const filter = button.dataset.filter;
        filterButtons.forEach((b) =>
            b.setAttribute("aria-pressed", String(b === button))
        );
        workCards.forEach((card) => {
            card.hidden = !(filter === "all" || card.dataset.category === filter);
        });
    });
});

// ---------- Reviews slider ----------
const reviews = document.querySelectorAll(".review");
const reviewDots = document.querySelectorAll(".review-dots button");

reviewDots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
        reviews.forEach((review, i) => {
            review.hidden = i !== index;
        });
        reviewDots.forEach((d, i) =>
            d.setAttribute("aria-pressed", String(i === index))
        );
    });
});

// ---------- Contact form ----------
// Sends the form without reloading the page. It posts to the form's own
// "action" if it has one (Formspree), otherwise to "/" (Netlify Forms).
const contactForm = document.querySelector(".contact-form");

if (contactForm) {
    const status = contactForm.querySelector(".form-status");
    const submitButton = contactForm.querySelector('button[type="submit"]');

    function showStatus(message, type) {
        status.textContent = message;
        status.classList.toggle("is-success", type === "success");
        status.classList.toggle("is-error", type === "error");
    }

    contactForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const buttonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = "Sending…";
        showStatus("", "");

        try {
            const response = await fetch(contactForm.getAttribute("action") || "/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    Accept: "application/json",
                },
                body: new URLSearchParams(new FormData(contactForm)).toString(),
            });

            if (!response.ok) throw new Error(`Request failed: ${response.status}`);

            contactForm.reset();
            showStatus("Thanks! Your message has been sent. I'll get back to you soon.", "success");
        } catch (error) {
            showStatus("Sorry, something went wrong. Please try again, or send me an email instead.", "error");
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = buttonText;
        }
    });
}

// ---------- Scroll reveal ----------
// Adds a gentle fade-up to each block the first time it scrolls into view.
// Skipped for visitors who have "reduce motion" turned on.
const revealSelectors = [
    ".section-title",
    ".about-avatar",
    ".about-card",
    ".stat",
    ".resume-card",
    ".service-card",
    ".work-card",
    ".reviews-slider",
    ".brands-grid li",
    ".posts-grid > li",
    ".contact-intro p",
    ".contact-form",
].join(",");

if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const revealObserver = new IntersectionObserver(
        (entries, obs) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("is-visible");
                obs.unobserve(entry.target);
            });
        },
        { threshold: 0.15, rootMargin: "0px 0px -6% 0px" }
    );

    document.querySelectorAll(revealSelectors).forEach((el) => {
        // Stagger siblings (cards in a row, stats, etc.) so they arrive one by one.
        const position = [...el.parentElement.children].indexOf(el);
        el.style.setProperty("--delay", `${Math.min(position, 5) * 90}ms`);
        el.classList.add("reveal");
        revealObserver.observe(el);
    });
}
