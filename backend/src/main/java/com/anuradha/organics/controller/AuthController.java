package com.anuradha.organics.controller;

import com.anuradha.organics.dto.AuthResponse;
import com.anuradha.organics.dto.LoginRequest;
import com.anuradha.organics.dto.ResetPasswordRequest;
import com.anuradha.organics.dto.SignupRequest;
import com.anuradha.organics.entity.User;
import com.anuradha.organics.security.JwtUtils;
import com.anuradha.organics.security.UserDetailsImpl;
import com.anuradha.organics.service.AuthService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private JwtUtils jwtUtils;

    @Value("${app.frontend.url:http://localhost:8080}")
    private String frontendUrl;

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> registerUser(@Valid @RequestBody SignupRequest request) {
        try {
            String message = authService.registerUser(request);
            return ResponseEntity.ok(new AuthResponse(true, message));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new AuthResponse(false, e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> authenticateUser(@Valid @RequestBody LoginRequest request) {
        try {
            User user = authService.authenticateUser(request);
            ResponseCookie jwtCookie = jwtUtils.generateJwtCookie(user.getEmail());

            AuthResponse.UserDto userDto = new AuthResponse.UserDto(
                    user.getId(),
                    user.getFirstName(),
                    user.getLastName(),
                    user.getEmail(),
                    user.getRole(),
                    user.getEmailVerified()
            );

            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, jwtCookie.toString())
                    .body(new AuthResponse(true, "Login successful.", userDto));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new AuthResponse(false, e.getMessage()));
        }
    }

    @GetMapping("/verify-email")
    public ResponseEntity<Void> verifyEmail(@RequestParam("token") String token, HttpServletResponse response) {
        String redirectUrl = frontendUrl;
        if (redirectUrl == null || redirectUrl.equals("/") || redirectUrl.isEmpty()) {
            redirectUrl = "https://anuradha-homemade-products.vercel.app";
        }
        
        try {
            User user = authService.verifyEmailAndGetUser(token);
            String jwt = "";
            try {
                jwt = jwtUtils.generateTokenFromUsername(user.getEmail());
                ResponseCookie cookie = jwtUtils.generateJwtCookie(user.getEmail());
                response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
            } catch (Exception ignored) {}

            String userName = (user != null && user.getFirstName() != null) ? user.getFirstName() : "Customer";
            String target = redirectUrl + "/index.html?verified=true&user=" + URLEncoder.encode(userName, StandardCharsets.UTF_8);
            if (jwt != null && !jwt.isEmpty()) {
                target += "&token=" + jwt;
            }

            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create(target))
                    .build();
        } catch (Exception e) {
            String errorMsg = URLEncoder.encode(e.getMessage() != null ? e.getMessage() : "Verification failed. Please sign in.", StandardCharsets.UTF_8);
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create(redirectUrl + "/login.html?error=" + errorMsg))
                    .build();
        }
    }

    @GetMapping("/check-verification")
    public ResponseEntity<Map<String, Boolean>> checkVerificationStatus(@RequestParam("email") String email) {
        boolean verified = authService.isEmailVerified(email);
        return ResponseEntity.ok(Map.of("verified", verified));
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<AuthResponse> resendVerificationEmail(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new AuthResponse(false, "Email is required."));
        }

        try {
            String message = authService.resendVerificationEmail(email);
            return ResponseEntity.ok(new AuthResponse(true, message));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new AuthResponse(false, e.getMessage()));
        }
    }

    @PostMapping("/instant-verify")
    public ResponseEntity<AuthResponse> instantVerify(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new AuthResponse(false, "Email is required."));
        }

        try {
            String message = authService.instantVerifyUser(email);
            return ResponseEntity.ok(new AuthResponse(true, message));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new AuthResponse(false, e.getMessage()));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<AuthResponse> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new AuthResponse(false, "Email is required."));
        }

        String message = authService.forgotPassword(email);
        return ResponseEntity.ok(new AuthResponse(true, message));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<AuthResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        try {
            String message = authService.resetPassword(
                    request.getToken(),
                    request.getPassword(),
                    request.getConfirmPassword()
            );
            return ResponseEntity.ok(new AuthResponse(true, message));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new AuthResponse(false, e.getMessage()));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<AuthResponse> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new AuthResponse(false, "Unauthorized: Please log in."));
        }

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User user = userDetails.getUser();

        if (!user.getEmailVerified()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new AuthResponse(false, "Unauthorized: Email not verified. Please verify your email."));
        }

        AuthResponse.UserDto userDto = new AuthResponse.UserDto(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getRole(),
                user.getEmailVerified()
        );

        return ResponseEntity.ok(new AuthResponse(true, "Current user retrieved.", userDto));
    }

    @PostMapping("/logout")
    public ResponseEntity<AuthResponse> logoutUser() {
        ResponseCookie cleanCookie = jwtUtils.getCleanJwtCookie();
        SecurityContextHolder.clearContext();
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cleanCookie.toString())
                .body(new AuthResponse(true, "Logged out successfully."));
    }
}
