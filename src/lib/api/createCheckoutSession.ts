import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import Stripe from "stripe";
import { PRICE_USD } from "@/lib/ghost/constants";

const InputSchema = z.object({
  vehicleLabel: z.string(),
  reportId: z.string(),
  successUrl: z.string(),
  cancelUrl: z.string(),
  customerEmail: z.string().trim().toLowerCase().email().max(254).optional(),
});

export const createCheckoutSession = createServerFn({ method: "POST" })
  .validator(InputSchema)
  .handler(async ({ data }) => { // OPRAVA: Změněno zpět na { data }
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

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
            unit_amount: Math.round(PRICE_USD * 100), // cents
          },
          quantity: 1,
        },
      ],
      success_url: `${data.successUrl}?session_id={CHECKOUT_SESSION_ID}&report_id=${data.reportId}`, // OPRAVA: data místo input
      cancel_url: data.cancelUrl, // OPRAVA: data místo input
      ...(data.customerEmail ? { customer_email: data.customerEmail } : {}),
      metadata: {
        reportId: data.reportId, // OPRAVA: data místo input
      },
    });

    return { sessionUrl: session.url };
  });