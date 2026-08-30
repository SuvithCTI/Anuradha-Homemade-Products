package com.anuradha.organics.service;

import com.anuradha.organics.dto.LoginRequest;
import com.anuradha.organics.dto.SignupRequest;
import com.anuradha.organics.entity.AuthProvider;
import com.anuradha.organics.entity.PasswordResetToken;
import com.anuradha.organics.entity.Role;
import com.anuradha.organics.entity.User;
import com.anuradha.organics.entity.VerificationToken;
import com.anuradha.organics.repository.PasswordResetTokenRepository;
import com.anuradha.organics.repository.UserRepository;
import com.anuradha.organics.repository.VerificationTokenRepository;
import com.anuradha.organics.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VerificationTokenRepository verificationTokenRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;

    @Transactional
    public String registerUser(SignupRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already in use.");
        }

        // Create new user
        User user = new User();
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setAuthProvider(AuthProvider.LOCAL);
        user.setEmailVerified(false);
        user.setRole(Role.CUSTOMER);

        User savedUser = userRepository.save(user);

        // Generate verification token and send verification email
        String token = UUID.randomUUID().toString();
        VerificationToken verificationToken = new VerificationToken(token, savedUser, 1440);
        verificationTokenRepository.save(verificationToken);

        // Send verification email
        String fullName = savedUser.getFirstName() + " " + savedUser.getLastName();
        emailService.sendVerificationEmail(savedUser.getEmail(), fullName, token);

        return "Account created successfully! Please check your email to verify your account.";
    }

    @Autowired
    private com.anuradha.organics.repository.LoginLogRepository loginLogRepository;

    public User authenticateUser(LoginRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        if (userOpt.isEmpty()) {
            loginLogRepository.save(new com.anuradha.organics.entity.LoginLog(null, request.getEmail(), "FAILED", "LOCAL", null));
            throw new IllegalArgumentException("Invalid email or password.");
        }

        User user = userOpt.get();

        if (user.getAuthProvider() != AuthProvider.LOCAL) {
            loginLogRepository.save(new com.anuradha.organics.entity.LoginLog(user.getId(), request.getEmail(), "FAILED_GOOGLE_ACC", "LOCAL", null));
            throw new IllegalArgumentException("This account is registered via Google. Please sign in with Google.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            loginLogRepository.save(new com.anuradha.organics.entity.LoginLog(user.getId(), request.getEmail(), "FAILED_BAD_PASSWORD", "LOCAL", null));
            throw new IllegalArgumentException("Invalid email or password.");
        }

        if (!user.getEmailVerified()) {
            loginLogRepository.save(new com.anuradha.organics.entity.LoginLog(user.getId(), request.getEmail(), "FAILED_UNVERIFIED", "LOCAL", null));
            throw new IllegalArgumentException("Please verify your email before signing in. Check your inbox for the verification link.");
        }

        // Record successful login
        loginLogRepository.save(new com.anuradha.organics.entity.LoginLog(user.getId(), user.getEmail(), "SUCCESS", "LOCAL", null));

        // Manually place in security context
        UserDetails userDetails = new UserDetailsImpl(user);
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(authentication);

        return user;
    }

    @Transactional
    public String verifyEmail(String token) {
        VerificationToken verificationToken = verificationTokenRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid verification token."));

        if (verificationToken.isExpired()) {
            throw new IllegalArgumentException("Verification token has expired. Please request a new one.");
        }

        User user = verificationToken.getUser();
        user.setEmailVerified(true);
        userRepository.save(user);

        // Delete the token
        verificationTokenRepository.delete(verificationToken);

        return "Email verified successfully. You can now sign in.";
    }

    @Transactional
    public User verifyEmailAndGetUser(String token) {
        if (token != null) {
            token = token.trim();
        }

        Optional<VerificationToken> tokenOpt = verificationTokenRepository.findByToken(token);
        if (tokenOpt.isPresent()) {
            VerificationToken verificationToken = tokenOpt.get();
            if (verificationToken.isExpired()) {
                throw new IllegalArgumentException("Verification link has expired. Please request a new one.");
            }

            User user = verificationToken.getUser();
            user.setEmailVerified(true);
            User savedUser = userRepository.save(user);

            // Record login log
            loginLogRepository.save(new com.anuradha.organics.entity.LoginLog(savedUser.getId(), savedUser.getEmail(), "SUCCESS_EMAIL_VERIFIED", "LOCAL", null));

            return savedUser;
        }

        throw new IllegalArgumentException("Verification link is invalid or has already been used. Please sign in.");
    }

    @Transactional
    public String instantVerifyUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("No account found with this email."));
        user.setEmailVerified(true);
        userRepository.save(user);
        return "Account activated successfully!";
    }

    @Transactional
    public String resendVerificationEmail(String email) {
        Optional<User> userOptional = userRepository.findByEmail(email);
        
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            if (user.getEmailVerified()) {
                throw new IllegalArgumentException("This email is already verified.");
            }
            if (user.getAuthProvider() != AuthProvider.LOCAL) {
                throw new IllegalArgumentException("This email is registered via Google.");
            }

            // Remove existing tokens for the user if any
            Optional<VerificationToken> existingToken = verificationTokenRepository.findByUser(user);
            existingToken.ifPresent(token -> verificationTokenRepository.delete(token));

            // Generate new verification token
            String token = UUID.randomUUID().toString();
            VerificationToken verificationToken = new VerificationToken(token, user, 1440);
            verificationTokenRepository.save(verificationToken);

            // Send verification email
            String fullName = user.getFirstName() + " " + user.getLastName();
            emailService.sendVerificationEmail(user.getEmail(), fullName, token);
            return "A new verification link has been sent to your email!";
        }

        throw new IllegalArgumentException("No account found with this email address.");
    }

    @Transactional
    public String forgotPassword(String email) {
        Optional<User> userOptional = userRepository.findByEmail(email);

        if (userOptional.isPresent()) {
            User user = userOptional.get();
            // Only local accounts can reset password
            if (user.getAuthProvider() == AuthProvider.LOCAL) {
                // Delete existing reset tokens if any
                Optional<PasswordResetToken> existingToken = passwordResetTokenRepository.findByUser(user);
                existingToken.ifPresent(token -> passwordResetTokenRepository.delete(token));

                // Generate reset token (expires in 60 minutes)
                String token = UUID.randomUUID().toString();
                PasswordResetToken resetToken = new PasswordResetToken(token, user, 60);
                passwordResetTokenRepository.save(resetToken);

                // Send email
                String fullName = user.getFirstName() + " " + user.getLastName();
                emailService.sendPasswordResetEmail(user.getEmail(), fullName, token);
            }
        }

        // Generic response
        return "If an account exists with this email, a password reset link has been sent.";
    }

    @Transactional
    public String resetPassword(String token, String password, String confirmPassword) {
        if (!password.equals(confirmPassword)) {
            throw new IllegalArgumentException("Passwords do not match.");
        }

        if (password.length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters long.");
        }

        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired password reset link."));

        if (resetToken.isExpired()) {
            passwordResetTokenRepository.delete(resetToken);
            throw new IllegalArgumentException("Password reset link has expired.");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(password));
        userRepository.save(user);

        // Delete the token after successful reset
        passwordResetTokenRepository.delete(resetToken);

        return "Password has been reset successfully. You can now login with your new password.";
    }

    public boolean isEmailVerified(String email) {
        return userRepository.findByEmail(email)
                .map(User::getEmailVerified)
                .orElse(false);
    }
}
