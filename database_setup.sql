-- ====================================================================
-- Anuradha Homemade Organics - Complete Database Setup Script
-- Compatible with MySQL Workbench / MySQL 8.0+
-- ====================================================================

-- 1. Create the Database
CREATE DATABASE IF NOT EXISTS anuradha_organics
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE anuradha_organics;

-- 2. Create Users Table (Stores user accounts, login credentials, Google OAuth data)
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

-- 3. Create Email Verification Tokens Table
CREATE TABLE IF NOT EXISTS verification_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    token VARCHAR(100) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_verification_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Create Password Reset Tokens Table
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
-- Helpful Queries to View User Data:
-- ====================================================================
-- View all registered users:
-- SELECT id, first_name, last_name, email, auth_provider, email_verified, role, created_at FROM users;

-- View all active verification tokens with user details:
-- SELECT v.id, v.token, u.email, v.expires_at, v.created_at 
-- FROM verification_tokens v 
-- JOIN users u ON v.user_id = u.id;

-- View all password reset requests:
-- SELECT p.id, p.token, u.email, p.expires_at, p.created_at 
-- FROM password_reset_tokens p 
-- JOIN users u ON p.user_id = u.id;
