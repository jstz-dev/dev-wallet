import { AutoRouter, IRequest, json } from "itty-router";
import { z } from "zod";

const ONE_TEZ = 1_000_000;
const SUPER_ADMIN = "tz1ZXxxkNYSUutm5VZvfudakRxx2mjpWko4J";
const KV_ROOT = "root";
const REFERER_HEADER = "Referer";
// const RPC_URL = "http://localhost:8933";
const RPC_URL = "https://privatenet.jstz.info";

// Schemas
const addressSchema = z.string().length(36);

const tokenSchema = z.object({
  token: z.enum(["yes", "no"]),
  amount: z.number().min(1),
  price: z.number().min(1).max(ONE_TEZ),
});

const marketFormSchema = z.object({
  question: z.string(),
  resolutionDate: z.iso.datetime(),
  resolutionUrl: z.string().nullish(),
  tokens: z.array(tokenSchema),
  pool: z.number().min(0),
});

const adminFormSchema = z.object({
  address: addressSchema,
});

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

// Routes
const router = AutoRouter();
router.post(
  "/admin",
  await withAdmin(async (request) => {
    try {
      const body = await request.json();
      const { success, error, data } = adminFormSchema.safeParse(body);
      if (!success) return errorResponse(error.message);

      dispatch({
        type: "add-admin",
        address: data.address,
      });

      return successResponse("Admin added successfully.");
    } catch (err) {
      if (err instanceof Error) {
        return errorResponse(`Error: ${err.message}`);
      }
      return errorResponse(`Error: ${err}`);
    }
  }),
);

router.post("/market", async (request) => {
  try {
    const body = await request.json();
    const { success, error, data } = marketFormSchema.safeParse(body);
    if (!success) return errorResponse(error.message);

    const referer = request.headers.get(REFERER_HEADER);
    if (!referer) return errorResponse("Referer address not found");

    const response = await fetch(
      "https://dev-wallet-jstz-prediction-market.vercel.app/api/market",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          master: Ledger.selfAddress,
          admins: [referer, SUPER_ADMIN],
        }),
      },
    );

    // TODO: add API error handling
    if (!response.ok) {
      console.log(response);
      return errorResponse("Error creating the market.");
    }

    const { address } = await response.json();

    dispatch({
      type: "add-market",
      address,
      resolutionDate: data.resolutionDate,
      referer,
    });

    return successResponse({ address, message: "Market created successfully." });
  } catch (err) {
    if (err instanceof Error) {
      return errorResponse(`Error: ${err.message}`);
    }
    return errorResponse(`Error: ${err}`);
  }
});

router.post(
  "/market/:address/resolve",
  await withAdmin((request) => {
    const { address } = request.params;
    return fetch(
      new Request(`jstz://${address}/resolve`, {
        method: "POST",
        body: JSON.stringify(request.json()),
      }),
    );
  }),
);

router.get(
  "/market/:address/payout",
  await withAdmin((request) => {
    const { address } = request.params;
    return fetch(new Request(`jstz://${address}/payout`));
  }),
);

const handler = (request: Request): Promise<Response> => router.fetch(request);

// KV
const addAdminActionSchema = z.object({
  type: z.literal("add-admin"),
  address: z.string().length(36),
});

const addMarketActionSchema = z.object({
  type: z.literal("add-market"),
  resolutionDate: marketFormSchema.shape.resolutionDate,
  address: addressSchema,
  referer: addressSchema,
});

type AddAdminAction = z.infer<typeof addAdminActionSchema>;
type AddMarketAction = z.infer<typeof addMarketActionSchema>;

type KvAction = AddAdminAction | AddMarketAction;

const kvSchema = z.object({
  admins: z.array(addAdminActionSchema.shape.address).optional(),
  markets: z
    .record(
      addMarketActionSchema.shape.address,
      addMarketActionSchema.pick({
        address: true,
        resolutionDate: true,
      }),
    )
    .optional(),
});

type KvState = z.infer<typeof kvSchema>;

function getState(): KvState {
  return JSON.parse(Kv.get(KV_ROOT) ?? "{}");
}

function dispatch(action: KvAction) {
  const state = getState();
  Kv.set(KV_ROOT, JSON.stringify(reducer(state, action)));
}

function reducer(state: Record<string, any>, action: KvAction): KvState {
  const newState = { ...state };
  switch (action.type) {
    case "add-admin":
      if (!newState.admins) newState.admins = [];
      if (!newState.admins.includes(action.address)) {
        newState.admins.push(action.address);
      }
      break;
    case "add-market":
      if (!newState.markets) newState.markets = {};
      newState.markets[action.address] = {
        address: action.address,
        resolutionDate: action.resolutionDate,
        referer: action.referer,
      };
      break;
  }

  new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
  return newState;
}

// utils

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
  console.log(resp)
  const json = await resp.json().then((data) => {
    console.log(data)
    return data
  }).catch((e) => {
    console.log(e)
    return "{}"
  });
  return JSON.parse(json);
}

async function getIsAdmin(address: string) {
  if (address === SUPER_ADMIN) return true;
  try {
    const kv = await getAsyncKV<KvState>(Ledger.selfAddress);
    console.log(kv)

    if (!kv) return false;

    console.log(kv)
    if ("admins" in kv) {
      console.log(kv.admins)
      return kv.admins?.includes(address);
    }
  } catch (e) {
    console.log(e)
    return false;
  }
}

async function withAdmin(handler: (request: IRequest) => Promise<Response>) {
  return async (request: IRequest) => {
    const requester = request.headers.get("Referer") as Address;

    const isAdmin = await getIsAdmin(requester);
    if (!isAdmin) {
      return errorResponse("You don't have authoritah");
    }
    return handler(request);
  };
}

export default handler;
