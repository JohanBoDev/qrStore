const db = require("../config/db");

// Agregar un producto al carrito
const addToCart = async (req, res) => {
  try {
    const { product_id, quantity } = req.body;
    const user_id = req.user.id; // ID del usuario autenticado

    if (!product_id || !quantity || quantity <= 0) {
      return res
        .status(400)
        .json({ error: "Producto y cantidad válidos son obligatorios." });
    }

    // Verificar si el producto ya está en el carrito del usuario
    const [existingCartItem] = await db.query(
      "SELECT * FROM qrstore.cart WHERE user_id = ? AND product_id = ?",
      [user_id, product_id]
    );

    if (existingCartItem.length > 0) {
      // Si el producto ya está en el carrito, actualizar cantidad
      await db.query(
        "UPDATE qrstore.cart SET quantity = quantity + ?, added_at = NOW() WHERE user_id = ? AND product_id = ?",
        [quantity, user_id, product_id]
      );

      return res.json({
        message: "Cantidad de producto actualizada en el carrito.",
      });
    } else {
      // Si el producto no está en el carrito, insertarlo
      await db.query(
        "INSERT INTO qrstore.cart (user_id, product_id, quantity, added_at) VALUES (?, ?, ?, NOW())",
        [user_id, product_id, quantity]
      );

      return res.status(201).json({ message: "Producto agregado al carrito." });
    }
  } catch (error) {
    console.error("Error agregando al carrito:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Obtener el carrito del usuario autenticado
const getCart = async (req, res) => {
  try {
    const user_id = req.user.id; // ID del usuario autenticado

    // Obtener los productos en el carrito del usuario
    const query = `
            SELECT c.id AS cart_id, p.id AS product_id, p.name, p.image_url, 
                   CAST(p.price AS DECIMAL(10,2)) AS price, 
                   c.quantity, 
                   CAST(p.price * c.quantity AS DECIMAL(10,2)) AS subtotal, 
                   c.added_at
            FROM qrstore.cart c
            JOIN qrstore.products p ON c.product_id = p.id
            WHERE c.user_id = ?
        `;

    const [cartItems] = await db.query(query, [user_id]);

    // Calcular el total asegurando que sea un número real
    const total = cartItems.reduce(
      (sum, item) => sum + parseFloat(item.subtotal),
      0
    );

    res.json({ total, items: cartItems });
  } catch (error) {
    console.error("Error obteniendo el carrito:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

//Actualizar la cantidad de un producto en el carrito
const updateCartQuantity = async (req, res) => {
  try {
    const { id } = req.params; // ID del producto en el carrito
    const { quantity } = req.body;
    const user_id = req.user.id; // ID del usuario autenticado

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ error: "La cantidad debe ser mayor a 0." });
    }

    // Verificar si el producto está en el carrito del usuario
    const [existingCartItem] = await db.query(
      "SELECT * FROM qrstore.cart WHERE id = ? AND user_id = ?",
      [id, user_id]
    );

    if (existingCartItem.length === 0) {
      return res
        .status(404)
        .json({ message: "Producto no encontrado en el carrito." });
    }

    // Actualizar la cantidad del producto en el carrito
    await db.query(
      "UPDATE qrstore.cart SET quantity = ?, added_at = NOW() WHERE id = ? AND user_id = ?",
      [quantity, id, user_id]
    );

    res.json({ message: "Cantidad de producto actualizada correctamente." });
  } catch (error) {
    console.error("Error actualizando la cantidad en el carrito:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Eliminar un producto del carrito
const deleteCartItem = async (req, res) => {
  try {
    const { id } = req.params; // ID del carrito (cart_id)
    const user_id = req.user.id; // ID del usuario autenticado

    // Verificar si el producto está en el carrito del usuario
    const [existingCartItem] = await db.query(
      "SELECT * FROM qrstore.cart WHERE id = ? AND user_id = ?",
      [id, user_id]
    );

    if (existingCartItem.length === 0) {
      return res
        .status(404)
        .json({ message: "Producto no encontrado en el carrito." });
    }

    // Eliminar el producto del carrito
    await db.query("DELETE FROM qrstore.cart WHERE id = ? AND user_id = ?", [
      id,
      user_id,
    ]);

    res.json({ message: "Producto eliminado del carrito correctamente." });
  } catch (error) {
    console.error("Error eliminando producto del carrito:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

//Vaciar el carrito
const clearCart = async (req, res) => {
    try {
        const user_id = req.user.id; // ID del usuario autenticado

        // Verificar si el carrito tiene productos antes de vaciarlo
        const [cartItems] = await db.query("SELECT COUNT(*) AS total FROM qrstore.cart WHERE user_id = ?", [user_id]);

        if (cartItems[0].total === 0) {
            return res.status(404).json({ message: "El carrito ya está vacío." });
        }

        // Eliminar todos los productos del carrito del usuario
        await db.query("DELETE FROM qrstore.cart WHERE user_id = ?", [user_id]);

        res.json({ message: "Carrito vaciado correctamente." });

    } catch (error) {
        console.error("Error vaciando el carrito:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};


module.exports = {
  addToCart,
  getCart,
  updateCartQuantity,
  deleteCartItem,
  clearCart,
};
