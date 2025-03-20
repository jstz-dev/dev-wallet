"use client";

import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import {useState} from "react";
import {Eye, EyeOff} from "lucide-react";

export default function TestPage() {
    const [privateKeyVisible, setPrivateKeyVisible] = useState(false)
  return (
    <div className="flex w-full flex-col gap-4">
      <div className={"font-lg font-bold"}>Your current wallet details</div>
      <div className={"flex w-full flex-col gap-2"}>
        <Label className="font-bold">Address</Label>
        KT1RtPzCe7MnGEcc1YhAS5RYK4VKFNXFvcKe
      </div>

      <div className={"flex w-full flex-col gap-2"}>
        <Label className="font-bold">Public Key</Label>
        KT1RtPzCe7MnGEcc1YhAS5RYK4VKFNXFvcKe
      </div>

      <div className={"flex w-full flex-col gap-2"}>
          <div className={"flex align-middle gap-2 flex-wrap"}>
              <Label className="font-bold">Private Key</Label>


              <div className={"cursor-pointer"} onClick={()=> setPrivateKeyVisible(!privateKeyVisible)}>
                  {privateKeyVisible ? <EyeOff size={20} /> : <Eye size={20} />}
              </div>
          </div>
          <div>
              {privateKeyVisible ? 'KT1RtPzCe7MnGEcc1YhAS5RYK4VKFNXFvcKe': '*****************************'}
          </div>
      </div>

      <div className="flex flex-col gap-4">
        <h1 className="text-lg">Do you want to sign with current wallet?</h1>

        <div className="flex w-full gap-4">
          <Button variant="outline" onClick={() => null}>
            Cancel
          </Button>

          <Button onClick={() => null}>Sign</Button>
        </div>
      </div>
    </div>
  );
}
