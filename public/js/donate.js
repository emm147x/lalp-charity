// Donation page: amount selection + calls the backend to start checkout.
document.addEventListener('DOMContentLoaded', () => {
  const amountGrid = document.getElementById('amount-grid');
  const customField = document.getElementById('custom-amount-field');
  const customInput = document.getElementById('custom-amount');
  const submitBtn = document.getElementById('donate-submit');
  const freqToggle = document.querySelector('.freq-toggle');
  const form = document.getElementById('donate-form');
  const statusEl = document.getElementById('donate-status');
  const currencyInput = document.getElementById('d-currency');

  let selectedAmount = 5000;
  let frequency = 'once';

  function formatCurrency(amount, currency) {
    if (currency === 'usd') {
      return '$' + Number(amount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    }
    return '₦' + Number(amount).toLocaleString('en-NG');
  }

  function refreshButton() {
    const currency = (currencyInput?.value || 'ngn').toLowerCase();
    const label = frequency === 'monthly'
      ? 'Continue to secure checkout — ' + formatCurrency(selectedAmount, currency) + '/mo'
      : 'Continue to secure checkout — ' + formatCurrency(selectedAmount, currency);
    submitBtn.textContent = label;
  }

  amountGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('.amount-btn');
    if (!btn) return;
    [...amountGrid.querySelectorAll('.amount-btn')].forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');

    if (btn.dataset.amount === 'custom') {
      customField.style.display = 'block';
      const v = parseInt(customInput.value, 10);
      selectedAmount = v > 0 ? v : 0;
      customInput.focus();
    } else {
      customField.style.display = 'none';
      selectedAmount = parseInt(btn.dataset.amount, 10);
    }
    refreshButton();
  });

  customInput.addEventListener('input', () => {
    const v = parseInt(customInput.value, 10);
    selectedAmount = v > 0 ? v : 0;
    refreshButton();
  });

  currencyInput.addEventListener('change', refreshButton);

  freqToggle.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-freq]');
    if (!btn) return;
    [...freqToggle.querySelectorAll('button')].forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    frequency = btn.dataset.freq;
    refreshButton();
  });

  refreshButton();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    statusEl.className = 'status-msg';

    const currency = (currencyInput?.value || 'ngn').toLowerCase();
    const minimum = currency === 'usd' ? 1 : 100;

    if (!selectedAmount || selectedAmount < minimum) {
      statusEl.textContent = currency === 'usd'
        ? 'Please choose or enter a valid donation amount (minimum $1).'
        : 'Please choose or enter a valid donation amount (minimum ₦100).';
      statusEl.className = 'status-msg show status-err';
      return;
    }

    const payload = {
      amount: selectedAmount,
      currency: currency,
      frequency: frequency,
      name: document.getElementById('d-name').value,
      email: document.getElementById('d-email').value,
      designation: document.getElementById('d-designation').value
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Redirecting to secure checkout…';

    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Could not start checkout. Please try again.');
      }

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned by the server.');
      }
    } catch (err) {
      statusEl.textContent = err.message + ' If this keeps happening, the server may not be configured with a payment gateway key yet.';
      statusEl.className = 'status-msg show status-err';
      submitBtn.disabled = false;
      refreshButton();
    }
  });
});
