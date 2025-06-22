<?php

use Api\Constants\PostStatus;

require_once 'constants/PostStatus.php';
require_once 'utilities/PostUtility.php';
require_once 'connect_db.php';
require_once 'entities/Post.php';
require_once 'entities/Tag.php';
require_once 'entities/Attachment.php';
require_once 'services/FileService.php';
require_once 'utilities/Logger.php';
require_once 'utilities/HttpUtility.php';
require_once 'utilities/ConfigUtility.php';

$logger = Logger::getInstance();

header('Content-Type: application/json');

$connection = getMariaDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

function generateSlug($title) {
    // Generate a URL-friendly slug from the title
    $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $title)));
    return $slug;
}

function getPostTags($connection, $post_id) {
    $stmt = $connection->prepare("SELECT t.tag_id, t.name, t.created_at FROM post_tags pt JOIN tags t ON pt.tag_id = t.tag_id WHERE pt.post_id = ?");
    $stmt->bind_param("i", $post_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $tags = [];
    while ($row = $result->fetch_assoc()) {
        $tags[] = new Tag($row);
    }
    return $tags;
}

function getPostAttachments($connection, $post_id) {
    $stmt = $connection->prepare("SELECT attachment_id, post_id, file_name, file_url, file_type, created_at FROM attachments WHERE post_id = ?");
    $stmt->bind_param("i", $post_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $attachments = [];
    while ($row = $result->fetch_assoc()) {
        $attachments[] = new Attachment($row);
    }
    return $attachments;
}

function getPostById($connection, $post_id) {
    $stmt = $connection->prepare("SELECT * FROM posts WHERE post_id = ? AND deleted_at IS NULL");
    $stmt->bind_param("i", $post_id);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->num_rows === 0) {
        return null;
    }
    $post = $result->fetch_assoc();
    return new Post($post);
}

function getPostBySlug($connection, $slug) {
    $stmt = $connection->prepare("SELECT * FROM posts WHERE slug = ? AND deleted_at IS NULL");
    $stmt->bind_param("s", $slug);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->num_rows === 0) {
        return null;
    }
    $post = $result->fetch_assoc();
    return new Post($post);
}


switch ($method) {
    case 'GET':
        if (isset($_GET['id']) || isset($_GET['slug'])) {
            $post = [];
            if(isset($_GET['slug'])) {
                $slug = $_GET['slug'];
                $post = getPostBySlug($connection, $slug);
            }else if (isset($_GET['id'])) {
                $post_id = intval($_GET['id']);
                $post = getPostById($connection, $post_id);
            }
         
            if (!$post) {
                respond_to_client(404, "Post not found");
                exit;
            }

            $post->tags = getPostTags($connection, $post->post_id);
            $post->attachments = getPostAttachments($connection, $post->post_id);
            echo json_encode(new Post($post));
        } else {
            // Paging parameters
            $default_page_start = ConfigUtility::get("defaultPageStart", 1);
            $default_page_size = ConfigUtility::get("defaultPageSize", 10);
            $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : $default_page_start;
            $limit = isset($_GET['limit']) ? max(1, intval($_GET['limit'])) : $default_page_size;
            $offset = ($page - 1) * $limit;

            // Filtering
            $where = ["deleted_at IS NULL"];
            
            $params = [];
            $types = '';

            if (isset($_GET['author_id'])) {
                $where[] = "author_id = ?";
                $params[] = intval($_GET['author_id']);
                $types .= 'i';
            }
            if (isset($_GET['tag'])) {
                // Filter by tag name
                $where[] = "post_id IN (SELECT pt.post_id FROM post_tags pt JOIN tags t ON pt.tag_id = t.tag_id WHERE t.name = ?)";
                $params[] = $_GET['tag'];
                $types .= 's';
            }
            if (isset($_GET['search'])) {
                $where[] = "(title LIKE ? OR content LIKE ?)";
                $search = '%' . $_GET['search'] . '%';
                $params[] = $search;
                $params[] = $search;
                $types .= 'ss';
            }

            $where_sql = implode(' AND ', $where);
            $select_columns = implode(",", Post::$SELECT_COLUMNS);

            // Add sort support
            $order_by = "created_at DESC"; 
            if (isset($_GET['sort']) && strtolower($_GET['sort']) === 'oldest') {
                $order_by = "created_at ASC";
            }

            $sql = "SELECT $select_columns FROM posts WHERE $where_sql ORDER BY $order_by LIMIT ? OFFSET ?";
            $params[] = $limit;
            $params[] = $offset;
            $types .= 'ii';

            $stmt = $connection->prepare($sql);
            $stmt->bind_param($types, ...$params);
            $stmt->execute();
            $result = $stmt->get_result();

            $posts = [];
            while ($row = $result->fetch_assoc()) {
                $row['tags'] = getPostTags($connection, $row['post_id']);
                $row['attachments'] = getPostAttachments($connection, $row['post_id']);
                $posts[] = new Post($row);
            }

            // Optionally, return total count for pagination
            $count_sql = "SELECT COUNT(*) as total FROM posts WHERE $where_sql";
            $count_stmt = $connection->prepare($count_sql);
            $logger->debug("[getPosts] type: ".$types);
            $logger->debug("[getPosts] params: ".implode(",", $params));
            
            if ($types !== '') {
                // Remove last two 'i' for limit/offset
                $count_types = substr($types, 0, -2);
                if($count_types !== ''){
                    $count_stmt->bind_param($count_types, ...array_slice($params, 0, -2));
                }
            }
            $count_stmt->execute();
            $count_result = $count_stmt->get_result();
            $total = $count_result->fetch_assoc()['total'];

            echo json_encode([
                "data" => $posts,
                "paging" => [
                    "page" => $page,
                    "limit" => $limit,
                    "total" => intval($total),
                    "pages" => ceil($total / $limit)
                ]
            ]);
        }
        break;
    case 'POST':
        // Create a new post
        $data = json_decode(file_get_contents('php://input'), true);
        if (!isset($data['title'], $data['content'])) {
            http_response_code(400);
            echo json_encode(["error" => "Missing required fields"]);
            exit;
        }
        $title = $data['title'];
        $description = $data['description'] ?? null;
        $content = $data['content'];
        $cover_image = $data['cover_image'] ?? null;
        $author_id = $data['author_id'] ?? 1;
        $post_status_str = $data['post_status'] ?? 'DRAFT';
        $reading_time = $data['reading_time'] ?? 0;

        $post_status = null;
        try {
            $post_status = PostStatus::getStatusForNewPost($post_status_str);
        } catch (\InvalidArgumentException $ex) {
            respond_to_client(422, "Invalid post status: $post_status_str");
            exit;
        }
    
        // Validation for create post
        $errors = [];
        if (empty($data['title']) || strlen($data['title']) > 255) {
            $errors[] = "Title is required and must be less than 255 characters.";
        }
        if (isset($data['description']) && strlen($data['description']) > 1000) {
            $errors[] = "Description must be less than 1000 characters.";
        }
        if (empty($data['content'])) {
            $errors[] = "Content is required.";
        }

        if (isset($data['tags']) && is_array($data['tags'])) {
            foreach ($data['tags'] as $tag_name) {
                if (empty($tag_name) || strlen($tag_name) > 50) {
                    $errors[] = "Each tag name must be non-empty and less than 50 characters.";
                    break;
                }
            }
        }
        $has_attachments = isset($data['attachments']) && is_array($data['attachments']) && count($data['attachments']) > 0;
        if ($has_attachments) {
            foreach ($data['attachments'] as $att) {
                if (empty($att['file_name']) || strlen($att['file_name']) > 255) {
                    $errors[] = "Attachment file name must be non-empty and less than 255 characters.";
                    break;
                }
                if (empty($att['file_url']) || strlen($att['file_url']) > 500) {
                    $errors[] = "Attachment file URL must be non-empty and less than 500 characters.";
                    break;
                }
                if (empty($att['file_type']) || strlen($att['file_type']) > 50) {
                    $errors[] = "Attachment file type must be non-empty and less than 50 characters.";
                    break;
                }
            }
        }
        if (!empty($errors)) {
            respond_to_client(422, "Validation errors", null, $errors);
            exit;
        }
        
        if($has_attachments){   
            // Move files from temp to upload directory
            $filenames = [];
            foreach ($data['attachments'] as $att) {
                if (isset($att['file_name'])) {
                    $filenames[] = basename($att['file_name']);
                }
            }
            if (!empty($filenames)) {
                
                $move_result = FileService::moveFilesToUpload($filenames);
                if (!$move_result) {
                    $logger->error("Failed to move files: " . json_encode($filenames));
                    respond_to_client(500, "Failed to move files from temp to upload directory");
                    exit;
                }                

            }  
        }
        
        $slug = generateSlug($title);
        if($has_attachments){
            $content = PostUtility::replaceText($content, PostUtility::$FILE_IS_TEMP_SEARCHING_TEXT, 'isTemp=false');
        }

        if(!PostUtility::isNullOrEmptyString($cover_image)){
            $logger->info("Cover image provided: $cover_image");
            $cover_image_filename = PostUtility::extractFileNameFromUrl($cover_image);
            $move_result = FileService::moveFilesToUpload([$cover_image_filename]);
            if (!$move_result) {
                $logger->error("Failed to move cover image: $cover_image_filename");
                respond_to_client(500, "Failed to move cover image from temp to upload directory");
                exit;
            }
            $cover_image = PostUtility::replaceText($cover_image, PostUtility::$FILE_IS_TEMP_SEARCHING_TEXT, 'isTemp=false');
        }
        

        $stmt = $connection->prepare("INSERT INTO posts (title, description, content, cover_image, slug, author_id, post_status, reading_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $post_status_str = $post_status->toString();
        $stmt->bind_param("sssssssi", $title, $description, $content, $cover_image, $slug, $author_id, $post_status_str, $reading_time);
        if ($stmt->execute()) {
            $post_id = $stmt->insert_id;
            // Handle tags
            if (!empty($data['tags']) && is_array($data['tags'])) {
                foreach ($data['tags'] as $tag_name) {
                    // Insert tag if not exists
                    $tag_stmt = $connection->prepare("INSERT IGNORE INTO tags (name) VALUES (?)");
                    $tag_stmt->bind_param("s", $tag_name);
                    $tag_stmt->execute();
                    // Get tag_id
                    $tag_id_stmt = $connection->prepare("SELECT tag_id FROM tags WHERE name = ?");
                    $tag_id_stmt->bind_param("s", $tag_name);
                    $tag_id_stmt->execute();
                    $tag_id_result = $tag_id_stmt->get_result();
                    if ($tag_row = $tag_id_result->fetch_assoc()) {
                        $tag_id = $tag_row['tag_id'];
                        $pt_stmt = $connection->prepare("INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)");
                        $pt_stmt->bind_param("ii", $post_id, $tag_id);
                        $pt_stmt->execute();
                    }
                }
            }
            // Handle attachments
            if ($has_attachments) {
                foreach ($data['attachments'] as $att) {
                    if (isset($att['file_name'], $att['file_url'], $att['file_type'])) {
                        $new_file_url = PostUtility::replaceText($att['file_url'], PostUtility::$FILE_IS_TEMP_SEARCHING_TEXT, 'isTemp=false');
                        $att_stmt = $connection->prepare("INSERT INTO attachments (post_id, file_name, file_url, file_type) VALUES (?, ?, ?, ?)");
                        $att_stmt->bind_param("isss", $post_id, $att['file_name'], $new_file_url, $att['file_type']);
                        $att_stmt->execute();
                    }
                }
            }

            // Get newly created post with tags and attachments
            $new_post = getPostById($connection, $post_id);
            if (!$new_post) {
                $logger->error("Failed to retrieve newly created post with ID: $post_id");
                respond_to_client(500, "Failed to retrieve newly created post");
                exit;
            }
            echo json_encode(["message" => "Post created", "Post" => $new_post]);
        } else {
            $logger->error("Failed to create post: " . $stmt->error);
            respond_to_client(500, "Failed to create post");
            exit;
        }
        break;
    case 'PUT':
        // Update a post
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(["error" => "Missing post id"]);
            exit;
        }
        $post_id = intval($_GET['id']);
        $data = json_decode(file_get_contents('php://input'), true);
        $fields = [];
        $params = [];
        $types = '';
        // Only update provided fields
        foreach ([
            'title' => 's',
            'description' => 's',
            'content' => 's',
            'cover_image' => 's',
            'slug' => 's',
            'author_id' => 'i',
            'post_status' => 's'
        ] as $field => $type) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $params[] = $data[$field];
                $types .= $type;
            }
        }
        if (empty($fields)) {
            http_response_code(400);
            echo json_encode(["error" => "No fields to update"]);
            exit;
        }
        $params[] = $post_id;
        $types .= 'i';
        $sql = "UPDATE posts SET ".implode(", ", $fields).", updated_at = CURRENT_TIMESTAMP WHERE post_id = ? AND deleted_at IS NULL";
        $stmt = $connection->prepare($sql);
        $stmt->bind_param($types, ...$params);
        if ($stmt->execute()) {
            // Validation for update post
            $errors = [];
            if (isset($data['title']) && (empty($data['title']) || strlen($data['title']) > 255)) {
                $errors[] = "Title must be non-empty and less than 255 characters.";
            }
            if (isset($data['description']) && strlen($data['description']) > 1000) {
                $errors[] = "Description must be less than 1000 characters.";
            }
            if (isset($data['content']) && empty($data['content'])) {
                $errors[] = "Content must be non-empty if provided.";
            }
            if (isset($data['cover_image']) && strlen($data['cover_image']) > 255) {
                $errors[] = "Cover image URL must be less than 255 characters.";
            }
            if (isset($data['slug']) && strlen($data['slug']) > 255) {
                $errors[] = "Slug must be less than 255 characters.";
            }
            if (isset($data['author_id']) && !is_numeric($data['author_id'])) {
                $errors[] = "Author ID must be numeric if provided.";
            }
            if (isset($data['tags']) && is_array($data['tags'])) {
                foreach ($data['tags'] as $tag_name) {
                    if (empty($tag_name) || strlen($tag_name) > 50) {
                        $errors[] = "Each tag name must be non-empty and less than 50 characters.";
                        break;
                    }
                }
            }
            if (isset($data['attachments']) && is_array($data['attachments'])) {
                foreach ($data['attachments'] as $att) {
                    if (empty($att['file_name']) || strlen($att['file_name']) > 255) {
                        $errors[] = "Attachment file name must be non-empty and less than 255 characters.";
                        break;
                    }
                    if (empty($att['file_url']) || strlen($att['file_url']) > 500) {
                        $errors[] = "Attachment file URL must be non-empty and less than 500 characters.";
                        break;
                    }
                    if (empty($att['file_type']) || strlen($att['file_type']) > 50) {
                        $errors[] = "Attachment file type must be non-empty and less than 50 characters.";
                        break;
                    }
                }
            }
            if (!empty($errors)) {
                http_response_code(422);
                echo json_encode(["errors" => $errors]);
                exit;
            }
            // Update tags
            if (isset($data['tags']) && is_array($data['tags'])) {
                // Remove old tags
                $connection->query("DELETE FROM post_tags WHERE post_id = $post_id");
                foreach ($data['tags'] as $tag_name) {
                    $tag_stmt = $connection->prepare("INSERT IGNORE INTO tags (name) VALUES (?)");
                    $tag_stmt->bind_param("s", $tag_name);
                    $tag_stmt->execute();
                    $tag_id_stmt = $connection->prepare("SELECT tag_id FROM tags WHERE name = ?");
                    $tag_id_stmt->bind_param("s", $tag_name);
                    $tag_id_stmt->execute();
                    $tag_id_result = $tag_id_stmt->get_result();
                    if ($tag_row = $tag_id_result->fetch_assoc()) {
                        $tag_id = $tag_row['tag_id'];
                        $pt_stmt = $connection->prepare("INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)");
                        $pt_stmt->bind_param("ii", $post_id, $tag_id);
                        $pt_stmt->execute();
                    }
                }
            }
            // Update attachments
            if (isset($data['attachments']) && is_array($data['attachments'])) {
                $connection->query("DELETE FROM attachments WHERE post_id = $post_id");
                foreach ($data['attachments'] as $att) {
                    if (isset($att['file_name'], $att['file_url'], $att['file_type'])) {
                        $att_stmt = $connection->prepare("INSERT INTO attachments (post_id, file_name, file_url, file_type) VALUES (?, ?, ?, ?)");
                        $att_stmt->bind_param("isss", $post_id, $att['file_name'], $att['file_url'], $att['file_type']);
                        $att_stmt->execute();
                    }
                }
            }
            echo json_encode(["message" => "Post updated"]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => "Failed to update post"]);
        }
        break;
    case 'DELETE':
        // Delete a post: soft delete by default, hard delete if isHard=true
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(["error" => "Missing post id"]);
            exit;
        }
        $post_id = intval($_GET['id']);
        $is_hard = isset($_GET['isHard']) && ($_GET['isHard'] === 'true' || $_GET['isHard'] === '1');

        if ($is_hard) {
            // Hard delete: remove post, tags relation, attachments
            $connection->begin_transaction();
            try {
                // Delete attachments
                $stmt1 = $connection->prepare("DELETE FROM attachments WHERE post_id = ?");
                $stmt1->bind_param("i", $post_id);
                $stmt1->execute();

                // Delete post_tags
                $stmt2 = $connection->prepare("DELETE FROM post_tags WHERE post_id = ?");
                $stmt2->bind_param("i", $post_id);
                $stmt2->execute();

                // Delete post
                $stmt3 = $connection->prepare("DELETE FROM posts WHERE post_id = ?");
                $stmt3->bind_param("i", $post_id);
                $stmt3->execute();

                $connection->commit();
                echo json_encode(["message" => "Post hard deleted"]);
            } catch (Exception $e) {
                $connection->rollback();
                http_response_code(500);
                echo json_encode(["error" => "Failed to hard delete post"]);
            }
        } else {
            // Soft delete
            $stmt = $connection->prepare("UPDATE posts SET deleted_at = CURRENT_TIMESTAMP WHERE post_id = ? AND deleted_at IS NULL");
            $stmt->bind_param("i", $post_id);
            if ($stmt->execute()) {
                echo json_encode(["message" => "Post soft deleted"]);
            } else {
                http_response_code(500);
                echo json_encode(["error" => "Failed to delete post"]);
            }
        }
        break;
    default:
        http_response_code(405);
        echo json_encode(["error" => "Method not allowed"]);
        break;
}
