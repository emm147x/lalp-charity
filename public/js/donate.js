// Donation page: amount selection + calls the backend to start checkout.
document.addEventListener('DOMContentLoaded', () => {
  const amountGrid = document.getElementById('amount-grid');
  const customField = document.getElementById('custom-amount-field');
  const customInput = document.getElementById('custom-amount');
  const customLabel = customField?.querySelector('label');
  const submitBtn = document.getElementById('donate-submit');
  const freqToggle = document.querySelector('.freq-toggle');
  const form = document.getElementById('donate-form');
  const statusEl = document.getElementById('donate-status');
  const currencyInput = document.getElementById('d-currency');

  const presetAmounts = {
    NGN: [5000, 10000, 25000, 50000, 100000],
    USD: [5, 10, 25, 50, 100]
  };

  const defaultSelectedAmount = {
    NGN: 5000,
    USD: 5
  };

  let selectedCurrency = (currencyInput?.value || 'ngn').toUpperCase();
  let selectedAmount = defaultSelectedAmount[selectedCurrency];
  let frequency = 'once';

  function formatCurrency(amount, currency = selectedCurrency) {
    if (currency === 'USD') {
      return '$' + Number(amount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    }
    return '₦' + Number(amount).toLocaleString('en-NG');
  }

  function renderPresetButtons() {
    const options = presetAmounts[selectedCurrency] || presetAmounts.NGN;
    const selectedMarkup = options.map((amount) => {
      const isSelected = Number(selectedAmount) === Number(amount);
      return `
        <button
          type="button"
          class="amount-btn ${isSelected ? 'selected' : ''}"
          data-amount="${amount}"
        >
          ${formatCurrency(amount, selectedCurrency)}
        </button>
      `;
    }).join('');

    amountGrid.innerHTML = `${selectedMarkup}
      <button
        type="button"
        class="amount-btn"
        id="custom-amount-btn"
        data-amount="custom"
      >
        Other
      </button>`;

    if (customLabel) {
      customLabel.textContent = selectedCurrency === 'USD' ? 'Custom amount ($)' : 'Custom amount (₦)';
    }
  }

  function refreshButton() {
    const label = frequency === 'monthly'
      ? 'Continue to secure checkout — ' + formatCurrency(selectedAmount, selectedCurrency) + '/mo'
      : 'Continue to secure checkout — ' + formatCurrency(selectedAmount, selectedCurrency);
    submitBtn.textContent = label;
  }

  function resetCurrencyState(nextCurrency) {
    selectedCurrency = String(nextCurrency || 'NGN').toUpperCase();
    selectedAmount = defaultSelectedAmount[selectedCurrency] ?? defaultSelectedAmount.NGN;
    customField.style.display = 'none';
    customInput.value = '';
    renderPresetButtons();
    refreshButton();
  }

  amountGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('.amount-btn');
    if (!btn) return;

    [...amountGrid.querySelectorAll('.amount-btn')].forEach((b) => b.classList.remove('selected'));
    btn.classList.add('selected');

    if (btn.dataset.amount === 'custom') {
      customField.style.display = 'block';
      const v = parseInt(customInput.value, 10);
      selectedAmount = v > 0 ? v : 0;
      customInput.focus();
    } else {
      customField.style.display = 'none';
      selectedAmount = Number(btn.dataset.amount);
    }
    refreshButton();
  });

  customInput.addEventListener('input', () => {
    const v = parseInt(customInput.value, 10);
    selectedAmount = v > 0 ? v : 0;
    refreshButton();
  });

  currencyInput.addEventListener('change', () => {
    const nextCurrency = (currencyInput?.value || 'ngn').toUpperCase();
    resetCurrencyState(nextCurrency);
  });

  freqToggle.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-freq]');
    if (!btn) return;
    [...freqToggle.querySelectorAll('button')].forEach((b) => b.classList.remove('selected'));
    btn.classList.add('selected');
    frequency = btn.dataset.freq;
    refreshButton();
  });

  renderPresetButtons();
  refreshButton();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    statusEl.className = 'status-msg';

    const currencyCode = selectedCurrency.toUpperCase();
    const minimum = currencyCode === 'USD' ? 1 : 100;

    if (!selectedAmount || selectedAmount < minimum) {
      statusEl.textContent = currencyCode === 'USD'
        ? 'Please choose or enter a valid donation amount (minimum $1).'
        : 'Please choose or enter a valid donation amount (minimum ₦100).';
      statusEl.className = 'status-msg show status-err';
      return;
    }

    const payload = {
      amount: Number(selectedAmount),
      currency: currencyCode,
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
