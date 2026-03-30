const API_BASE = window.location.origin;
/* =============================================
   FEEDBACK.JS — Star rating and feedback form
   ============================================= */

let selectedRating = 0;

function initStarRating() {
  const stars = document.querySelectorAll('.star');
  stars.forEach((star, i) => {
    star.addEventListener('mouseenter', () => highlightStars(i + 1));
    star.addEventListener('mouseleave', () => highlightStars(selectedRating));
    star.addEventListener('click', () => {
      selectedRating = i + 1;
      highlightStars(selectedRating);
      const label = document.getElementById('ratingLabel');
      const labels = ['', 'Poor 😞', 'Fair 😐', 'Good 🙂', 'Great 😊', 'Excellent 🤩'];
      if (label) label.textContent = labels[selectedRating];
    });
  });
}

function highlightStars(count) {
  document.querySelectorAll('.star').forEach((star, i) => {
    star.classList.toggle('active', i < count);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initStarRating();

  const form = document.getElementById('feedbackForm');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (selectedRating === 0) {
        showToast('⭐ Please select a star rating first.', 'error');
        return;
      }
      const text = document.getElementById('feedbackText').value.trim();
      const order = JSON.parse(localStorage.getItem('lastOrder') || '{}');

      const feedback = {
        orderId: order.orderId || 'N/A',
        table: getTableNumber() || 'N/A',
        rating: selectedRating,
        comment: text,
        submittedAt: new Date().toISOString()
      };

      const all = JSON.parse(localStorage.getItem('feedbacks') || '[]');
      all.push(feedback);
      localStorage.setItem('feedbacks', JSON.stringify(all));

      // Show success
      form.classList.add('hidden');
      const thanks = document.getElementById('thankYouMsg');
      if (thanks) thanks.classList.remove('hidden');
      showToast('🎉 Thank you for your feedback!');
    });
  }
});
