import { parseAsBoolean, parseAsString, parseAsStringEnum, type inferParserType } from "nuqs";
import { RequestEventTypes } from "~/scripts/service-worker";

export const walletParsers = {
  isPopup: parseAsBoolean.withDefault(false),
  content: parseAsString.withDefault("{}"),
  flow: parseAsStringEnum(Object.values(RequestEventTypes)),
};

export type WalletParams = inferParserType<typeof walletParsers>;
