// api/orders/index.js — POST /api/orders (customer places order)
const { getDb, admin } = require('../../lib/firebase');
const { handleCors } = require('../../lib/cors');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const {
      customer_name,
      table_number,
      items_with_qty,
      note,
      total_price,
      order_type,
    } = req.body;

    if (!customer_name || typeof customer_name !== 'string') {
      return res.status(400).json({ error: 'customer_name is required.' });
    }
    if (!table_number) {
      return res.status(400).json({ error: 'table_number is required.' });
    }
    if (!Array.isArray(items_with_qty) || items_with_qty.length === 0) {
      return res.status(400).json({ error: 'items_with_qty must be a non-empty array.' });
    }
    if (typeof total_price !== 'number' || total_price <= 0) {
      return res.status(400).json({ error: 'total_price must be a positive number.' });
    }

    const sanitisedItems = items_with_qty.map((item) => ({
      name: String(item.name || '').slice(0, 200),
      qty: Math.max(1, parseInt(item.qty, 10) || 1),
    }));

    const db = getDb();
    const docRef = await db.collection('orders').add({
      customer_name: String(customer_name).slice(0, 100),
      table_number: String(table_number).slice(0, 20),
      items_with_qty: sanitisedItems,
      note: note ? String(note).slice(0, 500) : 'بدون إضافات',
      total_price: parseFloat(total_price.toFixed(2)),
      order_type: order_type ? String(order_type).slice(0, 50) : 'داخل المكان',
      status: 'قيد الانتظار',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(201).json({ id: docRef.id, message: 'Order created.' });
  } catch (err) {
    console.error('[Orders] createOrder error:', err);
    return res.status(500).json({ error: 'Failed to create order.' });
  }
};
