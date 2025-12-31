require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const PORT = process.env.PORT || 4242;

app.use(express.static(path.join(__dirname, '..')));
app.use(express.json());

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

app.get('/prices', (req, res) => {
  res.json(cakePrices);
});

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
      success_url: 'http://localhost:4242/success.html?session_Id={CHECKOUT_SESSION_ID}',
      cancel_url: 'http://localhost:4242/cancel.html',
    });

    res.json({ id: session.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong creating the session' });
  }
});
// Получение данных сессии Stripe по session_id
// Получаем информацию о сессии Stripe
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
app.listen(PORT, () => console.log('Server running on http://localhost:4242'));