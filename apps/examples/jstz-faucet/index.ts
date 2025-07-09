// 1 tez = 1 million mutez
const ONE_TEZ = 1000000;

// Maximum amount of tez a requester can receive
const MAX_TEZ = ONE_TEZ * 1000;

// Amount of tez to send in one transaction
const ONE_TIME_AMOUNT = ONE_TEZ * 10;

// Get the amount of tez that the smart function has sent to an address
const getReceivedTez = (requester: Address): number => {
  let receivedTez: number | null = Kv.get(`received/${requester}`);
  receivedTez = receivedTez === null ? 0 : receivedTez;
  console.debug(`Requestor already received ${receivedTez} tez`);
  return receivedTez;
};

// Update the record of the amount of tez that an address has received
const setReceivedTez = (requester: Address, received: number): void => {
  Kv.set(`received/${requester}`, received);
};

// Main function: handle calls to the smart function
const handler = async (request: Request): Promise<Response> => {
  // Extract the requester's address and message from the request
  const requester = request.headers.get("Referer") as Address;

  console.log(`${requester} requests tez`);

  // If the requester already received too much tez, decline the request
  const receivedTez = getReceivedTez(requester);
  if (receivedTez >= MAX_TEZ) {
    console.log(`${requester} received ${receivedTez} and is not eligible for more`);
    return new Response(JSON.stringify("Sorry, you already received too much tez"));
  }

  // Process the request and send the 1 tez = 1 million mutez to the requester if you can
  if (Ledger.balance(Ledger.selfAddress) > ONE_TIME_AMOUNT) {
    console.log(
      `Transferring ${ONE_TIME_AMOUNT / ONE_TEZ} tez from ${Ledger.selfAddress} to ${requester}...`,
    );
  } else {
    console.log(
      `Not enough tez in the faucet to transfer ${ONE_TIME_AMOUNT / ONE_TEZ} tez to ${requester}`,
    );
    return new Response(JSON.stringify("Sorry, I don't have enough tez to fulfill your request"));
  }

  // Log the updates
  setReceivedTez(requester, receivedTez + ONE_TIME_AMOUNT);

  return new Response(JSON.stringify(`You received ${ONE_TIME_AMOUNT / ONE_TEZ} tez!`), {
    headers: {
      "X-JSTZ-TRANSFER": ONE_TIME_AMOUNT.toFixed(0),
    },
  });
};

export default handler;
