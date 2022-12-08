import { z } from "zod";
import { sendEmail } from "../../../utils/mailer";
import { mailOptions } from "../../../utils/validation/mail";

import { router, publicProcedure } from "../trpc";

export const mailRouter = router({
  hello: publicProcedure
    .input(z.object({ text: z.string().nullish() }).nullish())
    .query(({ input }) => {
      return {
        greeting: `Hello ${input?.text ?? "world"}`,
      };
    }),
  send: publicProcedure.input(mailOptions).mutation(async ({ input, ctx }) => {
    const { to, subject, body } = input;
    const args = {
      session: ctx.session,
      to,
      subject,
      body,
    };
    sendEmail(args);
    return {
      message: `Email sent to ${to}`,
    };
  }),
});
