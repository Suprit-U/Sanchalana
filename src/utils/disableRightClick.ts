export const disableRightClick = () => {
  // Disable right-click context menu
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
  });

  // Disable keyboard shortcuts for developer tools and view source
  document.addEventListener('keydown', (e) => {
    // Disable F12 key
    if (e.key === 'F12') {
      e.preventDefault();
      return false;
    }

    // Disable Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (Chrome DevTools)
    if (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key)) {
      e.preventDefault();
      return false;
    }

    // Disable Ctrl+U (View Source)
    if (e.ctrlKey && e.key.toLowerCase() === 'u') {
      e.preventDefault();
      return false;
    }
  });
};