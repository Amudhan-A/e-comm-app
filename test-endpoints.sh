#!/bin/bash
# ============================================================
#  E-Commerce Backend — Full Endpoint Test Script
#  Prerequisites: Docker, Java 17+, curl
# ============================================================
# Usage:
#   1. Start Docker Desktop
#   2. Run: docker-compose up -d
#   3. Start each service (in separate terminals):
#        cd backend/auth-service    && ./mvnw spring-boot:run
#        cd backend/product-service && ./mvnw spring-boot:run
#        cd backend/order-service   && ./mvnw spring-boot:run
#        cd backend/cart-service    && ./mvnw spring-boot:run
#        cd backend/api-gateway     && ./mvnw spring-boot:run
#   4. Wait ~30s for all services to start
#   5. Run this script: bash test-endpoints.sh
# ============================================================

BASE_AUTH="http://localhost:8081"
BASE_PRODUCT="http://localhost:8082"
BASE_ORDER="http://localhost:8083"
BASE_CART="http://localhost:8084"
BASE_GATEWAY="http://localhost:8080"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass=0
fail=0

test_endpoint() {
  local desc="$1"
  local expected_code="$2"
  local actual_code="$3"
  local body="$4"

  if [ "$actual_code" == "$expected_code" ]; then
    echo -e "${GREEN}✓ PASS${NC} [$actual_code] $desc"
    ((pass++))
  else
    echo -e "${RED}✗ FAIL${NC} [$actual_code] $desc (expected $expected_code)"
    echo "  Response: $body"
    ((fail++))
  fi
}

echo ""
echo "============================================================"
echo "  PHASE 1: AUTH SERVICE (:8081)"
echo "============================================================"

# 1.1 Register a new user
echo -e "\n${YELLOW}--- Register ---${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -c cookies.txt \
  -X POST "$BASE_AUTH/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "password": "Password123!"
  }')
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')
test_endpoint "Register new user" "200" "$HTTP_CODE" "$BODY"
echo "  Body: $BODY"

# 1.2 Register duplicate (should fail)
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "$BASE_AUTH/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "password": "Password123!"
  }')
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')
test_endpoint "Register duplicate email (should fail)" "400" "$HTTP_CODE" "$BODY"

# 1.3 Login
echo -e "\n${YELLOW}--- Login ---${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -c cookies.txt \
  -X POST "$BASE_AUTH/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!"
  }')
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')
test_endpoint "Login with valid credentials" "200" "$HTTP_CODE" "$BODY"
echo "  Body: $BODY"

# 1.4 Login with wrong password
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "$BASE_AUTH/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "WrongPassword"
  }')
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
test_endpoint "Login with wrong password (should fail)" "401" "$HTTP_CODE" ""

# 1.5 Get profile (with cookies from login)
echo -e "\n${YELLOW}--- Profile ---${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -b cookies.txt \
  -X GET "$BASE_AUTH/api/auth/me")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')
test_endpoint "Get user profile (authenticated)" "200" "$HTTP_CODE" "$BODY"
echo "  Body: $BODY"

# 1.6 Refresh token
echo -e "\n${YELLOW}--- Refresh Token ---${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -b cookies.txt -c cookies.txt \
  -X POST "$BASE_AUTH/api/auth/refresh")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')
test_endpoint "Refresh token" "200" "$HTTP_CODE" "$BODY"

echo ""
echo "============================================================"
echo "  PHASE 2: PRODUCT SERVICE (:8082)"
echo "============================================================"

# 2.1 Create a product (using X-User-Id header for dev bypass)
echo -e "\n${YELLOW}--- Create Products ---${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "$BASE_PRODUCT/api/products" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: test-seller" \
  -d '{
    "name": "Sony WH-1000XM5 Headphones",
    "description": "Industry-leading noise cancelling wireless headphones",
    "price": 24999.99,
    "stock": 50,
    "category": "ELECTRONICS",
    "imageUrl": "https://example.com/sony-headphones.jpg"
  }')
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')
test_endpoint "Create product 1 (Headphones)" "201" "$HTTP_CODE" "$BODY"
PRODUCT_1_ID=$(echo "$BODY" | grep -o '"productId":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "  Product 1 ID: $PRODUCT_1_ID"

RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "$BASE_PRODUCT/api/products" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: test-seller" \
  -d '{
    "name": "USB-C Cable 2m",
    "description": "Fast charging braided USB-C cable",
    "price": 199.00,
    "stock": 200,
    "category": "ELECTRONICS",
    "imageUrl": "https://example.com/usb-cable.jpg"
  }')
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')
test_endpoint "Create product 2 (USB Cable)" "201" "$HTTP_CODE" "$BODY"
PRODUCT_2_ID=$(echo "$BODY" | grep -o '"productId":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "  Product 2 ID: $PRODUCT_2_ID"

# 2.2 List all products
echo -e "\n${YELLOW}--- List & Search Products ---${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X GET "$BASE_PRODUCT/api/products")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
test_endpoint "List all products (paginated)" "200" "$HTTP_CODE" ""

# 2.3 Get single product
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X GET "$BASE_PRODUCT/api/products/$PRODUCT_1_ID")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
test_endpoint "Get product by ID" "200" "$HTTP_CODE" ""

# 2.4 Search products by keyword
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X GET "$BASE_PRODUCT/api/products?keyword=headphones")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
test_endpoint "Search products by keyword" "200" "$HTTP_CODE" ""

# 2.5 Filter by category
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X GET "$BASE_PRODUCT/api/products?category=ELECTRONICS")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
test_endpoint "Filter products by category" "200" "$HTTP_CODE" ""

# 2.6 Get non-existent product
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X GET "$BASE_PRODUCT/api/products/nonexistent123")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
test_endpoint "Get non-existent product (should 404)" "404" "$HTTP_CODE" ""

echo ""
echo "============================================================"
echo "  PHASE 3: CART SERVICE (:8084)"
echo "============================================================"

# 3.1 Get empty cart (lazy creation)
echo -e "\n${YELLOW}--- Cart Operations ---${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X GET "$BASE_CART/api/cart" \
  -H "X-User-Id: test-user-1")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')
test_endpoint "Get cart (lazy creation — empty)" "200" "$HTTP_CODE" "$BODY"
echo "  Body: $BODY"

# 3.2 Add item 1 to cart
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "$BASE_CART/api/cart/items" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: test-user-1" \
  -d "{
    \"productId\": \"$PRODUCT_1_ID\",
    \"productName\": \"Sony WH-1000XM5 Headphones\",
    \"imageUrl\": \"https://example.com/sony-headphones.jpg\",
    \"price\": 24999.99,
    \"quantity\": 2
  }")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')
test_endpoint "Add headphones to cart (qty: 2)" "200" "$HTTP_CODE" "$BODY"

# 3.3 Add item 2 to cart
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "$BASE_CART/api/cart/items" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: test-user-1" \
  -d "{
    \"productId\": \"$PRODUCT_2_ID\",
    \"productName\": \"USB-C Cable 2m\",
    \"imageUrl\": \"https://example.com/usb-cable.jpg\",
    \"price\": 199.00,
    \"quantity\": 1
  }")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')
test_endpoint "Add USB cable to cart (qty: 1)" "200" "$HTTP_CODE" "$BODY"

# 3.4 Get cart (should have 2 items)
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X GET "$BASE_CART/api/cart" \
  -H "X-User-Id: test-user-1")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')
test_endpoint "Get cart (should have 2 items)" "200" "$HTTP_CODE" "$BODY"
echo "  Body: $BODY"

# 3.5 Update quantity
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X PATCH "$BASE_CART/api/cart/items/$PRODUCT_1_ID?quantity=3" \
  -H "X-User-Id: test-user-1")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
test_endpoint "Update headphones quantity to 3" "200" "$HTTP_CODE" ""

# 3.6 Remove one item
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X DELETE "$BASE_CART/api/cart/items/$PRODUCT_2_ID" \
  -H "X-User-Id: test-user-1")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
test_endpoint "Remove USB cable from cart" "200" "$HTTP_CODE" ""

# 3.7 Re-add item 2 for order test
curl -s -X POST "$BASE_CART/api/cart/items" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: test-user-1" \
  -d "{
    \"productId\": \"$PRODUCT_2_ID\",
    \"productName\": \"USB-C Cable 2m\",
    \"imageUrl\": \"https://example.com/usb-cable.jpg\",
    \"price\": 199.00,
    \"quantity\": 1
  }" > /dev/null

echo ""
echo "============================================================"
echo "  PHASE 4: ORDER SERVICE (:8083)"
echo "============================================================"

# 4.1 Place order (checkout — the big one!)
echo -e "\n${YELLOW}--- Checkout Flow ---${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "$BASE_ORDER/api/orders" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: test-user-1" \
  -d '{
    "shippingAddress": "123 Main Street, Hyderabad, TS 500001"
  }')
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')
test_endpoint "Place order (checkout)" "201" "$HTTP_CODE" "$BODY"
ORDER_ID=$(echo "$BODY" | grep -o '"orderId":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "  Order ID: $ORDER_ID"
echo "  Body: $BODY"

# 4.2 Verify cart was cleared
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X GET "$BASE_CART/api/cart" \
  -H "X-User-Id: test-user-1")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')
test_endpoint "Cart should be empty after checkout" "200" "$HTTP_CODE" "$BODY"
echo "  Cart after order: $BODY"

# 4.3 Get order by ID
echo -e "\n${YELLOW}--- Order Queries ---${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X GET "$BASE_ORDER/api/orders/$ORDER_ID" \
  -H "X-User-Id: test-user-1")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')
test_endpoint "Get order by ID" "200" "$HTTP_CODE" "$BODY"

# 4.4 List user's orders
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X GET "$BASE_ORDER/api/orders?page=0&size=10" \
  -H "X-User-Id: test-user-1")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
test_endpoint "List user orders (paginated)" "200" "$HTTP_CODE" ""

# 4.5 Try to get order as different user (should fail)
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X GET "$BASE_ORDER/api/orders/$ORDER_ID" \
  -H "X-User-Id: other-user")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
test_endpoint "Get order as wrong user (should 404)" "404" "$HTTP_CODE" ""

# 4.6 Update order status (admin)
echo -e "\n${YELLOW}--- Order Status Updates ---${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X PATCH "$BASE_ORDER/api/orders/$ORDER_ID/status?status=CONFIRMED")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
test_endpoint "Update status to CONFIRMED" "200" "$HTTP_CODE" ""

RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X PATCH "$BASE_ORDER/api/orders/$ORDER_ID/status?status=SHIPPED")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
test_endpoint "Update status to SHIPPED" "200" "$HTTP_CODE" ""

RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X PATCH "$BASE_ORDER/api/orders/$ORDER_ID/status?status=DELIVERED")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
test_endpoint "Update status to DELIVERED" "200" "$HTTP_CODE" ""

# 4.7 Try invalid status update on delivered order
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X PATCH "$BASE_ORDER/api/orders/$ORDER_ID/status?status=CONFIRMED")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
test_endpoint "Update delivered order (should fail)" "400" "$HTTP_CODE" ""

# 4.8 Place another order for cancel test
curl -s -X POST "$BASE_CART/api/cart/items" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: test-user-1" \
  -d "{
    \"productId\": \"$PRODUCT_2_ID\",
    \"productName\": \"USB-C Cable 2m\",
    \"imageUrl\": \"https://example.com/usb-cable.jpg\",
    \"price\": 199.00,
    \"quantity\": 1
  }" > /dev/null

RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "$BASE_ORDER/api/orders" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: test-user-1" \
  -d '{"shippingAddress": "456 Test Ave, Mumbai"}')
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')
ORDER_2_ID=$(echo "$BODY" | grep -o '"orderId":"[^"]*"' | head -1 | cut -d'"' -f4)

# 4.9 Cancel the second order
echo -e "\n${YELLOW}--- Cancel Order ---${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X PATCH "$BASE_ORDER/api/orders/$ORDER_2_ID/cancel" \
  -H "X-User-Id: test-user-1")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
test_endpoint "Cancel order (PLACED -> CANCELLED)" "200" "$HTTP_CODE" ""

# 4.10 Try to cancel again (should fail)
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X PATCH "$BASE_ORDER/api/orders/$ORDER_2_ID/cancel" \
  -H "X-User-Id: test-user-1")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
test_endpoint "Cancel already-cancelled order (should fail)" "400" "$HTTP_CODE" ""

# 4.11 Place order with empty cart (should fail)
echo -e "\n${YELLOW}--- Edge Cases ---${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "$BASE_ORDER/api/orders" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: test-user-1" \
  -d '{"shippingAddress": "Some Address"}')
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
test_endpoint "Place order with empty cart (should fail)" "400" "$HTTP_CODE" ""

# 4.12 Place order without shipping address (validation)
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "$BASE_ORDER/api/orders" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: test-user-1" \
  -d '{}')
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
test_endpoint "Place order without address (should 400)" "400" "$HTTP_CODE" ""

echo ""
echo "============================================================"
echo "  PHASE 5: API GATEWAY (:8080) — JWT Flow"
echo "============================================================"

# 5.1 Public route — should work without auth
echo -e "\n${YELLOW}--- Public Routes ---${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X GET "$BASE_GATEWAY/api/products")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
test_endpoint "Gateway: GET /api/products (public)" "200" "$HTTP_CODE" ""

# 5.2 Protected route without cookie — should 401
echo -e "\n${YELLOW}--- Protected Routes (No Auth) ---${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X GET "$BASE_GATEWAY/api/cart")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
test_endpoint "Gateway: GET /api/cart without token (should 401)" "401" "$HTTP_CODE" ""

RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X GET "$BASE_GATEWAY/api/orders")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
test_endpoint "Gateway: GET /api/orders without token (should 401)" "401" "$HTTP_CODE" ""

# 5.3 Login through gateway (get cookies)
echo -e "\n${YELLOW}--- Authenticated Flow via Gateway ---${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -c gateway-cookies.txt \
  -X POST "$BASE_GATEWAY/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!"
  }')
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
test_endpoint "Gateway: Login (sets cookies)" "200" "$HTTP_CODE" ""

# 5.4 Protected route WITH cookie — should work
RESPONSE=$(curl -s -w "\n%{http_code}" -b gateway-cookies.txt \
  -X GET "$BASE_GATEWAY/api/cart")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')
test_endpoint "Gateway: GET /api/cart with JWT cookie" "200" "$HTTP_CODE" "$BODY"

RESPONSE=$(curl -s -w "\n%{http_code}" -b gateway-cookies.txt \
  -X GET "$BASE_GATEWAY/api/orders")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
test_endpoint "Gateway: GET /api/orders with JWT cookie" "200" "$HTTP_CODE" ""

# 5.5 Invalid cookie
echo -e "\n${YELLOW}--- Invalid Token ---${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X GET "$BASE_GATEWAY/api/cart" \
  -H "Cookie: accessToken=invalid.jwt.token")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
test_endpoint "Gateway: Invalid JWT cookie (should 401)" "401" "$HTTP_CODE" ""

echo ""
echo "============================================================"
echo "  PHASE 6: PRODUCT ADMIN OPS"
echo "============================================================"

# 6.1 Update product
echo -e "\n${YELLOW}--- Update & Delete ---${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X PUT "$BASE_PRODUCT/api/products/$PRODUCT_1_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sony WH-1000XM5 Headphones (Updated)",
    "description": "Updated description",
    "price": 22999.99,
    "stock": 45,
    "category": "ELECTRONICS",
    "imageUrl": "https://example.com/sony-headphones-v2.jpg"
  }')
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
test_endpoint "Update product" "200" "$HTTP_CODE" ""

# 6.2 Soft-delete product
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X DELETE "$BASE_PRODUCT/api/products/$PRODUCT_2_ID")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
test_endpoint "Soft-delete product" "204" "$HTTP_CODE" ""

# 6.3 Verify deleted product doesn't appear in listing
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X GET "$BASE_PRODUCT/api/products/$PRODUCT_2_ID")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
test_endpoint "Get soft-deleted product (should 404)" "404" "$HTTP_CODE" ""

# Cleanup
rm -f cookies.txt gateway-cookies.txt

echo ""
echo "============================================================"
echo "  RESULTS"
echo "============================================================"
echo -e "  ${GREEN}Passed: $pass${NC}"
echo -e "  ${RED}Failed: $fail${NC}"
echo "  Total:  $((pass + fail))"
echo "============================================================"

if [ "$fail" -eq 0 ]; then
  echo -e "  ${GREEN}ALL TESTS PASSED!${NC}"
else
  echo -e "  ${RED}SOME TESTS FAILED — check output above${NC}"
fi
echo ""
