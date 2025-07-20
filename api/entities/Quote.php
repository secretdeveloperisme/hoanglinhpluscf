<?php

class Quote {
    public $id;
    public $content;
    public $author;
    public $created_at;

    public function __construct($data = []) {
        foreach ($data as $key => $value) {
            if (property_exists($this, $key)) {
                $this->$key = $value;
            }
        }
    }

    public function toArray() {
        return [
            'id' => $this->id,
            'content' => $this->content,
            'author' => $this->author,
            'created_at' => $this->created_at
        ];
    }
}