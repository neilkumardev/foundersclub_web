(function () {
  "use strict";

  var cfg = window.FC_CONFIG || {};
  var meeting = cfg.meeting || {};
  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function all(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  function trim(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  /* ---------- Apply config ---------- */

  var start = trim(meeting.start);
  var end = trim(meeting.end);
  var values = {
    "meeting.cadence": trim(meeting.cadence),
    "meeting.time": end ? start + " – " + end : start,
    "meeting.room": trim(meeting.room),
    "meeting.host": trim(meeting.host),
    "meeting.school": trim(meeting.school),
    "instagram.handle": trim(cfg.instagramHandle),
  };

  // Fill text; an empty value hides that element (and its separators).
  all("[data-config]").forEach(function (el) {
    var key = el.getAttribute("data-config");
    if (!(key in values)) return;
    if (values[key]) {
      el.textContent = values[key];
    } else {
      el.hidden = true;
    }
  });
  all("[data-optional]").forEach(function (el) {
    if (!values[el.getAttribute("data-optional")]) el.hidden = true;
  });

  // Join: link straight to the form once one exists.
  var joinUrl = trim(cfg.joinUrl);
  if (joinUrl) {
    all("[data-join-cta], [data-join-link]").forEach(function (a) {
      a.href = joinUrl;
      a.target = "_blank";
      a.rel = "noopener";
      var note = document.createElement("span");
      note.className = "visually-hidden";
      note.textContent = " (sign-up form, opens in a new tab)";
      a.appendChild(note);
    });
    all("[data-join-ready]").forEach(function (el) { el.hidden = false; });
    all("[data-join-pending]").forEach(function (el) { el.hidden = true; });
  }

  // Contact email.
  var email = trim(cfg.contactEmail);
  if (email) {
    all("[data-email-link]").forEach(function (a) {
      a.href = "mailto:" + email;
      a.textContent = email;
    });
    all("[data-email-ready]").forEach(function (el) { el.hidden = false; });
    all("[data-email-pending]").forEach(function (el) { el.hidden = true; });
  }

  // Instagram.
  var instagram = trim(cfg.instagramUrl);
  if (instagram) {
    all("[data-instagram-link]").forEach(function (a) {
      a.href = instagram;
      a.rel = "noopener";
    });
  } else {
    all("[data-instagram]").forEach(function (el) { el.hidden = true; });
  }

  // Meeting photos: the section stays hidden until real photos are listed.
  var photos = Array.isArray(cfg.photos) ? cfg.photos.filter(function (p) { return p && trim(p.src); }) : [];
  var photoSection = document.querySelector("[data-photos]");
  var photoStrip = document.querySelector("[data-photo-strip]");
  if (photos.length && photoSection && photoStrip) {
    photos.forEach(function (photo) {
      var figure = document.createElement("figure");
      var img = document.createElement("img");
      img.src = photo.src;
      img.alt = trim(photo.alt);
      img.loading = "lazy";
      figure.appendChild(img);
      if (trim(photo.caption)) {
        var caption = document.createElement("figcaption");
        caption.textContent = photo.caption;
        figure.appendChild(caption);
      }
      photoStrip.appendChild(figure);
    });
    photoSection.hidden = false;
  }

  /* ---------- Mobile menu ---------- */

  var toggle = document.querySelector(".menu-toggle");
  var menu = document.getElementById("site-menu");

  function setMenu(open) {
    toggle.setAttribute("aria-expanded", String(open));
    menu.classList.toggle("is-open", open);
  }

  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      setMenu(toggle.getAttribute("aria-expanded") !== "true");
    });
    menu.addEventListener("click", function (event) {
      if (event.target.closest("a")) setMenu(false);
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setMenu(false);
        toggle.focus();
      }
    });
    window.matchMedia("(min-width: 861px)").addEventListener("change", function (mq) {
      if (mq.matches) setMenu(false);
    });
  }

  /* ---------- Scroll-linked: header rule, reading progress, step progress ---------- */

  var header = document.querySelector(".site-header");
  var progressBar = document.querySelector(".scroll-progress");
  var stepsList = document.querySelector(".steps");
  var stepItems = all(".step");
  var verticalSteps = window.matchMedia("(max-width: 999px)");
  var ticking = false;

  function clamp01(n) { return Math.min(1, Math.max(0, n)); }

  // Dots fill as the six steps scroll through the viewport; reverses on the way back up.
  function updateSteps() {
    if (!stepsList || !root.classList.contains("js-motion")) return;
    var rect = stepsList.getBoundingClientRect();
    var vh = window.innerHeight;
    var progress = verticalSteps.matches
      ? (vh * 0.72 - rect.top) / rect.height
      : (vh * 0.85 - rect.top) / (vh * 0.45);
    var reached = clamp01(progress) * stepItems.length;
    stepItems.forEach(function (step, i) {
      step.classList.toggle("is-reached", reached > i + 0.15);
      step.style.setProperty("--seg", clamp01(reached - i - 0.15).toFixed(3));
    });
    stepsList.classList.toggle("is-looping", reached > 4.15);
  }

  function onScroll() {
    var y = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    header.classList.toggle("is-scrolled", y > 40);
    if (progressBar) progressBar.style.setProperty("--scroll", max > 0 ? (y / max).toFixed(4) : 0);
    updateSteps();
    ticking = false;
  }

  function requestTick() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(onScroll);
    }
  }

  window.addEventListener("scroll", requestTick, { passive: true });
  window.addEventListener("resize", requestTick);

  if (!("IntersectionObserver" in window)) {
    onScroll();
    return;
  }

  /* ---------- "What you could build": the item in focus ---------- */

  var items = all(".build-item");
  var illustrations = all(".ill");
  var stageNum = document.querySelector(".stage-num");
  function setActive(active) {
    var index = items.indexOf(active);
    items.forEach(function (item) { item.classList.toggle("is-active", item === active); });
    illustrations.forEach(function (ill, i) { ill.classList.toggle("is-active", i === index); });
    if (stageNum) stageNum.textContent = String(index + 1).padStart(2, "0");
  }
  if (items.length) {
    setActive(items[0]);
    var focusObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActive(entry.target);
      });
    }, { rootMargin: "-48% 0px -48% 0px" });
    items.forEach(function (item) {
      focusObserver.observe(item);
      item.addEventListener("pointerenter", function () { setActive(item); });
    });
  }

  /* ---------- Motion (skipped entirely with reduced motion) ---------- */

  if (reduceMotion) {
    onScroll();
    return;
  }
  root.classList.add("js-motion");
  onScroll();

  // Reveal on scroll; siblings in lists arrive one after another.
  var revealTargets = all(".section-head, .what-head, .stage, .build-list, .board-title, .board-item, .path, .ask, .photo-strip figure, .meeting-item, .join-steps li, .partners");
  revealTargets.forEach(function (el) {
    el.classList.add("reveal");
    if (el.matches(".board-item, .path, .photo-strip figure, .meeting-item, .join-steps li")) {
      var index = Array.prototype.indexOf.call(el.parentNode.children, el);
      el.style.setProperty("--delay", (index * 0.09).toFixed(2) + "s");
    }
  });

  // Footer wordmark: split into letters so they can rise one by one.
  var mark = document.querySelector(".footer-mark");
  if (mark) {
    var count = 0;
    Array.prototype.slice.call(mark.childNodes).forEach(function (node) {
      if (node.nodeType === 3) {
        var frag = document.createDocumentFragment();
        node.textContent.split("").forEach(function (char) {
          if (char === " ") {
            frag.appendChild(document.createTextNode(" "));
            return;
          }
          var span = document.createElement("span");
          span.className = "ch";
          span.style.setProperty("--i", count++);
          span.textContent = char;
          frag.appendChild(span);
        });
        mark.replaceChild(frag, node);
      } else if (node.nodeType === 1) {
        node.classList.add("ch");
        node.style.setProperty("--i", count + 4);
      }
    });
    revealTargets.push(mark);
  }

  var revealObserver = new IntersectionObserver(function (entries, observer) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -10% 0px" });
  revealTargets.forEach(function (el) { revealObserver.observe(el); });

  // Buttons lean slightly toward the pointer.
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    all(".btn").forEach(function (btn) {
      btn.addEventListener("pointermove", function (event) {
        var r = btn.getBoundingClientRect();
        var x = (event.clientX - r.left) / r.width - 0.5;
        var y = (event.clientY - r.top) / r.height - 0.5;
        btn.style.transform = "translate(" + (x * 10).toFixed(1) + "px, " + (y * 8).toFixed(1) + "px)";
      });
      btn.addEventListener("pointerleave", function () { btn.style.transform = ""; });
    });
  }
})();
