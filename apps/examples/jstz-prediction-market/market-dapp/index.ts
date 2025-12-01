import { AutoRouter, json } from "itty-router";
import { z } from "zod";

const ONE_TOKEN = 1;
const SUPER_ADMIN = "tz1ZXxxkNYSUutm5VZvfudakRxx2mjpWko4J";
const KV_ROOT = "root";
// Schemas
const tokenSchema = z.object({
  isSynthetic: z.boolean(),
  value: z.enum(["yes", "no"]),
  amount: z.number().min(0),
});

const marketFormSchema = z.object({
  question: z.string(),
  resolutionDate: z.iso.date(),
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
  withAdmin(async (request) => {
    try {
      const body = await request.json();
      const { success, error, data } = marketFormSchema.safeParse(body);
      if (!success) return errorResponse(error.message);

      return successResponse("Market created");
    } catch (err) {
      if (err instanceof Error) {
        return errorResponse(`Error: ${err.message}`);
      }
      return errorResponse(`Error: ${err}`);
    }
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
  address: z.string().length(36),
  resolutionDate: marketFormSchema.shape.resolutionDate,
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

const marketSfCode = `

`;
