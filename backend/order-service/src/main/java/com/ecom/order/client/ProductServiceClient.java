package com.ecom.order.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

/**
 * Feign client for communicating with the Product Service.
 *
 * Used during checkout to reduce stock for each ordered product.
 * Maps to the internal PATCH /api/products/{id}/stock endpoint.
 *
 * The URL is configured in application.properties as 'product-service.url'.
 */
@FeignClient(name = "product-service", url = "${product-service.url}")
public interface ProductServiceClient {

    /**
     * Reduce a product's stock by the given quantity.
     * Maps to: PATCH /api/products/{id}/stock?quantity=N in the product-service.
     *
     * Called once per order item during checkout.
     * If the product has insufficient stock, the product-service will return
     * an error, which Feign will propagate as a FeignException.
     */
    @PatchMapping("/api/products/{id}/stock")
    void reduceStock(@PathVariable("id") String productId,
                     @RequestParam("quantity") int quantity);
}
