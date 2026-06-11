import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import Stripe from "stripe";

export const verifyStripeSession = createServerFn({ method: "POST" })
  .inputValidator(z.object({ sessionId: z.string() }))
  .handler(async ({ data }) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const session = await stripe.checkout.sessions.retrieve(data.sessionId);

    if (session.payment_status !== "paid") {
      throw new Error("Payment not completed");
    }

    return {
      paid: true,
      reportId: session.metadata?.reportId ?? null,
    };
  });
