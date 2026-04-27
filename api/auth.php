<?php
require_once __DIR__.'/connect_db.php';
require_once __DIR__.'/utilities/HttpUtility.php';
require_once __DIR__.'/services/AuthService.php';
require_once __DIR__.'/services/UserService.php';
require_once __DIR__.'/dtos/User.php';
session_start();

header("Content-Type: application/json");

$method = $_SERVER['REQUEST_METHOD'];


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

        $userService = UserService::getInstance();
        $user = $userService->getUserByUsername($username);
        if ($user && password_verify($password, $user->password)) {
            $userPayload = [
                'id' => $user->id,
                'username' => $user->username,
                'role' => $user->role,
            ];
            $accessToken = $authService->generateAccessToken($userPayload);
            $refreshToken = $authService->generateRefreshToken($userPayload);

            setcookie("access_token", $accessToken, time() + $authService->getAccessTokenExpiry(), "/", "", false, true);
            setcookie("refresh_token", $refreshToken, time() + $authService->getRefreshTokenExpiry(), "/", "", false, true);

            $_SESSION['user_id'] = $user->id;
            $_SESSION['role'] = $user->role;
            $userInfo = new UserDTO([
                'id' => $user->id,
                'username' => $user->username,
                'email' => $user->email,
                'role' => $user->role,
                'avatar_path' => $user->avatar_path
            ]);

            respond_to_client(200, message: "Login successful", data: [
                "message" => "Login successful",
                "access_token" => $accessToken,
                "refresh_token" => $refreshToken,
                "user_id" => $user->id,
                "role" => $user->role,
                "user_info" => $userInfo
            ]);
            exit;
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
            $user = UserService::getInstance()->getUserById($jwtUser->id);
            $userInfo = new UserDTO([
                'username' => $user->username,
                'email' => $user->email,
                'avatar_path' => $user->avatar_path
            ]);
            if ($jwtUser !== false && isset($jwtUser->id) && isset($jwtUser->role)) {
                respond_to_client(200, "Authentication successful", data: [
                    "user_id" => $jwtUser->id,
                    "role" => $jwtUser->role,
                    "access_token" => $accessToken,
                    "user_info" => $userInfo
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
            $validJWTUser = $authService->verifyToken($refreshToken);
            if ($validJWTUser !== false) {
                // Remove iat, exp, type from validJWTUser for new access token
                $newAccessToken = $authService->generateAccessToken([
                    'id' => $validJWTUser->id,
                    'username' => $validJWTUser->username,
                    'role' => $validJWTUser->role
                ]);
                setcookie("access_token", $newAccessToken, time() + $authService->getAccessTokenExpiry(), "/", "", false, true);
                respond_to_client(200, "Authentication successful", [
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


?>
