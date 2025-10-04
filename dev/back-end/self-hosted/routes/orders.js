const express = require('express');
const router = express.Router();

// Generate random order code
function generateOrderCode() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const codeLength = 8;
  let code = '';
  for (let i = 0; i < codeLength; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

// Calculate pricing
function calculatePricing(quantity) {
  const basePrice = 40; // $40 CAD per cover
  const taxRate = 0.15; // 15% Quebec tax
  
  // Apply 5% discount for pairs (2+ covers of same configuration)
  const discountRate = quantity >= 2 ? 0.05 : 0;
  const subtotal = basePrice * quantity * (1 - discountRate);
  const taxAmount = subtotal * taxRate;
  const totalPrice = subtotal + taxAmount;
  
  return {
    basePrice,
    subtotal,
    taxAmount,
    totalPrice,
    discountApplied: discountRate > 0
  };
}

// POST /api/orders - Create a new order
router.post('/', async (req, res) => {
  try {
    const {
      spokeCount,
      wheelSize,
      customerName,
      customerEmail,
      shippingAddress,
      notes,
      quantity = 1
    } = req.body;

    // Validate required fields
    if (!spokeCount || !wheelSize || !customerName || !customerEmail || !shippingAddress) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['spokeCount', 'wheelSize', 'customerName', 'customerEmail', 'shippingAddress']
      });
    }

    // Validate spoke count
    if (!['32', '36'].includes(spokeCount.toString())) {
      return res.status(400).json({
        error: 'Invalid spoke count',
        validValues: ['32', '36']
      });
    }

    // Validate wheel size
    if (!['26', '650b', '700'].includes(wheelSize)) {
      return res.status(400).json({
        error: 'Invalid wheel size',
        validValues: ['26', '650b', '700']
      });
    }

    // Validate quantity
    if (quantity < 1 || quantity > 10) {
      return res.status(400).json({
        error: 'Invalid quantity',
        validRange: '1-10'
      });
    }

    // Generate order code
    const orderCode = generateOrderCode();
    
    // Calculate pricing
    const pricing = calculatePricing(quantity);

    // Create order data
    const orderData = {
      order_code: orderCode,
      customer_name: customerName,
      customer_email: customerEmail,
      shipping_address: shippingAddress,
      notes: notes || '',
      order_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
      status: 'waiting_for_payment',
      total_price_cad: pricing.totalPrice,
      tax_amount_cad: pricing.taxAmount
    };

    // Create order in PocketBase
    const order = await global.pocketbase.createRecord('orders', orderData);

    // Create order item data
    const orderItemData = {
      order: order.id,
      spoke_count: parseInt(spokeCount),
      wheel_size: wheelSize,
      quantity: quantity,
      unit_price_cad: pricing.basePrice
    };

    // Create order item in PocketBase
    const orderItem = await global.pocketbase.createRecord('order_items', orderItemData);

    // Return success response
    res.status(201).json({
      success: true,
      order: {
        id: order.id,
        orderCode: order.order_code,
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        totalPrice: order.total_price_cad,
        taxAmount: order.tax_amount_cad,
        status: order.status,
        orderDate: order.order_date,
        item: {
          spokeCount: orderItem.spoke_count,
          wheelSize: orderItem.wheel_size,
          quantity: orderItem.quantity,
          unitPrice: orderItem.unit_price_cad
        },
        pricing: {
          basePrice: pricing.basePrice,
          subtotal: pricing.subtotal,
          taxAmount: pricing.taxAmount,
          totalPrice: pricing.totalPrice,
          discountApplied: pricing.discountApplied
        }
      }
    });

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      error: 'Failed to create order',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/orders/:orderCode - Get order by order code
router.get('/:orderCode', async (req, res) => {
  try {
    const { orderCode } = req.params;

    // Find order by order code
    const orders = await global.pocketbase.listRecords('orders', {
      filter: `order_code = "${orderCode}"`,
      expand: 'order_items'
    });

    if (orders.items.length === 0) {
      return res.status(404).json({
        error: 'Order not found',
        orderCode
      });
    }

    const order = orders.items[0];

    // Get order items
    const orderItems = await global.pocketbase.listRecords('order_items', {
      filter: `order = "${order.id}"`
    });

    res.json({
      success: true,
      order: {
        id: order.id,
        orderCode: order.order_code,
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        shippingAddress: order.shipping_address,
        notes: order.notes,
        orderDate: order.order_date,
        status: order.status,
        totalPrice: order.total_price_cad,
        taxAmount: order.tax_amount_cad,
        items: orderItems.items.map(item => ({
          spokeCount: item.spoke_count,
          wheelSize: item.wheel_size,
          quantity: item.quantity,
          unitPrice: item.unit_price_cad
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      error: 'Failed to fetch order',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// PUT /api/orders/:orderCode/status - Update order status (for admin use)
router.put('/:orderCode/status', async (req, res) => {
  try {
    const { orderCode } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['waiting_for_payment', 'to_produce', 'to_send', 'done', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        validStatuses
      });
    }

    // Find order by order code
    const orders = await global.pocketbase.listRecords('orders', {
      filter: `order_code = "${orderCode}"`
    });

    if (orders.items.length === 0) {
      return res.status(404).json({
        error: 'Order not found',
        orderCode
      });
    }

    const order = orders.items[0];

    // Update order status
    const updatedOrder = await global.pocketbase.updateRecord('orders', order.id, {
      status: status
    });

    res.json({
      success: true,
      order: {
        id: updatedOrder.id,
        orderCode: updatedOrder.order_code,
        status: updatedOrder.status
      }
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      error: 'Failed to update order status',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
