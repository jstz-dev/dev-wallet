export function textEncode(data: unknown) {
  if (!data) return null;
  const dataString = typeof data === "string" ? data : JSON.stringify(data);
  return btoa(dataString);
}

export function textDecode(data: string | null) {
  if (!data) return null;
  const decodedBody = atob(data)
  try {
    return JSON.parse(decodedBody);
  } catch {
    return decodedBody;
  }
}
