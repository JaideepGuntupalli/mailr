import nodemailer from "nodemailer";
import { sendEmail } from "./mailer";
import { env } from "./../env/server.mjs";

export const sendMassMails = async ({
  session,
  csvJson,
  to,
  subject,
  body,
  attachment,
}: {
  session: any;
  csvJson: any;
  to: string;
  subject: string;
  body: string;
  attachment: {
    filename: string;
    path: string;
  };
}) => {
  // maintain a array of emails and their respective names and mail status
  const emailStatus = [];

  for (let i = 0; i < csvJson.length; i++) {
    const substitutedTo = to.replace("{{email}}", csvJson[i].email);
    const substitutedSubject = subject.replace("{{name}}", csvJson[i].name);
    const substitutedBody = body.replace("{{name}}", csvJson[i].name);

    const args = {
      session: session,
      to: csvJson[i].email,
      subject: substitutedSubject,
      body: substitutedBody,
      attachment: attachment,
    };

    console.log(csvJson[i], args);

    const res = await sendEmail(args);

    if (!res || res.success === false) {
      emailStatus.push({
        email: csvJson[i].email,
        name: csvJson[i].name,
        status: "failed",
      });
    } else {
      emailStatus.push({
        email: csvJson[i].email,
        name: csvJson[i].name,
        status: "success",
      });
    }

    console.log(emailStatus[i]);
  }

  // send a mail to the user with the status of all the emails sent
  let mailConfig = {};

  if (env.NODE_ENV === "production") {
    mailConfig = {
      host: "smtp.mail.me.com",
      port: 587,
      secure: false,
      tls: {
        ciphers: "SSLv3",
        rejectUnauthorized: false,
      },
      auth: {
        user: "guntupallijaideep@icloud.com",
        pass: env.EMAIL_PASS,
      },
      debug: true,
      logger: true,
    };
  } else {
    const testAccount = await nodemailer.createTestAccount();
    mailConfig = {
      host: "smtp.ethereal.email",
      port: 587,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    };
  }

  const transporter = nodemailer.createTransport(mailConfig);

  const mailOptions = {
    from: '"Mailr" <mailr@gjd.one>',
    to: session.user.email,
    subject: "Your Mailr Mass Mail Report",
    html: `
    <h1>Mailr Mass Mail Report</h1>
    <p>Here is the status of your mass mail:</p>
    <table>
        <tr>
          <th>Email</th>
          <th>Name</th>
          <th>Status</th>
        </tr>
        ${emailStatus
          .map(
            (email) => `
        <tr>
          <td>${email.email}</td>
          <td>${email.name}</td>
          <td>${email.status}</td>
        </tr>
        `
          )
          .join("")}
    </table>`,
  };

  const mail = await transporter.sendMail(mailOptions);

  console.log("Message sent: %s", nodemailer.getTestMessageUrl(mail));
};
