const Order = require('../models/Order');
const Product = require('../models/Product');

exports.placeOrder = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || !quantity) {
      return res.status(400).json({ msg: 'productId and quantity are required' });
    }

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ msg: 'Product not found or inactive' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ msg: 'Insufficient stock' });
    }

    const totalPrice = quantity * product.price;

    const order = new Order({
      vendor: req.user._id,
      farmer: product.owner,
      product: productId,
      quantity,
      totalPrice
    });

    await order.save();

    // Reduce stock
    product.stock -= quantity;
    product.totalSold += quantity;
    product.lastUpdatedStock = Date.now();
    await product.save();

    res.status(201).json({ msg: 'Order placed successfully', order });
  } catch (err) {
    console.error('Error placing order:', err);
    res.status(500).json({ msg: 'Server error while placing order.' });
  }
};

exports.getVendorOrders = async (req, res) => {
  try {
    const orders = await Order.find({ vendor: req.user._id })
      .populate('product', 'name unit price')
      .populate('farmer', 'name email');

    res.status(200).json({ msg: 'Orders fetched', orders });
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ msg: 'Server error while fetching orders.' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['Confirmed', 'Shipped', 'Delivered', 'Cancelled'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ msg: 'Invalid status update.' });
    }

    const order = await Order.findById(orderId).populate('product');
    if (!order) {
      return res.status(404).json({ msg: 'Order not found' });
    }

    if (order.farmer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ msg: 'Only farmer can update the status' });
    }

    order.status = status;
    await order.save();

    res.status(200).json({ msg: 'Order status updated', order });
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ msg: 'Server error while updating status.' });
  }
};



// ✅ Farmer can view orders for their products
exports.getOrdersForMyProducts = async (req, res) => {
    try {
        const farmerId = req.user.id;

        const orders = await Order.find()
            .populate({
                path: 'product',
                match: { owner: farmerId }
            })
            .populate('vendor', 'name email')
            .sort({ createdAt: -1 });

        const filtered = orders.filter(order => order.product !== null);

        res.status(200).json({ msg: 'Orders for your products fetched', orders: filtered });
    } catch (err) {
        console.error('Error fetching farmer orders:', err);
        res.status(500).json({ msg: 'Server error.' });
    }
};


