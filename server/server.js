require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const PORT = process.env.PORT || 4242;
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: true, // для 465 порта
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
async function sendOrderEmail(order) {
  try {
    // Письмо клиенту
    await transporter.sendMail({
      from: `"Custom Cakes" <${process.env.EMAIL_USER}>`,
      to: order.email,
      subject: `Your Cake Order #${order.id} is Confirmed!`,
      html: `
        <h2>Thank you for your order, ${order.metadata.customer_name}!</h2>
        <p><strong>Cake:</strong> ${order.metadata.cake_type}</p>
        <p><strong>Date:</strong> ${order.metadata.event_date}</p>
        <p><strong>Age:</strong> ${order.metadata.child_age}</p>
        <p><strong>Notes:</strong> ${order.metadata.notes}</p>
        <p><strong>Amount Paid:</strong> $${order.amount} ${order.currency.toUpperCase()}</p>`
      
    });

    // Письмо для админа (тебя)
    await transporter.sendMail({
      from:`"Custom Cakes" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // сюда придет уведомление
      subject: `New Order Received #${order.id}`,
      html: `
        <h2>New order received!</h2>
        <p><strong>Name:</strong> ${order.metadata.customer_name}</p>
        <p><strong>Email:</strong> ${order.email}</p>
        <p><strong>Cake:</strong> ${order.metadata.cake_type}</p>
        <p><strong>Date:</strong> ${order.metadata.event_date}</p>
        <p><strong>Age:</strong> ${order.metadata.child_age}</p>
        <p><strong>Notes:</strong> ${order.metadata.notes}</p>
        <p><strong>Amount Paid:</strong> $${order.amount} ${order.currency.toUpperCase()}</p>`
      
    });

    console.log('📧 Emails sent successfully!');
  } catch (err) {
    console.error('❌ Failed to send email:', err);
  }
}

// ===== Stripe Webhook =====
// Важно: маршрут для webhook помещаем ДО других парсеров/статических middleware,
// чтобы тело запроса осталось необработанным.
app.post(
  '/webhook',
  // принимаем raw любой тип, чтобы защищаться от разных Content-Type headers
  express.raw({ type: '*/*' }),
  (req, res) => {
    const sig = req.headers['stripe-signature'];

    // Отладочная информация — не логируйте секреты в проде
    console.log('--- webhook received ---');
    console.log('stripe-signature header present:', !!sig);
    console.log('raw body length:', req.body ? req.body.length : 0);

    if (!sig) {
      console.error('No stripe-signature header present. Headers:', req.headers);
      return res.status(400).send('Webhook Error: Missing stripe-signature header');
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
      console.log('✅ Webhook verified, event type:', event.type);
    } catch (err) {
      console.error('❌ Webhook signature verification failed.', err.message);
      // Для отладки можно вывести первые N байт тела в base64 (но НЕ сам секрет)
      console.error('raw body (base64, first 500 chars):', req.body ? req.body.toString('base64').slice(0, 500) : '<no body>');
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // обработка успешной оплаты
    if (event.type === 'checkout.session.completed') {
  const session = event.data.object;

  const order = {
    id: session.id,
    email: session.customer_details?.email || '',
    amount: session.amount_total / 100,
    currency: session.currency,
    metadata: session.metadata,
    createdAt: new Date().toISOString()
  };

  const ordersPath = path.join(__dirname, 'orders.json');

  let orders = [];
  if (fs.existsSync(ordersPath)) {
    orders = JSON.parse(fs.readFileSync(ordersPath, 'utf8'));
  }

  orders.push(order);
  fs.writeFileSync(ordersPath, JSON.stringify(orders, null, 2));

  console.log('📦 Order saved:', order);
  sendOrderEmail(order);
}

    res.json({ received: true });
  }
);
// ===== Админ: получить все заказы =====
app.get('/admin/orders', (req, res) => {
  try {
    const data = fs.readFileSync(path.join(__dirname, 'orders.json'), 'utf8');
    const orders = data ? JSON.parse(data) : [];
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load orders' });
  }
});
// ===== Статика фронтенда =====
app.use(express.static(path.join(__dirname, '..')));

// ===== Middleware для json, кроме webhook =====
// (оставляем этот pattern, но webhook уже выше — глобальный json можно безопасно применять)
app.use((req, res, next) => {
  // express.json() применяется ко всем, webhook уже обработан выше
  express.json()(req, res, next);
});

// ===== Цены тортов =====
const cakePrices = {
  customcake: 120,
  citrusspecial: 95,
  dailyspecial: 90,
  happyb2: 100,
  happyb3: 105,
  happybirthday: 110,
  jellydesert: 95,
  spiderman: 120
};

// ===== Получение цен =====
app.get('/prices', (req, res) => {
  res.json(cakePrices);
});

// ===== Создание Checkout Session =====
app.post('/create-checkout-session', async (req, res) => {
  try {
    const { cake, name, date, age, message } = req.body;

    if (!cake || !cakePrices[cake]) {
      return res.status(400).json({ error: 'Invalid cake selected' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: cake },
            unit_amount: cakePrices[cake] * 100,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      metadata: {
        customer_name: name,
        cake_type: cake,
        event_date: date,
        child_age: age,
        notes: message || 'No notes',
      },
      success_url: 'https://custom-cakes1.onrender.com/success.html?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://custom-cakes1.onrender.com/cancel.html',
    });

    res.json({ id: session.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong creating the session' });
  }
});

// ===== Получение данных сессии =====
app.get('/checkout-session', async (req, res) => {
  const sessionId = req.query.session_id;
  if (!sessionId) return res.status(400).json({ error: 'No sessionId provided' });

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    res.json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve session' });
  }
});

// ===== Запуск сервера =====
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // Показать, что webhook secret установлен (без вывода значения)
  console.log('STRIPE_WEBHOOK_SECRET exists:', !!process.env.STRIPE_WEBHOOK_SECRET);
});