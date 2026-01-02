require('dotenv').config();
const express = require('express');
const path = require('path');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const PORT = process.env.PORT || 4242;

// ===== Статика фронтенда =====
app.use(express.static(path.join(__dirname, '..')));

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

// ===== Создание Checkout Session =====
app.post('/create-checkout-session', express.json(), async (req, res) => {
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
  const sessionId = req.query.sessionId;
  if (!sessionId) return res.status(400).json({ error: 'No sessionId provided' });

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    res.json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve session' });
  }
});

// ===== Stripe Webhook =====
// ⚠️ Используем express.raw(), чтобы передать Stripe _raw_ body
app.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      console.log('Webhook received!', event.type);
    } catch (err) {
      console.error('❌ Webhook signature verification failed.', err.message);
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

// ===== Запуск сервера =====
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));