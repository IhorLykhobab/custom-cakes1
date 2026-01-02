document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get('session_id');

  const details = document.getElementById('orderDetails');

  if (!details) {
    console.error('❌ Элемент #orderDetails не найден');
    return;
  }

  if (!sessionId) {
    details.textContent = 'No session id found';
    console.error('❌ No session id found in URL');
    return;
  }

  console.log('✅ session_id:', sessionId);

  fetch(`/checkout-session?session_id=${sessionId}`)
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch session');
      return res.json();
    })
    .then(session => {
      details.innerHTML = '';

      // === СУММА ===
      if (session.amount_total && session.currency) {
        const li = document.createElement('li');
        li.textContent = `💰 Amount paid: $${(session.amount_total / 100).toFixed(2)} ${session.currency.toUpperCase()}`;
        details.appendChild(li);
      }

      // === EMAIL ===
      if (session.customer_details?.email) {
        const li = document.createElement('li');
        li.textContent = `📧 Email: ${session.customer_details.email}`;
        details.appendChild(li);
      }

      // === METADATA (детали заказа) ===
      const metadata = session.metadata || {};

      const labels = {
        customer_name: '👤 Name',
        cake_type: '🎂 Cake',
        event_date: '📅 Event date',
        child_age: '🎉 Age',
        notes: '📝 Notes'
      };

      for (const key in metadata) {
        const li = document.createElement('li');
        li.textContent = `${labels[key] || key}: ${metadata[key]}`;
        details.appendChild(li);
      }
    })
    .catch(err => {
      console.error('❌ Error loading order details:', err);
      details.textContent = 'Failed to load order details.';
    });
});