import { AutoRouter, json } from "itty-router";
import { z } from "zod";

const ONE_TEZ = 1_000_000;
const KV_ROOT = "root";
const REFERER_HEADER = "Referer";
const TRANSFER_HEADER = "X-JSTZ-TRANSFER";
const AMOUNT_HEADER = "X-JSTZ-AMOUNT";

// Schemas
const tokenSchema = z.object({
  token: z.enum(["yes", "no"]),
  amount: z.number().min(1),
  price: z.number().min(1).max(ONE_TEZ),
});

const marketFormSchema = z.object({
  admins: z.array(z.string()).min(1),
  master: z.string().length(36), // parent SF address
  question: z.string(),
  resolutionDate: z.iso.datetime(),
  resolutionUrl: z.string().nullish(),
  tokens: z.array(tokenSchema),
});

const marketSchema = marketFormSchema.extend({
  state: z.enum(["created", "on-going", "resolved"]),
  resolvedToken: tokenSchema,
});

const betFormSchema = tokenSchema.pick({ token: true });

const resolutionFormSchema = tokenSchema.pick({ token: true });

interface ResponseMessage extends Record<string, unknown> {
  message: string;
}

interface ErrorMessage extends Record<string, unknown> {
  error: string;
}

function successResponse(message: ResponseMessage | string, options?: ResponseInit) {
  const payload = typeof message === "string" ? { message } : message;

  const { status = 200, ...rest } = options ?? {};
  return json({ ...payload, status }, { status, ...rest });
}

function errorResponse(error: ErrorMessage | string, options: ResponseInit = {}) {
  const payload = typeof error === "string" ? { error } : error;

  const { status = 400, ...rest } = options ?? {};
  return json({ ...payload, status }, { status, ...rest });
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
    if (!!state && state !== "on-going") return errorResponse("Market is closed for betting");

    const { success, error, data } = betFormSchema.safeParse(body);
    if (!success) return errorResponse(error.message);

    const referer = request.headers.get(REFERER_HEADER);
    if (!referer) return errorResponse("Referer address not found");

    const receivedMutez = request.headers.get(AMOUNT_HEADER);

    const tokenState = getTokenState(data.token);

    const mutez = Number(receivedMutez);

    if (!receivedMutez || isNaN(mutez) || mutez < tokenState.price)
      return errorResponse("Not enough tez for to make a bet");

    const amount = Math.floor(mutez / tokenState.price);

    dispatch({
      type: "bet",
      isSynthetic: false,
      referer,
      token: data.token,
      amount,
      price: tokenState.price,
    });

    const headers: ResponseInit["headers"] = {};
    const change = mutez - amount * tokenState.price;

    if (change > 0) {
      headers[TRANSFER_HEADER] = change.toString();
    }

    return successResponse("Bet placed", { headers });
  }),
);
marketRouter.post(
  "/resolve",
  withParseBody(async (_, body) => {
    const { state } = getState();
    if (!state || state === "created") return errorResponse("Market is not initialized yet");
    if (state === "resolved") return errorResponse("Market already resolved");

    const { success, error, data } = resolutionFormSchema.safeParse(body);
    if (!success) return errorResponse(error.message);

    dispatch({
      type: "resolve",
      token: data.token,
    });

    return successResponse("Market resolved");
  }),
);

marketRouter.get("/payout", async () => {
  const { state, bets = [], resolvedToken } = getState();
  if (!state || state === "created") return errorResponse("Market is not initialized yet");
  if (state !== "resolved" || !resolvedToken) return errorResponse("Market is not resolved");

  const payoutReqs = [];
  const payouts = [];
  for (let i = 0; i < bets.length; i++) {
    const bet = bets[i];
    if (!bet.isSynthetic && bet.token === resolvedToken.token) {
      const transferAmount = bet.amount * resolvedToken.price;

      payouts.push({ transferAmount, bet });
      await fetch(
        new Request(`jstz://${bet.referer}/`, {
          headers: {
            [TRANSFER_HEADER]: transferAmount.toString(),
          },
        }),
      );
    }
  }

  return successResponse({ message: "Payout successful", payouts });
});

// KV
const initActionSchema = marketFormSchema.extend({
  type: z.literal("init"),
});
const betActionSchema = tokenSchema.extend({
  type: z.literal("bet"),
  referer: z.string().length(36),
  price: z.number().min(1).max(ONE_TEZ),
  isSynthetic: z.boolean(),
});
const resolveActionSchema = marketSchema.shape.resolvedToken.pick({ token: true }).extend({
  type: z.literal("resolve"),
});

type InitAction = z.infer<typeof initActionSchema>;
type BetAction = z.infer<typeof betActionSchema>;
type ResolveAction = z.infer<typeof resolveActionSchema>;

type KvAction = InitAction | BetAction | ResolveAction;

const kvSchema = marketSchema.extend({
  bets: z.array(betActionSchema.omit({ type: true })).optional(),
});

type KvState = z.infer<typeof kvSchema>;

function getState(): KvState {
  return JSON.parse(Kv.get(KV_ROOT) ?? "{}");
}

function getTokenState(token: string): KvState["tokens"][number] {
  const { tokens = [] } = getState();
  const tokenState = tokens.find((t) => t.token === token);

  if (!tokenState) throw errorResponse("Token not found");

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
      newState.bets = [];
      action.tokens.forEach((token) =>
        newState.bets!.push({
          referer: action.admins[0],
          token: token.token,
          amount: token.amount,
          price: token.price,
          isSynthetic: true,
        }),
      );
      break;
    case "bet":
      if (!newState.tokens || !newState.bets) throw errorResponse("Market in not initialized");

      const token = newState.tokens.find((t) => t.token === action.token);
      if (!token) throw errorResponse("Token not found");

      // update purchased token's amount
      token!.amount += action.amount;

      newState.bets.push({
        referer: action.referer,
        token: action.token,
        amount: action.amount,
        price: action.price,
        isSynthetic: false,
      });
      // update tokens prices
      const sumOfTokens = newState.tokens.reduce((acc, token) => acc + token.amount, 0);
      newState.tokens.forEach((token) => {
        token.price = Math.floor((token.amount / sumOfTokens) * ONE_TEZ);
      });
      break;

    case "resolve": {
      if (!newState.tokens || !newState.bets) throw errorResponse("Market in not initialized");
      const token = newState.tokens.find((t) => t.token === action.token);
      if (!token) throw errorResponse("Token not found");

      const balance = Ledger.balance(Ledger.selfAddress);

      const syntheticTokensAmount = newState.bets.reduce((acc, token) => {
        if (token.isSynthetic) {
          return acc + token.amount;
        }
        return acc;
      }, 0);

      const resolvedTokenPrice = Math.floor(balance / (token.amount - syntheticTokensAmount));

      newState.resolvedToken = {
        token: action.token,
        amount: token.amount - syntheticTokensAmount,
        price: resolvedTokenPrice,
      };

      newState.state = "resolved";
    }
  }
  return newState;
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
