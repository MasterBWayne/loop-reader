import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || '';

export async function POST(req: NextRequest) {
  if (!STRIPE_SECRET) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  const stripe = new Stripe(STRIPE_SECRET);

  try {
    const { priceId, userId, userEmail } = await req.json();

    if (!priceId || !userId) {
      return NextResponse.json({ error: 'Missing priceId or userId' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${req.nextUrl.origin}?checkout=success`,
      cancel_url: `${req.nextUrl.origin}?checkout=cancel`,
      client_reference_id: userId,
      customer_email: userEmail || undefined,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('[Create Checkout] Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
