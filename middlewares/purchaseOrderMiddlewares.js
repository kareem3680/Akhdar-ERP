import Inventory from "../modules/inventory/models/inventoryModel.js";
import Product from "../modules/product/models/productModel.js";
import ApiError from "../utils/apiError.js";
import Logger from "../utils/loggerService.js";

const logger = new Logger("purchaseOrderMiddleware");

// ========================
// 1. Check Inventory Capacity Middleware
// ========================
export const checkInventoryCapacity = async (purchaseOrderData) => {
  const { products } = purchaseOrderData;

  if (!products || !Array.isArray(products) || products.length === 0) {
    throw new ApiError("Products array is required", 400);
  }

  const capacityChecks = await Promise.all(
    products.map(async (product) => {
      const { inventoryId, quantity } = product;

      if (!inventoryId) {
        throw new ApiError(
          `Inventory ID is required for product ${product.productId}`,
          400
        );
      }

      const inventory = await Inventory.findById(inventoryId);

      if (!inventory) {
        await logger.error("Inventory not found", { inventoryId });
        throw new ApiError(`Inventory ${inventoryId} not found`, 404);
      }

      // Check if quantity exceeds inventory capacity
      if (quantity > inventory.capacity) {
        await logger.error("Inventory capacity exceeded", {
          inventoryId,
          requested: quantity,
          capacity: inventory.capacity,
        });
        throw new ApiError(
          `Inventory ${inventory.name} cannot accept this quantity. Available capacity: ${inventory.capacity}, Requested: ${quantity}`,
          400
        );
      }

      return {
        productId: product.productId,
        inventoryId,
        requested: quantity,
        capacity: inventory.capacity,
        sufficient: quantity <= inventory.capacity,
      };
    })
  );

  await logger.info("Inventory capacity check passed", {
    products: capacityChecks.length,
  });

  return capacityChecks;
};

// ========================
// 2. Calculate Purchase Totals Middleware
// ========================
export const calculatePurchaseTotals = async (purchaseOrderData) => {
  const { products } = purchaseOrderData;

  // Calculate product totals
  const calculatedProducts = await Promise.all(
    products.map(async (product) => {
      const { productId, quantity, price, discount = 0 } = product;

      // Get product details
      const productDetails = await Product.findById(productId).select("name");
      if (!productDetails) {
        throw new ApiError(`Product ${productId} not found`, 404);
      }

      // Calculate product total
      const baseAmount = quantity * price;
      const discountAmount = (baseAmount * discount) / 100;
      const productTotal = baseAmount - discountAmount;

      return {
        ...product,
        name: productDetails.name,
        total: productTotal,
        remainingQuantity: quantity,
        deliveredQuantity: 0,
      };
    })
  );

  // Calculate order total
  const orderTotal = calculatedProducts.reduce(
    (sum, product) => sum + product.total,
    0
  );

  await logger.info("Purchase totals calculated", {
    productsCount: calculatedProducts.length,
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
export const generatePurchaseInvoiceNumber = async (purchaseOrderData) => {
  // Generate unique invoice number
  const year = new Date().getFullYear();
  const month = (new Date().getMonth() + 1).toString().padStart(2, "0");

  // Count purchase orders for this month
  const count = await PurchaseOrder.countDocuments({
    createdAt: {
      $gte: new Date(`${year}-${month}-01`),
      $lt: new Date(`${year}-${parseInt(month) + 1}-01`),
    },
  });

  const invoiceNumber = `PO-${year}${month}-${(count + 1)
    .toString()
    .padStart(4, "0")}`;

  await logger.info("Purchase invoice number generated", { invoiceNumber });

  return invoiceNumber;
};

// ========================
// 4. Validate Status Transition Middleware
// ========================
export const validatePurchaseStatusTransition = (
  currentStatus,
  newStatus,
  userId
) => {
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
  logger.info("Purchase status transition validated", {
    from: currentStatus,
    to: newStatus,
    userId,
  });

  return true;
};

// ========================
// 5. Update Inventory on Delivery Middleware
// ========================
export const updateInventoryOnDelivery = async (purchaseOrder, userId) => {
  const { _id: orderId, products } = purchaseOrder;

  await Promise.all(
    products.map(async (product) => {
      const { productId, inventoryId, deliveredQuantity, quantity } = product;

      if (deliveredQuantity > 0) {
        // Update stock
        await Stock.findOneAndUpdate(
          { productId, inventoryId },
          {
            $inc: { quantity: deliveredQuantity },
            $push: {
              transactions: {
                type: "purchase",
                orderId,
                quantity: deliveredQuantity,
                date: new Date(),
                performedBy: userId,
              },
            },
          },
          { upsert: true, new: true }
        );

        logger.info("Stock updated for delivered purchase", {
          orderId,
          productId,
          inventoryId,
          deliveredQuantity,
        });
      }
    })
  );

  return true;
};

// ========================
// 6. Check Delivered Quantity Middleware
// ========================
export const checkDeliveredQuantity = async (purchaseOrderId, deliveryData) => {
  const purchaseOrder = await PurchaseOrder.findById(purchaseOrderId);

  if (!purchaseOrder) {
    throw new ApiError("Purchase order not found", 404);
  }

  const { deliveredQuantities = [] } = deliveryData;

  const quantityChecks = purchaseOrder.products.map((product, index) => {
    const deliveredQty = deliveredQuantities[index] || 0;
    const remainingQty = product.remainingQuantity;

    if (deliveredQty < 0) {
      throw new ApiError(
        `Delivered quantity for product ${product.name} cannot be negative`,
        400
      );
    }

    if (deliveredQty > remainingQty) {
      throw new ApiError(
        `Delivered quantity for product ${product.name} exceeds remaining quantity. Remaining: ${remainingQty}, Delivered: ${deliveredQty}`,
        400
      );
    }

    return {
      productId: product.productId,
      name: product.name,
      ordered: product.quantity,
      alreadyDelivered: product.deliveredQuantity,
      remaining: remainingQty,
      deliveredNow: deliveredQty,
      newRemaining: remainingQty - deliveredQty,
    };
  });

  await logger.info("Delivered quantity check passed", {
    purchaseOrderId,
    checks: quantityChecks,
  });

  return quantityChecks;
};
