import { useState } from "react";
import { Button } from "@/components/ui/button";
function App() {
  const [code, setCode] = useState("")

  return (
    <>
      <textarea
      value={code}
      onChange={(e)=>setCode(e.target.value)}
      placeholder="write your code here"
      />
      <Button>Run</Button>
    </>
  );
}

export default App;
