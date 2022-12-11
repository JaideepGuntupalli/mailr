import { z } from "zod";
import * as trpc from "@trpc/server";
import {
  mailUrlOptions,
  multipleMailUrlOptions,
} from "../../../utils/validation/mail";

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
  test: publicProcedure.query(async ({ input }) => {
    const requestOptions = {
      method: "GET",
      redirect: "follow",
    };

    const res = await fetch(
      `${env.MAIL_API_LINK}/test`,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      requestOptions
    );

    return res.text();
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

      // make a post request to "http://localhost:3000/onemail" with the args
      const res = await fetch(`${env.MAIL_API_LINK}/onemail`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(args),
      });

      if (res.status !== 200) {
        throw new trpc.TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not send email",
        });
      }

      return {
        message: `Email sent to ${to}`,
      };
    }),
  sendMultipleMails: publicProcedure
    .input(multipleMailUrlOptions)
    .mutation(async ({ input, ctx }) => {
      const { csvJson, to, subject, body, attachment } = input;

      const args = {
        session: ctx.session,
        csvJson,
        to,
        subject,
        body,
        attachment,
      };

      // const res = await sendMassMails(args);
      console.log(JSON.stringify(args));

      const res = await fetch(`${env.MAIL_API_LINK}/mulmail`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(args),
      });

      if (res.status !== 200) {
        throw new trpc.TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not send emails",
        });
      }

      return {
        message: `Emails have been queued. You will be notified when they are sent with a report of their status via mail.${res.text()}`,
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
