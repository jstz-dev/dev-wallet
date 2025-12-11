import { type NextRequest, NextResponse } from "next/server";
import { readFileSync } from "node:fs";
import { z } from "zod/mini";
import { env } from "~/env";
import { createJstzClient } from "~/lib/jstz-signer.service";
import { marketSchema } from "~/lib/validators/market";

import Jstz from "@jstz-dev/jstz-client";
import * as signer from "@jstz-dev/jstz_sdk";
import { textEncode } from "~/lib/encoder";

const marketBodySchema = z.object({
  ...marketSchema.shape,
  master: z.string(),
});

export async function POST(req: NextRequest) {
  const contentLength = Number.parseInt(req.headers.get("content-length") ?? "0", 10);

  if (contentLength === 0) {
    return NextResponse.json({ message: "No body was provided." }, { status: 401 });
  }

  const { data: body, error } = marketBodySchema.safeParse(await req.json());

  if (error) {
    return NextResponse.json(error.message, { status: 401 });
  }

  const smartFunctionBody = readFileSync("./src/app/api/market/market.js").toString("utf8");

  // Deploy smart function
  const deployOperation: Jstz.Operation.DeployFunction = {
    _type: "DeployFunction",
    functionCode: smartFunctionBody,
    accountCredit: 100,
  };

  const jstz = createJstzClient();
  let nonce = await jstz.accounts.getNonce(env.WALLET_ADDRESS);

  const signedDeployOperation = signer.sign_operation(
    {
      content: deployOperation,
      publicKey: env.WALLET_PUBLIC_KEY,
      nonce,
    },
    env.WALLET_SECRET_KEY,
  );

  const { result } = await jstz.operations.injectAndPoll({
    inner: {
      content: deployOperation,
      publicKey: env.WALLET_PUBLIC_KEY,
      nonce,
    },

    signature: signedDeployOperation,
  });

  const smartFunctionAddress = result.inner.address;

  // Init smart function
  const initOperation: Jstz.Operation.RunFunction = {
    _type: "RunFunction",
    body: textEncode(body),
    gasLimit: 55_000,
    headers: {},
    uri: `jstz://${smartFunctionAddress}/init`,
    method: "POST",
  };

  // NOTE: Getting the nonce once again, just for safeties sake.
  // There is a possibility that in the meantime there will be another
  // operation which mutate the nonce.
  nonce = await jstz.accounts.getNonce(env.WALLET_ADDRESS);

  const signedInitOperation = signer.sign_operation(
    {
      content: initOperation,
      publicKey: env.WALLET_PUBLIC_KEY,
      nonce,
    },
    env.WALLET_SECRET_KEY,
  );

  const { result: _initResult } = await jstz.operations.injectAndPoll({
    inner: {
      content: initOperation,
      publicKey: env.WALLET_PUBLIC_KEY,
      nonce,
    },

    signature: signedInitOperation,
  });

  console.log(_initResult);

  return NextResponse.json({ address: smartFunctionAddress });
}
