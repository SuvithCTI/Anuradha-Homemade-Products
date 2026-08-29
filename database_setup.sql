-- ====================================================================
-- Anuradha Homemade Organics - Complete Database Setup Script
-- MySQL Workbench 8.0+
-- ====================================================================

-- 1. Create the Database
CREATE DATABASE IF NOT EXISTS anuradha_organics
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE anuradha_organics;

-- 2. Users Table (Stores user accounts, passwords, roles, verification status)
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NULL,
    auth_provider VARCHAR(20) NOT NULL DEFAULT 'LOCAL', -- 'LOCAL' or 'GOOGLE'
    google_id VARCHAR(100) NULL,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    role VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER',       -- 'CUSTOMER' or 'ADMIN'
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. Login History & Logs Table (Tracks all successful and failed logins)
CREATE TABLE IF NOT EXISTS login_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NULL,
    email VARCHAR(100) NOT NULL,
    login_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    login_status VARCHAR(20) NOT NULL,   -- 'SUCCESS', 'FAILED', 'FAILED_UNVERIFIED', etc.
    auth_provider VARCHAR(20) NOT NULL DEFAULT 'LOCAL', -- 'LOCAL' or 'GOOGLE'
    ip_address VARCHAR(50) NULL,
    CONSTRAINT fk_login_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE SET NULL
);

-- 4. Customer Enquiries Table (Contact Form Inquiries)
CREATE TABLE IF NOT EXISTS enquiries (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100) NULL,
    message TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'NEW', -- 'NEW', 'IN_PROGRESS', 'RESOLVED'
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Customer Feedbacks & Reviews Table
CREATE TABLE IF NOT EXISTS feedbacks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NULL,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(100) DEFAULT 'Verified Buyer',
    rating INT NOT NULL DEFAULT 5, -- 1 to 5 stars
    comment TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_feedback_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE SET NULL
);

-- 6. Newsletter Subscriptions Table
CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    subscribed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. Email Verification Tokens Table
CREATE TABLE IF NOT EXISTS verification_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    token VARCHAR(100) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_verification_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE
);

-- 8. Password Reset Tokens Table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    token VARCHAR(100) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_password_reset_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE
);

-- ====================================================================
-- HELPFUL QUERIES TO VIEW DATA IN MYSQL WORKBENCH:
-- ====================================================================

-- 1. View all Registered Users:
-- SELECT id, first_name, last_name, email, auth_provider, email_verified, role, created_at FROM users ORDER BY created_at DESC;

-- 2. View all User Login Activity / Logs:
-- SELECT * FROM login_logs ORDER BY login_time DESC;

-- 3. View all Contact Enquiries:
-- SELECT * FROM enquiries ORDER BY created_at DESC;

-- 4. View all Customer Feedbacks & Ratings:
-- SELECT * FROM feedbacks ORDER BY created_at DESC;

-- 5. View all Newsletter Subscribers:
-- SELECT * FROM newsletter_subscriptions ORDER BY subscribed_at DESC;
