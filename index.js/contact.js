
  const contactForm = document.getElementById("contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      showToast("success", "Message sent", "Your message has been submitted successfully.");
      contactForm.reset();
    });
  }
