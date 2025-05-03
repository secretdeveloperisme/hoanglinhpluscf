<?php
require_once 'connect_db.php';
session_start();

header("Content-Type: application/json");

$method = $_SERVER['REQUEST_METHOD'];
$connection = getMariaDBConnection();

switch ($method) {
    case 'POST':
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
                // Generate a token
                $token = bin2hex(random_bytes(32));
                $_SESSION['token'] = $token;
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['role'] = $user['role'];

                setcookie("token", $token, time() + 3600, "/", "", false, true);
                echo json_encode([
                    "message" => "Login successful",
                    "token" => $token,
                    "user_id" => $user['id'],
                    "role" => $user['role']
                ]);
            } else {
                http_response_code(401);
                echo json_encode(["error" => "Invalid credentials"]);
            }
        } else {
            http_response_code(401);
            echo json_encode(["error" => "Invalid credentials"]);
        }
        break;

    case 'GET':
        // Authenticate using token and return current user information
        if (isset($_SESSION['token']) && isset($_SESSION['user_id']) && isset($_SESSION['role'])) {
            echo json_encode([
                "message" => "Authenticated",
                "user_id" => $_SESSION['user_id'],
                "role" => $_SESSION['role'],
                "token" => $_SESSION['token']
            ]);
        } else {
            http_response_code(401);
            echo json_encode(["error" => "Unauthorized"]);
        }
        break;

    case 'DELETE':
        // Logout function
        session_unset();
        session_destroy();
        echo json_encode(["message" => "Logout successful"]);
        break;

    default:
        http_response_code(405);
        echo json_encode(["error" => "Method not allowed"]);
        break;
}

$connection->close();
?>