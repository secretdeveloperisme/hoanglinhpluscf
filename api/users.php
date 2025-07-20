<?php
require_once 'connect_db.php';
require_once 'entities/User.php';
require_once 'utilities/HttpUtility.php';
require_once 'utilities/ConfigUtility.php';



header("Content-Type: application/json");

$method = $_SERVER['REQUEST_METHOD'];
$connection = getMariaDBConnection();

$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action'])?$_GET['action']:'default';
$method_action = strtoupper($method.'_'.$action);

switch ($method_action) {
    case 'GET_DEFAULT':
        if (isset($_GET['id'])) {
            // Get a single user by ID
            $id = intval($_GET['id']);
            $stmt = $connection->prepare("SELECT id, username, role, email FROM users WHERE id = ?");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result();
            if ($result->num_rows == 0) {
                respond_to_client(404, "User not found");
                exit;
            }
            $user = new User($result->fetch_assoc());
            echo json_encode($user);
        } else {
            // Get all users with pagination
            $default_page_start = ConfigUtility::get("defaultPageStart", 1);
            $default_page_size = ConfigUtility::get("defaultPageSize", 10);
            $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : $default_page_start;
            $limit = isset($_GET['limit']) ? max(1, intval($_GET['limit'])) : $default_page_size;
            $offset = ($page - 1) * $limit;

            $total_result = $connection->query("SELECT COUNT(*) as total FROM users");
            $total_users = $total_result->fetch_assoc()['total'];

            $stmt = $connection->prepare("SELECT id, username, role, email FROM users LIMIT ? OFFSET ?");
            $stmt->bind_param("ii", $limit, $offset);
            $stmt->execute();
            $result = $stmt->get_result();
            $users = [];
            while ($row = $result->fetch_assoc()) {
                $users[] = new User($row);
            }
            echo json_encode([
                "data" => $users,
                "paging" => [
                    "page" => $page,
                    "limit" => $limit,
                    "total" => intval($total_users),
                    "pages" => ceil($total_users / $limit)
                ]
            ]);
        }
        break;

    case 'POST_DEFAULT':
        // Create a new user with a password
        $data = json_decode(file_get_contents("php://input"), true);
        $hashedPassword = password_hash($data['password'], PASSWORD_BCRYPT);
        $stmt = $connection->prepare("INSERT INTO users (username, email, password) VALUES (?, ?, ?)");
        $stmt->bind_param("sss", $data['username'], $data['email'], $hashedPassword);
        if ($stmt->execute()) {
            echo json_encode(["message" => "User created successfully", "id" => $connection->insert_id]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => "Failed to create user"]);
        }
        break;

    case 'POST_UPDATE':
        // Update an existing user
        if (isset($_GET['id'])) {
            $id = intval($_GET['id']);
            $data = json_decode(file_get_contents("php://input"), true);
            $stmt = $connection->prepare("UPDATE email = ? WHERE id = ?");
            $stmt->bind_param("si", $data['email'], $id);
            if ($stmt->execute()) {
                echo json_encode(["message" => "User updated successfully"]);
            } else {
                http_response_code(500);
                echo json_encode(["error" => "Failed to update user"]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["error" => "User ID is required"]);
        }
        break;

    case 'POST_DELETE':
        // Delete a user
        if (isset($_GET['id'])) {
            $id = intval($_GET['id']);
            $stmt = $connection->prepare("DELETE FROM users WHERE id = ?");
            $stmt->bind_param("i", $id);
            if ($stmt->execute()) {
                echo json_encode(["message" => "User deleted successfully"]);
            } else {
                http_response_code(500);
                echo json_encode(["error" => "Failed to delete user"]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["error" => "User ID is required"]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["error" => "Method not allowed"]);
        break;
}

$connection->close();
?>