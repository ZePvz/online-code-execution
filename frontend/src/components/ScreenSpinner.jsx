import { Loader2 } from "lucide-react"

export function ScreenSpinner() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-3 bg-background text-foreground">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 font-bold text-white text-xs">
          CS
        </div>
        <span className="font-semibold text-lg tracking-tight">CodeSphere</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
        <span>Initializing workspace...</span>
      </div>
    </div>
  )
}