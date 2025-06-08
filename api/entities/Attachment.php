<?php
// Entity class for the 'attachments' table
class Attachment {
    public $attachment_id;
    public $post_id;
    public $file_name;
    public $file_url;
    public $file_type;
    public $created_at;

    public function __construct($data = []) {
        foreach ($data as $key => $value) {
            if (property_exists($this, $key)) {
                $this->$key = $value;
            }
        }
    }
}
