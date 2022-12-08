import { router } from "../trpc";
import { authRouter } from "./auth";
import { mailRouter } from "./mail";

export const appRouter = router({
  mail: mailRouter,
  auth: authRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
