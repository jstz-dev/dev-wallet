import { useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import { spawn } from "~/lib/vault";

export default function App() {
  const navigate = useNavigate();

  async function handleGenerate() {
    const newAccount = await spawn();
    navigate(`/wallets/${newAccount.address}`);
  }

  return (
    <div className="flex flex-col gap-2 p-4">
      <h2 className="text-lg">You don't have any account yet.</h2>

      <Button onClick={handleGenerate}>Generate</Button>
    </div>
  );
}
