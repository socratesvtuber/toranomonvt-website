document.addEventListener('DOMContentLoaded', () => {
  const heroButton = document.querySelector('.button-primary');
  if (heroButton) {
    heroButton.addEventListener('click', () => {
      heroButton.blur();
    });
  }
});
