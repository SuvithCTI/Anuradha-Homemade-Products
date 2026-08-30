package com.anuradha.organics.security;

import com.anuradha.organics.entity.AuthProvider;
import com.anuradha.organics.entity.Role;
import com.anuradha.organics.entity.User;
import com.anuradha.organics.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import java.io.IOException;
import java.util.Optional;

@Component
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private com.anuradha.organics.repository.LoginLogRepository loginLogRepository;

    @Value("${app.frontend.url:http://localhost:8080}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        
        String email = oAuth2User.getAttribute("email");
        String googleId = oAuth2User.getAttribute("sub"); // Unique identifier from Google

        if (email == null) {
            response.sendRedirect(frontendUrl + "/login.html?error=no_email");
            return;
        }

        // Retrieve Google Name parameters
        String firstName = oAuth2User.getAttribute("given_name");
        String lastName = oAuth2User.getAttribute("family_name");
        String name = oAuth2User.getAttribute("name");

        if (firstName == null || firstName.trim().isEmpty()) {
            if (name != null && !name.trim().isEmpty()) {
                String[] parts = name.trim().split(" ", 2);
                firstName = parts[0];
                lastName = parts.length > 1 ? parts[1] : "";
            } else {
                firstName = email.split("@")[0];
                lastName = "";
            }
        }
        if (lastName == null) {
            lastName = "";
        }

        Optional<User> userOptional = userRepository.findByEmail(email);
        User user;

        if (userOptional.isPresent()) {
            user = userOptional.get();
            // Link Google ID if not set
            if (user.getGoogleId() == null) {
                user.setGoogleId(googleId);
            }
            if (user.getAuthProvider() == AuthProvider.LOCAL) {
                user.setAuthProvider(AuthProvider.GOOGLE);
            }
            user.setEmailVerified(true); // Google email is pre-verified
            userRepository.save(user);
        } else {
            // Register new Google user
            user = new User();
            user.setEmail(email);
            user.setFirstName(firstName);
            user.setLastName(lastName);
            user.setGoogleId(googleId);
            user.setAuthProvider(AuthProvider.GOOGLE);
            user.setEmailVerified(true);
            user.setRole(Role.CUSTOMER);
            userRepository.save(user);
        }

        // Log successful Google login
        loginLogRepository.save(new com.anuradha.organics.entity.LoginLog(user.getId(), user.getEmail(), "SUCCESS", "GOOGLE", request.getRemoteAddr()));
        ResponseCookie jwtCookie = jwtUtils.generateJwtCookie(user.getEmail());
        
        // Add cookie to response header
        response.addHeader("Set-Cookie", jwtCookie.toString());

        // Redirect to home page with token
        String jwtToken = jwtUtils.generateTokenFromUsername(user.getEmail());
        String redirectUrl = frontendUrl;
        if (redirectUrl.equals("/") || redirectUrl.isEmpty()) {
            redirectUrl = "";
        }
        
        getRedirectStrategy().sendRedirect(request, response, redirectUrl + "/index.html?token=" + jwtToken);
    }
}
