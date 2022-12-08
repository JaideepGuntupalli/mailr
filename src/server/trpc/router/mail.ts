import { z } from "zod";
import { sendEmail } from "../../../utils/mailer";
import * as trpc from "@trpc/server";
import { mailUrlOptions } from "../../../utils/validation/mail";

import { router, publicProcedure } from "../trpc";
import { env } from "../../../env/server.mjs";

export const mailRouter = router({
  hello: publicProcedure
    .input(z.object({ text: z.string().nullish() }).nullish())
    .query(({ input }) => {
      return {
        greeting: `Hello ${input?.text ?? "world"}`,
      };
    }),
  send: publicProcedure
    .input(mailUrlOptions)
    .mutation(async ({ input, ctx }) => {
      const { to, subject, body, attachment } = input;
      const args = {
        session: ctx.session,
        to,
        subject,
        body,
        attachment,
      };
      const res = await sendEmail(args);

      if (!res || res.success === false) {
        throw new trpc.TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not send email",
        });
      }

      return {
        message: `Email sent to ${to}`,
      };
    }),
  createPresignedUrl: publicProcedure.mutation(async ({ ctx }) => {
    if (!ctx.session) {
      throw new trpc.TRPCError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      });
    }

    const params = {
      Bucket: env.AWS_BUCKET_NAME,
      Fields: {
        key: `${ctx.session.user?.id}/${Date.now()}`,
      },
      Expires: 60,
      Conditions: [
        ["content-length-range", 0, 1048576], // up to 1 MB
      ],
    };

    const uploadUrl = await ctx.s3.createPresignedPost(params);

    if (!uploadUrl) {
      throw new trpc.TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Could not create presigned URL",
      });
    }

    return uploadUrl;
  }),
});
