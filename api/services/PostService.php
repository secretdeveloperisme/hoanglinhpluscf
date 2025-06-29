<?php

require_once __DIR__ . "/../utilities/Logger.php";
require_once __DIR__ . "/../entities/Post.php";
class PostService
{
    public static $logger;
    public static function validatePostdata($data){
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
        return $errors;
    }

}
 PostService::$logger = Logger::getInstance();
?>