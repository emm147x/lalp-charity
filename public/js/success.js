// Thank-you page: confirms what the donation was directed toward by
// verifying the transaction with the server, rather than trusting
// anything the browser held on to before checkout.
document.addEventListener('DOMContentLoaded', async () => {
  const heading = document.getElementById('thank-you-heading');
  if (!heading) return;

  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get('session_id');
  const reference = params.get('reference') || params.get('trxref');
  if (!sessionId && !reference) return;

  try {
    const query = sessionId
      ? `session_id=${encodeURIComponent(sessionId)}`
      : `reference=${encodeURIComponent(reference)}`;
    const res = await fetch(`/api/donation-details?${query}`);
    if (!res.ok) return;

    const data = await res.json();
    if (data.status !== 'success') return;

    heading.textContent = data.designationKey === 'general'
      ? "Your donation has been directed to where it's needed most."
      : `Your donation has been directed toward ${data.designationLabel}.`;
  } catch (err) {
    // Keep the default heading if details can't be loaded.
  }
});
