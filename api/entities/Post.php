<?php
// Entity class for the 'posts' table

use Api\Constants\PostStatus;

class Post {
    public static array $SELECT_COLUMNS;
    public static array $SEARCH_COLUMNS = [
        "post_id", "title", "slug"
    ];

    public int $post_id;
    public string $title;
    public ?string $description;
    public string $content;
    public ?string $cover_image;
    public string $slug;
    public int $author_id;
    public PostStatus $post_status;
    public int $reading_time; // in minutes
    public string $created_at;
    public string $updated_at;
    public ?string $deleted_at;
    public array $tags = [];
    public array $attachments = [];

    public function __construct($data = []) {
        foreach ($data as $key => $value) {
            if (property_exists($this, $key)) {
                if($key === 'post_status' && is_string($value)){
                    $this->$key = PostStatus::fromString($value);
                } else {
                    $this->$key = $value;
                }
            }
        }
    }
    public function get_object() {
        $data = [];
        foreach ($this as $key => $value) {
            if (is_array($value) && empty($value)) {
                continue;
            }
            $data[$key] = $value;
        }
        return ($data);
    }

    public function get_object_without_null_property($ignore_null = true) {
        $data = [];
        foreach ($this as $key => $value) {
            if ($ignore_null && is_null($value) || is_array($value) && empty($value)) {
                continue;
            }
            $data[$key] = $value;
        }
        return ($data);

    }
}
Post::$SELECT_COLUMNS = [
    "post_id", "title", "description", "cover_image",
    "slug", "author_id", "post_status", "reading_time", "created_at", "updated_at", 'deleted_at'
];
