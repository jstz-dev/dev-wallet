import { AutoRouter, json } from "itty-router";
import { z } from "zod";

const ONE_TEZ = 1_000_000;
const SUPER_ADMIN = "tz1ZXxxkNYSUutm5VZvfudakRxx2mjpWko4J";
const KV_ROOT = "root";
const REFERER_HEADER = "Referer";

// Schemas
const addressSchema = z.string().length(36);
const tokenSchema = z.object({
  isSynthetic: z.boolean(),
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

const marketSchema = marketFormSchema.extend({});

const betFormSchema = tokenSchema.extend({});

function successResponse(message: any, status = 200) {
  return json({ ...message, status }, { status });
}

function errorResponse(message: any, status = 400) {
  return successResponse({ message }, status);
}

// Routes
const router = AutoRouter();
router.post(
  "/market",
  // withAdmin(
  async (request) => {
    try {
      const body = await request.json();
      const { success, error, data } = marketFormSchema.safeParse(body);
      if (!success) return errorResponse(error.message);

      const referer = request.headers.get(REFERER_HEADER);
      if (!referer) return errorResponse("Referer address not found");

      const response = await fetch(
        "https://glenda-belonoid-unvirtuously.ngrok-free.dev/api/market",
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

      return json({ address }, { status: 200 });
    } catch (err) {
      if (err instanceof Error) {
        return errorResponse(`Error: ${err.message}`);
      }
      return errorResponse(`Error: ${err}`);
    }
  },
  // ),
);

router.post("/market/:address/resolve", (request) => {
  const { address } = request.params;
  return fetch(
    new Request(`jstz://${address}/resolve`, {
      method: "POST",
      body: JSON.stringify(request.json()),
    }),
  );
});

router.get("/market/:address/payout", (request) => {
  const { address } = request.params;
  return fetch(new Request(`jstz://${address}/payout`));
});

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
  return newState;
}

// utils

function isAdmin(address: string) {
  return address === SUPER_ADMIN || getState().admins?.includes(address);
}

function withAdmin(handler: (request: Request) => Promise<Response>) {
  return async (request: Request) => {
    const requester = request.headers.get("Referer") as Address;
    if (!isAdmin(requester)) {
      return errorResponse("You don't have authoritah");
    }
    return handler(request);
  };
}

export default handler;
