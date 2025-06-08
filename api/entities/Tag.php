<?php
// Entity class for the 'tags' table
class Tag {
    public $tag_id;
    public $name;
    public $created_at;

    public function __construct($data = []) {
        foreach ($data as $key => $value) {
            if (property_exists($this, $key)) {
                $this->$key = $value;
            }
        }
    }
}
