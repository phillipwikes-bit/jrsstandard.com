// Used only on explicit clicks from the two new free initiative pages.
// No page-load collection, newsletter enrollment, sales lead, or silent retry.
document.addEventListener('DOMContentLoaded', () => {
  for (const form of document.querySelectorAll('form[data-support-campaign]')) {
    const button = form.querySelector('button[type="submit"]');
    const status = form.querySelector('[role="status"]');
    if (!button || !status) continue;
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (button.disabled) return;
      const campaign = form.getAttribute('data-support-campaign');
      button.disabled = true;
      status.textContent = 'Checking whether this optional action can be recorded.';
      try {
        const res = await fetch('/api/initiative-support', {
          method:'POST', credentials:'same-origin',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({campaign})
        });
        const result = await res.json();
        if (res.ok && result.ok && result.recorded === true) {
          status.textContent = 'Your optional support action was recorded. This is not a subscription or endorsement of a legal outcome.';
         } else if (res.ok && result.ok && result.preview_only === true) {
          status.textContent = 'Preview mode: no support action was recorded. The free resources remain available.';
        } else if (res.ok && result.ok && result.already_recorded === true) {
          status.textContent = 'This browser was already counted for this initiative. No additional action was recorded.';
        } else {
          status.textContent = 'The action could not be confirmed as recorded. All free resources remain available.';
        }
      } catch {
        status.textContent = 'The action could not be confirmed as recorded. All free resources remain available.';
      } finally {
        button.disabled = false;
      }
    });
  }
});
