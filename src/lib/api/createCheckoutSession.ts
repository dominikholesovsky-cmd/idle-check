import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import Stripe from "stripe";

const InputSchema = z.object({
  vehicleLabel: z.string(),
  reportId: z.string(),
  successUrl: z.string(),
  cancelUrl: z.string(),
});

export const createCheckoutSession = createServerFn({ method: "POST" })
  .inputValidator(InputSchema)
  .handler(async ({ data }) => { // OPRAVA: Změněno zpět na { data }
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2024-12-18.acacia",
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Idle Check — Full Report`,
              description: `${data.vehicleLabel} inspection report`, // OPRAVA: data místo input
            },
            unit_amount: 499, // $4.99 v centech
          },
          quantity: 1,
        },
      ],
      success_url: `${data.successUrl}?session_id={CHECKOUT_SESSION_ID}&report_id=${data.reportId}`, // OPRAVA: data místo input
      cancel_url: data.cancelUrl, // OPRAVA: data místo input
      metadata: {
        reportId: data.reportId, // OPRAVA: data místo input
      },
    });

    return { sessionUrl: session.url };
  });