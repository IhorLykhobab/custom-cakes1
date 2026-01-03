fetch('/admin/orders')
  .then(res => res.json())
  .then(orders => {
    const container = document.getElementById('orders');

    if (!orders.length) {
      container.textContent = 'No orders yet.';
      return;
    }

    orders.reverse().forEach(order => {
      const div = document.createElement('div');
      div.className = 'order';

      div.innerHTML = `
        <p><strong>Name:</strong> ${order.customer_name}</p>
        <p><strong>Email:</strong> ${order.email}</p>
        <p><strong>Cake:</strong> ${order.cake_type}</p>
        <p><strong>Date:</strong> ${order.event_date}</p>
        <p><strong>Age:</strong> ${order.child_age}</p>
        <p><strong>Amount:</strong> $${order.amount}</p>
        <p><strong>Notes:</strong> ${order.notes}</p>
        <p><strong>Paid at:</strong> ${new Date(order.created * 1000).toLocaleString()}</p> `;

      container.appendChild(div);
    });
  })
  .catch(err => {
    console.error(err);
  });