<?php
// Entity class for the 'posts' table
class Post {
    public $post_id;
    public $title;
    public $description;
    public $content;
    public $cover_image;
    public $slug;
    public $author_id;
    public $post_status;
    public $created_at;
    public $updated_at;
    public $deleted_at;
    public $tags = [];
    public $attachments = [];

    public function __construct($data = []) {
        foreach ($data as $key => $value) {
            if (property_exists($this, $key)) {
                $this->$key = $value;
            }
        }
    }
}
