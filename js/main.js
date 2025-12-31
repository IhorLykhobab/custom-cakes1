document.addEventListener('DOMContentLoaded', () => {
  const stripe = Stripe('pk_test_51SjKQVE0nReDfuKv8TpCVHpogoiqW6CdktJePLj5fQc6aXYJfuyhHIOMfLkAXWqjUllN70Dm9XElFTmqXbfkfmbF00L6ve2jti');
  const form = document.getElementById('cakeOrderForm');
  const formMessage = document.getElementById('formMessage');
  const payButton = document.getElementById('payButton');
  let prices = {};

  // Получаем цены с сервера
  fetch('/prices')
    .then(res => res.json())
    .then(data => prices = data)
    .catch(err => console.error('Error fetching prices:', err));

  // Элемент для отображения цены
  const cakeSelect = document.getElementById('cake');
  const priceText = document.getElementById('cakePrice');

  // Показываем цену при выборе торта
  cakeSelect.addEventListener('change', () => {
    const cake = cakeSelect.value;
    if (!cake || !prices[cake]) {
      priceText.textContent = '';
      return;
    }
    priceText.textContent = `Price: $${prices[cake]}`;
  });
  // Place Order
  form.addEventListener('submit', function(e) {
    e.preventDefault();

    const name = form.name.value;
    const date = form.date.value;
    const age = form.age.value;
    const cake = form.cake.value;
    const message = form.message.value;

    formMessage.textContent = `Thank you, ${name}! Your order for "${cake}" on ${date} has been received.`;

    form.reset();
    priceText.textContent = '';
  });

  // Pay Now
  payButton.addEventListener('click', async () => {
    if (!form.cake.value) {
      alert("Please select a cake before paying.");
      return;
    }

    try {
      const response = await fetch('/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cake: form.cake.value,
          name: form.name.value,
          date: form.date.value,
          age: form.age.value,
          message: form.message.value
        })
      });

      const session = await response.json();

      if (session.error) {
        alert(session.error);
        return;
      }

      const result = await stripe.redirectToCheckout({ sessionId: session.id });

      if (result.error) {
        alert(result.error.message);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      alert('There was an error connecting to the server.');
    }
  });
  // Лайтбокс
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');

document.querySelectorAll('.cake img').forEach(img => {
  img.addEventListener('click', () => {
    lightbox.style.display = 'flex';
    lightboxImg.src = img.src;
  });
});

lightbox.addEventListener('click', () => {
  lightbox.style.display = 'none';
});
const langSwitcher = document.getElementById('languageSwitcher');

// Тексты на двух языках
const texts = {
  en: {
    heroTitle: "Custom Cakes for Kids’ Birthdays",
    heroSubtitle: "Made with love in Brookings, SD",
    orderTitle: "Order Your Cake",
    nameLabel: "Your Name:",
    emailLabel: "Your Email:",
    dateLabel: "Date of Celebration:",
    ageLabel: "Child's Age:",
    cakeLabel: "Choose Your Cake:",
    messageLabel: "Additional Notes:",
    placeOrder: "Place Order",
    payNow: "Pay Now",
  },
  es: {
    heroTitle: "Pasteles Personalizados para Cumpleaños Infantiles",
    heroSubtitle: "Hecho con amor en Brookings, SD",
    orderTitle: "Ordena Tu Pastel",
    nameLabel: "Tu Nombre:",
    emailLabel: "Tu Correo:",
    dateLabel: "Fecha de Celebración:",
    ageLabel: "Edad del Niño:",
    cakeLabel: "Elige Tu Pastel:",
    messageLabel: "Notas Adicionales:",
    placeOrder: "Ordenar",
    payNow: "Pagar Ahora",
  }
};

langSwitcher.addEventListener('change', () => {
  const lang = langSwitcher.value;
  document.querySelector('.hero h1').textContent = texts[lang].heroTitle;
  document.querySelector('.hero p').textContent = texts[lang].heroSubtitle;
  document.querySelector('#order h2').textContent = texts[lang].orderTitle;
  document.querySelector('label[for="name"]').textContent = texts[lang].nameLabel;
  document.querySelector('label[for="email"]').textContent = texts[lang].emailLabel;
  document.querySelector('label[for="date"]').textContent = texts[lang].dateLabel;
  document.querySelector('label[for="age"]').textContent = texts[lang].ageLabel;
  document.querySelector('label[for="cake"]').textContent = texts[lang].cakeLabel;
  document.querySelector('label[for="message"]').textContent = texts[lang].messageLabel;
  document.querySelector('button[type="submit"]').textContent = texts[lang].placeOrder;
  document.querySelector('#payButton').textContent = texts[lang].payNow;
});
// ================= LANGUAGE SWITCH =================
const dateInput = document.getElementById('date');
const datePreview = document.getElementById('dataPreview');

function updateDatePreview(lang) {
  if (!dateInput.value) {
    datePreview.textContent = '';
    return;
  }

  const date = new Date(dateInput.value);

  const options =
    lang === 'es'
      ? { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
      : { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

  datePreview.textContent =
    lang === 'es'
      ? `Fecha seleccionada: ${date.toLocaleDateString('es-ES', options)}`
      : `Selected date: ${date.toLocaleDateString('en-US', options)};`
}

// реагируем на выбор даты
dateInput.addEventListener('change', () => {
  updateDatePreview(langSwitcher.value);
});

// реагируем на смену языка
langSwitcher.addEventListener('change', () => {
  updateDatePreview(langSwitcher.value);
});
const cakeNames = {
  en: {
    customcake: "Custom Birthday Cake",
    citrusspecial: "Citrus Special Cake",
    dailyspecial: "Daily Special Cake",
    happyb2: "Happy Birthday Cake 2",
    happyb3: "Happy Birthday Cake 3",
    happybirthday: "Happy Birthday Cake",
    jellydesert: "Jelly Dessert Cake",
    spiderman: "Spiderman Cake"
  },
  es: {
    customcake: "Pastel de Cumpleaños Personalizado",
    citrusspecial: "Pastel Especial de Cítricos",
    dailyspecial: "Pastel del Día",
    happyb2: "Pastel Feliz Cumpleaños 2",
    happyb3: "Pastel Feliz Cumpleaños 3",
    happybirthday: "Pastel de Cumpleaños",
    jellydesert: "Postre de Gelatina",
    spiderman: "Pastel de Spiderman"
  }
};

function changeLanguage(lang) {
  // Hero
  document.querySelector('.hero h1').textContent = texts[lang].heroTitle;
  document.querySelector('.hero p').textContent = texts[lang].heroSubtitle;
  document.querySelector('.btn').textContent = lang === 'en' ? 'Order a Cake' : 'Ordenar Pastel';

  // Order section
  document.querySelector('#order h2').textContent = texts[lang].orderTitle;
  document.querySelector('label[for="name"]').textContent = texts[lang].nameLabel;
  document.querySelector('label[for="email"]').textContent = texts[lang].emailLabel;
  document.querySelector('label[for="date"]').textContent = texts[lang].dateLabel;
  document.querySelector('label[for="age"]').textContent = texts[lang].ageLabel;
  document.querySelector('label[for="cake"]').textContent = texts[lang].cakeLabel;
  document.querySelector('label[for="message"]').textContent = texts[lang].messageLabel;

  document.querySelector('button[type="submit"]').textContent = texts[lang].placeOrder;
  document.querySelector('#payButton').textContent = texts[lang].payNow;

  // Gallery cake names
  document.querySelectorAll('.cake p').forEach(p => {
    const key = p.dataset.key;
    if (cakeNames[lang][key]) {
      p.textContent = cakeNames[lang][key];
    }
  });

  // Select options
  const select = document.getElementById('cake');
  Array.from(select.options).forEach(option => {
    if (cakeNames[lang][option.value]) {
      option.textContent = cakeNames[lang][option.value];
    }
  });
}

// Событие переключения
langSwitcher.addEventListener('change', () => {
  changeLanguage(langSwitcher.value);
});
});