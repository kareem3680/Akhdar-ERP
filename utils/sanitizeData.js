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

export function sanitizeInventory(inventory) {
  return sanitizeObject(inventory, [
    ["id", (i) => i._id],
    ["name", (i) => i.name],
    ["avatar", (i) => i.avatar],
    ["location", (i) => i.location],
    ["capacity", (i) => i.capacity],
    ["currentCapacity", (i) => i.capacity - (i.usedCapacity || 0)],
    ["organizationId", (i) => i.organizationId],
    ["description", (i) => i.description],
    ["status", (i) => i.status],
    ["managerId", (i) => i.managerId],
    ["contactPhone", (i) => i.contactPhone],
    ["isActive", (i) => i.isActive],
    ["createdAt", (i) => i.createdAt],
    ["updatedAt", (i) => i.updatedAt],
  ]);
}

export function sanitizeStock(stock) {
  return sanitizeObject(stock, [
    ["id", (s) => s._id],
    ["productId", (s) => s.productId],
    ["inventoryId", (s) => s.inventoryId],
    ["quantity", (s) => s.quantity],
    ["minQuantity", (s) => s.minQuantity],
    ["maxQuantity", (s) => s.maxQuantity],
    ["status", (s) => s.status],
    [
      "availableQuantity",
      (s) =>
        s.getAvailableQuantity
          ? s.getAvailableQuantity()
          : Math.max(0, s.quantity - (s.minQuantity || 0)),
    ],
    ["lastUpdatedBy", (s) => s.lastUpdatedBy],
    ["transactions", (s) => s.transactions],
    ["isActive", (s) => s.isActive],
    ["createdAt", (s) => s.createdAt],
    ["updatedAt", (s) => s.updatedAt],
  ]);
}

export function sanitizeSupplier(supplier) {
  return sanitizeObject(supplier, [
    ["id", (s) => s._id],
    ["name", (s) => s.name],
    ["email", (s) => s.email],
    ["address", (s) => s.address],
    ["phone", (s) => s.phone],
    ["organizationId", (s) => s.organizationId],
    ["taxId", (s) => s.taxId],
    ["website", (s) => s.website],
    ["contactPerson", (s) => s.contactPerson],
    ["paymentTerms", (s) => s.paymentTerms],
    ["currency", (s) => s.currency],
    ["rating", (s) => s.rating],
    ["notes", (s) => s.notes],
    ["status", (s) => s.status],
    ["createdBy", (s) => s.createdBy],
    [
      "contactInfo",
      (s) => ({
        name: s.name,
        email: s.email,
        phone: s.phone,
        address: s.address,
        contactPerson: s.contactPerson,
      }),
    ],
    [
      "organizationsCount",
      (s) =>
        s.organizationsCount ||
        (s.organizationId ? s.organizationId.length : 0),
    ],
    ["createdAt", (s) => s.createdAt],
    ["updatedAt", (s) => s.updatedAt],
  ]);
}

export function sanitizeStockTransfer(transfer) {
  return sanitizeObject(transfer, [
    ["id", (t) => t._id],
    ["reference", (t) => t.reference],
    ["status", (t) => t.status],
    ["from", (t) => t.from],
    ["to", (t) => t.to],
    [
      "products",
      (t) =>
        t.products?.map((p) => ({
          productId: p.productId,
          unit: p.unit,
          name: p.name,
          code: p.code,
        })),
    ],
    ["shippingCost", (t) => t.shippingCost],
    ["notes", (t) => t.notes],
    ["createdBy", (t) => t.createdBy],
    ["approvedBy", (t) => t.approvedBy],
    ["createdAt", (t) => t.createdAt],
    ["updatedAt", (t) => t.updatedAt],
    ["canShip", (t) => (t.canShip ? t.canShip() : t.status === "draft")],
    [
      "canDeliver",
      (t) => (t.canDeliver ? t.canDeliver() : t.status === "shipping"),
    ],
  ]);
}

export function sanitizeAccount(account) {
  return sanitizeObject(account, [
    ["id", (a) => a._id],
    ["name", (a) => a.name],
    ["code", (a) => a.code],
    ["amount", (a) => a.amount],
    ["type", (a) => a.type],
    ["subtype", (a) => a.subtype],
    ["description", (a) => a.description],
    ["isActive", (a) => a.isActive],
    ["parentAccount", (a) => a.parentAccount],
    ["currency", (a) => a.currency],
    ["createdAt", (a) => a.createdAt],
    ["updatedAt", (a) => a.updatedAt],
  ]);
}

export function sanitizeJournal(journal) {
  return sanitizeObject(journal, [
    ["id", (j) => j._id],
    ["name", (j) => j.name],
    ["journalType", (j) => j.journalType],
    ["code", (j) => j.code],
    ["createdAt", (j) => j.createdAt],
    ["updatedAt", (j) => j.updatedAt],
  ]);
}

export function sanitizeJournalEntry(journalEntry) {
  return sanitizeObject(journalEntry, [
    ["id", (je) => je._id],
    ["journalId", (je) => je.journalId],
    [
      "lines",
      (je) =>
        je.lines?.map((line) => ({
          accountId: line.accountId,
          description: line.description,
          debit: line.debit,
          credit: line.credit,
        })),
    ],
    ["date", (je) => je.date],
    ["reference", (je) => je.reference],
    ["notes", (je) => je.notes],
    ["status", (je) => je.status],
    ["createdAt", (je) => je.createdAt],
    ["updatedAt", (je) => je.updatedAt],
    [
      "totalDebit",
      (je) => je.lines?.reduce((sum, line) => sum + line.debit, 0) || 0,
    ],
    [
      "totalCredit",
      (je) => je.lines?.reduce((sum, line) => sum + line.credit, 0) || 0,
    ],
  ]);
}

export function sanitizePayroll(payroll) {
  return sanitizeObject(payroll, [
    ["id", (p) => p._id],
    ["employee", (p) => p.employee],
    ["salary", (p) => p.salary],
    ["overtime", (p) => p.overtime],
    ["deduction", (p) => p.deduction],
    ["bonus", (p) => p.bonus],
    ["total", (p) => p.total],
    ["date", (p) => p.date],
    ["month", (p) => p.month],
    ["year", (p) => p.year],
    ["status", (p) => p.status],
    ["paymentDate", (p) => p.paymentDate],
    ["paymentMethod", (p) => p.paymentMethod],
    ["notes", (p) => p.notes],
    ["createdBy", (p) => p.createdBy],
    ["isActive", (p) => p.isActive],
    ["createdAt", (p) => p.createdAt],
    ["updatedAt", (p) => p.updatedAt],
  ]);
}

export function sanitizeLoan(loan) {
  const sanitized = sanitizeObject(loan, [
    ["id", (l) => l._id || l.id],
    ["borrowerType", (l) => l.borrowerType],
    ["borrowerId", (l) => l.borrower?._id || l.borrower],
    ["borrowerName", (l) => l.borrower?.name || l.borrower?.tradeName],
    ["loanAmount", (l) => l.loanAmount],
    ["installmentNumber", (l) => l.installmentNumber],
    [
      "installmentAmount",
      (l) =>
        l.installmentAmount != null
          ? Math.ceil(Number(l.installmentAmount) * 100) / 100
          : undefined,
    ],
    ["interestRate", (l) => l.interestRate],
    ["totalPayable", (l) => l.totalPayable],
    ["status", (l) => l.status],
    ["startDate", (l) => formatDate(l.startDate)],
    ["remainingBalance", (l) => l.remainingBalance || l.remaningBalance],
    ["description", (l) => l.description],
    ["createdAt", (l) => formatDate(l.createdAt)],
    ["updatedAt", (l) => formatDate(l.updatedAt)],
    ["createdById", (l) => l.createdBy?._id || l.createdBy],
    ["createdByName", (l) => l.createdBy?.name],
    ["approvedById", (l) => l.approvedBy?._id || l.approvedBy],
    ["approvedByName", (l) => l.approvedBy?.name],
  ]);

  // Add calculated fields
  if (sanitized) {
    sanitized.summary = {
      totalAmount: sanitized.totalPayable,
      remainingAmount: sanitized.remainingBalance,
      paidAmount: sanitized.totalPayable - sanitized.remainingBalance,
      progressPercentage:
        sanitized.totalPayable > 0
          ? (
              ((sanitized.totalPayable - sanitized.remainingBalance) /
                sanitized.totalPayable) *
              100
            ).toFixed(2)
          : 0,
      installmentProgress: `${loan.paidInstallmentsCount || 0}/${
        sanitized.installmentNumber
      }`,
    };
  }

  return sanitized;
}

export function sanitizeLoanInstallment(installment) {
  const sanitized = sanitizeObject(installment, [
    ["id", (i) => i._id || i.id],
    ["loanId", (i) => i.loanId?._id || i.loanId],
    ["loanAmount", (i) => i.loanId?.loanAmount],
    ["amount", (i) => i.amount],
    ["dueDate", (i) => formatDate(i.dueDate)],
    ["status", (i) => i.status],
    ["paymentDate", (i) => formatDate(i.paymentDate)],
    ["paymentMethod", (i) => i.paymentMethod],
    ["notes", (i) => i.notes],
    ["createdAt", (i) => formatDate(i.createdAt)],
    ["updatedAt", (i) => formatDate(i.updatedAt)],
    ["createdById", (i) => i.createdBy?._id || i.createdBy],
    ["createdByName", (i) => i.createdBy?.name],
    [
      "borrowerName",
      (i) => i.loanId?.borrower?.name || i.loanId?.borrower?.tradeName,
    ],
    ["loanStatus", (i) => i.loanId?.status],
  ]);

  // Calculate days status
  if (sanitized && sanitized.dueDate) {
    const dueDate = new Date(sanitized.dueDate);
    const today = new Date();

    if (sanitized.status === "pending" && dueDate < today) {
      sanitized.daysOverdue = Math.ceil(
        (today - dueDate) / (1000 * 60 * 60 * 24)
      );
      sanitized.status = "overdue";
    } else if (sanitized.status === "pending") {
      sanitized.daysUntilDue = Math.ceil(
        (dueDate - today) / (1000 * 60 * 60 * 24)
      );
    }
  }

  return sanitized;
}

export function sanitizeMobileStock(mobileStock) {
  return sanitizeObject(mobileStock, [
    ["id", (ms) => ms._id],
    ["representative", (ms) => ms.representative],
    [
      "goods",
      (ms) =>
        ms.goods?.map((good) => ({
          stock: good.stock,
          quantity: good.quantity,
        })),
    ],
    ["capacity", (ms) => ms.capacity],
    ["name", (ms) => ms.name],
    ["createdAt", (ms) => ms.createdAt],
    ["updatedAt", (ms) => ms.updatedAt],
  ]);
}

export function sanitizeSaleOrderInTrip(saleOrder) {
  return sanitizeObject(saleOrder, [
    ["id", (so) => so._id],
    ["customer", (so) => so.customer],
    ["orderDate", (so) => so.orderDate],
    [
      "goods",
      (so) =>
        so.goods?.map((good) => ({
          product: good.product,
          code: good.code,
          unit: good.unit,
          wholesalePrice: good.wholesalePrice,
          discount: good.discount,
          total: good.total,
        })),
    ],
    ["orderNumber", (so) => so.orderNumber],
    ["total", (so) => so.total],
    ["createdAt", (so) => so.createdAt],
    ["updatedAt", (so) => so.updatedAt],
  ]);
}

export function sanitizeTrip(trip) {
  return sanitizeObject(trip, [
    ["id", (t) => t._id],
    ["representative", (t) => t.representative],
    ["car", (t) => t.car],
    ["driver", (t) => t.driver],
    ["location", (t) => t.location],
    ["date", (t) => t.date],
    ["expenseses", (t) => t.expenseses],
    ["sales", (t) => t.sales],
    ["status", (t) => t.status],
    ["tripNumber", (t) => t.tripNumber],
    ["createdAt", (t) => t.createdAt],
    ["updatedAt", (t) => t.updatedAt],
  ]);
}

export function sanitizeTripInvoice(tripInvoice) {
  return sanitizeObject(tripInvoice, [
    ["id", (ti) => ti._id],
    ["saleOrderId", (ti) => ti.saleOrderId],
    ["createdAt", (ti) => ti.createdAt],
    ["updatedAt", (ti) => ti.updatedAt],
  ]);
}

export function sanitizeRepresentative(representative) {
  return sanitizeObject(representative, [
    ["id", (r) => r._id],
    ["user", (r) => r.user],
    ["region", (r) => r.region],
    ["territory", (r) => r.territory],
    ["supervisor", (r) => r.supervisor],
    ["commissionRate", (r) => r.commissionRate],
    ["targetSales", (r) => r.targetSales],
    ["currentSales", (r) => r.currentSales],
    ["active", (r) => r.active],
    ["createdAt", (r) => r.createdAt],
    ["updatedAt", (r) => r.updatedAt],
  ]);
}
