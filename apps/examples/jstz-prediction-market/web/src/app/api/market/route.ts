import { type NextRequest, NextResponse } from "next/server";
import { readFileSync } from "node:fs";
import { z } from "zod/mini";
import { env } from "~/env";
import { createJstzClient } from "~/lib/jstz-signer.service";
import { marketFormSchema } from "~/lib/validators/market";

import Jstz from "@jstz-dev/jstz-client";
import * as signer from "@jstz-dev/jstz_sdk";
import path from "node:path";
import { textDecode, textEncode } from "~/lib/encoder";

const marketBodySchema = z.object({
  ...marketFormSchema.shape,
  master: z.string(),
});

const smartFunctionBodyPath = path.join(process.cwd(), "artifacts", "market.js");

export async function POST(req: NextRequest) {
  const contentLength = Number.parseInt(req.headers.get("content-length") ?? "0", 10);

  if (contentLength === 0) {
    return NextResponse.json({ message: "No body was provided." }, { status: 401 });
  }

  const { data: body, error } = marketBodySchema.safeParse(await req.json());

  if (error) {
    console.log(error);
    return NextResponse.json(error.message, { status: 401 });
  }

  const smartFunctionBody = readFileSync(smartFunctionBodyPath, "utf8");

  // Deploy smart function
  const deployOperation: Jstz.Operation.DeployFunction = {
    _type: "DeployFunction",
    functionCode: smartFunctionBody,
    accountCredit: 0,
  };

  const jstz = createJstzClient();
  let nonce = await jstz.accounts.getNonce(env.WALLET_ADDRESS).catch(() => Promise.resolve(0));

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
  nonce = await jstz.accounts.getNonce(env.WALLET_ADDRESS).catch(() => Promise.resolve(0));

  const signedInitOperation = signer.sign_operation(
    {
      content: initOperation,
      publicKey: env.WALLET_PUBLIC_KEY,
      nonce,
    },
    env.WALLET_SECRET_KEY,
  );

  const { result: initResult } = await jstz.operations.injectAndPoll({
    inner: {
      content: initOperation,
      publicKey: env.WALLET_PUBLIC_KEY,
      nonce,
    },

    signature: signedInitOperation,
  });

  console.log(initResult);
  console.log(textDecode(initResult.inner.body));

  return NextResponse.json({ address: smartFunctionAddress });
}

export function GET() {
  const smartFunctionBody = readFileSync(smartFunctionBodyPath);
  return new NextResponse(smartFunctionBody);
}
