const sanitizeObject = (obj, fields) => {
  return Object.fromEntries(
    fields
      .map(([key, valueFn]) => {
        try {
          const value = valueFn(obj);
          return value !== undefined ? [key, value] : null;
        } catch {
          return null;
        }
      })
      .filter(Boolean)
  );
};

export function sanitizeUser(user) {
  return sanitizeObject(user, [
    ["id", (u) => u._id],
    ["name", (u) => u.name],
    ["email", (u) => u.email],
    ["phone", (u) => u.phone],
    ["active", (u) => u.active],
    ["role", (u) => u.role],
    ["position", (u) => u.position],
    ["jobId", (u) => u.jobId],
    ["hireDate", (u) => u.hireDate],
    [
      "organizations",
      (u) =>
        u.organizations?.map((org) => ({
          organization_id: org.organization_id,
        })),
    ],
  ]);
}

export function sanitizeCategory(category) {
  return sanitizeObject(category, [
    ["id", (c) => c._id],
    ["category", (c) => c.category],
    ["createdAt", (c) => c.createdAt],
    ["updatedAt", (c) => c.updatedAt],
  ]);
}

export function sanitizeProduct(product) {
  return sanitizeObject(product, [
    ["id", (p) => p._id],
    ["name", (p) => p.name],
    ["code", (p) => p.code],
    ["wholesalePrice", (p) => p.wholesalePrice],
    ["retailPrice", (p) => p.retailPrice],
    ["tax", (p) => p.tax],
    ["description", (p) => p.description],
    ["category", (p) => p.category],
    ["unit", (p) => p.unit],
    ["img", (p) => p.img],
    ["total", (p) => p.total],
    ["createdAt", (p) => p.createdAt],
    ["updatedAt", (p) => p.updatedAt],
  ]);
}

export function sanitizeCustomer(customer) {
  return sanitizeObject(customer, [
    ["id", (c) => c._id],
    ["name", (c) => c.name],
    ["email", (c) => c.email],
    ["phone", (c) => c.phone],
    ["currency", (c) => c.currency],
    ["notes", (c) => c.notes],
    ["address", (c) => c.address],
    ["country", (c) => c.country],
    ["city", (c) => c.city],
    ["taxNumber", (c) => c.taxNumber],
    ["status", (c) => c.status],
    [
      "organizations",
      (c) =>
        c.organizationId?.map((org) => ({
          id: org._id || org,
          name: org.name || "Unknown Organization",
        })),
    ],
    ["createdAt", (c) => c.createdAt],
    ["updatedAt", (c) => c.updatedAt],
  ]);
}

export function sanitizeOrganization(organization) {
  return sanitizeObject(organization, [
    ["id", (o) => o._id],
    ["tradeName", (o) => o.tradeName],
    ["address", (o) => o.address],
    ["locations", (o) => o.locations],
    ["country", (o) => o.country],
    ["email", (o) => o.email],
    ["phone", (o) => o.phone],
    ["website", (o) => o.website],
    ["description", (o) => o.description],
    ["status", (o) => o.status],
    [
      "userId",
      (o) => ({
        id: o.userId?._id || o.userId,
        name: o.userId?.name,
        email: o.userId?.email,
        role: o.userId?.role,
      }),
    ],
    ["logo", (o) => o.logo],
    ["taxId", (o) => o.taxId],
    ["industry", (o) => o.industry],
    [
      "customers",
      (o) =>
        o.customers?.map((customer) => ({
          id: customer._id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          currency: customer.currency,
          status: customer.status,
        })) || [],
    ],
    ["employeeCount", (o) => o.employeeCount || 0],
    ["createdAt", (o) => o.createdAt || o.created_at],
    ["updatedAt", (o) => o.updatedAt || o.updated_at],
  ]);
}

export function sanitizeSaleInvoice(invoice) {
  return sanitizeObject(invoice, [
    ["id", (i) => i._id],
    ["invoiceNumber", (i) => i.invoiceNumber],
    ["saleOrderId", (i) => i.saleOrderId],
    [
      "customer",
      (i) => ({
        id: i.customer?._id || i.customer,
        name: i.customer?.name,
        email: i.customer?.email,
        phone: i.customer?.phone,
      }),
    ],
    [
      "organization",
      (i) => ({
        id: i.organization?._id || i.organization,
        tradeName: i.organization?.tradeName,
        email: i.organization?.email,
      }),
    ],
    [
      "products",
      (i) =>
        i.products?.map((product) => ({
          product: {
            id: product.product?._id || product.product,
            name: product.product?.name,
            code: product.product?.code || product.code,
          },
          quantity: product.quantity,
          wholesalePrice: product.wholesalePrice,
          retailPrice: product.retailPrice,
          discount: product.discount,
          tax: product.tax,
          total: product.total,
          inventory: product.inventory,
        })) || [],
    ],
    ["paymentStatus", (i) => i.paymentStatus],
    ["status", (i) => i.status],
    ["notes", (i) => i.notes],
    ["totalPayment", (i) => i.totalPayment],
    ["amountPaid", (i) => i.amountPaid],
    ["amountDue", (i) => i.amountDue],
    ["dueDate", (i) => i.dueDate],
    [
      "createdBy",
      (i) => ({
        id: i.createdBy?._id || i.createdBy,
        name: i.createdBy?.name,
        email: i.createdBy?.email,
      }),
    ],
    [
      "paymentHistory",
      (i) =>
        i.paymentHistory?.map((payment) => ({
          amount: payment.amount,
          paymentMethod: payment.paymentMethod,
          notes: payment.notes,
          recordedBy: payment.recordedBy,
          recordedAt: payment.recordedAt,
        })) || [],
    ],
    ["createdAt", (i) => i.createdAt],
    ["updatedAt", (i) => i.updatedAt],
  ]);
}

export function sanitizeSaleOrder(order) {
  return sanitizeObject(order, [
    ["id", (o) => o._id],
    ["invoiceNumber", (o) => o.invoiceNumber],
    [
      "customer",
      (o) => ({
        id: o.customerId?._id || o.customerId,
        name: o.customerId?.name,
        email: o.customerId?.email,
        phone: o.customerId?.phone,
      }),
    ],
    [
      "organization",
      (o) => ({
        id: o.organizationId?._id || o.organizationId,
        tradeName: o.organizationId?.tradeName,
        email: o.organizationId?.email,
      }),
    ],
    [
      "products",
      (o) =>
        o.products?.map((product) => ({
          product: {
            id: product.productId?._id || product.productId,
            name: product.productId?.name || product.name,
            code: product.productId?.code || product.code,
          },
          quantity: product.quantity,
          wholesalePrice: product.wholesalePrice,
          retailPrice: product.retailPrice,
          discount: product.discount,
          tax: product.tax,
          total: product.total,
          inventory: product.inventoryId,
        })) || [],
    ],
    ["expectedDeliveryDate", (o) => o.expectedDeliveryDate],
    ["currency", (o) => o.currency],
    ["status", (o) => o.status],
    ["notes", (o) => o.notes],
    [
      "createdBy",
      (o) => ({
        id: o.createdBy?._id || o.createdBy,
        name: o.createdBy?.name,
        email: o.createdBy?.email,
      }),
    ],
    ["shippingCost", (o) => o.shippingCost],
    ["totalAmount", (o) => o.totalAmount],
    ["paymentStatus", (o) => o.paymentStatus],
    ["createdAt", (o) => o.createdAt],
    ["updatedAt", (o) => o.updatedAt],
  ]);
}

export function sanitizePurchaseOrder(order) {
  return sanitizeObject(order, [
    ["id", (o) => o._id],
    ["invoiceNumber", (o) => o.invoiceNumber],
    [
      "supplier",
      (o) => ({
        id: o.supplierId?._id || o.supplierId,
        name: o.supplierId?.name,
        email: o.supplierId?.email,
        phone: o.supplierId?.phone,
      }),
    ],
    [
      "organization",
      (o) => ({
        id: o.organizationId?._id || o.organizationId,
        tradeName: o.organizationId?.tradeName,
        email: o.organizationId?.email,
      }),
    ],
    [
      "products",
      (o) =>
        o.products?.map((product) => ({
          product: {
            id: product.productId?._id || product.productId,
            name: product.productId?.name || product.name,
          },
          quantity: product.quantity,
          deliveredQuantity: product.deliveredQuantity,
          remainingQuantity: product.remainingQuantity,
          retailPrice: product.retailPrice,
          wholesalePrice: product.wholesalePrice,
          discount: product.discount,
          total: product.total,
          inventory: product.inventoryId,
        })) || [],
    ],
    ["expectedDeliveryDate", (o) => o.expectedDeliveryDate],
    ["currency", (o) => o.currency],
    ["status", (o) => o.status],
    ["notes", (o) => o.notes],
    [
      "createdBy",
      (o) => ({
        id: o.createdBy?._id || o.createdBy,
        name: o.createdBy?.name,
        email: o.createdBy?.email,
      }),
    ],
    ["totalAmount", (o) => o.totalAmount],
    ["createdAt", (o) => o.createdAt],
    ["updatedAt", (o) => o.updatedAt],
  ]);
}

export function sanitizeAttendance(attendance) {
  return sanitizeObject(attendance, [
    ["id", (a) => a._id],
    [
      "employee",
      (a) => ({
        id: a.employee?._id || a.employee,
        name: a.employee?.name,
        position: a.employee?.position,
        department: a.employee?.department,
      }),
    ],
    ["date", (a) => a.date],
    ["checkIn", (a) => a.checkIn],
    ["checkOut", (a) => a.checkOut],
    ["totalHours", (a) => a.totalHours],
    ["overtime", (a) => a.overtime],
    ["deduction", (a) => a.deduction],
    ["status", (a) => a.status],
    ["notes", (a) => a.notes],
    ["createdAt", (a) => a.createdAt],
    ["updatedAt", (a) => a.updatedAt],
  ]);
}

export function sanitizeEmployee(employee) {
  return sanitizeObject(employee, [
    ["id", (e) => e._id],
    ["employeeId", (e) => e.employeeId],
    ["name", (e) => e.name],
    ["avatar", (e) => e.avatar],
    ["jobTitle", (e) => e.jobTitle],
    ["nationalId", (e) => e.nationalId],
    ["address", (e) => e.address],
    ["email", (e) => e.email],
    ["phone", (e) => e.phone],
    ["birthDate", (e) => e.birthDate],
    ["alternativePhone", (e) => e.alternativePhone],
    ["department", (e) => e.department],
    ["workLocation", (e) => e.workLocation],
    ["shift", (e) => e.shift],
    ["bonus", (e) => e.bonus],
    ["role", (e) => e.role],
    ["levelOfExperience", (e) => e.levelOfExperience],
    ["employmentType", (e) => e.employmentType],
    ["manager", (e) => e.manager],
    ["salary", (e) => e.salary],
    ["employmentDate", (e) => e.employmentDate],
    ["active", (e) => e.active],
    ["createdAt", (e) => e.createdAt],
    ["updatedAt", (e) => e.updatedAt],
  ]);
}

export function sanitizeDepartment(department) {
  const baseData = sanitizeObject(department, [
    ["id", (d) => d._id],
    ["name", (d) => d.name],
    ["code", (d) => d.code],
    ["description", (d) => d.description],
    ["active", (d) => d.active],
    ["manager", (d) => d.manager],
    ["budget", (d) => d.budget],
    ["location", (d) => d.location],
    ["color", (d) => d.color],
    ["createdBy", (d) => d.createdBy],
    ["createdAt", (d) => d.createdAt],
    ["updatedAt", (d) => d.updatedAt],
  ]);

  // Add virtual fields if they exist
  if (department.employeeCount !== undefined) {
    baseData.employeeCount = department.employeeCount;
  }

  if (department.employees !== undefined) {
    baseData.employees = department.employees;
  }

  return baseData;
}
