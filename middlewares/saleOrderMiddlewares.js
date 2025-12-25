import Stock from "../modules/inv/models/stockModel.js";
import Product from "../modules/product/models/productModel.js";
import ApiError from "../utils/apiError.js";
import Logger from "../utils/loggerService.js";

const logger = new Logger("saleOrderMiddleware");

// ========================
// 1. Check Stock Availability Middleware
// ========================
export const checkStockAvailability = async (saleOrderData) => {
  const { products } = saleOrderData;

  if (!products || !Array.isArray(products) || products.length === 0) {
    throw new ApiError("Products array is required", 400);
  }

  const stockChecks = await Promise.all(
    products.map(async (product) => {
      const { productId, inventoryId, quantity } = product;

      const stock = await Stock.findOne({
        productId,
        inventoryId,
      });

      if (!stock) {
        await logger.error("Stock not found for product", {
          productId,
          inventoryId,
        });
        throw new ApiError(
          `Stock not found for product ${productId} in inventory ${inventoryId}`,
          404
        );
      }

      if (quantity > stock.quantity) {
        await logger.error("Insufficient stock", {
          productId,
          inventoryId,
          requested: quantity,
          available: stock.quantity,
        });
        throw new ApiError(
          `Insufficient stock for product ${productId}. Available: ${stock.quantity}, Requested: ${quantity}`,
          400
        );
      }

      return {
        productId,
        inventoryId,
        available: stock.quantity,
        requested: quantity,
        sufficient: quantity <= stock.quantity,
      };
    })
  );

  await logger.info("Stock availability check passed", {
    products: stockChecks.length,
  });

  return stockChecks;
};

// ========================
// 2. Calculate Order Totals Middleware
// ========================
export const calculateOrderTotals = async (saleOrderData) => {
  const { products, shippingCost = 0 } = saleOrderData;

  // Calculate product totals
  const calculatedProducts = await Promise.all(
    products.map(async (product) => {
      const { productId, quantity, price, discount = 0, tax = 0 } = product;

      // Get product details
      const productDetails = await Product.findById(productId).select(
        "name code"
      );
      if (!productDetails) {
        throw new ApiError(`Product ${productId} not found`, 404);
      }

      // Calculate product total
      const baseAmount = quantity * price;
      const discountAmount = (baseAmount * discount) / 100;
      const amountAfterDiscount = baseAmount - discountAmount;
      const taxAmount = (amountAfterDiscount * tax) / 100;
      const productTotal = amountAfterDiscount + taxAmount;

      return {
        ...product,
        name: productDetails.name,
        code: productDetails.code,
        total: productTotal,
      };
    })
  );

  // Calculate order total
  const productsTotal = calculatedProducts.reduce(
    (sum, product) => sum + product.total,
    0
  );
  const orderTotal = productsTotal + shippingCost;

  await logger.info("Order totals calculated", {
    productsCount: calculatedProducts.length,
    productsTotal,
    shippingCost,
    orderTotal,
  });

  return {
    products: calculatedProducts,
    totalAmount: orderTotal,
  };
};

// ========================
// 3. Generate Invoice Number Middleware
// ========================
export const generateInvoiceNumber = async (saleOrderData) => {
  // Generate unique invoice number
  const year = new Date().getFullYear();
  const month = (new Date().getMonth() + 1).toString().padStart(2, "0");

  // Count orders for this month
  const count = await SaleOrder.countDocuments({
    createdAt: {
      $gte: new Date(`${year}-${month}-01`),
      $lt: new Date(`${year}-${parseInt(month) + 1}-01`),
    },
  });

  const invoiceNumber = `SO-${year}${month}-${(count + 1)
    .toString()
    .padStart(4, "0")}`;

  await logger.info("Invoice number generated", { invoiceNumber });

  return invoiceNumber;
};

// ========================
// 4. Validate Order Status Transition Middleware
// ========================
export const validateStatusTransition = (currentStatus, newStatus, userId) => {
  const validTransitions = {
    draft: ["approved", "canceled"],
    approved: ["shipped", "canceled"],
    shipped: ["delivered", "canceled"],
    delivered: [], // Cannot change from delivered
    canceled: [], // Cannot change from canceled
    invoiced: [], // Cannot change from invoiced
  };

  if (!validTransitions[currentStatus]) {
    throw new ApiError(`Invalid current status: ${currentStatus}`, 400);
  }

  if (!validTransitions[currentStatus].includes(newStatus)) {
    throw new ApiError(
      `Cannot transition from ${currentStatus} to ${newStatus}`,
      400
    );
  }

  // Log the transition
  logger.info("Status transition validated", {
    from: currentStatus,
    to: newStatus,
    userId,
  });

  return true;
};

// ========================
// 5. Update Stock on Status Change Middleware
// ========================
export const updateStockOnStatusChange = async (
  saleOrder,
  newStatus,
  userId
) => {
  const { _id: orderId, products, status: currentStatus } = saleOrder;

  // Only update stock for specific transitions
  if (currentStatus === "approved" && newStatus === "shipped") {
    // Reduce stock when order is shipped
    await Promise.all(
      products.map(async (product) => {
        const { productId, inventoryId, quantity } = product;

        await Stock.findOneAndUpdate(
          { productId, inventoryId },
          {
            $inc: { quantity: -quantity },
            $push: {
              transactions: {
                type: "sale",
                orderId,
                quantity: -quantity,
                date: new Date(),
                performedBy: userId,
              },
            },
          }
        );

        logger.info("Stock reduced for shipped order", {
          orderId,
          productId,
          inventoryId,
          quantity,
        });
      })
    );
  } else if (newStatus === "canceled") {
    // Restore stock if order is canceled
    await Promise.all(
      products.map(async (product) => {
        const { productId, inventoryId, quantity } = product;

        await Stock.findOneAndUpdate(
          { productId, inventoryId },
          {
            $inc: { quantity: quantity },
            $push: {
              transactions: {
                type: "cancel",
                orderId,
                quantity: quantity,
                date: new Date(),
                performedBy: userId,
              },
            },
          }
        );

        logger.info("Stock restored for canceled order", {
          orderId,
          productId,
          inventoryId,
          quantity,
        });
      })
    );
  }

  return true;
};
