<?php
class UserDTO{
    public $username;
    public $email;
    public $avatar_path;

    public function __construct($data) {
        $this->username = $data['username'] ?? null;
        $this->email = $data['email'] ?? null;
        $this->avatar_path = $data['avatar_path'] ?? null;
    }
}
?>
