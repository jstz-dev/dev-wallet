/**
 * @template T
 * @param {T[]} arr
 * @param {(val: T) => Promise<boolean>} predicate
 */
export async function asyncFind(arr, predicate) {
  const promises = arr.map(predicate);
  const results = await Promise.all(promises);

  for (let i = 0; i < results.length; i++) {
    const bool = results[i];
    if (!bool) continue;

    return arr[i];
  }
}
