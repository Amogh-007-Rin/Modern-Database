import { Button } from "./components/ui/button";

function App() {
  return (
    <main className="h-screen w-full bg-black flex items-center justify-center">
      <Button onClick={checkLog}>Click</Button>
    </main>
  );
}

function checkLog() {
  console.log("Button Clicked");
}

export default App;
