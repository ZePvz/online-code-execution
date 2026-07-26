// tRPC React Query setup
// Provides type-safe hooks (useMutation, useQuery) for calling backend procedures

import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../../../backend/src/routes/index.routes"; 

export const trpc = createTRPCReact<AppRouter>();
