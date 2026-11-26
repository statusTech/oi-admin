/**
 * O Realtime Database recusa `undefined` em set()/update() ("values argument
 * contains undefined in property ..."). Campo que o cliente nunca gravou chega
 * undefined do formulário (ex.: eCommerce.additionalTaxPix de quem só tem a
 * taxa do cartão). `null` no Firebase é o mesmo que campo ausente, então troca
 * um pelo outro em objetos e listas, sem mexer na entrada.
 */
export const undefinedToNull = (value) => {
  if (value === undefined) return null;
  if (Array.isArray(value)) return value.map(undefinedToNull);
  if (value && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(Object.entries(value).map(([key, v]) => [key, undefinedToNull(v)]));
  }
  return value;
};
