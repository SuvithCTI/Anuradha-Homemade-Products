package com.anuradha.organics.controller;

import com.anuradha.organics.entity.*;
import com.anuradha.organics.repository.*;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EnquiryRepository enquiryRepository;

    @Autowired
    private FeedbackRepository feedbackRepository;

    @Autowired
    private NewsletterSubscriptionRepository newsletterRepository;

    @Autowired
    private LoginLogRepository loginLogRepository;

    @Autowired
    private VerificationTokenRepository verificationTokenRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    // --- 1. OVERVIEW / STATS ---
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getAdminStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalProducts", productRepository.count());
        stats.put("totalUsers", userRepository.countByRole(Role.CUSTOMER));
        stats.put("totalEnquiries", enquiryRepository.count());
        stats.put("totalFeedbacks", feedbackRepository.count());
        stats.put("totalSubscribers", newsletterRepository.count());
        stats.put("totalLoginAttempts", loginLogRepository.count());
        return ResponseEntity.ok(stats);
    }

    // --- UPLOAD IMAGE ---
    @PostMapping("/upload-image")
    public ResponseEntity<?> uploadImage(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Please select a valid image file."));
        }

        try {
            String originalFilename = file.getOriginalFilename();
            String ext = ".jpg";
            if (originalFilename != null && originalFilename.contains(".")) {
                ext = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String newFilename = "prod_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 6) + ext;

            String userDir = System.getProperty("user.dir");
            File baseDir = new File(userDir);
            File projectRoot = baseDir.getName().equalsIgnoreCase("backend") ? baseDir.getParentFile() : baseDir;

            File uploadsDir = new File(projectRoot, "frontend/images/uploads");
            if (!uploadsDir.exists()) uploadsDir.mkdirs();
            File destFile = new File(uploadsDir, newFilename);
            file.transferTo(destFile.getAbsoluteFile());

            File targetStaticDir = new File(projectRoot, "backend/target/classes/static/images/uploads");
            if (!targetStaticDir.exists()) targetStaticDir.mkdirs();
            Files.copy(destFile.toPath(), new File(targetStaticDir, newFilename).toPath(), StandardCopyOption.REPLACE_EXISTING);

            File srcStaticDir = new File(projectRoot, "backend/src/main/resources/static/images/uploads");
            if (!srcStaticDir.exists()) srcStaticDir.mkdirs();
            Files.copy(destFile.toPath(), new File(srcStaticDir, newFilename).toPath(), StandardCopyOption.REPLACE_EXISTING);

            String relativeUrl = "images/uploads/" + newFilename;
            return ResponseEntity.ok(Map.of("success", true, "imageUrl", relativeUrl));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Image upload failed: " + e.getMessage()));
        }
    }

    // --- 2. PRODUCTS MANAGEMENT ---
    @GetMapping("/products")
    public ResponseEntity<List<Product>> getAllProducts() {
        return ResponseEntity.ok(productRepository.findAllByOrderByCreatedAtDesc());
    }

    @PostMapping("/products")
    public ResponseEntity<?> createProduct(@Valid @RequestBody Product product) {
        if (product.getId() == null || product.getId().trim().isEmpty()) {
            String slug = product.getName().toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
            if (slug.isEmpty()) {
                slug = "product-" + UUID.randomUUID().toString().substring(0, 8);
            }
            product.setId(slug);
        }

        if (productRepository.existsById(product.getId())) {
            // Generate unique slug if duplicate
            product.setId(product.getId() + "-" + UUID.randomUUID().toString().substring(0, 4));
        }

        Product saved = productRepository.save(product);
        return ResponseEntity.ok(Map.of("success", true, "message", "Product created successfully", "product", saved));
    }

    @PutMapping("/products/{id}")
    public ResponseEntity<?> updateProduct(@PathVariable String id, @Valid @RequestBody Product updated) {
        return productRepository.findById(id).map(product -> {
            product.setName(updated.getName());
            product.setCategory(updated.getCategory());
            product.setPrice(updated.getPrice());
            if (updated.getRating() != null) product.setRating(updated.getRating());
            if (updated.getReviewsCount() != null) product.setReviewsCount(updated.getReviewsCount());
            if (updated.getImage() != null) product.setImage(updated.getImage());
            product.setDescription(updated.getDescription());
            product.setIngredients(updated.getIngredients());
            product.setBenefits(updated.getBenefits());
            product.setSizesJson(updated.getSizesJson());
            if (updated.getInStock() != null) product.setInStock(updated.getInStock());
            if (updated.getFeatured() != null) product.setFeatured(updated.getFeatured());

            Product saved = productRepository.save(product);
            return ResponseEntity.ok(Map.of("success", true, "message", "Product updated successfully", "product", saved));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/products/{id}")
    public ResponseEntity<?> deleteProduct(@PathVariable String id) {
        if (!productRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        productRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("success", true, "message", "Product deleted successfully"));
    }

    // --- 3. CUSTOMER USERS MANAGEMENT ---
    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findByRoleOrderByCreatedAtDesc(Role.CUSTOMER));
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<?> updateUserRole(@PathVariable Long id, @RequestBody Map<String, String> request) {
        String roleStr = request.get("role");
        if (roleStr == null) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Role is required"));
        }

        return userRepository.findById(id).map(user -> {
            user.setRole(Role.valueOf(roleStr.toUpperCase()));
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("success", true, "message", "User role updated to " + user.getRole()));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/users")
    public ResponseEntity<?> createUser(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");
        String firstName = request.get("firstName");
        String lastName = request.get("lastName");
        String roleStr = request.get("role");

        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Email is required"));
        }
        if (password == null || password.trim().length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Password must be at least 6 characters"));
        }
        if (userRepository.existsByEmail(email.trim().toLowerCase())) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Email is already registered"));
        }

        User user = new User();
        user.setEmail(email.trim().toLowerCase());
        user.setPassword(passwordEncoder.encode(password.trim()));
        user.setFirstName(firstName != null && !firstName.trim().isEmpty() ? firstName.trim() : "User");
        user.setLastName(lastName != null && !lastName.trim().isEmpty() ? lastName.trim() : "");
        user.setAuthProvider(AuthProvider.LOCAL);
        user.setEmailVerified(true);
        user.setRole(roleStr != null && "ADMIN".equalsIgnoreCase(roleStr.trim()) ? Role.ADMIN : Role.CUSTOMER);

        User saved = userRepository.save(user);
        return ResponseEntity.ok(Map.of("success", true, "message", "Account registered successfully", "user", saved));
    }

    @DeleteMapping("/users/{id}")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        return userRepository.findById(id).map(user -> {
            try {
                verificationTokenRepository.deleteByUser(user);
                passwordResetTokenRepository.deleteByUser(user);
                loginLogRepository.deleteByUserId(user.getId());
                loginLogRepository.deleteByEmail(user.getEmail());
                userRepository.delete(user);
                return ResponseEntity.ok(Map.of("success", true, "message", "User account deleted successfully"));
            } catch (Exception e) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Could not delete user: " + e.getMessage()));
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    // --- 4. ENQUIRIES MANAGEMENT ---
    @GetMapping("/enquiries")
    public ResponseEntity<List<Enquiry>> getAllEnquiries() {
        return ResponseEntity.ok(enquiryRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt")));
    }

    @PutMapping("/enquiries/{id}/status")
    public ResponseEntity<?> updateEnquiryStatus(@PathVariable Long id, @RequestBody Map<String, String> request) {
        String status = request.get("status");
        if (status == null || status.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Status is required"));
        }

        return enquiryRepository.findById(id).map(enquiry -> {
            enquiry.setStatus(status.toUpperCase().trim());
            enquiryRepository.save(enquiry);
            return ResponseEntity.ok(Map.of("success", true, "message", "Status updated successfully"));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/enquiries/{id}")
    public ResponseEntity<?> deleteEnquiry(@PathVariable Long id) {
        if (!enquiryRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        enquiryRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("success", true, "message", "Enquiry deleted successfully"));
    }

    // --- 5. FEEDBACKS / REVIEWS MANAGEMENT ---
    @GetMapping("/feedbacks")
    public ResponseEntity<List<Feedback>> getAllFeedbacks() {
        return ResponseEntity.ok(feedbackRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt")));
    }

    @DeleteMapping("/feedbacks/{id}")
    public ResponseEntity<?> deleteFeedback(@PathVariable Long id) {
        if (!feedbackRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        feedbackRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("success", true, "message", "Review deleted successfully"));
    }

    // --- 6. NEWSLETTER SUBSCRIPTIONS ---
    @GetMapping("/newsletters")
    public ResponseEntity<List<NewsletterSubscription>> getAllNewsletters() {
        return ResponseEntity.ok(newsletterRepository.findAll(Sort.by(Sort.Direction.DESC, "subscribedAt")));
    }

    @DeleteMapping("/newsletters/{id}")
    public ResponseEntity<?> deleteNewsletter(@PathVariable Long id) {
        if (!newsletterRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        newsletterRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("success", true, "message", "Subscription removed successfully"));
    }

    // --- 7. LOGIN LOGS & AUDIT ---
    @GetMapping("/login-logs")
    public ResponseEntity<List<LoginLog>> getLoginLogs() {
        return ResponseEntity.ok(loginLogRepository.findAll(Sort.by(Sort.Direction.DESC, "loginTime")));
    }
}
