<?php
// Entity class for the 'tags' table
class User {
    public $id;
    public $username;
    public $email;
    public $role;
    public $password;
    public ?string $avatar_path;

    public function __construct($data = []) {
        foreach ($data as $key => $value) {
            if (property_exists($this, $key)) {
                $this->$key = $value;
            }
        }
    }
    public static function fromJson($json) {
        $data = json_decode($json, true);
        return new User($data);
    }
}
