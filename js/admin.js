fetch('https://custom-cakes1.onrender.com/admin/orders')
  .then(res => res.json())
  .then(orders => {
    const container = document.getElementById('orders');

    if (!orders.length) {
      container.textContent = 'No orders yet.';
      return;
    }

    // Показываем последние заказы первыми
    orders.reverse().forEach(order => {
      const div = document.createElement('div');
      div.className = 'order';

      // Используем template literal с backticks
      div.innerHTML = `
        <p><strong>Name:</strong> ${order.metadata.customer_name}</p>
        <p><strong>Email:</strong> ${order.email}</p>
        <p><strong>Cake:</strong> ${order.metadata.cake_type}</p>
        <p><strong>Date:</strong> ${order.metadata.event_date}</p>
        <p><strong>Age:</strong> ${order.metadata.child_age}</p>
        <p><strong>Amount:</strong> $${order.amount}</p>
        <p><strong>Notes:</strong> ${order.metadata.notes}</p>
        <p><strong>Paid at:</strong> ${new Date(order.createdAt).toLocaleString()}</p> `;

      container.appendChild(div);
    });
  })
  .catch(err => {
    console.error(err);
  });