import { useState } from "react";
function App() {
  const [code, setCode] = useState("")

  return (
    <>
      <textarea
      value={code}
      onChange={(e)=>setCode(e.target.value)}
      placeholder="write your code here"
      />
    </>
  );
}

export default App;
