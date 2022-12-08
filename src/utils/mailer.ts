import nodemailer from "nodemailer";
import { env } from "./../env/server.mjs";

const CLIENT_ID = env.GOOGLE_CLIENT_ID;
const CLEINT_SECRET = env.GOOGLE_CLIENT_SECRET;

export const sendEmail = async ({
  session,
  to,
  subject,
  body,
}: {
  session: any;
  to: string;
  subject: string;
  body: string;
}) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      type: "OAuth2",
      user: session.user.email,
      clientId: CLIENT_ID,
      clientSecret: CLEINT_SECRET,
      refreshToken: session.refreshToken,
      accessToken: session.accessToken,
      expires: session.expires,
    },
  });

  const mailOptions = {
    from: `"${session.user.name}" <${session.user.email}>`,
    to: to,
    subject: subject,
    text: body,
  };

  const mail = await transporter.sendMail(mailOptions);

  console.log("Message sent: %s", mail.messageId);
};