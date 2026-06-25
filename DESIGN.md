# DESIGN DOCUMENTATION

This document details the architectural decisions, database schemas, validation design patterns, edge-case mitigation strategies, and design trade-offs chosen for the **Adaptive E-Commerce Shopping Cart Engine**.

---

## 1. Architectural Style & Code Structure

The application adopts a modular, layered MVC (Model-View-Controller) structure which cleanly separates concerns across distinct directory folders:
* **Models Layer (`src/models/`)**: Manages the data schemas (User, Cart, CartItem) and coordinates persistence interaction rules directly with MongoDB.
* **Controllers Layer (`src/controllers/`)**: Contains the application logic, orchestrates requests, acts upon model interfaces, and prepares API responses.
* **Routes Layer (`src/routes/`)**: Establishes API endpoints, handles path parameter bindings, and hooks up request validation chains.
* **Services Layer (`src/services/`)**: Enforces generic application middlewares such as request logging, validation parsing, and global exception handlers.
* **Utilities (`src/utils/`)**: Exposes reusable helpers like the standard `responce.js` formatting system.

---

## 2. Multi-Tenant Session & Security Isolation

A primary requirement of the microservice is to prevent cross-tenant exposure (i.e. User A reading or modifying User B's cart contents).

### Session Strategy
* Each User maps to at most **one active cart** document at a time.
* Carts have a state status indicator (`status` enum: `["ACTIVE", "CHECKED_OUT"]`). 
* Active requests (adding, fetching, updating, or deleting items) target the user's `ACTIVE` cart. Once a checkout completes, the status will shift to `CHECKED_OUT`, and the next item-addition will generate a fresh `ACTIVE` cart session.

### Isolation Verification
Since cart items are updated or deleted via their own unique resource identifiers (e.g. `PUT /api/cart/update-item/:itemId` and `DELETE /api/cart/remove-item/:itemId`), the route params do not naturally contain the caller's user identity. 
* **Design Decision**: The controller extracts the requester's ID from the `X-User-Id` request header (or request body/query parameter). 
* **Security Validation**: Before updating or removing a cart item, the controller queries the item's cart and compares the cart's `user` ObjectId string with the caller's request identity. If they do not match, the request is rejected immediately with a `403 Forbidden` status code, preventing tenant boundary crossing.

---

## 3. Data Integrity & Validation Strategy

The project employs two layers of defensive validation to block invalid or malformed data before it propagates or persists to MongoDB:

### A. Routing Layer Validation (Express-Validator)
All incoming payloads are intercepted at the route registration level using schema definitions. We assert:
1. **User Routes**:
   * Name: Non-empty string.
   * Email: Must conform to a valid email regex representation.
2. **Cart Ingestion Routes**:
   * User IDs and Cart Item IDs: Must be valid 24-character hexadecimal MongoDB ObjectIds.
   * Product price: Must be a float greater than 0.
   * Product quantity: Must be a strict integer greater than or equal to 1.

Any violations are caught by the `validateRequest` middleware and returned as a structured `400 Bad Request` block.

### B. Mongoose Layer Validation
Mongoose schema rules enforce `min` constraints, default fallbacks, and reference integrity checks. If validation fails at the model save point, the exception is automatically caught by the global error handler middleware and mapped to an appropriate JSON structure.

---

## 4. Tiered Promotional Campaign Logic

The promotional calculation is performed in the checkout summary controller:
* **Gold Tier**: Subtotal $\ge 10000$ receives a $10\%$ discount.
* **Silver Tier**: Subtotal $\ge 5000$ and $< 10000$ receives a $5\%$ discount.
* **Diversity Bonus**: Carts containing $3$ or more unique product items (distinct product IDs) receive a flat bonus discount of ₹500.

### Mathematical Edge-Case Considered:
If a user adds three distinct, very low-cost items (e.g., three ₹100 items), the subtotal is ₹300. Without safety checks, the diversity discount of ₹500 would reduce the final checkout total to a negative number (-₹200).
* **Fix**: The code caps the discount at the subtotal amount:
  $$\text{discount} = \min(\text{discount}, \text{subtotal})$$
  $$\text{finalAmount} = \max(0, \text{subtotal} - \text{discount})$$
  This guarantees the checkout total is mathematically sound and never drops below zero.

---

## 5. Architectural Trade-offs

1. **Header-based Identity vs JWT Session Cookies**:
   * *Trade-off*: We utilize a request header (`X-User-Id`) to authenticate the caller tenant. While JWTs are more secure, header-based tenant passing simplifies implementation in microservice architectures where a parent gateway handles auth token extraction and forwards downstream headers.
2. **Hardcoded Tiers vs Dynamic Database Rules**:
   * *Trade-off*: The campaign rules are hardcoded in the controller logic. Storing tiers in the database would be more flexible for business managers, but hardcoding offers high performance and immediate implementation for this version of the service.
3. **On-the-Fly Cart Recalculations**:
   * *Trade-off*: We recalculate the cart's `totalItems` and `totalAmount` in the controller after database writes to cart items. While database triggers or aggregation pipelines could do this, recalculating in JavaScript is more portable across databases and easy to debug.
