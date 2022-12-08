import { router } from "../trpc";
import { mailRouter } from "./mail";

export const appRouter = router({
  mail: mailRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
