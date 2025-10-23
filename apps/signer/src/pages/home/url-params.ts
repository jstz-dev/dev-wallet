import { createLoader, type inferParserType, parseAsString } from "nuqs";

const homeParsers = {
  path: parseAsString,
};

export const loadHomeParams = createLoader(homeParsers);

export type HomeParams = inferParserType<typeof homeParsers>;
