
(function () {
  const searchInput = document.querySelector("[data-article-search]");
  const categorySelect = document.querySelector("[data-category-filter]");
  const cards = Array.from(document.querySelectorAll("[data-article-card]"));
  const countLabel = document.querySelector("[data-result-count]");

  function normalize(text) {
    return (text || "").toLowerCase().trim();
  }

  function updateList() {
    if (!cards.length) return;

    const q = normalize(searchInput ? searchInput.value : "");
    const cat = categorySelect ? categorySelect.value : "All";

    let visible = 0;

    cards.forEach(card => {
      const text = normalize(card.textContent);
      const cardCat = card.getAttribute("data-category") || "";
      const matchesText = !q || text.includes(q);
      const matchesCat = cat === "All" || cardCat === cat;
      const show = matchesText && matchesCat;

      card.style.display = show ? "" : "none";
      if (show) visible++;
    });

    if (countLabel) {
      countLabel.textContent = visible + " guide" + (visible === 1 ? "" : "s") + " shown";
    }
  }

  if (searchInput) searchInput.addEventListener("input", updateList);
  if (categorySelect) categorySelect.addEventListener("change", updateList);
  updateList();

  const feedbackButtons = Array.from(document.querySelectorAll("[data-feedback]"));
  const feedbackStatus = document.querySelector("[data-feedback-status]");
  feedbackButtons.forEach(button => {
    button.addEventListener("click", () => {
      const value = button.getAttribute("data-feedback");
      try {
        localStorage.setItem("jle_last_feedback", value);
      } catch (e) {}
      if (feedbackStatus) {
        feedbackStatus.textContent = "Saved demo feedback: " + value;
      }
      feedbackButtons.forEach(b => b.classList.remove("selected"));
      button.classList.add("selected");
    });
  });

  const requestForm = document.querySelector("[data-request-form]");
  const requestStatus = document.querySelector("[data-request-status]");
  if (requestForm) {
    requestForm.addEventListener("submit", event => {
      event.preventDefault();
      const data = new FormData(requestForm);
      const request = {
        question: data.get("question") || "",
        topic: data.get("topic") || "",
        email: data.get("email") || "",
        createdAt: new Date().toISOString()
      };
      try {
        const existing = JSON.parse(localStorage.getItem("jle_demo_requests") || "[]");
        existing.push(request);
        localStorage.setItem("jle_demo_requests", JSON.stringify(existing));
      } catch (e) {}
      if (requestStatus) {
        requestStatus.textContent = "Demo saved locally. This form is not connected to a server yet.";
      }
      requestForm.reset();
    });
  }
})();
