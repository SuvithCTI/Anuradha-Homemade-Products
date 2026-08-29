package com.anuradha.organics.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import java.util.concurrent.CompletableFuture;

@Service
public class EmailService {
    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${app.backend.url:https://anuradha-homemade-products.onrender.com}")
    private String backendUrl;

    @Value("${app.frontend.url:https://anuradha-homemade-products.vercel.app}")
    private String frontendUrl;

    @Value("${spring.mail.username:suvithsuvi22@gmail.com}")
    private String fromEmail;

    public void sendVerificationEmail(String toEmail, String fullName, String token) {
        String verificationLink = backendUrl + "/api/auth/verify-email?token=" + token;
        
        String subject = "Verify your email - Anuradha Homemade Organics";
        String body = String.format(
                "Welcome to Anuradha Homemade Organics, %s!\n\n" +
                "Thank you for creating your account.\n\n" +
                "Please verify your email address by clicking the link below:\n" +
                "%s\n\n" +
                "This verification link will expire after 24 hours.\n\n" +
                "Regards,\nAnuradha Homemade Organics Team",
                fullName, verificationLink
        );

        sendEmail(toEmail, subject, body);
    }

    public void sendPasswordResetEmail(String toEmail, String fullName, String token) {
        String resetLink = frontendUrl + "/reset-password.html?token=" + token;

        String subject = "Password Reset - Anuradha Homemade Organics";
        String body = String.format(
                "Hello %s,\n\n" +
                "We received a request to reset your password.\n\n" +
                "Please reset your password by clicking the link below:\n" +
                "%s\n\n" +
                "If you did not request this, you can safely ignore this email.\n\n" +
                "This reset link will expire after 1 hour.\n\n" +
                "Regards,\nAnuradha Homemade Organics Team",
                fullName, resetLink
        );

        sendEmail(toEmail, subject, body);
    }

    private void sendEmail(String toEmail, String subject, String body) {
        // Run email dispatch asynchronously in a background thread so the HTTP request completes instantly
        CompletableFuture.runAsync(() -> {
            try {
                if (mailSender == null) {
                    throw new IllegalStateException("JavaMailSender is not initialized. Check SMTP configuration.");
                }
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(fromEmail);
                message.setTo(toEmail);
                message.setSubject(subject);
                message.setText(body);
                mailSender.send(message);
                logger.info("Email sent successfully to {}", toEmail);
            } catch (Exception e) {
                logger.warn("Could not send email to {} via SMTP (will log to console): {}", toEmail, e.getMessage());
                logger.info("----- EMAIL CONSOLE LOG (BACKUP) -----");
                logger.info("To: {}", toEmail);
                logger.info("Subject: {}", subject);
                logger.info("Body:\n{}", body);
                logger.info("--------------------------------------");
            }
        });
    }
}
