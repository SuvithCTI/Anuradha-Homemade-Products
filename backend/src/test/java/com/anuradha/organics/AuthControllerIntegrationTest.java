package com.anuradha.organics;

import com.anuradha.organics.dto.LoginRequest;
import com.anuradha.organics.dto.ResetPasswordRequest;
import com.anuradha.organics.dto.SignupRequest;
import com.anuradha.organics.entity.AuthProvider;
import com.anuradha.organics.entity.PasswordResetToken;
import com.anuradha.organics.entity.Role;
import com.anuradha.organics.entity.User;
import com.anuradha.organics.entity.VerificationToken;
import com.anuradha.organics.repository.PasswordResetTokenRepository;
import com.anuradha.organics.repository.UserRepository;
import com.anuradha.organics.repository.VerificationTokenRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import static org.hamcrest.Matchers.containsString;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VerificationTokenRepository verificationTokenRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    public void setup() {
        passwordResetTokenRepository.deleteAll();
        verificationTokenRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    public void testSignupSuccess() throws Exception {
        SignupRequest signupRequest = new SignupRequest();
        signupRequest.setFirstName("Test");
        signupRequest.setLastName("Customer");
        signupRequest.setEmail("test@example.com");
        signupRequest.setPassword("Password123");

        mockMvc.perform(post("/api/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(signupRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value(containsString("Account created successfully")));

        assertTrue(userRepository.existsByEmail("test@example.com"));
    }

    @Test
    public void testSignupDuplicateEmail() throws Exception {
        // Save an existing user
        User existingUser = new User();
        existingUser.setFirstName("Existing");
        existingUser.setLastName("User");
        existingUser.setEmail("existing@example.com");
        existingUser.setPassword(passwordEncoder.encode("Password123"));
        existingUser.setAuthProvider(AuthProvider.LOCAL);
        existingUser.setEmailVerified(true);
        existingUser.setRole(Role.CUSTOMER);
        userRepository.save(existingUser);

        SignupRequest signupRequest = new SignupRequest();
        signupRequest.setFirstName("New");
        signupRequest.setLastName("User");
        signupRequest.setEmail("existing@example.com"); // Duplicate
        signupRequest.setPassword("Password123");

        mockMvc.perform(post("/api/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(signupRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(containsString("already in use")));
    }

    @Test
    public void testLoginUnverifiedEmail() throws Exception {
        // Create unverified user
        User unverifiedUser = new User();
        unverifiedUser.setFirstName("Unverified");
        unverifiedUser.setLastName("User");
        unverifiedUser.setEmail("unverified@example.com");
        unverifiedUser.setPassword(passwordEncoder.encode("Password123"));
        unverifiedUser.setAuthProvider(AuthProvider.LOCAL);
        unverifiedUser.setEmailVerified(false); // Unverified
        unverifiedUser.setRole(Role.CUSTOMER);
        userRepository.save(unverifiedUser);

        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("unverified@example.com");
        loginRequest.setPassword("Password123");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(containsString("verify your email")));
    }

    @Test
    public void testLoginSuccess() throws Exception {
        // Create verified user
        User verifiedUser = new User();
        verifiedUser.setFirstName("Verified");
        verifiedUser.setLastName("User");
        verifiedUser.setEmail("verified@example.com");
        verifiedUser.setPassword(passwordEncoder.encode("Password123"));
        verifiedUser.setAuthProvider(AuthProvider.LOCAL);
        verifiedUser.setEmailVerified(true); // Verified
        verifiedUser.setRole(Role.CUSTOMER);
        userRepository.save(verifiedUser);

        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("verified@example.com");
        loginRequest.setPassword("Password123");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(cookie().exists("token"))
                .andExpect(jsonPath("$.user.email").value("verified@example.com"));
    }

    @Test
    public void testVerifyEmail() throws Exception {
        User user = new User();
        user.setFirstName("Test");
        user.setLastName("Verify");
        user.setEmail("verify@example.com");
        user.setPassword(passwordEncoder.encode("Password123"));
        user.setAuthProvider(AuthProvider.LOCAL);
        user.setEmailVerified(false);
        user.setRole(Role.CUSTOMER);
        User savedUser = userRepository.save(user);

        String token = UUID.randomUUID().toString();
        VerificationToken verificationToken = new VerificationToken(token, savedUser, 60);
        verificationTokenRepository.save(verificationToken);

        mockMvc.perform(get("/api/auth/verify-email")
                .param("token", token))
                .andExpect(status().isFound()) // Redirect code 302
                .andExpect(redirectedUrl("http://localhost:8080/login.html?verified=true"));

        User updatedUser = userRepository.findByEmail("verify@example.com").orElse(null);
        assertTrue(updatedUser != null && updatedUser.getEmailVerified());
    }

    @Test
    public void testForgotPasswordAndResetPassword() throws Exception {
        User user = new User();
        user.setFirstName("Password");
        user.setLastName("Reset User");
        user.setEmail("reset@example.com");
        user.setPassword(passwordEncoder.encode("OldPassword123"));
        user.setAuthProvider(AuthProvider.LOCAL);
        user.setEmailVerified(true);
        user.setRole(Role.CUSTOMER);
        User savedUser = userRepository.save(user);

        // 1. Forgot password request
        Map<String, String> forgotReq = new HashMap<>();
        forgotReq.put("email", "reset@example.com");

        mockMvc.perform(post("/api/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(forgotReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        PasswordResetToken resetToken = passwordResetTokenRepository.findByUser(savedUser).orElse(null);
        assertTrue(resetToken != null);

        // 2. Reset password request
        ResetPasswordRequest resetReq = new ResetPasswordRequest();
        resetReq.setToken(resetToken.getToken());
        resetReq.setPassword("NewPassword123");
        resetReq.setConfirmPassword("NewPassword123");

        mockMvc.perform(post("/api/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(resetReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // 3. Verify login works with new password
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("reset@example.com");
        loginRequest.setPassword("NewPassword123");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
