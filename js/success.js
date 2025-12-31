const params = new URLSearchParams(window.location.search);
const sessionId = params.get('session_id');

if (sessionId) {
  fetch(`${window.location.origin}/checkout-session?session_id=${sessionId}`)
    .then(res => res.json())
    .then(data => {
      const details = document.getElementById('orderDetails');
      if (!details) return;

      const metadata = data.metadata || {};
      for (const key in metadata) {
        const li = document.createElement('li');
        li.textContent = `${key}: ${metadata[key]}`;
        details.appendChild(li);
      }

      if (data.amount_total && data.currency) {
        const liAmount = document.createElement('li');
        liAmount.textContent = `Amount Paid: $${data.amount_total / 100} ${data.currency.toUpperCase()}`;
        details.appendChild(liAmount);
      }
    })
    .catch(err => console.error('Error fetching session:', err));
} else {
  const details = document.getElementById('orderDetails');
  if (details) details.textContent = 'No session ID found.';
}