# Akhdar-ERP - API Documentation

## Overview

This API is designed for the **Akhdar-ERP Platform**.  
It is an enterprise resource planning backend system covering inventory, sales, purchases, accounting, and HR management.

---

# Common Features

All list endpoints support the following features:

| Feature         | Description                   | Example                            |
| --------------- | ----------------------------- | ---------------------------------- |
| Pagination      | Split results into pages      | `?page=2&limit=20`                 |
| Sorting         | Sort results by a field       | `?sort=-createdAt` or `?sort=name` |
| Field Selection | Return only specific fields   | `?fields=name,email,phone`         |
| Filtering       | Filter results by exact match | `?status=active&type=asset`        |
| Range Filtering | Filter by numeric ranges      | `?price[lte]=1000&price[gte]=100`  |
| Date Range      | Filter by date interval       | `?from=2025-01-01&to=2025-12-31`   |
| Search          | Text search in string fields  | `?keyword=john`                    |

---

# Identity Module

| Endpoint                         | Method | Description                               |
| -------------------------------- | ------ | ----------------------------------------- |
| `/api/v1/auth/refresh`           | POST   | Refresh access token using refresh token |
| `/api/v1/auth/signUp`            | POST   | Register a new user                      |
| `/api/v1/auth/logIn`             | POST   | Login                                    |
| `/api/v1/auth/logout`            | POST   | Logout                                   |

---

# User Dashboard Module

| Endpoint                               | Method | Description                   |
| -------------------------------------- | ------ | ----------------------------- |
| `/api/v1/userDashboard/getMyData`      | GET    | Get current user data        |
| `/api/v1/userDashboard/updateMyData`   | PATCH  | Update current user data     |
| `/api/v1/updatePassword`               | PATCH  | Change password              |

---

# Forget Password Module (OTP)

| Endpoint                                 | Method | Description                       |
| ---------------------------------------- | ------ | --------------------------------- |
| `/api/v1/forgetPassword/sendResetCode`   | POST   | Send reset code to email          |
| `/api/v1/forgetPassword/resendResetCode` | POST   | Resend reset code                 |
| `/api/v1/forgetPassword/verifyResetCode` | POST   | Verify reset code                 |
| `/api/v1/forgetPassword/resetPassword`   | PUT    | Reset password after verification |

---

# Admin Dashboard Module

| Endpoint                                     | Method | Description                          |
| -------------------------------------------- | ------ | ------------------------------------ |
| `/api/v1/adminDashboard`                     | POST   | Create a new user                    |
| `/api/v1/adminDashboard`                     | GET    | Get all users                        |
| `/api/v1/adminDashboard/{userId}`            | GET    | Get specific user                    |
| `/api/v1/adminDashboard/{userId}`            | PATCH  | Update user role                     |
| `/api/v1/adminDashboard/deactivate/{userId}` | PATCH  | Deactivate user                      |
| `/api/v1/adminDashboard/activate/{userId}`   | PATCH  | Activate user                        |

---

# Categories Module

## Category Endpoints

| Endpoint                        | Method | Description           |
| ------------------------------- | ------ | --------------------- |
| `/api/v1/categories`            | POST   | Create a new category |
| `/api/v1/categories`            | GET    | Get all categories    |
| `/api/v1/categories/{id}`       | GET    | Get specific category |
| `/api/v1/categories/{id}`       | PATCH  | Update category       |
| `/api/v1/categories/{id}`       | DELETE | Delete category       |

---

# Products Module

## Product Endpoints

| Endpoint                              | Method | Description                    |
| ------------------------------------- | ------ | ------------------------------ |
| `/api/v1/products`                    | POST   | Create a new product           |
| `/api/v1/products`                    | GET    | Get all products               |
| `/api/v1/products/{id}`               | GET    | Get specific product           |
| `/api/v1/products/{id}`               | PATCH  | Update product                 |
| `/api/v1/products/{id}`               | DELETE | Delete product                 |
| `/api/v1/products/{categoryId}/products` | GET | Get products by category       |

---

# Customers Module

## Customer Status

| Status     | Description                          |
| ---------- | ------------------------------------ |
| `active`   | Active customer                      |
| `inactive` | Inactive customer                    |
| `lead`     | Potential customer                   |

## Customer Endpoints

| Endpoint                                      | Method | Description                       |
| --------------------------------------------- | ------ | --------------------------------- |
| `/api/v1/customers`                           | POST   | Create a new customer             |
| `/api/v1/customers`                           | GET    | Get all customers                 |
| `/api/v1/customers/{id}`                      | GET    | Get specific customer             |
| `/api/v1/customers/{id}`                      | PATCH  | Update customer                   |
| `/api/v1/customers/{id}`                      | DELETE | Hard delete customer              |
| `/api/v1/customers/soft-delete/{id}`          | PATCH  | Soft delete customer              |
| `/api/v1/customers/{customerId}/organizations/{orgId}` | PATCH | Add organization to customer |
| `/api/v1/customers/{customerId}/organizations/{orgId}` | DELETE | Remove organization from customer |

---

# Organizations Module

## Organization Endpoints

| Endpoint                        | Method | Description                       |
| ------------------------------- | ------ | --------------------------------- |
| `/api/v1/organizations`         | POST   | Create a new organization         |
| `/api/v1/organizations`         | GET    | Get all organizations             |
| `/api/v1/organizations/{id}`    | GET    | Get specific organization         |
| `/api/v1/organizations/{id}`    | PATCH  | Update organization               |
| `/api/v1/organizations/{id}`    | DELETE | Delete organization               |

---

# Sale Orders Module

## Order Status Flow

draft -> approved -> shipped -> delivered -> canceled

## Sale Order Endpoints

| Endpoint                                   | Method | Description                           |
| ------------------------------------------ | ------ | ------------------------------------- |
| `/api/v1/sale-orders`                      | POST   | Create a new sale order               |
| `/api/v1/sale-orders`                      | GET    | Get all sale orders                   |
| `/api/v1/sale-orders/{id}`                 | GET    | Get specific sale order               |
| `/api/v1/sale-orders/{id}`                 | PATCH  | Update sale order (draft only)        |
| `/api/v1/sale-orders/{id}`                 | DELETE | Delete sale order (draft only)        |
| `/api/v1/sale-orders/status/draft`         | GET    | Get draft sale orders                 |
| `/api/v1/sale-orders/status/approved`      | GET    | Get approved sale orders              |
| `/api/v1/sale-orders/status/delivered`     | GET    | Get delivered sale orders             |
| `/api/v1/sale-orders/approve/{id}`         | PATCH  | Approve sale order                    |
| `/api/v1/sale-orders/ship/{id}`            | PATCH  | Mark sale order as shipped            |
| `/api/v1/sale-orders/deliver/{id}`         | PATCH  | Mark sale order as delivered          |
| `/api/v1/sale-orders/cancel/{id}`          | PATCH  | Cancel sale order                     |

---

# Sale Invoices Module

## Payment Status

| Status       | Description                          |
| ------------ | ------------------------------------ |
| `unpaid`     | Invoice not paid yet                 |
| `partial`    | Partially paid                       |
| `paid`       | Fully paid                           |

## Sale Invoice Endpoints

| Endpoint                                  | Method | Description                           |
| ----------------------------------------- | ------ | ------------------------------------- |
| `/api/v1/sale-invoices/{saleOrderId}`     | POST   | Create invoice from sale order        |
| `/api/v1/sale-invoices`                   | GET    | Get all sale invoices                 |
| `/api/v1/sale-invoices/{id}`              | GET    | Get specific invoice                  |
| `/api/v1/sale-invoices/{id}`              | PATCH  | Update invoice                        |
| `/api/v1/sale-invoices/{id}`              | DELETE | Delete invoice                        |
| `/api/v1/sale-invoices/payments/{id}`     | POST   | Record payment on invoice             |

---

# Purchase Orders Module

## Purchase Order Status Flow

draft -> approved -> shipped -> delivered -> canceled

## Purchase Order Endpoints

| Endpoint                                      | Method | Description                              |
| --------------------------------------------- | ------ | ---------------------------------------- |
| `/api/v1/purchase-orders`                     | POST   | Create a new purchase order              |
| `/api/v1/purchase-orders`                     | GET    | Get all purchase orders                  |
| `/api/v1/purchase-orders/{id}`                | GET    | Get specific purchase order              |
| `/api/v1/purchase-orders/{id}`                | PATCH  | Update purchase order                    |
| `/api/v1/purchase-orders/{id}`                | DELETE | Delete purchase order                    |
| `/api/v1/purchase-orders/status/draft`        | GET    | Get draft purchase orders                |
| `/api/v1/purchase-orders/status/approved`     | GET    | Get approved purchase orders             |
| `/api/v1/purchase-orders/status/delivered`    | GET    | Get delivered purchase orders            |
| `/api/v1/purchase-orders/approve/{id}`        | PATCH  | Approve purchase order                   |
| `/api/v1/purchase-orders/ship/{id}`           | PATCH  | Mark purchase order as shipped           |
| `/api/v1/purchase-orders/deliver/{id}`        | PATCH  | Mark purchase order as delivered         |
| `/api/v1/purchase-orders/cancel/{id}`         | PATCH  | Cancel purchase order                    |

---

# Purchase Invoices Module

## Purchase Invoice Endpoints

| Endpoint                                    | Method | Description                           |
| ------------------------------------------- | ------ | ------------------------------------- |
| `/api/v1/purchase-invoices/{purchaseOrderId}` | POST | Create invoice from purchase order    |
| `/api/v1/purchase-invoices`                 | GET    | Get all purchase invoices             |
| `/api/v1/purchase-invoices/{id}`            | GET    | Get specific invoice                  |
| `/api/v1/purchase-invoices/{id}`            | PATCH  | Update invoice                        |
| `/api/v1/purchase-invoices/{id}`            | DELETE | Delete invoice                        |

---

# Purchase Invoice Payments Module

| Endpoint                                        | Method | Description                           |
| ----------------------------------------------- | ------ | ------------------------------------- |
| `/api/v1/purchase-invoice-payments/pay/{id}`    | POST   | Record payment on invoice             |
| `/api/v1/purchase-invoice-payments/{id}`        | GET    | Get invoice payments                  |
| `/api/v1/purchase-invoice-payments/stats/{id}`  | GET    | Get payment statistics for invoice    |

---

# Inventory Module

## Inventory Endpoints

| Endpoint                        | Method | Description                       |
| ------------------------------- | ------ | --------------------------------- |
| `/api/v1/inventories`           | POST   | Create a new inventory            |
| `/api/v1/inventories`           | GET    | Get all inventories               |
| `/api/v1/inventories/{id}`      | GET    | Get specific inventory            |
| `/api/v1/inventories/{id}`      | PATCH  | Update inventory                  |
| `/api/v1/inventories/{id}`      | DELETE | Delete inventory                  |

---

# Stock Module

## Stock Endpoints

| Endpoint                                              | Method | Description                           |
| ----------------------------------------------------- | ------ | ------------------------------------- |
| `/api/v1/stocks/{inventoryId}`                        | POST   | Add stock to inventory                |
| `/api/v1/stocks/stocks/{inventoryId}`                 | GET    | Get all stocks in inventory           |
| `/api/v1/stocks/{inventoryId}/stocks/{stockId}`       | GET    | Get specific stock                    |
| `/api/v1/stocks/{id}`                                 | PATCH  | Update stock                          |
| `/api/v1/stocks/{id}`                                 | DELETE | Delete stock                          |
| `/api/v1/stocks/purchase-orders/stock-in/{orderId}`   | POST   | Stock in from purchase order          |
| `/api/v1/stocks/sale-orders/stock-out/{orderId}`      | POST   | Stock out from sale order             |

---

# Stock Transfer Module

## Transfer Status Flow

draft -> pending -> in_transit -> completed -> cancelled

## Stock Transfer Endpoints

| Endpoint                              | Method | Description                           |
| ------------------------------------- | ------ | ------------------------------------- |
| `/api/v1/stock-transfers`             | POST   | Create a new stock transfer           |
| `/api/v1/stock-transfers`             | GET    | Get all stock transfers               |
| `/api/v1/stock-transfers/document/{id}` | GET    | Get transfer document                 |

---

# Supplier Module

## Supplier Endpoints

| Endpoint                                        | Method | Description                           |
| ----------------------------------------------- | ------ | ------------------------------------- |
| `/api/v1/suppliers`                             | POST   | Create a new supplier                 |
| `/api/v1/suppliers`                             | GET    | Get all suppliers                     |
| `/api/v1/suppliers/{id}`                        | GET    | Get specific supplier                 |
| `/api/v1/suppliers/{id}`                        | PATCH  | Update supplier                       |
| `/api/v1/suppliers/{id}`                        | DELETE | Hard delete supplier                  |
| `/api/v1/suppliers/soft-delete/{id}`            | PATCH  | Soft delete supplier                  |
| `/api/v1/suppliers/organizations/{orgId}`       | GET    | Get suppliers by organization         |
| `/api/v1/suppliers/{supplierId}/organizations/{orgId}` | PATCH | Add organization to supplier      |

---

# Attendances Module

## Attendance Status

| Status        | Description                          |
| ------------- | ------------------------------------ |
| `present`     | Employee checked in                  |
| `absent`      | Employee absent                      |
| `late`        | Employee arrived late                |
| `half_day`    | Employee worked half day             |
| `holiday`     | Official holiday                     |

## Attendance Endpoints

| Endpoint                            | Method | Description                           |
| ----------------------------------- | ------ | ------------------------------------- |
| `/api/v1/attendances/today`         | GET    | Get today's attendance records        |
| `/api/v1/attendances/day/{day}`     | GET    | Get attendance for specific day       |
| `/api/v1/attendances`               | GET    | Get all attendance records            |
| `/api/v1/attendances/check-in/{id}` | PATCH  | Record employee check-in              |
| `/api/v1/attendances/check-out/{id}`| PATCH  | Record employee check-out             |
| `/api/v1/attendances/month`         | GET    | Get monthly attendance report         |

---

# Employees Module

## Employment Types

| Type           | Description                          |
| -------------- | ------------------------------------ |
| `full_time`    | Full time employee                   |
| `part_time`    | Part time employee                   |
| `contract`     | Contract employee                    |
| `intern`       | Intern                               |

## Employee Endpoints

| Endpoint                              | Method | Description                           |
| ------------------------------------- | ------ | ------------------------------------- |
| `/api/v1/employees`                   | POST   | Create a new employee                 |
| `/api/v1/employees/documents/{id}`    | POST   | Add documents to employee             |
| `/api/v1/employees/documents/{id}/{fileId}` | DELETE | Delete employee document         |
| `/api/v1/employees`                   | GET    | Get all employees                     |
| `/api/v1/employees/{id}`              | GET    | Get specific employee                 |
| `/api/v1/employees/{id}`              | PATCH  | Update employee                       |
| `/api/v1/employees/activate/{id}`     | PATCH  | Activate employee                     |
| `/api/v1/employees/{id}`              | DELETE | Deactivate employee                   |

---

# Departments Module

## Department Endpoints

| Endpoint                            | Method | Description                           |
| ----------------------------------- | ------ | ------------------------------------- |
| `/api/v1/departments`               | POST   | Create a new department               |
| `/api/v1/departments`               | GET    | Get all departments                   |
| `/api/v1/departments/{id}`          | GET    | Get specific department               |
| `/api/v1/departments/{id}`          | PATCH  | Update department                     |
| `/api/v1/departments/{id}`          | DELETE | Delete department                     |
| `/api/v1/departments/stats/overview`| GET    | Get department statistics             |

---

# Statistics Module

| Endpoint                    | Method | Description                           |
| --------------------------- | ------ | ------------------------------------- |
| `/api/v1/stats`             | GET    | Get statistics (daily/monthly/date range) |
| `/api/v1/stats/history`     | GET    | Get statistics history                |

---

# Accounts Module (Accounting)

## Account Types

| Type           | Description                          |
| -------------- | ------------------------------------ |
| `asset`        | Asset account                        |
| `liability`    | Liability account                    |
| `equity`       | Equity account                       |
| `revenue`      | Revenue account                      |
| `expense`      | Expense account                      |

## Account Endpoints

| Endpoint                                  | Method | Description                           |
| ----------------------------------------- | ------ | ------------------------------------- |
| `/api/v1/accounts`                        | POST   | Create a new account                  |
| `/api/v1/accounts`                        | GET    | Get all accounts                      |
| `/api/v1/accounts/{id}`                   | DELETE | Delete account                        |
| `/api/v1/accounts/journal-entries/{id}`   | GET    | Get account journal entries           |
| `/api/v1/accounts/balance/{id}`           | GET    | Get account balance                   |

---

# Journals Module

| Endpoint                        | Method | Description                           |
| ------------------------------- | ------ | ------------------------------------- |
| `/api/v1/journals`              | POST   | Create a new journal                  |
| `/api/v1/journals`              | GET    | Get all journals                      |
| `/api/v1/journals/{id}`         | DELETE | Delete journal                        |
| `/api/v1/journals/entries/{id}` | GET    | Get journal entries                   |

---

# Journal Entries Module

## Entry Status

| Status     | Description                          |
| ---------- | ------------------------------------ |
| `draft`    | Entry not yet posted                 |
| `posted`   | Entry posted to accounts             |
| `canceled` | Entry canceled                       |

## Journal Entry Endpoints

| Endpoint                            | Method | Description                           |
| ----------------------------------- | ------ | ------------------------------------- |
| `/api/v1/journal-entries`           | POST   | Create a new journal entry            |
| `/api/v1/journal-entries`           | GET    | Get all journal entries               |
| `/api/v1/journal-entries/{id}`      | GET    | Get specific journal entry            |
| `/api/v1/journal-entries/{id}`      | PATCH  | Update journal entry                  |
| `/api/v1/journal-entries/{id}`      | DELETE | Delete journal entry                  |
| `/api/v1/journal-entries/post/{id}` | POST   | Post journal entry to accounts        |

---

# Payroll Module

## Payroll Status

| Status     | Description                          |
| ---------- | ------------------------------------ |
| `pending`  | Payroll not processed yet            |
| `paid`     | Payroll has been paid                |
| `canceled` | Payroll canceled                     |

## Payroll Endpoints

| Endpoint                              | Method | Description                           |
| ------------------------------------- | ------ | ------------------------------------- |
| `/api/v1/payrolls`                    | GET    | Get all payroll records               |
| `/api/v1/payrolls/{id}`               | PATCH  | Update payroll                        |
| `/api/v1/payrolls/pay/{id}`           | POST   | Process payroll payment               |
| `/api/v1/payrolls/employee/{id}`      | GET    | Get employee payroll history          |

---

# Loan Module

## Loan Status

| Status     | Description                          |
| ---------- | ------------------------------------ |
| `pending`  | Loan awaiting approval               |
| `approved` | Loan approved                        |
| `rejected` | Loan rejected                        |
| `active`   | Loan active and being repaid         |
| `completed`| Loan fully repaid                    |
| `defaulted`| Loan in default                      |

## Loan Endpoints

| Endpoint                        | Method | Description                           |
| ------------------------------- | ------ | ------------------------------------- |
| `/api/v1/loans`                 | POST   | Create a new loan                     |
| `/api/v1/loans`                 | GET    | Get all loans                         |
| `/api/v1/loans/{id}`            | GET    | Get specific loan                     |
| `/api/v1/loans/{id}`            | PATCH  | Update loan                           |
| `/api/v1/loans/{id}`            | DELETE | Delete loan                           |
| `/api/v1/loans/approve/{id}`    | POST   | Approve loan                          |
| `/api/v1/loans/summary/{id}`    | GET    | Get loan summary                      |

---

# Loan Installments Module

## Installment Endpoints

| Endpoint                              | Method | Description                           |
| ------------------------------------- | ------ | ------------------------------------- |
| `/api/v1/loan-installments`           | GET    | Get all installments                  |
| `/api/v1/loan-installments/overdue`   | GET    | Get overdue installments              |
| `/api/v1/loan-installments/{id}`      | GET    | Get specific installment              |
| `/api/v1/loan-installments/pay/{id}`  | POST   | Pay installment                       |
| `/api/v1/loan-installments/{id}`      | DELETE | Delete installment                    |

---

# Mobile Stock Module

## Mobile Stock Endpoints

| Endpoint                        | Method | Description                           |
| ------------------------------- | ------ | ------------------------------------- |
| `/api/v1/mobile-stocks`         | POST   | Create a new mobile stock             |
| `/api/v1/mobile-stocks`         | GET    | Get all mobile stocks                 |
| `/api/v1/mobile-stocks/{id}`    | GET    | Get specific mobile stock             |
| `/api/v1/mobile-stocks/{id}`    | PATCH  | Update mobile stock                   |
| `/api/v1/mobile-stocks/{id}`    | DELETE | Delete mobile stock                   |

---

# Trip Module

## Trip Status

| Status        | Description                          |
| ------------- | ------------------------------------ |
| `pending`     | Trip planned but not started         |
| `inprogress`  | Trip in progress                     |
| `completed`   | Trip completed                       |
| `cancelled`   | Trip cancelled                       |

## Trip Endpoints

| Endpoint                              | Method | Description                           |
| ------------------------------------- | ------ | ------------------------------------- |
| `/api/v1/trips`                       | POST   | Create a new trip                     |
| `/api/v1/trips`                       | GET    | Get all trips                         |
| `/api/v1/trips/{id}`                  | GET    | Get specific trip                     |
| `/api/v1/trips/{id}`                  | PATCH  | Update trip                           |
| `/api/v1/trips/{id}`                  | DELETE | Delete trip                           |
| `/api/v1/trips/complete/{id}`         | PATCH  | Complete trip                         |

---

# Trip Invoices Module

## Trip Invoice Endpoints

| Endpoint                            | Method | Description                           |
| ----------------------------------- | ------ | ------------------------------------- |
| `/api/v1/trip-invoices/{tripId}`    | POST   | Create invoice for trip               |
| `/api/v1/trip-invoices`             | GET    | Get all trip invoices                 |

---

# Sale Orders In Trip Module

| Endpoint                                  | Method | Description                           |
| ----------------------------------------- | ------ | ------------------------------------- |
| `/api/v1/sale-orders-in-trip/{tripId}`    | POST   | Create sale order in trip             |
| `/api/v1/sale-orders-in-trip`             | GET    | Get all sale orders in trips          |
| `/api/v1/sale-orders-in-trip/sale/{id}`   | GET    | Get specific sale order               |

---

# Representative Module

## Representative Endpoints

| Endpoint                              | Method | Description                           |
| ------------------------------------- | ------ | ------------------------------------- |
| `/api/v1/representatives`             | POST   | Create a new representative           |
| `/api/v1/representatives`             | GET    | Get all representatives               |
| `/api/v1/representatives/stats`       | GET    | Get representative statistics         |
| `/api/v1/representatives/{id}`        | GET    | Get specific representative           |
| `/api/v1/representatives/{id}`        | PATCH  | Update representative                 |
| `/api/v1/representatives/{id}`        | DELETE | Delete representative                 |

---

# Authentication

JWT is used for authentication. Most endpoints require a Bearer token in the Authorization header:
Authorization: Bearer {{JWT}}

text

Refresh tokens are used to obtain new access tokens.

---

# Notes

- All list endpoints support pagination, sorting, filtering, and search.
- Date fields should be sent in ISO 8601 format (e.g., `2024-01-15T08:00:00.000Z`).
- File uploads use `multipart/form-data`.
- Soft delete endpoints preserve data for audit purposes.
- The `{{MainHost}}` variable should be replaced with your API base URL.
- Draft orders can be edited and deleted; approved orders cannot.
