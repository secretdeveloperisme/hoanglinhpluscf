<?php
// Entity class for the 'tags' table
class User {
    public $id;
    public $username;
    public $email;
    public $role;

    public function __construct($data = []) {
        foreach ($data as $key => $value) {
            if (property_exists($this, $key)) {
                $this->$key = $value;
            }
        }
    }
}
