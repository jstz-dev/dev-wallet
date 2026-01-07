import { AutoRouter, IRequest, json } from "itty-router";
import { z } from "zod";

const ONE_TEZ = 1_000_000;
const KV_ROOT = "root";
const REFERER_HEADER = "Referer";
const TRANSFER_HEADER = "X-JSTZ-TRANSFER";
const AMOUNT_HEADER = "X-JSTZ-AMOUNT";
// const RPC_URL = "http://localhost:8933";
const RPC_URL = "https://privatenet.jstz.info";

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
  state: z.enum(["created", "on-going", "resolved", "closed"]),
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
    // check resolution date
    // FIXME: temporary disabled
    // const isResolutionDatePassed = await getIsResolutionDatePassed()
    // if (isResolutionDatePassed) return errorResponse("Market is not accepting bets anymore")

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
      return errorResponse("Not enough tez to make a bet");

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
  await withMaster(
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
  ),
);

marketRouter.post(
  "/payout",
  await withMaster(async () => {
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

    dispatch({
      type: "close",
    });

    return successResponse({ message: "Payout successful", payouts });
  }),
);

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

const closeActionSchema = z.object({
  type: z.literal("close"),
});

type InitAction = z.infer<typeof initActionSchema>;
type BetAction = z.infer<typeof betActionSchema>;
type ResolveAction = z.infer<typeof resolveActionSchema>;
type CloseAction = z.infer<typeof closeActionSchema>;

type KvAction = InitAction | BetAction | ResolveAction | CloseAction;

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
    case "init": {
      newState.state = "on-going";
      newState.admins = action.admins;
      newState.question = action.question;
      newState.resolutionDate = action.resolutionDate;
      newState.resolutionUrl = action.resolutionUrl;
      newState.tokens = action.tokens;
      newState.master = action.master;
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
    }

    case "bet": {
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
    }

    case "resolve": {
      if (!newState.tokens || !newState.bets) throw errorResponse("Market in not initialized");
      const token = newState.tokens.find((t) => t.token === action.token);
      if (!token) throw errorResponse("Token not found");

      const balance = Ledger.balance(Ledger.selfAddress);

      const realTokensAmount = newState.bets.reduce((acc, token) => {
        if (!token.isSynthetic && token.token === action.token) {
          return acc + token.amount;
        }
        return acc;
      }, 0);

      const resolvedTokenPrice = Math.floor(balance / realTokensAmount);

      newState.resolvedToken = {
        token: action.token,
        amount: realTokensAmount,
        price: resolvedTokenPrice,
      };

      newState.state = "resolved";
      break;
    }

    case "close": {
      newState.state = "closed";
      break;
    }
  }

  return newState;
}

function withParseBody(handler: (request: IRequest, body: unknown) => Promise<Response>) {
  return async (request: IRequest) => {
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

interface GetAsyncKVOptions {
  rpcUrl?: string;
  kvKey?: string;
}
async function getAsyncKV<T = unknown>(
  address: string,
  options: GetAsyncKVOptions = {},
): Promise<T> {
  const { rpcUrl = RPC_URL, kvKey = KV_ROOT } = options;
  const resp = await fetch(new Request(`${rpcUrl}/accounts/${address}/kv?key=${kvKey}`));
    const json = await resp
      .json()
      .then((data) => {
        console.log(data);
        return data;
      })
      .catch(async (e) => {
        console.log(e);
        const message = await resp.text()
        throw new Error(message)
      });
    return JSON.parse(json);
}

async function getIsResolutionDatePassed() {
  try {
    const kv = await getAsyncKV<KvState>(Ledger.selfAddress);
    console.log(kv);

    if (!kv) return true;

    console.log(kv);
    if ("resolutionDate" in kv) {
      console.log("Resolution date: ", kv.resolutionDate);

      const response = await fetch(
        "https://dev-wallet-jstz-prediction-market.vercel.app/api/date"
      );

      if (!response.ok) {
        console.log("Error getting current date: ", response);
        return true
      }

      const { dateNowISO } = await response.json();

      return new Date(dateNowISO) > new Date(kv.resolutionDate);
    }
    return true
  } catch (e) {
    console.log(e);
    return true;
  }
}

async function getIsMaster(address: string) {
  try {
    const kv = await getAsyncKV<KvState>(Ledger.selfAddress);
    console.log(kv);

    if (!kv) return false;

    console.log("KV", kv);
    if ("master" in kv) {
      console.log("Master function:", kv.master);
      console.log("Requester address:", address);
      console.log("is Master:", kv.master === address);
      return kv.master === address;
    }
  } catch (e) {
    console.log("Auth error", e);
    return false;
  }
}

async function withMaster(handler: (request: IRequest) => Promise<Response>) {
  return async (request: IRequest) => {
    // const requester = request.headers.get("Referer") as Address;
    //
    // const isMaster = await getIsMaster(requester);
    // if (!isMaster) {
    //   return errorResponse("You don't have authoritah");
    // }
    return handler(request);
  };
}


const marketHandler = (request: Request): Promise<Response> => marketRouter.fetch(request);
export default marketHandler;
