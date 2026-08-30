package com.anuradha.organics.controller;

import com.anuradha.organics.entity.Product;
import com.anuradha.organics.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    @Autowired
    private ProductRepository productRepository;

    @GetMapping
    public ResponseEntity<List<Product>> getAllProducts(
            @RequestParam(value = "category", required = false) String category) {
        if (category != null && !category.trim().isEmpty() && !"all".equalsIgnoreCase(category)) {
            return ResponseEntity.ok(productRepository.findByCategory(category.trim()));
        }
        return ResponseEntity.ok(productRepository.findAllByOrderByCreatedAtDesc());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable String id) {
        return productRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
