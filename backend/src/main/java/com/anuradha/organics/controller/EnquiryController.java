package com.anuradha.organics.controller;

import com.anuradha.organics.entity.Enquiry;
import com.anuradha.organics.repository.EnquiryRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/enquiries")
public class EnquiryController {

    @Autowired
    private EnquiryRepository enquiryRepository;

    @PostMapping
    public ResponseEntity<?> submitEnquiry(@Valid @RequestBody Enquiry enquiry) {
        try {
            Enquiry saved = enquiryRepository.save(enquiry);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Enquiry submitted successfully! We will contact you soon.",
                    "id", saved.getId()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Failed to submit enquiry: " + e.getMessage()
            ));
        }
    }

    @GetMapping
    public ResponseEntity<List<Enquiry>> getAllEnquiries() {
        return ResponseEntity.ok(enquiryRepository.findAllByOrderByCreatedAtDesc());
    }
}
