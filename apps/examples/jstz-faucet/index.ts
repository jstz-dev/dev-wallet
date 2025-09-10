// Update the transactions history
const logTx = async (address: Address, entry: { type: string, amount: string, [key: string]: unknown }) => {
  const key = `txs/${address}`;
  const existing = await Kv.get(key);
  const txs = existing ? JSON.parse(existing as string) : [];
  txs.push({ ...entry, time: Date.now() });
  await Kv.set(key, JSON.stringify(txs));
};

// Main function: handle calls to the smart function
const handler = async (request: Request): Promise<Response> => {
  const sender = request.headers.get("Referer") as Address;
  const amount = request.headers.get("X-JSTZ-AMOUNT");
  const body = await request.json()
  const receiver = body.receiver

  if (!amount) {
    return new Response(JSON.stringify(`No assets to transfer`), {status: 400})
  }
  
  if (!receiver) {
    return new Response(JSON.stringify(`Receiver is not specified. Transfer returned to the sender`), {
      status: 400,
      headers: {
        "X-JSTZ-TRANSFER": amount,
      },
    });
  }

  try {
    console.log(`${sender} transferring ${amount} mutez to ${receiver}`);

    const transferRequest = new Request(`jstz://${receiver}`, {
      headers: {
        "X-JSTZ-TRANSFER": amount,
      },
    });

    await fetch(transferRequest)

    // Log the updates
    void logTx(sender, {type: "send", amount });
    void logTx(receiver, {type: "receive", amount });

    return new Response(JSON.stringify({message: `Success: transferred ${amount} mutez to ${receiver}`
  }), {
      status: 200
    });
  } catch (e) {
    console.error(e)
    return new Response(JSON.stringify({message: `Failed: transfer of ${amount} mutez to ${receiver}`, error: e
  }), {status: 500})
  }
};

export default handler;
