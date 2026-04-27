<?php
require_once __DIR__ . '/../connect_db.php';
require_once __DIR__ . '/../entities/User.php';


class UserService {
	private static $instance = null;
	private $conn;

	private function __construct() {
		$this->conn = getMariaDBConnection();
	}

	public static function getInstance() {
		if (self::$instance === null) {
			self::$instance = new UserService();
		}
		return self::$instance;
	}

	public function createUser($username, $email, $password, $role = 'USER', $avatar_path = null) {
		$stmt = $this->conn->prepare("INSERT INTO users (username, email, password, role, avatar_path) VALUES (?, ?, ?, ?, ?)");
		$stmt->bind_param('sssss', $username, $email, $password, $role, $avatar_path);
		$result = $stmt->execute();
		$stmt->close();
		return $result ? $this->conn->insert_id : false;
	}

	public function getUserById($id) {
		$stmt = $this->conn->prepare("SELECT * FROM users WHERE id = ?");
		$stmt->bind_param('i', $id);
		$stmt->execute();
		$result = $stmt->get_result();
		$user = $result->fetch_assoc();
		$stmt->close();
		return $user ? new User($user) : null;
	}

    public function getUserByUsername($username) {
        $stmt = $this->conn->prepare("SELECT * FROM users WHERE username = ?");
        $stmt->bind_param('s', $username);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();
        $stmt->close();
        return $user ? new User($user) : null;
    }

	public function getAllUsers() {
		$result = $this->conn->query("SELECT * FROM users");
		$users = [];
		while ($row = $result->fetch_assoc()) {
			$users[] = new User($row);
		}
		return $users;
	}

	public function updateUser($id, $data) {
		$fields = [];
		$params = [];
		$types = '';
		foreach ($data as $key => $value) {
			$fields[] = "$key = ?";
			$params[] = $value;
			$types .= is_int($value) ? 'i' : 's';
		}
		if (empty($fields)) return false;
		$params[] = $id;
		$types .= 'i';
		$sql = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = ?";
		$stmt = $this->conn->prepare($sql);
		$stmt->bind_param($types, ...$params);
		$result = $stmt->execute();
		$stmt->close();
		return $result;
	}

	public function deleteUser($id) {
		$stmt = $this->conn->prepare("DELETE FROM users WHERE id = ?");
		$stmt->bind_param('i', $id);
		$result = $stmt->execute();
		$stmt->close();
		return $result;
	}

	public function __destruct() {
		if ($this->conn) {
			$this->conn->close();
		}
		self::$instance = null;
	}
}

?>
