package com.anuradha.organics.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.concurrent.CompletableFuture;

@Service
public class EmailService {
    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${app.backend.url:https://anuradha-homemade-products.onrender.com}")
    private String backendUrl;

    @Value("${app.frontend.url:https://anuradha-homemade-products.vercel.app}")
    private String frontendUrl;

    @Value("${spring.mail.username:suvithsuvi22@gmail.com}")
    private String fromEmail;

    @Value("${RESEND_API_KEY:}")
    private String resendApiKey;

    @Value("${BREVO_API_KEY:}")
    private String brevoApiKey;

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

        logger.info(">>> VERIFICATION LINK GENERATED FOR {}: {}", toEmail, verificationLink);
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
        CompletableFuture.runAsync(() -> {
            // 1. Try Resend HTTPS API if API Key is configured (Best for Render/Cloud)
            if (resendApiKey != null && !resendApiKey.trim().isEmpty()) {
                try {
                    sendViaResendHttp(toEmail, subject, body);
                    return;
                } catch (Exception e) {
                    logger.warn("Resend API failed: {}", e.getMessage());
                }
            }

            // 2. Try Brevo HTTPS API if API Key is configured
            if (brevoApiKey != null && !brevoApiKey.trim().isEmpty()) {
                try {
                    sendViaBrevoHttp(toEmail, subject, body);
                    return;
                } catch (Exception e) {
                    logger.warn("Brevo API failed: {}", e.getMessage());
                }
            }

            // 3. Fallback to JavaMailSender (Works on localhost & standard SMTP networks)
            try {
                if (mailSender != null) {
                    SimpleMailMessage message = new SimpleMailMessage();
                    message.setFrom(fromEmail);
                    message.setTo(toEmail);
                    message.setSubject(subject);
                    message.setText(body);
                    mailSender.send(message);
                    logger.info("Email sent successfully via SMTP to {}", toEmail);
                    return;
                }
            } catch (Exception e) {
                logger.warn("SMTP send failed (Render may block port 587): {}", e.getMessage());
            }

            // 4. Always log to console as guaranteed backup
            logger.info("----- EMAIL BACKUP CONSOLE LOG -----");
            logger.info("To: {}", toEmail);
            logger.info("Subject: {}", subject);
            logger.info("Body:\n{}", body);
            logger.info("------------------------------------");
        });
    }

    private void sendViaResendHttp(String toEmail, String subject, String body) throws Exception {
        String jsonPayload = String.format(
                "{\"from\":\"Anuradha Organics <onboarding@resend.dev>\",\"to\":[\"%s\"],\"subject\":\"%s\",\"text\":\"%s\"}",
                toEmail,
                escapeJson(subject),
                escapeJson(body)
        );

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.resend.com/emails"))
                .header("Authorization", "Bearer " + resendApiKey.trim())
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                .timeout(Duration.ofSeconds(10))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 200 && response.statusCode() < 300) {
            logger.info("Email successfully sent via Resend API to {}", toEmail);
        } else {
            throw new RuntimeException("Resend API returned status " + response.statusCode() + ": " + response.body());
        }
    }

    private void sendViaBrevoHttp(String toEmail, String subject, String body) throws Exception {
        String jsonPayload = String.format(
                "{\"sender\":{\"name\":\"Anuradha Organics\",\"email\":\"%s\"},\"to\":[{\"email\":\"%s\"}],\"subject\":\"%s\",\"textContent\":\"%s\"}",
                fromEmail,
                toEmail,
                escapeJson(subject),
                escapeJson(body)
        );

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.brevo.com/v3/smtp/email"))
                .header("api-key", brevoApiKey.trim())
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                .timeout(Duration.ofSeconds(10))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 200 && response.statusCode() < 300) {
            logger.info("Email successfully sent via Brevo API to {}", toEmail);
        } else {
            throw new RuntimeException("Brevo API returned status " + response.statusCode() + ": " + response.body());
        }
    }

    private String escapeJson(String input) {
        if (input == null) return "";
        return input.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "");
    }
}
