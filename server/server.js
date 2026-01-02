require('dotenv').config();
const express = require('express');
const path = require('path');
const crypto = require('crypto');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const PORT = process.env.PORT || 4242;

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
      console.log('✅ Checkout session completed!', {
        email: session.customer_details?.email,
        amount: session.amount_total / 100,
        metadata: session.metadata,
      });
    }

    res.json({ received: true });
  }
);

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