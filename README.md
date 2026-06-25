# Shopping Cart Engine

A production-ready Shopping Cart Microservice built using **Node.js**, **Express**, and **MongoDB (Mongoose)**. Designed with multi-tenant session isolation, an ingestion flow, tiered campaign promotional logic, input validation schemas, and enterprise logging and error handling.

---

## Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (v16 or higher recommended)
* MongoDB (Atlas or a locally running instance)

### Installation & Setup

1. **Clone the repository and install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Create a `.env` file in the root of the project (if not present) and define:
   ```env
   PORT=3000
   MONGO_URI=your_mongodb_connection_string
   ```

3. **Start the application in Development Mode**:
   ```bash
   npm run dev
   ```
   This command starts the service using `nodemon` on port `3000`.

---

## API Specifications

All endpoints return standardized JSON structures.

### 1. User Management (`/api/users`)

* **`POST /api/users/`**
  * **Description**: Create a new user account.
  * **Payload**:
    ```json
    {
      "name": "Jane Doe",
      "email": "jane@example.com"
    }
    ```
* **`GET /api/users/`**
  * **Description**: Retrieve a list of all registered users.
* **`GET /api/users/:id`**
  * **Description**: Retrieve user details by ID.
* **`PUT /api/users/:id`**
  * **Description**: Update user name or email.
* **`DELETE /api/users/:id`**
  * **Description**: Delete a user.

### 2. Shopping Cart (`/api/cart`)

For multi-tenant isolation, the request header `X-User-Id` (or the parameter `userId` in route/body/query) must match the owner of the cart.

* **`POST /api/cart/add-item`**
  * **Description**: Add a product item to a user's active cart or increment quantity if it exists.
  * **Payload**:
    ```json
    {
      "userId": "603d2e1b4f1b2c001f3e7a01",
      "productId": "prod_101",
      "productName": "Wireless Mouse",
      "price": 899.00,
      "quantity": 1
    }
    ```
* **`GET /api/cart/:userId`**
  * **Description**: Fetch the active cart and items for a specific user.
* **`PUT /api/cart/update-item/:itemId`**
  * **Description**: Modify the quantity of a specific cart item.
  * **Header**: `X-User-Id: <userId>` (or body `userId`)
  * **Payload**:
    ```json
    {
      "quantity": 3
    }
    ```
* **`DELETE /api/cart/remove-item/:itemId`**
  * **Description**: Remove an item from the cart entirely.
  * **Header**: `X-User-Id: <userId>` (or query `?userId=<userId>`)
* **`GET /api/cart/checkout/:userId`**
  * **Description**: Generate a checkout summary with active cart contents, subtotals, and calculated promotional discounts.

---

## Database Schemas

### User Schema (`user`)
* `name`: String (Required, trimmed)
* `email`: String (Required, unique, trimmed, lowercase)

### Cart Schema (`cart`)
* `user`: ObjectId -> User (Required, reference)
* `totalAmount`: Number (Default: 0)
* `totalItems`: Number (Default: 0)
* `status`: String (Enum: `["ACTIVE", "CHECKED_OUT"]`, Default: `ACTIVE`)

### Cart Item Schema (`cartItem`)
* `cart`: ObjectId -> Cart (Required, reference)
* `productId`: String (Required, trimmed)
* `productName`: String (Required, trimmed)
* `price`: Number (Required, min: 0)
* `quantity`: Number (Required, min: 1, default: 1)

---

## Technical Design & Strategy

### 1. Multi-Tenant Isolation
* **Isolation Strategy**: The microservice isolates user data by linking `cart` structures directly to `userId` objects. To prevent cross-tenant attacks (where a user attempts to update or delete another user's cart item), the controllers compare the owner of the cart associated with `itemId` against the caller's request identity (`userId` / `X-User-Id` header).
* **Session Strategy**: Cart status is marked `ACTIVE` for current carts. Checking out calculates the pricing summary. If a transaction finishes, the status updates to `CHECKED_OUT`, allowing a user to generate a new active cart session on their next add.

### 2. Tiered Promotion Campaign formulas
Discounts scale dynamically based on cart values and product diversity:
1. **Value Tiers**:
   * **Gold (10% Discount)**: Applied to cart subtotals $\ge 10000$.
   * **Silver (5% Discount)**: Applied to cart subtotals $\ge 5000$ (and $< 10000$).
2. **Diversity Bonus**:
   * If a cart contains 3 or more **distinct** products, a flat bonus discount of ₹500 is applied.
3. **Guardrails**:
   * The total discount is capped at the subtotal value. The final checkout price will never drop below 0.

---

## Feature X: Production-Ready Additions

To make this microservice enterprise-grade, we implemented the following production enhancements:

1. **Request Performance Logger Middleware**:
   * **What was added**: A custom middleware that hooks into Express response stream finishes to log incoming requests.
   * **Why it was added**: Provides developer observability to audit API endpoints, track processing speeds, identify latency bottlenecks, and capture which tenant is making which calls at what time.
2. **Global Exception & Error Handling Middleware**:
   * **What was added**: A unified middleware placed at the end of the Express application route pipeline.
   * **Why it was added**: Avoids application downtime by catching runtime exceptions, Mongoose cast format errors, and constraint violations. It translates low-level database crash reports into clean, user-friendly JSON structures while keeping stack traces secure from public client exposure.
