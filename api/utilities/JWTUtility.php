<?php

require_once __DIR__ . '/ConfigUtility.php';

require_once __DIR__.'/../dtos/JwtUser.php';


class JWTUtility
{
    private string $secret;
    private const ALGORITHM = 'HS256';
    private const TYPE = 'JWT';
    private static $jwtUtility;

    public function __construct(string $secret)
    {
        $this->secret = $secret;
    }


    public static function get_instance(): JWTUtility{
        if (JWTUtility::$jwtUtility  === null) {
            $secret = ConfigUtility::get('JWT_SECRET') ?: 'default_secret_key';
            JWTUtility::$jwtUtility = new JWTUtility($secret);
        }
        return JWTUtility::$jwtUtility;   
    }

    /**
     * Generate a JWT token from payload
     */
    public function encode(array $payload): string
    {
        $header = ['alg' => $this::ALGORITHM, 'typ' => $this::TYPE];

        $header_encoded = $this->base64urlEncode(json_encode($header));
        $payload_encoded = $this->base64urlEncode(json_encode($payload));

        $signature = hash_hmac('sha256', "$header_encoded.$payload_encoded", $this->secret, true);
        $signature_encoded = $this->base64urlEncode($signature);

        return "$header_encoded.$payload_encoded.$signature_encoded";
    }

    /**
     * Decode and verify a JWT token.
     * Returns the payload as an array if valid, or false if invalid.
     */
    public function decode(string $token): JwtUser|false
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return false;
        }

        [$header_encoded, $payload_encoded, $signature_encoded] = $parts;

        $signature = $this->base64urlDecode($signature_encoded);
        $expected_signature = hash_hmac('sha256', "$header_encoded.$payload_encoded", $this->secret, true);

        if (!hash_equals($expected_signature, $signature)) {
            return false;
        }

        $payload_json = $this->base64urlDecode($payload_encoded);
        $payload = json_decode($payload_json, true);


        // Optional: Check expiry
        if (isset($payload['exp']) && time() >= $payload['exp']) {
            return false; // Token expired
        }

        return new JwtUser($payload);
    }

    /**
     * Encode data as base64url (no padding, URL-safe)
     */
    private function base64urlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    /**
     * Decode base64url-encoded data
     */
    private function base64urlDecode(string $data): string
    {
        $padding = strlen($data) % 4;
        if ($padding > 0) {
            $data .= str_repeat('=', 4 - $padding);
        }
        return base64_decode(strtr($data, '-_', '+/'));
    }
}
?>
