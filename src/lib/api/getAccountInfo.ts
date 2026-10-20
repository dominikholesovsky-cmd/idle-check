import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { verifyAccessToken } from "./_auth";
import { isAdminEmail } from "./_admin";

// The client uses `isAdmin` only to decide what to show. Every privileged server function checks again.
export const getAccountInfo = createServerFn({ method: "POST" })
  .validator(z.object({ accessToken: z.string().min(1).max(4096) }))
  .handler(async ({ data }) => {
    const user = await verifyAccessToken(data.accessToken);
    return { email: user.email, isAdmin: isAdminEmail(user.email) };
  });
