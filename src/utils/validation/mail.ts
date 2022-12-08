import { z } from "zod";

export const mailOptions = z.object({
  to: z.string().email(),
  subject: z.string(),
  body: z.string(),
});

export type MailOpts = z.infer<typeof mailOptions>;
