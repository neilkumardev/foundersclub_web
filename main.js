(function () {
  "use strict";

  var cfg = window.FC_CONFIG || {};
  var meeting = cfg.meeting || {};
  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var motion = !reduceMotion && "IntersectionObserver" in window;

  function all(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  function trim(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  function clamp01(n) { return Math.min(1, Math.max(0, n)); }
  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

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

  /* ---------- Motion switch ---------- */

  if (motion) root.classList.add("js-motion");

  // Wrap each word (or character) in a span so it can be revealed on its own.
  // Character splits keep an untouched copy for screen readers.
  function splitText(el, mode) {
    var pieces = [];
    var label = null;
    if (mode === "chars") {
      label = document.createElement("span");
      label.className = "visually-hidden";
      label.textContent = el.textContent;
    }
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          var parts = mode === "chars" ? child.textContent.split("") : child.textContent.split(/(\s+)/);
          parts.forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(part));
              return;
            }
            var span = document.createElement("span");
            span.className = mode === "chars" ? "c" : "w";
            span.textContent = part;
            pieces.push(span);
            frag.appendChild(span);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) {
          walk(child);
        }
      });
    })(el);
    if (label) {
      var visual = document.createElement("span");
      visual.setAttribute("aria-hidden", "true");
      while (el.firstChild) visual.appendChild(el.firstChild);
      el.appendChild(label);
      el.appendChild(visual);
    }
    return pieces;
  }

  /* ---------- Scroll engine: header, reading progress, scenes ---------- */

  var header = document.querySelector(".site-header");
  var progressBar = document.querySelector(".scroll-progress");
  var headerH = header.offsetHeight;
  var scenes = [];
  var ticking = false;

  // 0 when a pinned scene's stage first sticks, 1 when it lets go.
  function sceneProgress(el) {
    var rect = el.getBoundingClientRect();
    var travel = rect.height - (window.innerHeight - headerH);
    return travel > 0 ? clamp01((headerH - rect.top) / travel) : 0;
  }

  // Scene: an idea's three dots merge into one vermilion dot that fills the screen.
  var dotScene = document.querySelector(".scene-dot");
  if (motion && dotScene) {
    var dotFill = dotScene.querySelector(".dot-fill");
    var dotWords = splitText(dotScene.querySelector(".dot-title"), "words");
    var cover = 1;
    var measureDot = function () {
      cover = Math.hypot(window.innerWidth, window.innerHeight) / 28 + 2;
    };
    measureDot();
    window.addEventListener("resize", measureDot);

    scenes.push(function () {
      var p = sceneProgress(dotScene);
      var merge = easeInOut(clamp01(p / 0.16));
      var grow = easeInOut(clamp01((p - 0.17) / 0.33));
      var shown = clamp01((p - 0.52) / 0.36) * dotWords.length;
      dotScene.style.setProperty("--conv", merge.toFixed(3));
      dotScene.style.setProperty("--hint", (1 - clamp01((p - 0.03) / 0.08)).toFixed(3));
      dotFill.style.opacity = merge >= 1 ? "1" : "0";
      dotFill.style.transform = "scale(" + (1 + grow * (cover - 1)).toFixed(2) + ")";
      dotWords.forEach(function (word, i) {
        word.style.opacity = (0.14 + 0.86 * clamp01(shown - i)).toFixed(2);
      });
    });
  }

  // Scene: the six steps, one at a time, with a drawing that evolves alongside.
  var stepsScene = document.querySelector(".scene-steps");
  if (motion && stepsScene) {
    var stepItems = all(".sl-item", stepsScene);
    var railItems = all(".rail li", stepsScene);
    var rail = stepsScene.querySelector(".rail");
    var currentStep = -1;

    scenes.push(function () {
      var p = sceneProgress(stepsScene);
      var idx = Math.min(stepItems.length - 1, Math.floor(p * stepItems.length));
      rail.style.setProperty("--rail", clamp01((p * stepItems.length - 0.3) / (stepItems.length - 1)).toFixed(3));
      if (idx === currentStep) return;
      currentStep = idx;
      stepsScene.setAttribute("data-step", idx + 1);
      stepItems.forEach(function (li, i) {
        li.classList.toggle("is-active", i === idx);
        li.classList.toggle("is-past", i < idx);
      });
      railItems.forEach(function (li, i) {
        li.classList.toggle("is-reached", i <= idx);
        li.classList.toggle("is-current", i === idx);
      });
    });
  }

  // Scene: one project type at a time in the middle of the screen. The index
  // along the bottom fills as you scroll and jumps to a type when clicked; the
  // name drifts slightly with the cursor.
  var buildScene = document.querySelector(".scene-build");
  if (motion && buildScene) {
    var buildItems = all(".build-item", buildScene);
    var buildLayout = buildScene.querySelector(".build-layout");
    var buildIndex = buildScene.querySelector("[data-build-index]");
    var currentBuild = -1;

    var buildButtons = buildItems.map(function (item, i) {
      var name = item.querySelector(".build-name").textContent.replace(/^an? /i, "").replace(/\.$/, "");
      var button = document.createElement("button");
      button.type = "button";
      button.textContent = name;
      button.setAttribute("aria-label", "Show " + name);
      button.addEventListener("click", function () {
        var rect = buildScene.getBoundingClientRect();
        var travel = rect.height - (window.innerHeight - headerH);
        var p = (i + 0.2) / buildItems.length;
        window.scrollTo({ top: window.scrollY + rect.top - headerH + p * travel, behavior: "smooth" });
      });
      buildIndex.appendChild(button);
      return button;
    });

    scenes.push(function () {
      var p = sceneProgress(buildScene);
      var n = buildItems.length;
      var idx = Math.min(n - 1, Math.floor(p * n));
      var local = clamp01(p * n - idx);
      buildButtons.forEach(function (button, i) {
        button.style.setProperty("--seg", i < idx ? 1 : i > idx ? 0 : local.toFixed(3));
      });
      if (idx === currentBuild) return;
      currentBuild = idx;
      buildItems.forEach(function (item, i) {
        item.classList.toggle("is-active", i === idx);
        item.classList.toggle("is-past", i < idx);
      });
      buildButtons.forEach(function (button, i) { button.setAttribute("aria-current", i === idx ? "true" : "false"); });
    });

    buildLayout.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      var r = buildLayout.getBoundingClientRect();
      buildLayout.style.setProperty("--mx", (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
      buildLayout.style.setProperty("--my", (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
    });
    buildLayout.addEventListener("pointerleave", function () {
      buildLayout.style.setProperty("--mx", "0");
      buildLayout.style.setProperty("--my", "0");
    });
  }

  // Scene: each starting point types itself out, then its answer appears.
  var whoScene = document.querySelector(".scene-who");
  if (motion && whoScene) {
    var quotes = all(".quote", whoScene).map(function (el) {
      return { el: el, chars: splitText(el.querySelector(".quote-q"), "chars") };
    });
    var quoteCount = whoScene.querySelector(".quote-count span");

    scenes.push(function () {
      var p = sceneProgress(whoScene);
      var seg = Math.min(quotes.length - 1, Math.floor(p * quotes.length));
      var local = clamp01(p * quotes.length - seg);
      quotes.forEach(function (q, i) {
        var typed = i < seg ? q.chars.length : i > seg ? 0 : Math.round(clamp01(local / 0.45) * q.chars.length);
        q.el.classList.toggle("is-active", i === seg);
        q.el.classList.toggle("show-a", i < seg || (i === seg && local > 0.5));
        q.chars.forEach(function (c, j) { c.classList.toggle("on", j < typed); });
      });
      if (quoteCount) quoteCount.textContent = seg + 1;
    });
  }

  // Statements that light up word by word as they cross the screen.
  if (motion) {
    all("[data-words]").forEach(function (el) {
      var words = splitText(el, "words");
      scenes.push(function () {
        var vh = window.innerHeight;
        var p = clamp01((vh * 0.85 - el.getBoundingClientRect().top) / (vh * 0.45));
        var shown = p * words.length;
        words.forEach(function (word, i) {
          word.style.opacity = (0.2 + 0.8 * clamp01(shown - i)).toFixed(2);
        });
      });
    });
  }

  function onScroll() {
    var y = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    header.classList.toggle("is-scrolled", y > 40);
    if (progressBar) progressBar.style.setProperty("--scroll", max > 0 ? (y / max).toFixed(4) : 0);
    scenes.forEach(function (update) { update(); });
    ticking = false;
  }

  function requestTick() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(onScroll);
    }
  }

  window.addEventListener("scroll", requestTick, { passive: true });
  window.addEventListener("resize", function () {
    headerH = header.offsetHeight;
    requestTick();
  });
  onScroll();

  if (!("IntersectionObserver" in window)) return;

  /* ---------- "What you could build" without motion: the item in focus ---------- */

  var items = all(".build-item");
  var illustrations = all(".ill");
  var stageNum = document.querySelector(".stage-num");
  function setActive(active) {
    var index = items.indexOf(active);
    items.forEach(function (item) { item.classList.toggle("is-active", item === active); });
    illustrations.forEach(function (ill, i) { ill.classList.toggle("is-active", i === index); });
    if (stageNum) stageNum.textContent = String(index + 1).padStart(2, "0");
  }
  if (items.length && !(motion && buildScene)) {
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

  if (!motion) return;

  /* ---------- Marquee: drifts on its own, races and reverses with your scroll ---------- */

  var track = document.querySelector(".marquee-track");
  if (track) {
    var mx = 0;
    var velocity = 0;
    var direction = 1;
    var lastY = window.scrollY;
    var marqueeVisible = false;

    var spin = function () {
      if (!marqueeVisible) return;
      var y = window.scrollY;
      velocity = velocity * 0.9 + (y - lastY) * 0.1;
      lastY = y;
      if (Math.abs(velocity) > 0.3) direction = velocity > 0 ? 1 : -1;
      mx -= direction * (0.6 + Math.min(Math.abs(velocity) * 0.8, 18));
      var half = track.scrollWidth / 2;
      if (mx <= -half) mx += half;
      else if (mx > 0) mx -= half;
      track.style.transform = "translate3d(" + mx.toFixed(1) + "px, 0, 0)";
      window.requestAnimationFrame(spin);
    };

    new IntersectionObserver(function (entries) {
      var wasVisible = marqueeVisible;
      marqueeVisible = entries[0].isIntersecting;
      if (marqueeVisible && !wasVisible) {
        lastY = window.scrollY;
        window.requestAnimationFrame(spin);
      }
    }).observe(track.parentNode);
  }

  /* ---------- Reveal on scroll; siblings in lists arrive one after another ---------- */

  var revealTargets = all(".section-head, .what-head, .board-title, .board-item, .ask, .photo-strip figure, .meeting-item, .join-steps li, .partners");
  revealTargets.forEach(function (el) {
    el.classList.add("reveal");
    if (el.matches(".board-item, .photo-strip figure, .meeting-item, .join-steps li")) {
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
