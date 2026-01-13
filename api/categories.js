import { BASE_URL, getHeaders } from "../utils/helpers";

const ENDPOINT = `${BASE_URL}${process.env.CATEGORIES_BIN_ID}`;

export async function getCategories() {
  const response = await fetch(ENDPOINT, {
    headers: getHeaders(),
  });
  const json = await response.json();
  return json.info == "empty" ? [] : json;
}

export default async function handler(req, res) {
  try {
    // 1️⃣ List all categories
    if (req.method === "GET") {
      const categories = await getCategories();
      return res.status(200).json(categories);
    }

    // 2️⃣ Add new category
    if (req.method === "POST") {
      const { name, hexColor } = await req.body;
      if ((!name, !hexColor))
        return res.status(400).json({ error: "Missing category name" });

      // Fetch current data
      const categories = await getCategories();
      const newCategory = {
        id: name.replace(" ", "-").toLowerCase(),
        name: name,
        hexColor: hexColor,
      };
      const updated = [...categories, newCategory];

      // Update bin
      await fetch(ENDPOINT, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(updated),
      });

      return res.status(201).json({ success: true });
    }

    // 3️⃣ Delete category
    if (req.method === "DELETE") {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: "Missing category id" });

      // Fetch current data
      const categories = await getCategories();
      const updated = categories.filter((cat) => cat.id !== id);
      const body = updated.length > 0 ? updated : { info: "empty" };

      // Update bin
      await fetch(ENDPOINT, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(body),
      });

      return res.status(200).json({ success: true });
    }

    // Unsupported method
    res.setHeader("Allow", ["GET", "POST", "DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
