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


/*
 * This SQL script creates a table named 'quotes' with the following fields:
 * - id: an auto-incrementing primary key
 * - content: a text field to store the quote content
 * - author: a string to store the author's name
 * - created_at: a timestamp for when the quote was created
 */
CREATE TABLE quotes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    content TEXT NOT NULL,
    author VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


/* * This SQL script creates a table named 'posts' with the following fields:
 * - post_id: an auto-incrementing primary key
 * - title: a string for the post title
 * - description: a string for the post description
 * - content: a text field for the post content
 * - cover_image: a string for the cover image URL
 * - slug: a string for the post slug (URL-friendly identifier)
 * - author_id: an integer foreign key referencing the user who authored the post
 * - is_pulished: a boolean to indicate if the post is published
 * - created_at: a timestamp for when the post was created
 * - updated_at: a timestamp for when the post was last updated
 * - deleted_at: a timestamp for soft deletion of the post
 */
DROP TABLE IF EXISTS posts;
CREATE TABLE `posts` (
  `post_id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` varchar(1000) DEFAULT NULL,
  `content` text NOT NULL,
  `cover_image` varchar(255) DEFAULT NULL,
  `slug` varchar(255) DEFAULT NULL,
  `author_id` int(11) DEFAULT NULL,
  `post_status` enum('DRAFT','PUBLISH','ARCHIVED','DELETED') NOT NULL DEFAULT 'DRAFT' COMMENT 'ENUM(''DRAFT'', ''PUBLISH'', ''ARCHIVED'', ''DELETED'' )',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`post_id`),
  KEY `FK_AUTHOR` (`author_id`),
  CONSTRAINT `FK_AUTHOR` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- This SQL script creates a table named 'tags' to categorize posts with the following fields:
-- - tag_id: an auto-incrementing primary key
-- - name: a unique string for the tag name
-- - created_at: a timestamp for when the tag was created
DROP TABLE IF EXISTS tags;
CREATE TABLE tags (
    tag_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- This SQL script creates a junction table named 'post_tags' to establish a many-to-many relationship between posts and tags.
DROP TABLE IF EXISTS post_tags;
CREATE TABLE post_tags (
    post_id INT NOT NULL,
    tag_id INT NOT NULL,

    PRIMARY KEY (post_id, tag_id),

    FOREIGN KEY (post_id) REFERENCES posts(post_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    
    FOREIGN KEY (tag_id) REFERENCES tags(tag_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- This SQL script creates a table named 'attachments' to store attachments related to posts.
-- Fields:
-- - attachment_id: an auto-incrementing primary key
-- - post_id: an integer foreign key referencing the post
-- - file_name: the name of the file
-- - file_url: the URL or path to the file
-- - file_type: the mime type of attachments
-- - created_at: a timestamp for when the attachment was added

DROP TABLE IF EXISTS attachments;
CREATE TABLE attachments (
    attachment_id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(post_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);