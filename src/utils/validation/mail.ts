import { z } from "zod";

const ACCEPTED_FILE_TYPES = ["application/pdf"];
const MAX_FILE_SIZE = 1024 * 1024; // 1MB

export const mailOptions = z.object({
  to: z.string(),
  subject: z.string(),
  body: z.string(),
  attachment: z
    .any()
    .refine((files) => files?.length == 1, "File is required.")
    .refine(
      (files) => files?.[0]?.size <= MAX_FILE_SIZE,
      `Max file size is 1MB.`
    )
    .refine(
      (files) => ACCEPTED_FILE_TYPES.includes(files?.[0]?.type),
      "Only .pdf files are accepted."
    ),
});

export const mailUrlOptions = z.object({
  to: z.string(),
  subject: z.string(),
  body: z.string(),
  attachment: z.object({
    filename: z.string(),
    path: z.string().url(),
  }),
});

export const multipleMailUrlOptions = z.object({
  csvJson: z.array(
    z.object({
      email: z.string().email(),
      name: z.string(),
    })
  ),
  to: z.string(),
  subject: z.string(),
  body: z.string(),
  attachment: z.object({
    filename: z.string(),
    path: z.string().url(),
  }),
});

export type MailOpts = z.infer<typeof mailOptions>;
