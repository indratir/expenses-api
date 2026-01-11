import { BASE_URL, getHeaders } from "../utils/helpers";
import { getCategories } from "./categories";
import { getPaymentMethods } from "./payment-methods";

const ENDPOINT = `${BASE_URL}${process.env.EXPENSES_BIN_ID}`;

export default async function handler(req, res) {
  async function getExpenses() {
    const response = await fetch(ENDPOINT, {
      headers: getHeaders(),
    });
    const json = await response.json();
    return json.info == "empty" ? [] : json;
  }

  try {
    // 1️⃣ List all expenses
    if (req.method === "GET") {
      const categories = await getCategories();
      const paymentMethods = await getPaymentMethods();
      const expenses = await getExpenses();

      const enrichedExpenses = expenses.map((expense) => {
        const category = categories.find((cat) => cat.id === expense.category);
        const paymentMethod = paymentMethods.find(
          (pay) => pay.id === expense.paymentMethod
        );

        return {
          ...expense,
          category: category || expense.category,
          paymentMethod: paymentMethod || expense.paymentMethod,
        };
      });

      return res.status(200).json(enrichedExpenses);
    }

    // 2️⃣ Add new expense
    if (req.method === "POST") {
      const { text, amount, date, category, paymentMethod } = await req.body;
      if (!text || !amount || !date || !category || !paymentMethod) {
        return res.status(400).json({ error: "Missing expenses field" });
      }

      // Fetch current data
      const expenses = await getExpenses();
      const newExpense = {
        id: crypto.randomUUID(),
        text: text,
        amount: amount,
        date: date,
        category: category,
        paymentMethod: paymentMethod,
      };
      const updated = [...expenses, newExpense];

      // Update bin
      await fetch(ENDPOINT, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(updated),
      });

      return res.status(201).json({ success: true });
    }

    // 3️⃣ Delete expense
    if (req.method === "DELETE") {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: "Missing expense id" });

      // Fetch current data
      const expenses = await getExpenses();
      const updated = expenses.filter((exp) => exp.id !== id);
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
