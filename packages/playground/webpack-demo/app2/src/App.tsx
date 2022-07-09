import React, { FunctionComponent } from "react";
import Button from './Button'

interface AppProps {
  name: string;
  name2: string;
  name3: string;
}


const App: FunctionComponent<AppProps> = () => {
  return (
    <div style={{
      margin: "10px",
      padding: "10px",
      textAlign: "center",
      backgroundColor: "greenyellow"
    }}>
      <Button />
      <h1>App2</h1>
    </div>
  )
}

export default App;

