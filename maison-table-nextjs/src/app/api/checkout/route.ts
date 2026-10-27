import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe not configured — set STRIPE_SECRET_KEY in .env.local" },
      { status: 503 },
    );
  }

  try {
    const body = await request.json();
    const { amount } = body as { amount: number };

    // TODO: create real PaymentIntent
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: Math.round(amount * 100),
    //   currency: "usd",
    //   automatic_payment_methods: { enabled: true },
    // });
    // return NextResponse.json({ clientSecret: paymentIntent.client_secret });

    return NextResponse.json({
      clientSecret: null,
      message: "Stripe stub — wire up PaymentIntent creation here",
      amount,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
