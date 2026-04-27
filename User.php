<?php

class User {
    public int $id;
    public string $username;
    public string $password;
    public ?string $avatar_path;
    public string $email;

    public function __construct(int $id, string $username, string $password, ?string $avatar_path, string $email) {
        $this->id = $id;
        $this->username = $username;
        $this->password = $password;
        $this->avatar_path = $avatar_path;
        $this->email = $email;
    }

    public function getId(): int {
        return $this->id;
    }

    public function setId(int $id): void {
        $this->id = $id;
    }

    public function getUsername(): string {
        return $this->username;
    }

    public function setUsername(string $username): void {
        $this->username = $username;
    }

    public function getPassword(): string {
        return $this->password;
    }

    public function setPassword(string $password): void {
        $this->password = $password;
    }

    public function getAvatarPath(): string {
        return $this->avatar_path;
    }

    public function setAvatarPath(string $avatar_path): void {
        $this->avatar_path = $avatar_path;
    }

    public function getEmail(): string {
        return $this->email;
    }

    public function setEmail(string $email): void {
        $this->email = $email;
    }
}
