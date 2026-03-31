# E-Commerce Microservices Backend — Complete Architecture & Code Walkthrough

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Technology Stack](#2-technology-stack)
3. [Architecture Diagram](#3-architecture-diagram)
4. [Database Design](#4-database-design)
5. [Service-by-Service Breakdown](#5-service-by-service-breakdown)
   - 5.1 [Auth Service (:8081)](#51-auth-service-8081)
   - 5.2 [Product Service (:8082)](#52-product-service-8082)
   - 5.3 [Order Service (:8083)](#53-order-service-8083)
   - 5.4 [Cart Service (:8084)](#54-cart-service-8084)
   - 5.5 [API Gateway (:8080)](#55-api-gateway-8080)
6. [End-to-End Request Flows](#6-end-to-end-request-flows)
   - 6.1 [User Registration & Login](#61-user-registration--login)
   - 6.2 [Browsing Products](#62-browsing-products)
   - 6.3 [Add to Cart](#63-add-to-cart)
   - 6.4 [Checkout (Place Order)](#64-checkout-place-order---the-most-complex-flow)
   - 6.5 [Order Lifecycle](#65-order-lifecycle)
7. [Security Architecture](#7-security-architecture)
8. [Inter-Service Communication](#8-inter-service-communication)
9. [Design Patterns Used](#9-design-patterns-used)
10. [File Navigation Map](#10-file-navigation-map)
11. [How to Run](#11-how-to-run)
12. [Common Viva Questions & Answers](#12-common-viva-questions--answers)

---

## 1. System Overview

This is a **microservices-based e-commerce backend** with 5 independently deployable services:

| Service | Port | Database | Responsibility |
|---------|------|----------|----------------|
| **API Gateway** | 8080 | None | Routes requests, validates JWT tokens, injects user identity |
| **Auth Service** | 8081 | auth_db (MongoDB :27017) | Registration, login, JWT token management |
| **Product Service** | 8082 | product_db (MongoDB :27018) | Product CRUD, search, stock management |
| **Order Service** | 8083 | order_db (MongoDB :27020) | Checkout orchestration, order lifecycle |
| **Cart Service** | 8084 | cart_db (MongoDB :27019) | User cart management with embedded items |

**Key Principle:** Each microservice owns its own database. No service directly accesses another service's database. All inter-service communication happens via REST API calls (using OpenFeign).

---

## 2. Technology Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | Spring Boot 3.4.4 | Industry standard for Java microservices |
| Language | Java 17 | LTS version with modern features (records, text blocks) |
| API Gateway | Spring Cloud Gateway | Reactive, non-blocking gateway built on WebFlux |
| Inter-Service Calls | Spring Cloud OpenFeign | Declarative HTTP clients — write an interface, Spring generates the implementation |
| Database | MongoDB 7.0 | Document-based NoSQL — flexible schemas, embedded documents |
| Security | JWT (JJWT 0.11.5) | Stateless authentication — no server-side sessions |
| Build Tool | Maven | Dependency management and build lifecycle |
| API Docs | SpringDoc OpenAPI (Swagger) | Auto-generated API documentation at /swagger-ui.html |
| Code Generation | Lombok | Reduces boilerplate: @Data, @Builder, @RequiredArgsConstructor |

---

## 3. Architecture Diagram

```
                                    ┌─────────────────┐
                                    │   React Frontend │
                                    │  (localhost:5173)│
                                    └────────┬────────┘
                                             │
                                    ┌────────▼────────┐
                                    │   API GATEWAY    │
                                    │   (port 8080)    │
                                    │                  │
                                    │ • JWT Validation │
                                    │ • Route Matching │
                                    │ • X-User-Id      │
                                    │   Injection      │
                                    └──┬───┬───┬───┬──┘
                                       │   │   │   │
                    ┌──────────────────┘   │   │   └──────────────────┐
                    │                      │   │                      │
           ┌────────▼──────┐    ┌──────────▼───▼──────┐    ┌────────▼──────┐
           │  AUTH SERVICE │    │  PRODUCT SERVICE    │    │ CART SERVICE  │
           │  (port 8081)  │    │   (port 8082)       │    │ (port 8084)  │
           │               │    │                     │    │              │
           │ • Register    │    │ • CRUD Products     │    │ • Add Items  │
           │ • Login       │    │ • Search & Filter   │    │ • Update Qty │
           │ • JWT Tokens  │    │ • Stock Management  │    │ • Remove     │
           │ • Refresh     │    │ • Soft Delete       │    │ • Clear Cart │
           └───────┬───────┘    └──────────┬──────────┘    └──────┬───────┘
                   │                       │    ▲                  │    ▲
                   │              ┌────────▼────┘──────┐          │    │
                   │              │   ORDER SERVICE    │──────────┘    │
                   │              │   (port 8083)      │───────────────┘
                   │              │                    │  Feign Calls:
                   │              │ • Place Order      │  - GET /api/cart
                   │              │ • Order Lifecycle  │  - DELETE /api/cart
                   │              │ • Cancel Order     │  - PATCH /api/products/{id}/stock
                   │              └────────┬───────────┘
                   │                       │
           ┌───────▼───────┐    ┌──────────▼──────────┐
           │  MongoDB      │    │  MongoDB             │
           │  auth_db      │    │  order_db            │
           │  (:27017)     │    │  (:27020)            │
           └───────────────┘    └─────────────────────┘
                                         
           ┌───────────────┐    ┌─────────────────────┐
           │  MongoDB      │    │  MongoDB             │
           │  product_db   │    │  cart_db             │
           │  (:27018)     │    │  (:27019)            │
           └───────────────┘    └─────────────────────┘
```

---

## 4. Database Design

### auth_db — `users` collection
```json
{
  "_id": "663a...",
  "firstName": "Harshil",
  "lastName": "Malisetty",
  "email": "harshil@example.com",
  "password": "$2a$10$...(BCrypt hash)",
  "role": "CUSTOMER",
  "refreshToken": "eyJhbGciOi...",
  "createdAt": "2026-03-31T10:00:00Z",
  "updatedAt": "2026-03-31T10:00:00Z"
}
```

### product_db — `products` collection
```json
{
  "_id": "663b...",
  "name": "Sony WH-1000XM5",
  "description": "Noise cancelling headphones",
  "price": { "$numberDecimal": "24999.99" },
  "stock": 50,
  "category": "ELECTRONICS",
  "imageUrl": "https://...",
  "sellerId": "admin-user-1",
  "active": true,
  "createdAt": "2026-03-31T10:00:00Z",
  "updatedAt": "2026-03-31T10:00:00Z"
}
```
**Indexes:** `@TextIndexed` on name + description (keyword search), `@Indexed` on category (filter queries).

### cart_db — `carts` collection (Embedded Document Pattern)
```json
{
  "_id": "663c...",
  "userId": "harshil@example.com",
  "items": [
    {
      "productId": "663b...",
      "productName": "Sony WH-1000XM5",
      "imageUrl": "https://...",
      "price": { "$numberDecimal": "24999.99" },
      "quantity": 2
    }
  ],
  "updatedAt": "2026-03-31T10:05:00Z"
}
```
**Key Design:** Items are embedded inside the Cart document (not a separate collection). ONE cart per user.

### order_db — `orders` collection
```json
{
  "_id": "663d...",
  "userId": "harshil@example.com",
  "items": [
    {
      "productId": "663b...",
      "productName": "Sony WH-1000XM5",
      "imageUrl": "https://...",
      "price": { "$numberDecimal": "24999.99" },
      "quantity": 2
    }
  ],
  "totalAmount": { "$numberDecimal": "49999.98" },
  "status": "PLACED",
  "shippingAddress": "123 Main St, Hyderabad",
  "createdAt": "2026-03-31T10:10:00Z",
  "updatedAt": "2026-03-31T10:10:00Z"
}
```
**Key Design:** A user can have MANY orders (unlike cart which is 1-per-user). Items are snapshotted at order time.

---

## 5. Service-by-Service Breakdown

### 5.1 Auth Service (:8081)

**Purpose:** Handles user identity — registration, login, JWT token issuance, refresh token rotation, and logout.

#### File Structure & Navigation

```
auth-service/src/main/java/com/ecom/auth/
├── AuthServiceApplication.java          ← Entry point, @EnableMongoAuditing
├── model/
│   ├── User.java                        ← MongoDB document, implements UserDetails
│   └── Role.java                        ← Enum: ADMIN, CUSTOMER
├── dto/
│   ├── RegisterRequest.java             ← { firstName, lastName, email, password }
│   ├── LoginRequest.java                ← { email, password }
│   ├── AuthResponse.java               ← { userId, email, firstName, lastName, role, message }
│   └── UserProfileResponse.java         ← { id, firstName, lastName, email, role, createdAt }
├── repository/
│   └── UserRepository.java             ← findByEmail(), existsByEmail()
├── security/
│   ├── JwtService.java                  ← Token generation & validation (HMAC-SHA256)
│   └── JwtAuthFilter.java              ← Servlet filter: cookie → JWT → SecurityContext
├── config/
│   └── SecurityConfig.java             ← SecurityFilterChain, public/protected routes, BCrypt
├── service/
│   └── AuthService.java                ← Business logic: register, login, refresh, logout
├── controller/
│   └── AuthController.java             ← Thin REST controller, delegates to AuthService
└── exception/
    └── GlobalExceptionHandler.java      ← Standardized error JSON responses
```

#### How Registration Works (file-by-file)

1. **Client** → `POST /api/auth/register` with `{ firstName, lastName, email, password }`
2. **AuthController.java** receives the request, `@Valid` triggers bean validation on `RegisterRequest.java`
3. **AuthController** → calls `authService.register(request, response)`
4. **AuthService.java**:
   - Checks `userRepository.existsByEmail()` → throws if duplicate
   - Builds a `User` entity, hashes password with `BCryptPasswordEncoder`
   - Saves to MongoDB via `UserRepository.java`
   - Calls `jwtService.generateAccessToken(user)` and `jwtService.generateRefreshToken(user)`
5. **JwtService.java**:
   - Takes user email as the JWT "subject"
   - Embeds `role` as a custom claim
   - Signs with HMAC-SHA256 using the secret from `application.properties`
   - Access token: 15 min expiry, Refresh token: 7 day expiry
6. **AuthService.java** (continued):
   - Sets `accessToken` and `refreshToken` as **HttpOnly cookies** on the response
   - HttpOnly = JavaScript cannot read them (XSS protection)
   - Returns `AuthResponse` DTO (user info, NO tokens in body)

#### JWT Token Structure
```
Header:    { "alg": "HS256", "typ": "JWT" }
Payload:   { "sub": "harshil@example.com", "role": "ROLE_CUSTOMER", "iat": 1743415200, "exp": 1743416100 }
Signature: HMACSHA256(base64(header) + "." + base64(payload), secret)
```

#### Refresh Token Rotation
When the access token expires (15 min), the client calls `POST /api/auth/refresh`:
1. The refresh token is read from the cookie
2. Email is extracted from it
3. The token is validated AND compared against what's stored in the database
4. If valid: new access token + **new refresh token** are issued (rotation)
5. The old refresh token is invalidated — if someone stole it, it won't work anymore

---

### 5.2 Product Service (:8082)

**Purpose:** Full product catalog management — CRUD operations, search, filtering, pagination, and stock control.

#### File Structure & Navigation

```
product-service/src/main/java/com/ecom/product/
├── ProductServiceApplication.java       ← Entry point, @EnableMongoAuditing
├── model/
│   ├── Product.java                     ← MongoDB document with @TextIndexed fields
│   └── Category.java                    ← Enum: ELECTRONICS, CLOTHING, BOOKS, etc.
├── dto/
│   ├── ProductRequest.java              ← { name, description, price, stock, category, imageUrl }
│   ├── ProductResponse.java             ← { productId, name, ..., inStock, createdAt }
│   └── PagedResponse.java              ← Generic pagination wrapper
├── repository/
│   └── ProductRepository.java           ← findByActiveTrue(), searchByKeyword(), findByCategory()
├── service/
│   └── ProductService.java             ← Business logic: CRUD, search, reduceStock, softDelete
├── controller/
│   └── ProductController.java           ← REST endpoints, delegates to ProductService
└── exception/
    └── GlobalExceptionHandler.java      ← Standardized error responses
```

#### Key Endpoints

| Method | Path | Access | What it does |
|--------|------|--------|-------------|
| GET | /api/products | Public | List all active products (paginated, filterable, searchable) |
| GET | /api/products/{id} | Public | Get single product by ID |
| POST | /api/products | Admin | Create a new product |
| PUT | /api/products/{id} | Admin | Update product details |
| DELETE | /api/products/{id} | Admin | Soft-delete (sets active=false) |
| PATCH | /api/products/{id}/stock | Internal | Reduce stock (called by order-service) |

#### How Product Search Works

1. Client sends `GET /api/products?keyword=wireless+headphones&page=0&size=10`
2. **ProductController** → `productService.getAllProducts(page, size, sort, order, null, keyword)`
3. **ProductService**:
   - keyword is not null → calls `productRepository.searchByKeyword(keyword, pageable)`
4. **ProductRepository** uses `@Query("{'$text': {'$search': ?0}, 'active': true}")`:
   - MongoDB's `$text` operator searches across all `@TextIndexed` fields (name + description)
   - Returns a `Page<Product>` with pagination metadata
5. **ProductService** maps `Page<Product>` → `PagedResponse<ProductResponse>` (DTOs only, never raw entities)

#### Soft Delete Pattern
Instead of removing products from MongoDB, we set `active = false`. Why?
- Old orders reference product IDs — hard deletion would create broken references
- Admin can reactivate products later
- All listing queries filter with `findByActiveTrue()` — soft-deleted products are invisible

#### Stock Reduction (Internal Endpoint)
`PATCH /api/products/{id}/stock?quantity=2` is NOT for the frontend. It's called by the **order-service** during checkout via Feign:
```
ProductService.reduceStock(id, quantity):
  1. Load product from DB
  2. If stock < quantity → throw "Insufficient stock"
  3. product.setStock(product.getStock() - quantity)
  4. Save to DB
```

---

### 5.3 Order Service (:8083)

**Purpose:** Orchestrates the checkout process. The most complex service because it coordinates with cart-service and product-service via Feign.

#### File Structure & Navigation

```
order-service/src/main/java/com/ecom/order/
├── OrderServiceApplication.java         ← @EnableFeignClients, @EnableMongoAuditing
├── model/
│   ├── Order.java                       ← MongoDB document with embedded OrderItems
│   ├── OrderItem.java                   ← Embedded sub-document (not a @Document)
│   └── OrderStatus.java                ← Enum: PLACED, CONFIRMED, SHIPPED, DELIVERED, CANCELLED
├── dto/
│   ├── PlaceOrderRequest.java           ← { shippingAddress } — items come from cart, not request
│   ├── OrderResponse.java              ← Full order details with nested OrderItemResponse
│   └── PagedResponse.java              ← Generic pagination wrapper
├── client/
│   ├── CartServiceClient.java           ← Feign interface → cart-service REST API
│   ├── ProductServiceClient.java        ← Feign interface → product-service REST API
│   └── dto/
│       └── CartResponse.java            ← Local mirror of cart-service's response DTO
├── repository/
│   └── OrderRepository.java            ← findByUserId(userId, Pageable)
├── service/
│   └── OrderService.java               ← THE checkout orchestrator + order lifecycle
├── controller/
│   └── OrderController.java            ← REST endpoints
└── exception/
    └── GlobalExceptionHandler.java      ← Handles Feign errors, validation, runtime errors
```

#### The Checkout Flow (The Most Important Feature)

This is the core of the entire application. When a user clicks "Place Order":

**Step-by-step trace through the code:**

1. **Client** → `POST /api/orders` with `{ "shippingAddress": "123 Main St" }`

2. **OrderController.java** (line: `placeOrder` method):
   - Reads `X-User-Id` header (injected by API Gateway from JWT)
   - Validates `PlaceOrderRequest` with `@Valid` (shippingAddress must not be blank)
   - Calls `orderService.placeOrder(userId, request)`

3. **OrderService.java** — `placeOrder()` method:

   **Step 3a — Fetch Cart via Feign:**
   ```java
   CartResponse cart = cartServiceClient.getCart(userId);
   ```
   This calls `CartServiceClient.java` → which is a Feign interface:
   ```java
   @FeignClient(name = "cart-service", url = "${cart-service.url}")
   public interface CartServiceClient {
       @GetMapping("/api/cart")
       CartResponse getCart(@RequestHeader("X-User-Id") String userId);
   }
   ```
   Spring generates the HTTP client at runtime. This makes a real `GET http://localhost:8084/api/cart` call with the user's ID.

   **Step 3b — Validate Cart Not Empty:**
   ```java
   if (cart.getItems() == null || cart.getItems().isEmpty()) {
       throw new RuntimeException("Cannot place order: your cart is empty.");
   }
   ```

   **Step 3c — Reduce Stock for Each Item via Feign:**
   ```java
   for (CartResponse.CartItemResponse cartItem : cart.getItems()) {
       productServiceClient.reduceStock(cartItem.getProductId(), cartItem.getQuantity());
   }
   ```
   Each call hits `PATCH http://localhost:8082/api/products/{id}/stock?quantity=N`
   If any item is out of stock, the product-service throws an error → Feign propagates it as `FeignException` → caught and re-thrown with a user-friendly message.

   **Step 3d — Build & Save Order:**
   ```java
   List<OrderItem> orderItems = cart.getItems().stream()
       .map(cartItem -> OrderItem.builder()
           .productId(cartItem.getProductId())
           .productName(cartItem.getProductName())
           .price(cartItem.getPrice())
           .quantity(cartItem.getQuantity())
           .build())
       .toList();

   Order order = Order.builder()
       .userId(userId)
       .items(orderItems)
       .totalAmount(totalAmount)  // sum of all item subtotals
       .status(OrderStatus.PLACED)
       .shippingAddress(request.getShippingAddress())
       .build();

   Order savedOrder = orderRepository.save(order);
   ```

   **Step 3e — Clear Cart via Feign:**
   ```java
   cartServiceClient.clearCart(userId);
   // Maps to: DELETE http://localhost:8084/api/cart
   ```
   This is non-critical — if it fails, the order is already placed. We just log the warning.

   **Step 3f — Return Response:**
   The saved `Order` entity is mapped to `OrderResponse` DTO and returned.

4. **OrderController** wraps it in `ResponseEntity.status(201).body(response)` → **201 Created**

#### Visual Flow Diagram
```
Client                    Order Service              Cart Service           Product Service
  │                            │                          │                       │
  │  POST /api/orders          │                          │                       │
  │  { shippingAddress }       │                          │                       │
  │───────────────────────────►│                          │                       │
  │                            │  GET /api/cart            │                       │
  │                            │  (Feign + X-User-Id)     │                       │
  │                            │─────────────────────────►│                       │
  │                            │  CartResponse             │                       │
  │                            │◄─────────────────────────│                       │
  │                            │                          │                       │
  │                            │  PATCH /products/p1/stock │                       │
  │                            │  ?quantity=2              │                       │
  │                            │─────────────────────────────────────────────────►│
  │                            │                200 OK     │                       │
  │                            │◄─────────────────────────────────────────────────│
  │                            │                          │                       │
  │                            │  PATCH /products/p2/stock │                       │
  │                            │  ?quantity=1              │                       │
  │                            │─────────────────────────────────────────────────►│
  │                            │                200 OK     │                       │
  │                            │◄─────────────────────────────────────────────────│
  │                            │                          │                       │
  │                            │  [Save Order to MongoDB]  │                       │
  │                            │                          │                       │
  │                            │  DELETE /api/cart          │                       │
  │                            │─────────────────────────►│                       │
  │                            │         204 No Content    │                       │
  │                            │◄─────────────────────────│                       │
  │                            │                          │                       │
  │  201 Created               │                          │                       │
  │  { orderId, items, total } │                          │                       │
  │◄───────────────────────────│                          │                       │
```

#### Order Status Lifecycle
```
PLACED ───► CONFIRMED ───► SHIPPED ───► DELIVERED
  │
  └───► CANCELLED (only from PLACED status)
```
- `PLACED → CANCELLED`: User cancels before seller confirms
- `CANCELLED → anything`: Blocked ("Cannot update status of a cancelled order")
- `DELIVERED → anything`: Blocked ("Cannot update status of a delivered order")

---

### 5.4 Cart Service (:8084)

**Purpose:** Manages per-user shopping carts using the embedded document pattern.

#### File Structure & Navigation

```
cart-service/src/main/java/com/ecom/cart/
├── CartServiceApplication.java          ← Entry point, @EnableMongoAuditing
├── model/
│   ├── Cart.java                        ← MongoDB document, contains List<CartItem>
│   └── CartItem.java                    ← Embedded sub-document (no @Id)
├── dto/
│   ├── AddToCartRequest.java            ← { productId, productName, imageUrl, price, quantity }
│   └── CartResponse.java               ← Full cart with computed totalItems + totalAmount
├── repository/
│   └── CartRepository.java             ← findByUserId(), deleteByUserId()
├── service/
│   └── CartService.java                ← Business logic: get, add, update, remove, clear
├── controller/
│   └── CartController.java             ← REST endpoints
└── exception/
    └── GlobalExceptionHandler.java      ← Standardized error responses
```

#### Key Design Decisions

**Embedded Document Pattern:** CartItem has no `@Id` and no `@Document`. It lives INSIDE the Cart document in MongoDB. Benefits:
- 1 database read to get the entire cart (not 1 + N)
- Atomic updates — the whole cart is saved in one write
- Simpler queries

**Lazy Cart Creation:** When `GET /api/cart` is called and no cart exists, an empty cart object is returned (not saved to DB). The cart is only persisted to MongoDB on the first `addToCart()` call.

**Price Snapshotting:** When an item is added to the cart, its `productName` and `price` are snapshot at that moment. This avoids N+1 calls to product-service every time the user views their cart.

#### Add-to-Cart Upsert Logic
```
addToCart(userId, request):
  1. Load cart or create empty one
  2. Search items for matching productId
  3. If found → increment quantity (existing item)
  4. If not found → create new CartItem and append
  5. Save cart to MongoDB
  6. Return CartResponse with computed totals
```

---

### 5.5 API Gateway (:8080)

**Purpose:** Single entry point for ALL frontend requests. Handles routing, JWT authentication, and user identity injection.

#### File Structure & Navigation

```
api-gateway/src/main/java/com/ecom/api_gateway/
├── ApiGatewayApplication.java           ← Entry point
└── JwtAuthFilter.java                   ← GlobalFilter: JWT validation + header injection
```

#### How the Gateway Processes Every Request

```
Incoming Request
       │
       ▼
┌──────────────────────┐
│   Is path public?    │──── YES ──► Route directly to downstream service
│ (/api/auth/register, │
│  /api/auth/login,    │
│  /api/products,      │
│  /swagger-ui, etc.)  │
└──────────┬───────────┘
           │ NO
           ▼
┌──────────────────────┐
│ Extract "accessToken" │──── NULL ──► 401 Unauthorized
│ from HttpOnly cookie  │
└──────────┬───────────┘
           │ Found
           ▼
┌──────────────────────┐
│ Parse JWT & verify   │──── Invalid/Expired ──► 401 Unauthorized
│ HMAC-SHA256 signature │
└──────────┬───────────┘
           │ Valid
           ▼
┌──────────────────────┐
│ Extract claims:      │
│ • subject → email    │
│ • role → ROLE_*      │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Mutate request:      │
│ Add X-User-Id header │
│ Add X-User-Role header│
└──────────┬───────────┘
           │
           ▼
   Route to downstream service
   (auth/product/order/cart)
```

#### Route Configuration (application.properties)
```properties
spring.cloud.gateway.routes[0].id=auth-service
spring.cloud.gateway.routes[0].uri=http://localhost:8081
spring.cloud.gateway.routes[0].predicates[0]=Path=/api/auth/**

spring.cloud.gateway.routes[1].id=product-service
spring.cloud.gateway.routes[1].uri=http://localhost:8082
spring.cloud.gateway.routes[1].predicates[0]=Path=/api/products/**

spring.cloud.gateway.routes[2].id=order-service
spring.cloud.gateway.routes[2].uri=http://localhost:8083
spring.cloud.gateway.routes[2].predicates[0]=Path=/api/orders/**

spring.cloud.gateway.routes[3].id=cart-service
spring.cloud.gateway.routes[3].uri=http://localhost:8084
spring.cloud.gateway.routes[3].predicates[0]=Path=/api/cart/**
```

#### Why WebFlux?
The API Gateway uses Spring WebFlux (reactive/non-blocking), not Spring MVC (servlet-based). That's why:
- `JwtAuthFilter` implements `GlobalFilter` (reactive), not `OncePerRequestFilter` (servlet)
- Uses `ServerWebExchange` instead of `HttpServletRequest`
- Uses `Mono<Void>` return types instead of void
- Uses `HttpCookie` instead of `jakarta.servlet.http.Cookie`

---

## 6. End-to-End Request Flows

### 6.1 User Registration & Login

```
Browser → POST localhost:8080/api/auth/register
       → API Gateway (public path, no JWT check)
       → Routed to localhost:8081/api/auth/register
       → AuthController.register()
       → AuthService.register()
       → UserRepository.save(user)
       → JwtService.generateAccessToken() + generateRefreshToken()
       → Set cookies: accessToken (15min), refreshToken (7 days)
       → Return { userId, email, role }

Response Headers:
  Set-Cookie: accessToken=eyJhbG...; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=900
  Set-Cookie: refreshToken=eyJhbG...; HttpOnly; Secure; SameSite=Lax; Path=/api/auth; Max-Age=604800
```

### 6.2 Browsing Products

```
Browser → GET localhost:8080/api/products?category=ELECTRONICS&page=0
       → API Gateway (public path — /api/products is in PUBLIC_PATHS)
       → Routed to localhost:8082/api/products?category=ELECTRONICS&page=0
       → ProductController.getAllProducts()
       → ProductService.getAllProducts() → productRepository.findByCategoryAndActiveTrue()
       → Returns PagedResponse<ProductResponse>
```

### 6.3 Add to Cart

```
Browser → POST localhost:8080/api/cart/items (with accessToken cookie)
       → API Gateway:
           1. Extract accessToken from cookie
           2. Validate JWT signature
           3. Extract email from subject → inject as X-User-Id header
       → Routed to localhost:8084/api/cart/items (with X-User-Id: harshil@example.com)
       → CartController.addToCart(userId="harshil@example.com", request)
       → CartService.addToCart() → upsert logic → cartRepository.save()
       → Returns CartResponse with updated items + totals
```

### 6.4 Checkout (Place Order) — The Most Complex Flow

```
Browser → POST localhost:8080/api/orders (with accessToken cookie)
       → API Gateway validates JWT, injects X-User-Id
       → Routed to localhost:8083/api/orders

Order Service Orchestration:
  ┌─ Step 1: Feign GET localhost:8084/api/cart (with X-User-Id)
  │          Cart Service returns cart with 2 items
  │
  ├─ Step 2: Validate cart is not empty ✓
  │
  ├─ Step 3: Feign PATCH localhost:8082/api/products/p1/stock?quantity=2
  │          Product Service reduces stock from 50 → 48 ✓
  │
  ├─ Step 4: Feign PATCH localhost:8082/api/products/p2/stock?quantity=1
  │          Product Service reduces stock from 200 → 199 ✓
  │
  ├─ Step 5: Build Order document with snapshotted items
  │          Save to MongoDB (order_db) ✓
  │
  ├─ Step 6: Feign DELETE localhost:8084/api/cart (clear user's cart)
  │          Cart Service deletes cart document ✓
  │
  └─ Step 7: Return 201 Created with OrderResponse
```

### 6.5 Order Lifecycle

```
Admin updates order:
  PATCH /api/orders/{id}/status?status=CONFIRMED
  PATCH /api/orders/{id}/status?status=SHIPPED
  PATCH /api/orders/{id}/status?status=DELIVERED

User cancels order (only if PLACED):
  PATCH /api/orders/{id}/cancel (with X-User-Id to verify ownership)
```

---

## 7. Security Architecture

### JWT Cookie-Based Authentication

```
┌─────────────────────────────────────────────────────────────────────┐
│                      SECURITY FLOW                                  │
│                                                                     │
│  1. User logs in → Auth Service generates 2 JWT tokens              │
│  2. Tokens are set as HttpOnly cookies (not in response body!)      │
│  3. Browser auto-sends cookies with every request                   │
│  4. API Gateway reads the accessToken cookie                        │
│  5. Gateway validates the JWT signature (HMAC-SHA256)               │
│  6. Gateway extracts userId + role from JWT claims                  │
│  7. Gateway injects X-User-Id + X-User-Role headers downstream     │
│  8. Downstream services trust these headers (internal network only) │
└─────────────────────────────────────────────────────────────────────┘
```

### Why HttpOnly Cookies (Not Bearer Tokens)?
| Feature | HttpOnly Cookie | Bearer Token (localStorage) |
|---------|----------------|---------------------------|
| XSS Attack | **Immune** — JS can't read the cookie | **Vulnerable** — JS can steal the token |
| CSRF Attack | Possible but mitigated with SameSite=Lax | Not vulnerable |
| Automatic Sending | Browser sends cookie automatically | Must add Authorization header manually |

### Password Security
- Passwords are hashed with **BCrypt** before storage
- BCrypt includes a salt and intentionally slow computation (resistant to brute force)
- Raw passwords NEVER touch the database

### Refresh Token Rotation
```
 Old Tokens                    New Tokens
┌──────────┐                 ┌──────────┐
│ Access #1│  ── expired ──► │ Access #2│  (new 15-min token)
│ Refresh#1│  ── used ─────► │ Refresh#2│  (new 7-day token)
└──────────┘                 └──────────┘
                                  │
                  Old Refresh#1 is NOW INVALID
                  (rotation = one-time use)
```
If an attacker steals Refresh#1 after the user has already rotated to Refresh#2, the stolen token won't match what's in the database → rejected.

---

## 8. Inter-Service Communication

### OpenFeign — Declarative REST Clients

Instead of manually writing `RestTemplate` or `WebClient` code, we declare interfaces:

```java
@FeignClient(name = "cart-service", url = "${cart-service.url}")
public interface CartServiceClient {

    @GetMapping("/api/cart")
    CartResponse getCart(@RequestHeader("X-User-Id") String userId);

    @DeleteMapping("/api/cart")
    void clearCart(@RequestHeader("X-User-Id") String userId);
}
```

Spring Cloud OpenFeign generates the HTTP client at runtime. At compile time, this is just a Java interface. At runtime, calling `cartServiceClient.getCart("user1")` makes a real HTTP GET request to `http://localhost:8084/api/cart` with the `X-User-Id: user1` header.

### Service Dependencies
```
Auth Service        → None (independent)
Product Service     → None (independent)
Cart Service        → None (independent)
Order Service       → Cart Service (Feign) + Product Service (Feign)
API Gateway         → All services (HTTP routing)
```

### Error Handling Across Services
When a Feign call fails:
1. Downstream service returns error (e.g., 400 "Insufficient stock")
2. Feign wraps it as `FeignException` with the status code and response body
3. `GlobalExceptionHandler` in order-service catches `FeignException`:
   - 4xx errors → passed through as 400 Bad Request
   - 5xx errors → returned as 502 Bad Gateway ("downstream service unavailable")

---

## 9. Design Patterns Used

| Pattern | Where | Why |
|---------|-------|-----|
| **API Gateway** | api-gateway service | Single entry point, centralized auth, routing |
| **Database per Service** | Each service has own MongoDB | Loose coupling, independent scaling |
| **Embedded Document** | Cart (List\<CartItem\>), Order (List\<OrderItem\>) | Avoid joins, atomic reads/writes |
| **Soft Delete** | Product.active=false | Preserve referential integrity for orders |
| **DTO Pattern** | Every service uses Request/Response DTOs | Never expose raw entities to clients |
| **Lazy Creation** | Cart is created on first add, not on user registration | Avoid empty cart documents for users who never shop |
| **Price Snapshotting** | CartItem + OrderItem store name/price at add time | Immutable price record, avoid N+1 calls |
| **Refresh Token Rotation** | Auth service refresh endpoint | One-time-use tokens prevent replay attacks |
| **Stateless Authentication** | JWT tokens validated without DB lookup | Scalable — any gateway instance can validate |
| **Controller → Service → Repository** | All services | Clean separation of concerns, testable layers |
| **Global Exception Handler** | `@RestControllerAdvice` in each service | Consistent error format: { status, error, message, timestamp } |

---

## 10. File Navigation Map

### Complete File Tree (every Java file in the project)

```
backend/
├── api-gateway/
│   └── src/main/java/com/ecom/api_gateway/
│       ├── ApiGatewayApplication.java           ← Spring Boot entry point
│       └── JwtAuthFilter.java                   ← JWT cookie validation + header injection
│
├── auth-service/
│   └── src/main/java/com/ecom/auth/
│       ├── AuthServiceApplication.java
│       ├── config/SecurityConfig.java           ← Filter chain, BCrypt, public routes
│       ├── controller/AuthController.java       ← register, login, refresh, logout, me
│       ├── dto/RegisterRequest.java
│       ├── dto/LoginRequest.java
│       ├── dto/AuthResponse.java
│       ├── dto/UserProfileResponse.java
│       ├── exception/GlobalExceptionHandler.java
│       ├── model/User.java                      ← implements UserDetails
│       ├── model/Role.java                      ← ADMIN, CUSTOMER
│       ├── repository/UserRepository.java
│       ├── security/JwtService.java             ← generate + validate JWT
│       ├── security/JwtAuthFilter.java          ← cookie → SecurityContext (servlet filter)
│       └── service/AuthService.java             ← register, login, refresh, logout, profile
│
├── product-service/
│   └── src/main/java/com/ecom/product/
│       ├── ProductServiceApplication.java
│       ├── controller/ProductController.java    ← CRUD + search + stock reduction
│       ├── dto/ProductRequest.java
│       ├── dto/ProductResponse.java
│       ├── dto/PagedResponse.java
│       ├── exception/GlobalExceptionHandler.java
│       ├── model/Product.java                   ← @TextIndexed, BigDecimal price
│       ├── model/Category.java                  ← ELECTRONICS, CLOTHING, etc.
│       ├── repository/ProductRepository.java    ← keyword search, category filter
│       └── service/ProductService.java          ← CRUD, search, reduceStock, softDelete
│
├── order-service/
│   └── src/main/java/com/ecom/order/
│       ├── OrderServiceApplication.java         ← @EnableFeignClients
│       ├── client/CartServiceClient.java        ← Feign → GET/DELETE /api/cart
│       ├── client/ProductServiceClient.java     ← Feign → PATCH /api/products/{id}/stock
│       ├── client/dto/CartResponse.java         ← Local mirror of cart-service DTO
│       ├── controller/OrderController.java      ← place, list, get, cancel, updateStatus
│       ├── dto/PlaceOrderRequest.java           ← { shippingAddress }
│       ├── dto/OrderResponse.java               ← Nested OrderItemResponse
│       ├── dto/PagedResponse.java
│       ├── exception/GlobalExceptionHandler.java ← Handles FeignException specifically
│       ├── model/Order.java                     ← MongoDB document
│       ├── model/OrderItem.java                 ← Embedded sub-document
│       ├── model/OrderStatus.java               ← PLACED, CONFIRMED, SHIPPED, DELIVERED, CANCELLED
│       ├── repository/OrderRepository.java      ← findByUserId(Pageable)
│       └── service/OrderService.java            ← Checkout orchestrator
│
└── cart-service/
    └── src/main/java/com/ecom/cart/
        ├── CartServiceApplication.java
        ├── controller/CartController.java       ← get, add, update, remove, clear
        ├── dto/AddToCartRequest.java
        ├── dto/CartResponse.java                ← Nested CartItemResponse
        ├── exception/GlobalExceptionHandler.java
        ├── model/Cart.java                      ← 1 per user, embedded items
        ├── model/CartItem.java                  ← Embedded sub-document
        ├── repository/CartRepository.java       ← findByUserId, deleteByUserId
        └── service/CartService.java             ← get, addToCart, updateQty, remove, clear
```

---

## 11. How to Run

### Prerequisites
- Java 17+ (JDK 21 also works)
- Docker Desktop (for MongoDB containers)
- Maven (or use the included `./mvnw` wrapper)

### Step 1: Start Databases
```bash
cd e-comm-app
docker-compose up -d
# Starts 4 MongoDB instances: auth(:27017), product(:27018), cart(:27019), order(:27020)
```

### Step 2: Start Services (5 separate terminals)
```bash
cd backend/auth-service    && ./mvnw spring-boot:run
cd backend/product-service && ./mvnw spring-boot:run
cd backend/order-service   && ./mvnw spring-boot:run
cd backend/cart-service    && ./mvnw spring-boot:run
cd backend/api-gateway     && ./mvnw spring-boot:run
```

### Step 3: Verify
- Swagger UI: http://localhost:8081/swagger-ui.html (auth)
- Swagger UI: http://localhost:8082/swagger-ui.html (product)
- Swagger UI: http://localhost:8083/swagger-ui.html (order)
- Swagger UI: http://localhost:8084/swagger-ui.html (cart)

### Step 4: Run Automated Tests
```bash
bash test-endpoints.sh
```

---

## 12. Common Viva Questions & Answers

**Q: Why microservices instead of a monolith?**
A: Each service can be developed, deployed, and scaled independently. The cart team doesn't need to redeploy the auth service. Each service has its own database, preventing tight coupling.

**Q: Why MongoDB instead of MySQL/PostgreSQL?**
A: The data models (carts with embedded items, orders with embedded items) map naturally to MongoDB's document model. Embedded sub-documents avoid expensive JOIN operations. Schema flexibility makes iteration faster.

**Q: Why HttpOnly cookies instead of sending JWT in the Authorization header?**
A: HttpOnly cookies can't be read by JavaScript, protecting against XSS attacks. The browser sends them automatically with every request, simplifying the frontend code.

**Q: What happens if the product-service is down during checkout?**
A: The Feign call to reduce stock will fail with a `FeignException`. The `GlobalExceptionHandler` catches it and returns a 502 Bad Gateway to the user. The order is NOT placed — we fail before saving. This is a "best-effort" approach; for production, you'd implement the Saga pattern for distributed transactions.

**Q: Why does the cart snapshot product prices instead of fetching them fresh?**
A: Performance — viewing a cart with 10 items would require 10 REST calls to product-service (N+1 problem). By snapshotting at add-time, we get the entire cart in 1 database read.

**Q: What is refresh token rotation?**
A: Each time a refresh token is used, both a new access token AND a new refresh token are issued. The old refresh token is invalidated in the database. If an attacker steals a refresh token after the user has already refreshed, the stolen token won't match the DB and will be rejected.

**Q: How does the API Gateway know which user is making a request?**
A: The `JwtAuthFilter` (GlobalFilter) extracts the JWT from the `accessToken` HttpOnly cookie, validates the signature using the shared secret, extracts the email from the "subject" claim, and injects it as an `X-User-Id` header that downstream services read.

**Q: Why BigDecimal for prices?**
A: `double` and `float` have floating-point precision errors (e.g., `0.1 + 0.2 = 0.30000000000000004`). Financial calculations require exact precision. `BigDecimal` provides arbitrary-precision decimal arithmetic.

**Q: What is soft delete and why use it?**
A: Instead of deleting a product document from MongoDB, we set `active = false`. The product becomes invisible in listings but still exists. This preserves referential integrity — old orders still reference the product ID. Hard deletion would create orphaned references.

**Q: How does inter-service communication work?**
A: We use Spring Cloud OpenFeign. You declare a Java interface annotated with `@FeignClient` and Spring HTTP mapping annotations (`@GetMapping`, `@PatchMapping`). Spring generates the actual HTTP client at runtime. Calling a method on the Feign interface makes a real REST API call to the target service.

**Q: Can a user see another user's orders?**
A: No. The `OrderService.getOrderById()` method loads the order, then checks `if (!order.getUserId().equals(userId))` — if they don't match, it throws "Order not found" (deliberately vague to not reveal the order exists).

**Q: Why is the API Gateway reactive (WebFlux) while other services are servlet-based?**
A: Spring Cloud Gateway is built on WebFlux (non-blocking I/O). A gateway handles thousands of concurrent connections and mostly just proxies requests — it doesn't do heavy computation. Non-blocking I/O is ideal for this. The downstream services use Spring MVC (servlet) because they do sequential database operations where blocking is acceptable.
