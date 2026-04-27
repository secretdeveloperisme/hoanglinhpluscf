<?php

use Api\Constants\PostStatus;

require_once __DIR__.'/constants/PostStatus.php';
require_once __DIR__.'/utilities/PostUtility.php';
require_once __DIR__.'/connect_db.php';
require_once __DIR__.'/entities/Post.php';
require_once __DIR__.'/entities/Tag.php';
require_once __DIR__.'/entities/Attachment.php';
require_once __DIR__.'/services/FileService.php';
require_once __DIR__.'/services/PostService.php';
require_once __DIR__.'/utilities/Logger.php';
require_once __DIR__.'/utilities/FileUtility.php';
require_once __DIR__.'/utilities/CommonUtility.php';
require_once __DIR__.'/utilities/HttpUtility.php';
require_once __DIR__.'/utilities/ConfigUtility.php';
require_once __DIR__.'/utilities/JWTUtility.php';

$logger = Logger::getInstance();

header('Content-Type: application/json');

$connection = getMariaDBConnection();
$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action'])?$_GET['action']:'default';
$method_action = strtoupper($method.'_'.$action);


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
    $stmt = $connection->prepare("SELECT * FROM posts WHERE post_id = ?");
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


function isTagsChanged($connection, $post_id, $new_tags) {
    if (!is_array($new_tags)) return true;
    $existing_tags = getPostTags($connection, $post_id);
    if (count($existing_tags) !== count($new_tags)) return true;

    $existing_tag_names = array_column(array_map(function($tag) {
        return ['name' => $tag->name];
    }, $existing_tags), 'name');

    if (array_diff($existing_tag_names, $new_tags) || array_diff($new_tags, $existing_tag_names)) {
        return true;
    }
    return false;
}


function checkUserAuthentication($user, $method_action) {
    if ($method_action === 'GET_DEFAULT') {
        return true;
    }
    if ($user == null) {
        return false;
    }
    return true;
}

function checkOwnerPermission($user, $post) {
    if ($user->id !== $post->author_id) {
        respond_to_client(403, "You are not the owner of this post");
        exit;
    }
}
$user = CommonUtility::getUserFromTokenCookie();

$logger->debug("User from token cookie: ".json_encode($user));

if(!checkUserAuthentication($user, $method_action)) {
    respond_to_client(401, "Unauthenticated: Please login to access this resource");
    exit;
}


switch ($method_action) {
    case 'GET_DEFAULT': // GET METHOD
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
            respond_to_client(200, "Post fetched successfully", new Post($post));
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

            respond_to_client(200, "Posts fetched successfully", [
                "posts" => $posts,
                "paging" => [
                    "page" => $page,
                    "limit" => $limit,
                    "total" => intval($total),
                    "pages" => ceil($total / $limit)
                ]
            ]);
        }
        break;
    case 'POST_DEFAULT': // POST_METHOD
        // Create a new post
        $data = json_decode(file_get_contents('php://input'), true);
        if (!isset($data['title'], $data['content'])) {
            respond_to_client(400, "Missing required fields");
            exit;
        }
        $title = $data['title'];
        $description = $data['description'] ?? null;
        $content = $data['content'];
        $cover_image = $data['cover_image'] ?? null;
        $author_id = $user->id;
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
        if (CommonUtility::isNullOrEmptyString($data['title']) || strlen($data['title']) > 255) {
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

        $slug = PostUtility::generateSlug($title);
        if($has_attachments){
            $content = PostUtility::replaceText($content, FileUtility::$FILE_IS_TEMP_SEARCHING_TEXT, 'isTemp=false');
        }

        if(!CommonUtility::isNullOrEmptyString($cover_image)){
            $logger->info("Cover image provided: $cover_image");
            $cover_image_filename = FileUtility::extractFileNameFromUrl($cover_image);
            $move_result = FileService::moveFilesToUpload([$cover_image_filename]);
            if (!$move_result) {
                $logger->error("Failed to move cover image: $cover_image_filename");
                respond_to_client(500, "Failed to move cover image from temp to upload directory");
                exit;
            }
            $cover_image = PostUtility::replaceText($cover_image, FileUtility::$FILE_IS_TEMP_SEARCHING_TEXT, 'isTemp=false');
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
                        $new_file_url = PostUtility::replaceText($att['file_url'], FileUtility::$FILE_IS_TEMP_SEARCHING_TEXT, 'isTemp=false');
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
            echo respond_to_client(200, "Creates the post successfully", $new_post);
        } else {
            $logger->error("Failed to create post: " . $stmt->error);
            respond_to_client(500, "Failed to create post");
            exit;
        }
        break;
    case 'POST_UPDATE': // PUT METHOD
        // Update a post
        if (!isset($_GET['id'])) {
            respond_to_client(400, "Missing post id");
            exit;
        }
        $post_id = intval($_GET['id']);
        $post = getPostById($connection, $post_id);
        if (!$post) {
            respond_to_client(404, "Post not found");
            exit;
        }
        checkOwnerPermission($user, $post); // exit if user is not the owner of the post
        $orginal_post_map = $post->get_object();
        $data = json_decode(file_get_contents('php://input'), true);
        $fields = [];
        $params = [];
        $types = [];
        // Only update provided fields
        foreach ([
            'title' => 's',
            'description' => 's',
            'content' => 's',
            'cover_image' => 's',
            'author_id' => 'i',
            'post_status' => 's'
        ] as $field => $type) {
            if (isset($data[$field]) && PostUtility::isEqual($data[$field], $orginal_post_map[$field]) === false) {
                $fields[$field] = "?";
                $params[$field] = $data[$field];
                $types[$field] = $type;
            }
        }
        // Check request has changes to update
        $has_attachments = isset($data['attachments']) && is_array($data['attachments']) && count($data['attachments']) > 0;
        $new_attachments = [];
        $original_attachments = [];
        $has_attachments_change = false;
        if($has_attachments){
            $original_attachments = getPostAttachments($connection, $post_id);
            // Remove old attachments that are not in the new data

            $new_attachments = array_filter($data['attachments'], function($att){
                return !isset($att['file_id']);
            });
            if(!empty($new_attachments) || count($original_attachments) != count($data['attachments'])){
                $has_attachments_change = true;
            }
        }

        $is_tags_changed = isTagsChanged($connection, $post_id, $data['tags'] ?? []);

        if (empty($fields) && $has_attachments_change && $is_tags_changed) {
            respond_to_client(400, "No fields to update");
            exit;
        }
        // Validate post fiedls before updating
        $errors = PostService::validatePostdata($data);
        if (!empty($errors)) {
            respond_to_client(422, "Validation errors", null, $errors);
            exit;
        }

        if (isset($data['title']) && !PostUtility::isEqual($data['title'], $orginal_post_map['title'])) {
            $data['slug'] = PostUtility::generateSlug($data['title']);
            $fields['slug']  = '?';
            $params['slug'] = $data['slug'];
            $types ['slug']= 's';
        } else {
            $data['slug'] = $orginal_post_map['slug'];
        }


        $to_delete_ids = [];

        if($has_attachments){
            // Remove old attachments that are not in the new data
            $existing_attachment_ids = array_map(function($att) {
                return $att->attachment_id;
            }, $original_attachments);

            $update_attachment_ids = array_map(function($att) {
                return $att['file_id'] ?? null; // Use file_id if exists, otherwise null
            }, $data['attachments']);

            $existing_attachment_ids = CommonUtility::findExistenceIds($update_attachment_ids, $existing_attachment_ids);

            $to_delete_ids = $existing_attachment_ids["diff"] ?? [];
            $logger->debug("Delete attachments: ".implode(', ', $to_delete_ids));

            // Move files from temp to upload directory
            $filenames = [];
            foreach ($new_attachments as $att) {
                if (isset($att['file_name'])) {
                    $filenames[] = basename($att['file_name']);
                }
            }
            if (!empty($filenames)) {
                $logger->debug("Files need to move to upload folder: ", implode(", ", $filenames));
                $move_result = FileService::moveFilesToUpload($filenames);
                if (!$move_result) {
                    $connection->close();
                    $logger->error("Failed to move files: " . json_encode($filenames));
                    respond_to_client(500, "Failed to move files from temp to upload directory");
                    exit;
                }

            }
            $params['content'] = PostUtility::replaceText($data['content'], FileUtility::$FILE_IS_TEMP_SEARCHING_TEXT, 'isTemp=false');
            $types['content'] = 's';
            $fields['content'] = '?';
        }

        $cover_image = $data['cover_image'] ?? null;
        if(!CommonUtility::isNullOrEmptyString($cover_image)){
            $logger->info("Cover image provided: $cover_image");
            $cover_image_filename = FileUtility::extractFileNameFromUrl($cover_image);
            $move_result = FileService::moveFilesToUpload([$cover_image_filename]);
            if (!$move_result) {
                $connection->close();
                $logger->error("Failed to move cover image: $cover_image_filename");
                respond_to_client(500, "Failed to move cover image from temp to upload directory");
                exit;
            }
            $cover_image = PostUtility::replaceText($cover_image, FileUtility::$FILE_IS_TEMP_SEARCHING_TEXT, 'isTemp=false');
            $logger->debug("Cover image after replacement: $cover_image");
            $params['cover_image'] = $cover_image;
            $types['cover_image'] = 's';
            $fields['cover_image'] = '?';
        }

        $connection->begin_transaction();
        $params['post_id'] = $post_id;
        $types ['post_id'] = 'i';

        $fields_strings = [];
        array_map(function($key, $value) use (&$fields_strings) {
            $fields_strings[]= "$key = $value";
        }, array_keys($fields), array_values($fields));
        $sql = "UPDATE posts SET ".implode(", ", $fields_strings).", updated_at = CURRENT_TIMESTAMP WHERE post_id = ? AND deleted_at IS NULL";
        $logger->debug("[updatePost] SQL: $sql");
        $logger->debug("[updatePost] type: ".implode("", $types));
        $stmt = $connection->prepare($sql);

        $stmt->bind_param(implode("", array_values($types)), ...array_values($params));

        $post_update_result = $stmt->execute();
        if (!$post_update_result || $stmt->affected_rows === 0) {
            $logger->error("Failed to update post with ID: $post_id. No rows affected.");
            respond_to_client(500, "Failed to update post");
            $connection->rollback();
            $connection->close();
            exit;
        }
        // Update tags
        try{
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
        } catch (Exception $e) {
            $logger->error("Failed to update tags for post ID: $post_id. Error: " . $e->getMessage());
            respond_to_client(500, "Failed to update tags");
            $connection->rollback();
            $connection->close();
            exit;
        }
        try{
            // Update attachments
            if ($has_attachments) {
                // Remove old attachments
                if (!empty($to_delete_ids)) {
                    $delete_ids = implode(',', array_map('intval', $to_delete_ids));
                    $connection->query("DELETE FROM attachments WHERE attachment_id IN ($delete_ids)");
                }

                $new_attachments = array_filter($data['attachments'], function($att) {
                    return !isset($att['file_id']);
                });
                // Insert new attachments
                foreach ($new_attachments as $att) {
                    if (isset($att['file_name'], $att['file_url'], $att['file_type'])) {
                        $att_stmt = $connection->prepare("INSERT INTO attachments (post_id, file_name, file_url, file_type) VALUES (?, ?, ?, ?)");
                        $att_stmt->bind_param("isss", $post_id, $att['file_name'], $att['file_url'], $att['file_type']);
                        $att_stmt->execute();
                    }
                }
            }
        } catch (Exception $e) {
            $logger->error("Failed to update tags for post ID: $post_id. Error: " . $e->getMessage());
            respond_to_client(500, "Failed to update tags");
            $connection->rollback();
            $connection->close();
            exit;
        }

        $updated_post = getPostById($connection, $post_id);
        if (!$updated_post) {
            $logger->error("Failed to retrieve newly updated post with ID: $post_id");
            respond_to_client(500, "Failed to retrieve newly updated post");
            $connection->rollback();
            $connection->close();
            exit;
        }
        $connection->commit();
        $connection->close();

        respond_to_client(200, "Post updated successfully", $updated_post);
        break;
    case 'POST_DELETE': // DELETE METHOD
        // Delete a post: soft delete by default, hard delete if isHard=true
        if (!isset($_GET['id'])) {
            respond_to_client(400, "Missing post id");
            exit;
        }
        $post_id = intval($_GET['id']);
        $post = getPostById($connection, $post_id);
        checkOwnerPermission($user, $post); // exit if user is not the owner of the post
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
                respond_to_client(200, "Post hard deleted");
            } catch (Exception $e) {
                $connection->rollback();
                respond_to_client(500, "Failed to hard delete post");
            }
        } else {
            // Soft delete
            $stmt = $connection->prepare("UPDATE posts SET deleted_at = CURRENT_TIMESTAMP WHERE post_id = ? AND deleted_at IS NULL");
            $stmt->bind_param("i", $post_id);
            if ($stmt->execute()) {
                respond_to_client(200, "Post soft deleted");
            } else {
                respond_to_client(500, "Failed to delete post");
            }
        }
        break;
    default:
        respond_to_client(405, "Method not allowed");
        break;
}
