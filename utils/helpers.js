export const BASE_URL = `https://api.jsonbin.io/v3/b/`;

export function getHeaders() {
  return {
    "Content-Type": "application/json",
    "X-Master-Key": process.env.JSONBIN_API_KEY,
    "X-Bin-Meta": false,
  };
}
