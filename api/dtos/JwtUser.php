<?php

class JwtUser
{
    public int $id;
    public string $username;
    public string $role;
    public string $type;
    public int $iat;
    public int $exp;

    public function __construct(array $data)
    {
        $this->id = $data['id'];
        $this->username = $data['username'];
        $this->role = $data['role'];
        $this->type = $data['type'];
        $this->iat = $data['iat'];
        $this->exp = $data['exp'];
    }
}
