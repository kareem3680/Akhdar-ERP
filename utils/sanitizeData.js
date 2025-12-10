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
    ["price", (p) => p.price],
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
