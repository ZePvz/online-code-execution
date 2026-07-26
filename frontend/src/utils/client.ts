// tRPC client setup with React Query integration
// Configures HTTP batch link for efficient RPC calls to backend

import { httpBatchLink } from "@trpc/client";
import { QueryClient } from "@tanstack/react-query";
import { trpc } from "../utils/trpc";

export const queryClient = new QueryClient();

const backendUrl = import.meta.env.VITE_BACKEND;

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${backendUrl}/trpc`,
    }),
  ],
});
