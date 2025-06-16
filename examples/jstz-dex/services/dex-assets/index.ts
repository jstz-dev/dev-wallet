import { AutoRouter, json } from "itty-router";
import { z } from "zod";

// Schemas
const assetSchema = z.object({
  name: z.string().min(2),
  symbol: z.string().min(1),
  initialSupply: z.number().min(0),
  basePrice: z.number().min(0),
  slope: z.number().min(0.0001),
});

const buySchema = z.object({
  symbol: z.string(),
  amount: z.number().min(1),
  address: z.string(),
});

const swapSchema = z.object({
  fromSymbol: z.string(),
  toSymbol: z.string(),
  amount: z.number().min(1),
  address: z.string(),
});

const listAssetSchema = z.object({
  symbol: z.string(),
  address: z.string(),
  basePrice: z.number().min(0),
  slope: z.number().min(0.0001),
});

const router = AutoRouter();

// Helpers
async function updateUserBalance(
  address: string,
  symbol: string,
  delta: number,
) {
  const balanceKey = `balances/${address}/${symbol}`;
  const indexKey = `balances/${address}`;
  const current = await Kv.get(balanceKey);
  const newBalance = (current ? parseInt(current as string) : 0) + delta;
  await Kv.set(balanceKey, newBalance.toString());

  // update balance index
  const existingKeysRaw = await Kv.get(indexKey);
  const keys: string[] = existingKeysRaw
    ? JSON.parse(existingKeysRaw as string)
    : [];
  if (!keys.includes(symbol)) {
    keys.push(symbol);
    await Kv.set(indexKey, JSON.stringify(keys));
  }
}

async function logTransaction(address: string, entry: any) {
  const key = `txs/${address}`;
  const existing = await Kv.get(key);
  const txs = existing ? JSON.parse(existing as string) : [];
  txs.push({ ...entry, time: Date.now() });
  await Kv.set(key, JSON.stringify(txs));
}

async function getUserBalances(address: string) {
  const indexKey = `balances/${address}`;
  const keysRaw = await Kv.get(indexKey);
  const keys: string[] = keysRaw ? JSON.parse(keysRaw as string) : [];
  const balances: Record<string, number> = {};
  for (const symbol of keys) {
    const value = await Kv.get(`balances/${address}/${symbol}`);
    if (value) {
      balances[symbol] = parseInt(value);
    }
  }
  return balances;
}

// Routes
router.get("/assets", async () => {
  const keysRaw = await Kv.get("assets");
  const keys: string[] = keysRaw ? JSON.parse(keysRaw as string) : [];
  const assets = [];

  for (const key of keys) {
    const data = await Kv.get(key);
    if (data) assets.push(JSON.parse(data));
  }
  return json(assets);
});

router.post("/assets/mint", async (request) => {
  const body = await request.json();
  const parsed = assetSchema.safeParse(body);
  if (!parsed.success)
    return new Response(parsed.error.message, { status: 422 });

  const { name, symbol, initialSupply, basePrice, slope } = parsed.data;
  const key = `assets/${symbol}`;
  const exists = await Kv.get(key);
  if (exists) return new Response("Asset already exists.", { status: 400 });

  const asset = {
    name,
    symbol,
    supply: initialSupply,
    basePrice,
    slope,
    listed: true,
  };
  await Kv.set(key, JSON.stringify(asset));

  const indexKey = "assets";
  const current = await Kv.get(indexKey);
  const assetKeys = current ? JSON.parse(current as string) : [];
  assetKeys.push(key);
  await Kv.set(indexKey, JSON.stringify(assetKeys));

  return json({ message: `Asset '${symbol}' minted and listed.` });
});

router.get("/assets/:symbol", async (request) => {
  const { symbol } = request.params;
  const data = await Kv.get(`assets/${symbol}`);
  if (!data) return new Response("Asset not found.", { status: 404 });
  return json(JSON.parse(data));
});

router.post("/assets/list", async (request) => {
  const body = await request.json();
  const parsed = listAssetSchema.safeParse(body);
  if (!parsed.success)
    return new Response(parsed.error.message, { status: 422 });

  const { symbol, address, basePrice, slope } = parsed.data;
  const key = `assets/${symbol}`;
  const data = await Kv.get(key);
  if (!data) return new Response("Asset not found.", { status: 404 });

  const asset = JSON.parse(data);
  asset.listed = true;
  asset.basePrice = basePrice;
  asset.slope = slope;
  await Kv.set(key, JSON.stringify(asset));
  await logTransaction(address, { type: "list", symbol, basePrice, slope });

  return json({ message: `Asset '${symbol}' listed by ${address}.` });
});

router.post("/assets/unlist", async (request) => {
  const body = await request.json();
  const { symbol, address } = body;
  if (!symbol || !address)
    return new Response("Missing symbol or address.", { status: 400 });

  const key = `assets/${symbol}`;
  const data = await Kv.get(key);
  if (!data) return new Response("Asset not found.", { status: 404 });

  const asset = JSON.parse(data);
  asset.listed = false;
  await Kv.set(key, JSON.stringify(asset));
  await logTransaction(address, { type: "unlist", symbol });

  return json({ message: `Asset '${symbol}' unlisted by ${address}.` });
});

router.get("/user/:address/balances", async (request) => {
  const { address } = request.params;
  const balances = await getUserBalances(address);
  return json(balances);
});

router.get("/user/:address/txs", async (request) => {
  const { address } = request.params;
  const data = await Kv.get(`txs/${address}`);
  return json(data ? JSON.parse(data) : []);
});

router.post("/buy", async (request) => {
  try {
    const body = await request.json();
    const parsed = buySchema.safeParse(body);
    if (!parsed.success)
      return new Response(parsed.error.message, { status: 422 });

    const { symbol, amount, address } = parsed.data;
    const key = `assets/${symbol}`;
    const data = await Kv.get(key);
    if (!data) return new Response("Asset not found.", { status: 404 });

    const asset = JSON.parse(data);
    if (!asset.listed)
      return new Response("Asset is not listed for purchase.", { status: 400 });

    let totalCost = 0;
    for (let i = 0; i < amount; i++) {
      totalCost += asset.basePrice + asset.supply * asset.slope;
      asset.supply += 1;
    }

    await Kv.set(key, JSON.stringify(asset));
    await updateUserBalance(address, symbol, amount);
    await logTransaction(address, {
      type: "buy",
      symbol,
      amount,
      cost: totalCost,
    });

    return json({
      message: `Successfully bought ${amount} ${symbol}.`,
      cost: totalCost,
    });
  } catch (err) {
    return new Response(`Error: ${err.message}`, { status: 500 });
  }
});

router.post("/swap", async (request) => {
  try {
    const body = await request.json();
    const parsed = swapSchema.safeParse(body);
    if (!parsed.success)
      return new Response(parsed.error.message, { status: 422 });

    const { fromSymbol, toSymbol, amount, address } = parsed.data;
    const fromKey = `assets/${fromSymbol}`;
    const toKey = `assets/${toSymbol}`;
    const fromData = await Kv.get(fromKey);
    const toData = await Kv.get(toKey);
    if (!fromData || !toData)
      return new Response("One or both assets not found.", { status: 404 });

    const fromAsset = JSON.parse(fromData);
    const toAsset = JSON.parse(toData);
    if (!fromAsset.listed || !toAsset.listed)
      return new Response("Assets must be listed.", { status: 400 });

    let totalValue = 0;
    for (let i = 0; i < amount; i++) {
      fromAsset.supply -= 1;
      totalValue += fromAsset.basePrice + fromAsset.supply * fromAsset.slope;
    }

    let tokensReceived = 0;
    let spent = 0;
    while (
      spent + toAsset.basePrice + toAsset.supply * toAsset.slope <=
      totalValue
      ) {
      spent += toAsset.basePrice + toAsset.supply * toAsset.slope;
      toAsset.supply += 1;
      tokensReceived += 1;
    }

    await Kv.set(fromKey, JSON.stringify(fromAsset));
    await Kv.set(toKey, JSON.stringify(toAsset));
    await updateUserBalance(address, fromSymbol, -amount);
    await updateUserBalance(address, toSymbol, tokensReceived);
    await logTransaction(address, {
      type: "swap",
      fromSymbol,
      toSymbol,
      amount,
      received: tokensReceived,
    });

    return json({
      message: `Swapped ${amount} ${fromSymbol} for ${tokensReceived} ${toSymbol}.`,
      valueUsed: spent,
    });
  } catch (err) {
    return new Response(`Error: ${err.message}`, { status: 500 });
  }
});

const handler = (request: Request): Promise<Response> => router.fetch(request);

export default handler;
