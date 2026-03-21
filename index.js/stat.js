function animateValue(element, target, options = {}) {
  const duration = options.duration || 1400;
  const prefix = options.prefix || "";
  const suffix = options.suffix || "";
  const decimals = options.decimals || 0;

  let startTimestamp = null;
  const startValue = 0;

  function step(timestamp) {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const currentValue = startValue + (target - startValue) * progress;

    element.textContent =
      prefix + currentValue.toFixed(decimals) + suffix;

    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      element.textContent =
        prefix + target.toFixed(decimals) + suffix;
    }
  }

  window.requestAnimationFrame(step);
}

function parseTargetValue(rawValue) {
  const cleaned = rawValue.replace(/[^0-9.]/g, "");
  return parseFloat(cleaned) || 0;
}

const statObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      const el = entry.target;
      const targetText = el.dataset.target || "0";
      const target = parseTargetValue(targetText);
      const prefix = el.dataset.prefix || "";
      const suffix = el.dataset.suffix || "";
      const decimals = parseInt(el.dataset.decimals || "0", 10);

      animateValue(el, target, { prefix, suffix, decimals });
      observer.unobserve(el);
    });
  },
  { threshold: 0.35 }
);

document.querySelectorAll(".stat-number").forEach((el) => {
  statObserver.observe(el);
});