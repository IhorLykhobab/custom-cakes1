// Получаем session_id из URL: success.html?session_id=cs_test_...
const params = new URLSearchParams(window.location.search);
const sessionId = params.get('session_id');

if (sessionId) {
  fetch(`http://localhost:4242/checkout-session?sessionid=${sessionId}`)
  .then(res => res.json())
    .then(data => {
      const details = document.getElementById('orderDetails');

      if (!details) return;

      // Выводим metadata (если есть)
      const metadata = data.metadata || {};
      for (const key in metadata) {
        const li = document.createElement('li');
        li.textContent = `${key}: ${metadata[key]}`;
        details.appendChild(li);
      }

      // Показываем сумму оплаты
      if (data.amount_total && data.currency) {
        const liAmount = document.createElement('li');
        liAmount.textContent = `Amount Paid: $${data.amount_total / 100} ${data.currency.toUpperCase()}`;
        details.appendChild(liAmount);
      }
    })
    .catch((err) => {
      console.error('Error fetching session:', err);
    });
} else {
  const details = document.getElementById('orderDetails');
  if (details) details.textContent = 'No session ID found.';
}