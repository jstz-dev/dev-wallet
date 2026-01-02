import { AutoRouter, json } from "itty-router";
import { z } from "zod";

const ONE_TEZ = 1_000_000;
const KV_ROOT = "root";
const REFERER_HEADER = "Referer";
const RPC_URL = "https://privatenet.jstz.info";

// Schemas
const increaseFormSchema = z.object({
  value: z.number(),
});

export type IncreaseForm = z.infer<typeof increaseFormSchema>

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
router.get("/counter", () => {
  const { counter } = getState();
  return successResponse((counter ?? 0).toString());
});

router.post("/counter/increase", async (request) => {
  try {
    const body = await request.json();
    const { success, error, data } = increaseFormSchema.safeParse(body);
    if (!success) return errorResponse(error.message);

    dispatch({
      type: "add",
      value: data?.value,
    });

    return successResponse(`Counter increased by value of ${data?.value}`);
  } catch (err) {
    if (err instanceof Error) {
      return errorResponse(`Error: ${err.message}`);
    }
    return errorResponse(`Error: ${err}`);
  }
});

const handler = (request: Request): Promise<Response> => router.fetch(request);

// KV
const addActionSchema = z.object({
  type: z.literal("add"),
  value: z.number(),
});

type AddAction = z.infer<typeof addActionSchema>;

type KvAction = AddAction;

const kvSchema = z.object({
  counter: z.number().optional(),
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
    case "add":
      if (!newState.counter) newState.counter = 0;
      newState.counter += action.value;
      break;
  }

  return newState;
}

// utils
interface GetAsyncKVOptions {
  rpcUrl?: string;
  kvKey?: string;
}

/**
 * @function getAsyncKV - Fetches KV store of given Jstz's smart function address. When calling an
 *   external API through Jstz Oracle, KV cannot be access prior to request so this function can be
 *   used to reach out to KV though API call
 */
async function getAsyncKV<T = unknown>(
  address: string,
  options: GetAsyncKVOptions = {},
): Promise<T> {
  const { rpcUrl = RPC_URL, kvKey = KV_ROOT } = options;
  const resp = await fetch(new Request(`${rpcUrl}/accounts/${address}/kv?key=${kvKey}`));
  const json = await resp
    .json()
    .then((data) => {
      return data;
    })
    .catch((e) => {
      console.log(e);
      return "{}";
    });
  return JSON.parse(json);
}

export default handler;
