const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { packageId, name, email } = req.body;

    const packages = {
      foundation: {
        name: 'Foundation Package — $2,500/mo',
        amount: 250000,
        description: 'Website build, Google Business Profile, 1 paid channel, monthly report, brand video, local SEO'
      },
      growth: {
        name: 'Growth Package — $4,500/mo',
        amount: 450000,
        description: 'Everything in Foundation + Meta & Google, monthly shoots, local SEO + citations, weekly strategy, full creative'
      },
      elite: {
        name: 'Elite Package — $7,500/mo',
        amount: 750000,
        description: 'Everything in Growth + aggressive ad mgmt, weekly content, PR strategy, dedicated manager, quarterly brand strategy'
      }
    };

    const pkg = packages[packageId];
    if (!pkg) {
      return res.status(400).json({ error: 'Invalid package' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: email || undefined,
      metadata: {
        package: packageId,
        customer_name: name || '',
        customer_email: email || ''
      },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: pkg.name,
              description: pkg.description,
            },
            unit_amount: pkg.amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${req.headers.origin || 'https://pitch.injury.media'}/nik?payment=success&package=${packageId}`,
      cancel_url: `${req.headers.origin || 'https://pitch.injury.media'}/nik?payment=cancelled`,
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err.message);
    res.status(500).json({ error: err.message });
  }
};
