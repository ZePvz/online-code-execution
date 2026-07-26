import AppRouter from "./Routes/AppRouter.routes"
import { BrowserRouter } from "react-router-dom"
import { AuthProvider } from "./utils/AuthContext"
import { trpc } from "./utils/trpc";
import { trpcClient, queryClient } from "./utils/client";
import { QueryClientProvider } from "@tanstack/react-query";

function App() {
  return (
    <>
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <AuthProvider >
        <BrowserRouter>
        <AppRouter />
      </BrowserRouter>  
      </AuthProvider>
    </QueryClientProvider>
    </trpc.Provider>

    </>
  )
}

export default App
