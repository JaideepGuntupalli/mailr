import aws from "aws-sdk";

import { env } from "../../env/server.mjs";

declare global {
  // eslint-disable-next-line no-var
  var s3: aws.S3 | undefined;
}

export const s3 =
  global.s3 ||
  new aws.S3({
    accessKeyId: env.ACCESS_KEY_ID_AWS,
    secretAccessKey: env.SECRET_ACCESS_KEY_AWS,
    region: env.REGION_AWS,
    signatureVersion: "v4",
  });
