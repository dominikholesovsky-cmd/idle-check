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
  .handler(async ({ input }) => { // OPRAVA: Změněno z { data } na { input }
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
              description: `${input.vehicleLabel} inspection report`, // OPRAVA: Použití input
            },
            unit_amount: 499, // $4.99 v centech
          },
          quantity: 1,
        },
      ],
      success_url: `${input.successUrl}?session_id={CHECKOUT_SESSION_ID}&report_id=${input.reportId}`, // OPRAVA: Použití input
      cancel_url: input.cancelUrl, // OPRAVA: Použití input
      metadata: {
        reportId: input.reportId, // OPRAVA: Použití input
      },
    });

    return { sessionUrl: session.url };
  });