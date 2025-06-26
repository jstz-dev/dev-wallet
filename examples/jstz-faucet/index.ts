// 1 tez = 1 million mutez
const ONE_TEZ = 1000000;

// Maximum amount of tez a requester can receive
const MAX_TEZ = 1000;

// Amount of tez to send in one transaction
const ONE_TIME_AMOUNT = ONE_TEZ * 10

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

// Log the message that the user sent
const addPoliteMessage = (requester: Address, message: string): void => {
  let length: number | null = Kv.get(`messages/${requester}/length`);
  if (length === null) {
    length = 0;
  }
  Kv.set(`messages/${requester}/${length}`, message);
  Kv.set(`messages/${requester}/length`, length + 1);
};

// Main function: handle calls to the smart function
const handler = async (request: Request): Promise<Response> => {
  // Extract the requester's address and message from the request
  const requester = request.headers.get("Referer") as Address;
  const { message } = await request.json();

  console.log(`${requester} says: ${message}`);

  // If the requester already received too much tez, decline the request
  const receivedTez = getReceivedTez(requester);
  if (receivedTez >= MAX_TEZ) {
    return new Response(
      JSON.stringify("Sorry, you already received too much tez"),
    );
  }

  // Process the request and send the 1 tez = 1 million mutez to the requester if you can
  if (Ledger.balance(Ledger.selfAddress) > ONE_TIME_AMOUNT) {
    console.log(
      `Transferring ${ONE_TIME_AMOUNT / ONE_TEZ} tez from ${Ledger.selfAddress} to ${requester}...`,
    );
    Ledger.transfer(requester, ONE_TIME_AMOUNT);
  } else {
    return new Response(
      JSON.stringify("Sorry, I don't have enough tez to fulfill your request"),
    );
  }

  // Log the updates
  setReceivedTez(requester, receivedTez + ONE_TIME_AMOUNT);
  addPoliteMessage(requester, message);

  return new Response(
    JSON.stringify(`You received ${ONE_TIME_AMOUNT / ONE_TEZ} tez!`),
  );
};

export default handler;
