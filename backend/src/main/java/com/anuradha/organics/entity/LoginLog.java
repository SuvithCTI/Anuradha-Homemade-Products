package com.anuradha.organics.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "login_logs")
public class LoginLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(nullable = false, length = 100)
    private String email;

    @Column(name = "login_time", nullable = false)
    private LocalDateTime loginTime;

    @Column(name = "login_status", nullable = false, length = 50)
    private String loginStatus; // SUCCESS or FAILED

    @Column(name = "auth_provider", length = 20)
    private String authProvider; // LOCAL or GOOGLE

    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    @PrePersist
    protected void onCreate() {
        loginTime = LocalDateTime.now();
    }

    public LoginLog() {
    }

    public LoginLog(Long userId, String email, String loginStatus, String authProvider, String ipAddress) {
        this.userId = userId;
        this.email = email;
        this.loginStatus = loginStatus;
        this.authProvider = authProvider;
        this.ipAddress = ipAddress;
        this.loginTime = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public LocalDateTime getLoginTime() {
        return loginTime;
    }

    public void setLoginTime(LocalDateTime loginTime) {
        this.loginTime = loginTime;
    }

    public String getLoginStatus() {
        return loginStatus;
    }

    public void setLoginStatus(String loginStatus) {
        this.loginStatus = loginStatus;
    }

    public String getAuthProvider() {
        return authProvider;
    }

    public void setAuthProvider(String authProvider) {
        this.authProvider = authProvider;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }
}
