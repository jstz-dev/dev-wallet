import { type NextRequest, NextResponse } from "next/server";
import { readFileSync } from "node:fs";
import SuperJSON from "superjson";
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
  if (req.arrayBuffer.length === 0) {
    return NextResponse.json({ message: "No body was provided." }, { status: 401 });
  }

  const { data: body, error } = marketBodySchema.safeParse(SuperJSON.parse(await req.text()));

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

  const signedDeployOperation = signer.sign_operation(deployOperation, env.WALLET_SECRET_KEY);

  const jstz = createJstzClient();

  const { result } = await jstz.operations.injectAndPoll({
    inner: {
      content: deployOperation,
      publicKey: env.WALLET_PUBLIC_KEY,
      nonce: 0,
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

  const signedInitOperation = signer.sign_operation(deployOperation, env.WALLET_SECRET_KEY);

  const { result: _initResult } = await jstz.operations.injectAndPoll({
    inner: {
      content: initOperation,
      publicKey: env.WALLET_PUBLIC_KEY,
      nonce: 0,
    },

    signature: signedInitOperation,
  });

  return NextResponse.json({ address: smartFunctionAddress });
}
