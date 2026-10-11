const revealScopes = document.querySelectorAll("[data-reveal]");

const overviewTimeline = document.querySelector(".sm-overview .sm-timeline");
if (overviewTimeline && "IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  overviewTimeline.classList.add("is-pending");
  const timelineObserver = new IntersectionObserver((entries, observer) => {
    if (!entries[0].isIntersecting) return;
    requestAnimationFrame(() => overviewTimeline.classList.add("is-active"));
    observer.unobserve(overviewTimeline);
  }, { threshold: 0.2 });
  timelineObserver.observe(overviewTimeline);
}

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        entry.target.classList.toggle("is-visible", entry.isIntersecting);
      }
    },
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
  );
  revealScopes.forEach((section) => revealObserver.observe(section));
} else {
  revealScopes.forEach((section) => section.classList.add("is-visible"));
}

const book = document.querySelector("[data-book]");
if (book) {
  const cover = book.querySelector("[data-book-open]");
  const pages = [...book.querySelectorAll("[data-project-page]")];
  const previous = book.querySelector("[data-book-prev]");
  const next = book.querySelector("[data-book-next]");
  const flip = book.querySelector("[data-page-flip]");
  const flipImage = flip.querySelector(".page-flip-front");
  let activePage = 0;
  let isOpen = false;
  let isTurning = false;
  let isEnd = false;
  let endTimer;

  function syncBook() {
    book.classList.toggle("is-open", isOpen);
    book.closest(".featured-projects").classList.toggle("is-book-open", isOpen);
    book.classList.toggle("is-end", isEnd);
    book.classList.toggle("has-turned-pages", isOpen && !isEnd && activePage > 0);
    book.querySelector(".book-pages").setAttribute("aria-hidden", String(!isOpen || isEnd));
    cover.setAttribute("aria-hidden", String(isOpen));
    cover.setAttribute("aria-expanded", String(isOpen));
    cover.tabIndex = isOpen ? -1 : 0;
    previous.tabIndex = isOpen && !isEnd ? 0 : -1;
    next.tabIndex = isOpen && !isEnd ? 0 : -1;
    pages.forEach((page, index) => {
      const active = !isEnd && index === activePage;
      page.classList.toggle("is-active", active);
      page.setAttribute("aria-hidden", String(!isOpen || !active));
      page.querySelector(".case-link").tabIndex = isOpen && active ? 0 : -1;
    });
  }

  cover.addEventListener("click", (event) => {
    if (isTurning) return;
    if (event.detail > 0) {
      const clickX = event.clientX - cover.getBoundingClientRect().left;
      if (clickX < cover.clientWidth * 0.65) return;
    }
    isOpen = true;
    isEnd = false;
    window.clearTimeout(endTimer);
    activePage = 0;
    syncBook();
  });

  function turnPage(direction) {
    if (!isOpen || isTurning || isEnd) return;
    const lastTurn = direction > 0 && activePage === pages.length - 1;
    const targetPage = activePage + direction;
    if (targetPage < 0) {
      isOpen = false;
      isEnd = false;
      activePage = 0;
      syncBook();
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      if (lastTurn) isEnd = true;
      else activePage = targetPage;
      syncBook();
      if (lastTurn) endTimer = window.setTimeout(closeBook, 1000);
      return;
    }

    isTurning = true;
    previous.disabled = true;
    next.disabled = true;
    const startingPage = activePage;
    flipImage.src = pages[direction > 0 ? startingPage : targetPage].querySelector("img").src;
    flip.dataset.direction = direction > 0 ? "forward" : "back";
    flip.dataset.lastTurn = String(lastTurn);
    flip.classList.remove("is-turning-forward", "is-turning-back");
    flip.classList.add("is-prepared");

    if (direction > 0) {
      if (lastTurn) isEnd = true;
      else activePage = targetPage;
      syncBook();
    }

    // Give the sheet its starting face before beginning the hinge rotation.
    void flip.offsetWidth;
    flip.classList.add(direction > 0 ? "is-turning-forward" : "is-turning-back");

    let finished = false;
    function finishTurn() {
      if (finished) return;
      finished = true;
      if (direction < 0) activePage = targetPage;
      flip.classList.remove("is-prepared", "is-turning-forward", "is-turning-back");
      delete flip.dataset.direction;
      delete flip.dataset.lastTurn;
      previous.disabled = false;
      next.disabled = false;
      isTurning = false;
      syncBook();
      if (lastTurn) endTimer = window.setTimeout(closeBook, 1000);
    }
    flip.addEventListener("transitionend", function onTurnEnd(event) {
      if (event.propertyName !== "transform") return;
      flip.removeEventListener("transitionend", onTurnEnd);
      finishTurn();
    });
    window.setTimeout(finishTurn, 1000);
  }

  function closeBook() {
    isOpen = false;
    isEnd = false;
    activePage = 0;
    syncBook();
  }

  next.addEventListener("click", () => turnPage(1));
  previous.addEventListener("click", () => turnPage(-1));

  syncBook();
}

const aboutLink = document.querySelector("[data-scroll-to='about']");
if (aboutLink) {
  aboutLink.addEventListener("click", (event) => {
    const target = document.getElementById("about");
    if (!target) return;
    event.preventDefault();
    const start = window.scrollY;
    const destination = target.getBoundingClientRect().top + start;
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 380;
    const started = performance.now();
    function animate(now) {
      const progress = duration ? Math.min((now - started) / duration, 1) : 1;
      const eased = 1 - Math.pow(1 - progress, 3);
      window.scrollTo(0, start + (destination - start) * eased);
      if (progress < 1) requestAnimationFrame(animate);
      else history.replaceState(null, "", "#about");
    }
    requestAnimationFrame(animate);
  });
}

const study = document.querySelector("[data-study]");
if (study) {
  const studies = {
    "selective-mutism": {
      title: "Designing Low-Pressure Communication for Children with Selective Mutism",
      image: "Assets/web/sm.jpg",
      alt: "Selective Mutism project scrapbook preview"
    },
    svaroots: {
      title: "Building a Sneaker Brand Around Indian Craft",
      image: "Assets/web/svaroots.jpg",
      alt: "Svaroots project scrapbook preview"
    },
    chakli: {
      title: "Redesigning the Traditional Chakli Maker",
      image: "Assets/web/chakli.jpg",
      alt: "Chakli Maker project scrapbook preview"
    }
  };
  const key = new URLSearchParams(window.location.search).get("project") || "selective-mutism";
  if (key === "selective-mutism") {
    window.location.replace("selective-mutism.html");
  }
  if (key === "svaroots") {
    window.location.replace("svaroots.html");
  }
  const chosen = studies[key] || studies["selective-mutism"];
  study.querySelector("[data-study-title]").textContent = chosen.title;
  const image = study.querySelector("[data-study-image]");
  image.src = chosen.image;
  image.alt = chosen.alt;
  document.title = `${chosen.title} — Khushna Kazi`;
}

for (const button of document.querySelectorAll("[data-copy-phone]")) {
  const feedback = button.parentElement.querySelector(".copy-feedback");
  let feedbackTimer;

  button.addEventListener("click", async () => {
    let copied = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(button.dataset.copyPhone);
        copied = true;
      }
    } catch {
      // Fall back to the selection-based copy method below.
    }

    if (!copied) {
      try {
        const temporaryInput = document.createElement("textarea");
        temporaryInput.value = button.dataset.copyPhone;
        temporaryInput.style.position = "fixed";
        temporaryInput.style.opacity = "0";
        document.body.appendChild(temporaryInput);
        temporaryInput.select();
        copied = document.execCommand("copy");
        temporaryInput.remove();
      } catch {
        copied = false;
      }
    }

    feedback.textContent = copied ? "Number copied!" : "Could not copy";
    feedback.classList.add("is-visible");
    window.clearTimeout(feedbackTimer);
    feedbackTimer = window.setTimeout(() => {
      feedback.classList.remove("is-visible");
      feedback.textContent = "";
    }, 1000);
  });
}
