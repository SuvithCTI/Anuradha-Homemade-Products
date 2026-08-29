package com.anuradha.organics.controller;

import com.anuradha.organics.entity.Feedback;
import com.anuradha.organics.repository.FeedbackRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/feedbacks")
public class FeedbackController {

    @Autowired
    private FeedbackRepository feedbackRepository;

    @PostMapping
    public ResponseEntity<?> submitFeedback(@Valid @RequestBody Feedback feedback) {
        try {
            Feedback saved = feedbackRepository.save(feedback);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Feedback submitted successfully! Thank you for your review.",
                    "id", saved.getId()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Failed to submit feedback: " + e.getMessage()
            ));
        }
    }

    @GetMapping
    public ResponseEntity<List<Feedback>> getAllFeedbacks() {
        return ResponseEntity.ok(feedbackRepository.findAllByOrderByCreatedAtDesc());
    }
}
