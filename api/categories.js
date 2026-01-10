export default async function handler(req, res) {
  const CATEGORIES_BIN_ID = process.env.CATEGORIES_BIN_ID;
  const JSONBIN_API_KEY = process.env.JSONBIN_API_KEY;
  const BASE_URL = `https://api.jsonbin.io/v3/b/${CATEGORIES_BIN_ID}`;

  function getHeaders() {
    return {
      "Content-Type": "application/json",
      "X-Master-Key": JSONBIN_API_KEY,
      "X-Bin-Meta": false,
    };
  }

  async function getCategories() {
    const response = await fetch(BASE_URL, {
      headers: getHeaders(),
    });
    const json = await response.json();
    return json.info == "empty" ? [] : json;
  }

  try {
    // 1️⃣ List all categories
    if (req.method === "GET") {
      const categories = await getCategories();
      return res.status(200).json(categories);
    }

    // 2️⃣ Add new category
    if (req.method === "POST") {
      const { name } = await req.body;
      if (!name)
        return res.status(400).json({ error: "Missing category name" });

      // Fetch current data
      const categories = await getCategories();
      const newCategory = { id: name.replace(" ", "-").toLowerCase(), name };
      const updated = [...categories, newCategory];

      // Update bin
      await fetch(BASE_URL, {
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
      await fetch(BASE_URL, {
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
