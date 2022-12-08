import { type NextPage } from "next";
import Head from "next/head";
import { signIn, signOut, useSession } from "next-auth/react";
import { useCSVReader } from "react-papaparse";
import logo from "./../../public/logo.png";
import Image from "next/image";
import { useCallback, useState } from "react";
import Link from "next/link";
import type { MailOpts } from "../utils/validation/mail";
import { mailOptions } from "../utils/validation/mail";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { trpc } from "../utils/trpc";

const Home: NextPage = () => {
  const { CSVReader } = useCSVReader();
  const [data, setData] = useState<any[]>([]);
  const [jsonEmailData, setJsonEmailData] = useState<any[]>([]);
  const { data: sessionData } = useSession();
  const [resultStr, setResultStr] = useState("");
  const [massMail, setMassMail] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MailOpts>({
    resolver: zodResolver(mailOptions),
    defaultValues: {
      to: "",
      subject: "",
      body: "",
      attachment: [],
    },
  });

  const sendMailMutation = trpc.mail.send.useMutation({
    onSuccess: (data) => {
      console.log(data);
      setResultStr(data.message);
    },
  });

  const sendMassMailMutation = trpc.mail.sendMultipleMails.useMutation({
    onSuccess: (data) => {
      console.log(data);
      setResultStr(data.message);
    },
  });

  const getPresignedUrlMutation = trpc.mail.createPresignedUrl.useMutation();

  const onSubmit = useCallback(
    async (data: MailOpts) => {
      console.log(data);

      const { url, fields }: { url: string; fields: any } =
        (await getPresignedUrlMutation.mutateAsync()) as any;

      const fdata = {
        ...fields,
        file: data.attachment[0],
      };
      const formData = new FormData();

      Object.keys(fdata).forEach((key) => {
        formData.append(key, fdata[key]);
      });

      await fetch(url, {
        method: "POST",
        body: formData,
      });

      const newData = {
        to: data.to,
        subject: data.subject,
        body: data.body,
        attachment: {
          path: `https://mailr-attachments.s3.us-west-2.amazonaws.com/${fields.key}`,
          filename: data.attachment[0].name,
        },
      };

      if (massMail) {
        const newjData = {
          csvJson: jsonEmailData,
          to: data.to,
          subject: data.subject,
          body: data.body,
          attachment: {
            path: `https://mailr-attachments.s3.us-west-2.amazonaws.com/${fields.key}`,
            filename: data.attachment[0].name,
          },
        };
        await sendMassMailMutation.mutateAsync(newjData);
      } else {
        await sendMailMutation.mutateAsync(newData);
      }

      reset();
    },
    [
      getPresignedUrlMutation,
      sendMailMutation,
      reset,
      sendMassMailMutation,
      massMail,
      jsonEmailData,
    ]
  );

  return (
    <>
      <Head>
        <title>mailr</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col bg-gradient-to-b from-[#2e026d] to-[#15162c]">
        {sessionData ? (
          <>
            <nav className="flex justify-between px-20 py-10">
              <h1 className="flex gap-4 text-4xl font-bold text-[#cc66ff]">
                <Image src={logo} alt="Logo" width={50} height={50} />
                mailr
              </h1>
              <div
                className={
                  "flex items-center justify-center gap-2 font-semibold text-white " +
                  (!massMail ? "animate-pulse" : "")
                }
              >
                <p>Multiple Mails?</p>
                <label className="switch">
                  <input
                    type="checkbox"
                    onChange={() => setMassMail(!massMail)}
                  />
                  <span className="slider round"></span>
                </label>
              </div>
              <AuthShowcase />
            </nav>
            <div className="flex h-[80vh] items-center justify-between gap-10 px-20">
              {massMail && (
                <div className="flex h-[80vh] max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-6 text-white">
                  <h2 className="w-80 text-lg font-medium text-white">
                    {"Upload Email Addresses (.csv)"}
                  </h2>
                  <CSVReader
                    onUploadAccepted={(results: { data: any[] }) => {
                      setData(results.data);
                      const jsonData = [];
                      // first row is the header
                      const headers = results.data[0];
                      for (let i = 1; i < results.data.length; i++) {
                        const obj: any = {};
                        for (let j = 0; j < headers.length; j++) {
                          obj[headers[j]] = results.data[i][j];
                        }
                        jsonData.push(obj);
                      }
                      console.log(jsonData);
                      setJsonEmailData(jsonData);
                    }}
                  >
                    {({
                      getRootProps,
                      acceptedFile,
                      ProgressBar,
                      getRemoveFileProps,
                    }: any) => (
                      <>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            {...getRootProps()}
                            className="rounded-xl bg-white/20 px-4 py-2 text-white"
                          >
                            Browse file
                          </button>
                          {acceptedFile && (
                            <div className="flex gap-2">
                              <div>{acceptedFile && acceptedFile.name}</div>
                              <button
                                className=" text-red-500"
                                {...getRemoveFileProps()}
                              >
                                x
                              </button>
                            </div>
                          )}
                        </div>
                        <ProgressBar className="bg-white" />
                      </>
                    )}
                  </CSVReader>
                  {/* table */}
                  {data.length > 0 && (
                    <table className="w-full">
                      <thead>
                        <tr>
                          <th className="text-left">{data[0][0]}</th>
                          <th className="text-left">{data[0][1]}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((row, index) => (
                          <>
                            {index === 0 ? (
                              <> </>
                            ) : (
                              <tr key={index}>
                                <td className="text-left">{row[0]}</td>
                                <td>{row[1]}</td>
                              </tr>
                            )}
                          </>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
              <div className="flex h-[80vh] w-full flex-col gap-4 rounded-xl bg-white/10 p-6 px-8 text-white">
                <form
                  className="flex flex-col gap-6"
                  onSubmit={handleSubmit(onSubmit)}
                >
                  <label className="flex flex-col gap-2 text-sm">
                    From:
                    <input
                      className="rounded-lg py-2 px-2 text-black"
                      type="email"
                      disabled
                      value={
                        sessionData?.user?.email ? sessionData.user.email : ""
                      }
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm">
                    To:
                    <input
                      className="rounded-lg bg-white/80 py-2 px-2 text-black focus:outline-none disabled:bg-white/30"
                      disabled={massMail}
                      value={massMail ? "{{email}}" : ""}
                      {...register("to")}
                    />
                    {errors.to && (
                      <p className="text-xs text-red-500">
                        {errors.to?.message}
                      </p>
                    )}
                  </label>
                  <label className="flex flex-col gap-2 text-sm">
                    Subject:
                    <input
                      className="rounded-lg bg-white/80 py-2 px-2 text-black focus:outline-none"
                      type="text"
                      {...register("subject")}
                    />
                    {errors.subject && (
                      <p className="text-xs text-red-500">
                        {errors.subject?.message}
                      </p>
                    )}
                  </label>
                  <label className="flex flex-col gap-2 text-sm">
                    Mail Body:
                    <textarea
                      className="h-[20vh] rounded-lg bg-white/80 py-2 px-2 text-black focus:outline-none"
                      {...register("body")}
                    />
                    {errors.body && (
                      <p className="text-xs text-red-500">
                        {errors.body?.message}
                      </p>
                    )}
                  </label>
                  <label className="flex flex-col gap-2 text-sm hover:cursor-pointer">
                    Add any attachments:
                    <input
                      className="
                  rounded-lg py-2 px-2 text-sm text-white file:mr-4 file:rounded-lg file:border-0 file:bg-white/20 file:py-2 file:px-4 file:text-sm file:font-semibold file:text-white hover:file:bg-white/30"
                      type="file"
                      {...register("attachment")}
                    />
                    {errors.attachment && (
                      <p className="text-xs text-red-500">
                        {JSON.stringify(errors.attachment.message)}
                      </p>
                    )}
                  </label>
                  <button
                    className="rounded-xl bg-white/20 px-4 py-2 text-white disabled:animate-pulse disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/50"
                    disabled={
                      sendMailMutation.isLoading ||
                      getPresignedUrlMutation.isLoading ||
                      sendMassMailMutation.isLoading
                    }
                    type="submit"
                  >
                    Mail
                  </button>
                  {sendMailMutation.error && (
                    <p className="rounded-lg border-2 border-red-500 bg-red-200 p-2 text-sm text-red-600">
                      Something went wrong! {sendMailMutation.error.message}
                    </p>
                  )}
                  {resultStr !== "" && (
                    <p className="rounded-lg border-2 border-green-500 bg-green-200 p-2 text-sm text-green-600">
                      Success! {resultStr}
                    </p>
                  )}
                  {sendMassMailMutation.isLoading && (
                    <p className="rounded-lg border-2 border-yellow-500 bg-yellow-200 p-2 text-sm text-yellow-600">
                      Waiting! Emails are being sent. Please wait for a few
                      minutes. Dont close the tab.
                    </p>
                  )}
                </form>
                <Link href="/">
                  <span className="cursor-pointer text-center text-sm text-purple-700">
                    Don&apos;t have an idea how this works? Check out this short
                    tutorial!
                  </span>
                </Link>
              </div>
            </div>
          </>
        ) : (
          <nav className="flex h-screen flex-col items-center justify-center gap-8 px-20 py-10">
            <h1 className="flex gap-4 text-4xl font-bold text-[hsl(280,100%,70%)]">
              <Image src={logo} alt="Logo" width={50} height={50} />
              mailr
            </h1>
            <AuthShowcase />
          </nav>
        )}
      </main>
    </>
  );
};

export default Home;

const AuthShowcase: React.FC = () => {
  const { data: sessionData } = useSession();

  return (
    <div className="flex items-center justify-center gap-4">
      <p className="text-center text-lg font-semibold text-white/80">
        {sessionData && <span>{sessionData.user?.name}</span>}
      </p>
      <button
        className="rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
        onClick={sessionData ? () => signOut() : () => signIn()}
      >
        {sessionData ? "Sign out" : "Sign in"}
      </button>
    </div>
  );
};
