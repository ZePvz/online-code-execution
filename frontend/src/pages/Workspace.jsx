import { useState } from "react";
import { Button } from "@/components/ui/button";
function Workspace() {
  const [code, setCode] = useState("");
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

export default Workspace;
