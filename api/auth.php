<?php
require_once __DIR__.'/connect_db.php';
require_once __DIR__.'/utilities/HttpUtility.php';
require_once __DIR__.'/services/AuthService.php';
session_start();

header("Content-Type: application/json");

$method = $_SERVER['REQUEST_METHOD'];
$connection = getMariaDBConnection();

$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action'])?$_GET['action']:'default';
$method_action = strtoupper($method.'_'.$action);
$authService = AuthService::get_instance();

switch ($method_action) {
    case 'POST_DEFAULT':
        // Login function
        $data = json_decode(file_get_contents("php://input"), true);
        $username = $data['username'];
        $password = $data['password'];

        $stmt = $connection->prepare("SELECT id, role, password FROM users WHERE username = ?");
        $stmt->bind_param("s", $username);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 1) {
            $user = $result->fetch_assoc();
            if (password_verify($password, $user['password'])) {
                // Generate access and refresh tokens using AuthService
                $userPayload = [
                    'id' => $user['id'],
                    'username' => $username,
                    'role' => $user['role']
                ];
                $accessToken = $authService->generateAccessToken($userPayload);
                $refreshToken = $authService->generateRefreshToken($userPayload);

                // Set cookies for both tokens
                setcookie("access_token", $accessToken, time() + $authService->getAccessTokenExpiry(), "/", "", false, true);
                setcookie("refresh_token", $refreshToken, time() + $authService->getRefreshTokenExpiry(), "/", "", false, true);

                // Optionally, store user info in session if needed
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['role'] = $user['role'];

                respond_to_client(200, message: "Login successful", data: [
                    "message" => "Login successful",
                    "access_token" => $accessToken,
                    "refresh_token" => $refreshToken,
                    "user_id" => $user['id'],
                    "role" => $user['role']
                ]);
                exit;
                
            } else {
                respond_to_client(401, message: "Invalid credentials");
                exit;
            }
        } else {
            respond_to_client(401, message: "Invalid credentials");
            exit;
        }
        break;

    case 'GET_DEFAULT':
        // Authenticate using access token from cookie and return current user information
        if (isset($_COOKIE['access_token'])) {
            $accessToken = $_COOKIE['access_token'];
            $jwtUser = $authService->verifyToken($accessToken);
            if ($jwtUser !== false && isset($jwtUser->id) && isset($jwtUser->role)) {
                respond_to_client(200, "Authentication successful", data: [
                    "user_id" => $jwtUser->id,
                    "role" => $jwtUser->role,
                    "access_token" => $accessToken
                ]);
                exit;
            } else {
                respond_to_client(401, message: "Invalid or expired access token");
                exit;
            }
        } else {
            respond_to_client(401, message: "No access token found");
            exit;
        }
        break;

    case 'POST_REFRESH':
        // Generate new access token from refresh token
        if (isset($_COOKIE['refresh_token'])) {
            $refreshToken = $_COOKIE['refresh_token'];
            $payload = $authService->verifyToken($refreshToken);
            if ($payload !== false && isset($payload['id']) && isset($payload['username']) && isset($payload['role']) && isset($payload['type']) && $payload['type'] === 'refresh') {
                // Remove iat, exp, type from payload for new access token
                $userPayload = [
                    'id' => $payload['id'],
                    'username' => $payload['username'],
                    'role' => $payload['role']
                ];
                $newAccessToken = $authService->generateAccessToken($userPayload);
                setcookie("access_token", $newAccessToken, time() + $authService->getAccessTokenExpiry(), "/", "", false, true);
                echo json_encode([
                    "message" => "Access token refreshed",
                    "access_token" => $newAccessToken
                ]);
            } else {
                respond_to_client(401, message: "Invalid or expired refresh token");
                exit;
            }
        } else {
            respond_to_client(401, message: "No refresh token found");
        }
        break;
    case 'POST_DELETE':
        // Logout function
        session_unset();
        session_destroy();
        respond_to_client(200, "Logout successful");
        break;

    default:
        respond_to_client(405, message: "Method not allowed");
        break;
}

$connection->close();
?>