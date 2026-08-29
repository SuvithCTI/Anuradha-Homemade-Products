package com.anuradha.organics.controller;

import com.anuradha.organics.entity.NewsletterSubscription;
import com.anuradha.organics.repository.NewsletterSubscriptionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/newsletter")
public class NewsletterController {

    @Autowired
    private NewsletterSubscriptionRepository newsletterRepository;

    @PostMapping("/subscribe")
    public ResponseEntity<?> subscribe(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        if (email == null || email.trim().isEmpty() || !email.contains("@")) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Please provide a valid email address."
            ));
        }

        email = email.trim().toLowerCase();
        if (newsletterRepository.existsByEmail(email)) {
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "You are already subscribed to our newsletter!"
            ));
        }

        NewsletterSubscription sub = new NewsletterSubscription(email);
        newsletterRepository.save(sub);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Thank you for subscribing to our newsletter!"
        ));
    }
}
