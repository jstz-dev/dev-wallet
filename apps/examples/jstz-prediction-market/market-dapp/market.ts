import { AutoRouter, json } from "itty-router";
import { z } from "zod";

const ONE_TOKEN = 1;
const KV_ROOT = "root";
const REFERER_HEADER = "Referer";
const TRANSFER_HEADER = "X-JSTZ-TRANSFER";
const AMOUNT_HEADER = "X-JSTZ-AMOUNT";

// Schemas
const tokenSchema = z.object({
  isSynthetic: z.boolean(),
  token: z.enum(["yes", "no"]),
  amount: z.number().min(0),
  price: z.number().min(0).max(1_000_000),
});

const marketFormSchema = z.object({
  state: z.enum(["created", "on-going", "resolved"]),
  admins: z.array(z.string()),
  question: z.string(),
  resolutionDate: z.iso.date(),
  resolutionUrl: z.string().nullish(),
  resolvedToken: z.enum(["yes", "no"]).nullish(),
  resolvedTokenPrice: z.number().min(0).max(1).nullish(),
  tokens: z.array(tokenSchema),
});

const betFormSchema = tokenSchema.pick({ token: true }).extend({
  isSynthetic: false,
});

function successResponse(message: any, status = 200) {
  return json({ ...message, status }, { status });
}

function errorResponse(message: any, status = 400) {
  return successResponse({ message }, status);
}

const marketRouter = AutoRouter();

marketRouter.post(
  "/init",
  withParseBody(async (_, body) => {
    const { state } = getState();
    if (!!state && state !== "created") return errorResponse("Market already initialized");
    const { success, error, data } = marketFormSchema.safeParse(body);

    if (!success) return errorResponse(error.message);

    dispatch({
      type: "init",
      ...data,
    });
    return successResponse("Market created");
  }),
);
marketRouter.post(
  "/bet",
  withParseBody(async (request, body) => {
    const { state } = getState();
    if (!state || state === "created") return errorResponse("Market is not initialized yet");
    // TODO: bet amount is in XTZ and transferred via "Referrer" header
    // add an approximate estimation of tokens on the FE basing on the current token price from Indexer
    const { success, error, data } = betFormSchema.safeParse(body);
    if (!success) throw new Error(error.message);

    const address = request.headers.get(REFERER_HEADER);
    if (!address) throw new Error("Referer address not found");

    const receivedMutez = request.headers.get(AMOUNT_HEADER);

    const tokenState = getTokenState(data.token);

    const mutez = Number(receivedMutez);

    if (!receivedMutez || isNaN(mutez) || mutez < tokenState.price)
      throw new Error("Not enough tez for to make a bet");

    const amount = mutez / tokenState.price;

    dispatch({
      type: "bet",
      address,
      token: data.token,
      amount,
      price: tokenState.price,
    });

    const newPrice = getNewTokenPrice(data.token, amount)

    return successResponse("Bet placed");
  }),
);
marketRouter.post("/resolve", (request) => {
  const { state } = getState();
  if (!state || state === "created") return errorResponse("Market is not initialized yet");
  if (state === "resolved") return errorResponse("Market already resolved");
});

// KV
const initActionSchema = marketFormSchema.extend({
  type: z.literal("init"),
});
const betActionSchema = tokenSchema.omit({ isSynthetic: true }).extend({
  type: z.literal("bet"),
  address: z.string().length(36),
  price: z.number().min(0).max(1),
});

type InitAction = z.infer<typeof initActionSchema>;
type BetAction = z.infer<typeof betActionSchema>;

type KvAction = InitAction | BetAction;

const kvSchema = marketFormSchema.extend({
  bets: z.array(betActionSchema.omit({ type: true })).optional(),
  users: z.record(betActionSchema.shape.address, betActionSchema.omit({ type: true })).optional(),
});

type KvState = z.infer<typeof kvSchema>;

function getState(): KvState {
  return JSON.parse(Kv.get(KV_ROOT) ?? "{}");
}

function getTokenState(token: string): KvState["tokens"][number] {
  const { tokens = [] } = getState();
  const tokenState = tokens.find((t) => t.token === token);

  if (!tokenState) throw new Error("Token not found");

  return tokenState;
}

function dispatch(action: KvAction) {
  const state = getState();
  Kv.set(KV_ROOT, JSON.stringify(reducer(state, action)));
}

function reducer(state: KvState, action: KvAction): KvState {
  const newState = { ...state };
  switch (action.type) {
    case "init":
      newState.state = "on-going";
      newState.admins = action.admins;
      newState.question = action.question;
      newState.resolutionDate = action.resolutionDate;
      newState.resolutionUrl = action.resolutionUrl;
      newState.tokens = action.tokens;
      newState.users = {};
      newState.bets = [];
      break;
    case "bet":
      if (!newState.tokens || !newState.bets || !newState.users)
        throw new Error("Market in not initialized");

      const token = newState.tokens.find((t) => t.token === action.token);
      if (!token) throw new Error("Token not found");

      token!.amount += action.amount;

      newState.bets.push({
        address: action.address,
        token: action.token,
        amount: action.amount,
        price: action.price,
      });

      newState.users[action.address] = {
        address: action.address,
        token: action.token,
        amount: action.amount,
        price: action.price,
      };
      break;
  }
  return newState;
}

function getNewTokenPrice(token: string, amountToBuy: number) {
  const { tokens = [] } = getState();
  const tokenState = getTokenState(token);
  const sumOfTokens = tokens.reduce((acc, token) => acc + token.amount, 0);
  return tokenState.amount + amountToBuy / sumOfTokens;
}

function withParseBody(handler: (request: Request, body: unknown) => Promise<Response>) {
  return async (request: Request) => {
    try {
      const body = await request.json();
      return handler(request, body);
    } catch (err) {
      if (err instanceof Error) {
        return errorResponse(`Error: ${err.message}`);
      }
      return errorResponse(`Error: ${err}`);
    }
  };
}

const marketHandler = (request: Request): Promise<Response> => marketRouter.fetch(request);
export default marketHandler;
