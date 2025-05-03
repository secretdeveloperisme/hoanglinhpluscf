/*
 * 
 * This SQL script creates a table named 'users' with the following fields:
 * - id: an auto-incrementing primary key
 * - username: a unique string for the user's name
 * - email: a unique string for the user's email address
 * - password: a hashed string for the user's password
 * - role: a string to define the user's role (e.g., ADMIN, USER, etc.)
 * - created_at: a timestamp for when the user was created
 * - updated_at: a timestamp for when the user was last updated
 */
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'USER') DEFAULT 'USER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
