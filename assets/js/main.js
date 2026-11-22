(() => {
  "use strict";

  const doc = document.documentElement;
  const body = document.body;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
  const desktopRoute = window.matchMedia("(min-width: 981px)");
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  doc.classList.remove("no-js");

  /* Loader ---------------------------------------------------------------- */
  const loader = document.getElementById("loader");
  let loaderFinished = false;

  const finishLoader = () => {
    if (loaderFinished) return;
    loaderFinished = true;
    body.classList.add("is-ready");
    window.setTimeout(() => body.classList.add("loader-done"), 1000);
  };

  if (reduce.matches) {
    finishLoader();
  } else {
    const fallback = window.setTimeout(finishLoader, 2200);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        window.clearTimeout(fallback);
        window.setTimeout(finishLoader, 350);
      });
    }
    window.addEventListener("load", () => window.setTimeout(finishLoader, 250), { once: true });
  }

  if (loader) {
    window.setTimeout(() => {
      if (body.classList.contains("loader-done")) loader.setAttribute("hidden", "");
    }, 2500);
  }

  /* Clock ---------------------------------------------------------------- */
  const clock = document.getElementById("clock");
  if (clock) {
    try {
      const formatter = new Intl.DateTimeFormat("ru-RU", {
        timeZone: "Asia/Ho_Chi_Minh",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      });
      const tick = () => {
        clock.textContent = "HANOI " + formatter.format(new Date());
      };
      tick();
      window.setInterval(tick, 30000);
    } catch (error) {
      clock.textContent = "HANOI";
    }
  }

  /* Header, progress and route -------------------------------------------- */
  const header = document.getElementById("header");
  const progress = document.getElementById("progress");
  const routePin = document.getElementById("route-pin");
  const routeTrack = document.getElementById("route-track");
  const routeProgress = document.getElementById("route-progress");
  const routeCount = document.getElementById("route-count");
  let routeIndex = -1;

  const updateRoute = () => {
    if (!routeTrack) return;
    const canPin = desktopRoute.matches && !reduce.matches;

    if (!canPin || !routePin) {
      routeTrack.style.transform = "";
      if (routeProgress) routeProgress.style.transform = "scaleX(0)";
      return;
    }

    const rect = routePin.getBoundingClientRect();
    const distance = routePin.offsetHeight - window.innerHeight;
    const p = distance > 0 ? clamp(-rect.top / distance, 0, 1) : 0;

    routeTrack.style.transform = `translate3d(${-p * 200}vw, 0, 0)`;
    if (routeProgress) routeProgress.style.transform = `scaleX(${p})`;

    const index = Math.min(2, Math.floor(p * 3));
    if (index !== routeIndex && routeCount) {
      routeIndex = index;
      routeCount.textContent = `0${index + 1} / 03`;
    }
  };

  let scrollFrame = 0;
  const updateScroll = () => {
    const y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle("is-scrolled", y > 36);
    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = `scaleX(${max > 0 ? clamp(y / max, 0, 1) : 0})`;
    }
    updateRoute();
    scrollFrame = 0;
  };

  const requestScroll = () => {
    if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateScroll);
  };

  window.addEventListener("scroll", requestScroll, { passive: true });
  window.addEventListener("resize", () => {
    updateRoute();
    requestScroll();
  });
  updateScroll();

  /* Reveals --------------------------------------------------------------- */
  const revealItems = Array.from(document.querySelectorAll("[data-reveal]"));

  if ("IntersectionObserver" in window && !reduce.matches) {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -7% 0px" }
    );
    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-in"));
  }

  /* Mobile menu ----------------------------------------------------------- */
  const menu = document.getElementById("menu");
  const menuBtn = document.querySelector(".menu-btn");

  if (menu && menuBtn) {
    let returnFocus = null;

    const openMenu = () => {
      returnFocus = document.activeElement;
      menu.showModal();
      menuBtn.setAttribute("aria-expanded", "true");
      body.classList.add("is-locked");
      const close = menu.querySelector(".menu-close");
      if (close) close.focus();
    };

    const closeMenu = () => {
      if (menu.open) menu.close();
    };

    menuBtn.addEventListener("click", openMenu);
    const closeBtn = menu.querySelector(".menu-close");
    if (closeBtn) closeBtn.addEventListener("click", closeMenu);
    menu.addEventListener("click", (event) => {
      if (event.target === menu) closeMenu();
    });

    menu.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (event) => {
        const href = link.getAttribute("href");
        const target = href && href.length > 1 ? document.querySelector(href) : null;
        if (!target) return;
        event.preventDefault();
        closeMenu();
        window.setTimeout(() => {
          target.scrollIntoView({ behavior: reduce.matches ? "auto" : "smooth" });
        }, 60);
      });
    });

    menu.addEventListener("close", () => {
      menuBtn.setAttribute("aria-expanded", "false");
      body.classList.remove("is-locked");
      if (returnFocus && typeof returnFocus.focus === "function") returnFocus.focus();
    });
  }

  /* Custom cursor --------------------------------------------------------- */
  const cursor = document.getElementById("cursor");

  if (cursor && fine.matches && !reduce.matches) {
    doc.classList.add("has-cursor");
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let tx = x;
    let ty = y;

    const render = () => {
      x += (tx - x) * 0.16;
      y += (ty - y) * 0.16;
      cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      window.requestAnimationFrame(render);
    };

    window.addEventListener("mousemove", (event) => {
      tx = event.clientX;
      ty = event.clientY;
      cursor.style.opacity = "1";
    }, { passive: true });

    document.addEventListener("pointerover", (event) => {
      if (event.target.closest("a, button, .archive-strip")) cursor.classList.add("is-hover");
    });

    document.addEventListener("pointerout", (event) => {
      if (event.target.closest("a, button, .archive-strip")) cursor.classList.remove("is-hover");
    });

    document.addEventListener("mouseleave", () => {
      cursor.style.opacity = "0";
    });

    render();
  }

  /* Magnetic elements ----------------------------------------------------- */
  if (fine.matches && !reduce.matches) {
    document.querySelectorAll(".magnetic").forEach((element) => {
      element.addEventListener("mousemove", (event) => {
        const rect = element.getBoundingClientRect();
        const mx = (event.clientX - rect.left - rect.width / 2) * 0.12;
        const my = (event.clientY - rect.top - rect.height / 2) * 0.18;
        element.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
      });

      element.addEventListener("mouseleave", () => {
        element.style.transform = "";
      });
    });
  }

  /* Club card tilt -------------------------------------------------------- */
  const clubCard = document.getElementById("club-card");
  if (clubCard && fine.matches && !reduce.matches) {
    const wrap = clubCard.closest(".club-card-wrap") || clubCard.parentElement;

    const reset = () => {
      clubCard.style.setProperty("--rx", "0deg");
      clubCard.style.setProperty("--ry", "0deg");
    };

    if (wrap) {
      wrap.addEventListener("mousemove", (event) => {
        const rect = clubCard.getBoundingClientRect();
        const px = clamp((event.clientX - rect.left) / rect.width, 0, 1);
        const py = clamp((event.clientY - rect.top) / rect.height, 0, 1);
        clubCard.style.setProperty("--rx", `${(0.5 - py) * 10}deg`);
        clubCard.style.setProperty("--ry", `${(px - 0.5) * 12}deg`);
        clubCard.style.setProperty("--gx", `${px * 100}%`);
        clubCard.style.setProperty("--gy", `${py * 100}%`);
      });
      wrap.addEventListener("mouseleave", reset);
    }
  }

  /* FAQ ------------------------------------------------------------------- */
  const faqButtons = Array.from(document.querySelectorAll(".faq-btn"));

  if (faqButtons.length) {
    const setPanel = (button, open) => {
      const panel = document.getElementById(button.getAttribute("aria-controls"));
      if (!panel) return;
      button.setAttribute("aria-expanded", String(open));
      panel.classList.toggle("is-open", open);
      panel.inert = !open;
    };

    faqButtons.forEach((button) => {
      const panel = document.getElementById(button.getAttribute("aria-controls"));
      if (panel) {
        const open = button.getAttribute("aria-expanded") === "true";
        panel.classList.toggle("is-open", open);
        panel.inert = !open;
      }

      button.addEventListener("click", () => {
        const willOpen = button.getAttribute("aria-expanded") !== "true";
        faqButtons.forEach((other) => {
          if (other !== button) setPanel(other, false);
        });
        setPanel(button, willOpen);
      });
    });
  }

  /* Archive drag ---------------------------------------------------------- */
  const strip = document.getElementById("archive-strip");

  if (strip) {
    let down = false;
    let moved = false;
    let startX = 0;
    let startScroll = 0;
    let suppressClick = false;

    strip.addEventListener("pointerdown", (event) => {
      if (event.pointerType !== "mouse") return;
      down = true;
      moved = false;
      startX = event.clientX;
      startScroll = strip.scrollLeft;
      strip.setPointerCapture?.(event.pointerId);
      strip.classList.add("is-dragging");
    });

    strip.addEventListener("pointermove", (event) => {
      if (!down) return;
      const dx = event.clientX - startX;
      if (Math.abs(dx) > 6) moved = true;
      strip.scrollLeft = startScroll - dx;
    });

    const stopDrag = (event) => {
      if (!down) return;
      down = false;
      strip.releasePointerCapture?.(event.pointerId);
      strip.classList.remove("is-dragging");
      if (moved) {
        suppressClick = true;
        window.setTimeout(() => { suppressClick = false; }, 80);
      }
    };

    strip.addEventListener("pointerup", stopDrag);
    strip.addEventListener("pointercancel", stopDrag);

    strip.addEventListener("click", (event) => {
      if (suppressClick) {
        event.preventDefault();
        event.stopPropagation();
      }
    }, true);

    strip.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      strip.scrollBy({ left: event.key === "ArrowRight" ? 340 : -340, behavior: reduce.matches ? "auto" : "smooth" });
    });
  }

  /* Lightbox -------------------------------------------------------------- */
  const lightbox = document.getElementById("lightbox");
  const items = Array.from(document.querySelectorAll(".archive-item"));

  if (lightbox && items.length) {
    const image = document.getElementById("lb-image");
    const count = document.getElementById("lb-count");
    const closeBtn = lightbox.querySelector(".lb-close");
    const prevBtn = lightbox.querySelector(".lb-prev");
    const nextBtn = lightbox.querySelector(".lb-next");
    let current = 0;
    let returnFocus = null;

    const show = (index) => {
      current = (index + items.length) % items.length;
      const item = items[current];
      if (image) {
        image.src = item.dataset.full || "";
        image.alt = item.dataset.alt || "";
      }
      if (count) count.textContent = `${String(current + 1).padStart(2, "0")} / ${String(items.length).padStart(2, "0")}`;
    };

    const open = (index, trigger) => {
      returnFocus = trigger || document.activeElement;
      show(index);
      lightbox.showModal();
      body.classList.add("is-locked");
      if (closeBtn) closeBtn.focus();
    };

    const close = () => {
      if (lightbox.open) lightbox.close();
    };

    items.forEach((item, index) => {
      item.addEventListener("click", () => open(index, item));
    });

    if (closeBtn) closeBtn.addEventListener("click", close);
    if (prevBtn) prevBtn.addEventListener("click", () => show(current - 1));
    if (nextBtn) nextBtn.addEventListener("click", () => show(current + 1));

    lightbox.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") { event.preventDefault(); show(current - 1); }
      if (event.key === "ArrowRight") { event.preventDefault(); show(current + 1); }
    });

    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) close();
    });

    lightbox.addEventListener("close", () => {
      body.classList.remove("is-locked");
      if (returnFocus && typeof returnFocus.focus === "function") returnFocus.focus();
    });
  }
})();
