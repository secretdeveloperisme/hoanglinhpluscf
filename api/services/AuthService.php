<?php
require_once __DIR__ .'/../utilities/JWTUtility.php';
require_once __DIR__ .'/../utilities/ConfigUtility.php';
require_once __DIR__ .'/../dtos/JwtUser.php';

class AuthService
{
    private JWTUtility $jwtUtility;
    private int $accessTokenExpiry; // seconds
    private int $refreshTokenExpiry; // seconds

    static $authService;


    public static function get_instance(): AuthService
    {
        if (AuthService::$authService === null) {
            AuthService::$authService = new AuthService();
        }
        return AuthService::$authService;
    }
   
    public function __construct()
    {
        $this->jwtUtility = JWTUtility::get_instance();
        $this->accessTokenExpiry = ConfigUtility::get('ACCESS_TOKEN_EXPIRY') ?: 900; // 15 minutes default
        $this->refreshTokenExpiry = ConfigUtility::get('REFRESH_TOKEN_EXPIRY') ?: 604800; // 7 days default
    }

    public function getAccessTokenExpiry(): int
    {
        return $this->accessTokenExpiry;
    }

    public function getRefreshTokenExpiry(): int
    {
        return $this->refreshTokenExpiry;
    }

    public function generateAccessToken(array $userPayload): string
    {
        $payload = $userPayload;
        $payload['type'] = 'access';
        $payload['iat'] = time();
        $payload['exp'] = time() + $this->accessTokenExpiry;
        return $this->jwtUtility->encode($payload);
    }

    public function generateRefreshToken(array $userPayload): string
    {
        $payload = $userPayload;
        $payload['type'] = 'refresh';
        $payload['iat'] = time();
        $payload['exp'] = time() + $this->refreshTokenExpiry;
        return $this->jwtUtility->encode($payload);
    }

    public function verifyToken(string $token): JwtUser|false
    {
        return $this->jwtUtility->decode($token);
    }

    public function isAdmin($token): bool
    {
        $user = $this->verifyToken($token);
        if ($user && $user->role === 'admin') {
            return true;
        }
        return false;
    }
}

AuthService::$authService = AuthService::get_instance();

?>