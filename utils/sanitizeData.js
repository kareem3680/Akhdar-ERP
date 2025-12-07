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
