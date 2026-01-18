
<?php
require_once __DIR__."/connect_db.php";
require_once __DIR__."/entities/Quote.php";
require_once __DIR__."/utilities/HttpUtility.php";
header("Content-Type: application/json");

$connection = getMariaDBConnection();
$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : 'default';
$method_action = strtoupper($method . '_' . $action);

switch ($method_action) {
    case 'GET_DEFAULT':
        if (isset($_GET['id'])) {
            // Get a single quote by ID
            $id = intval($_GET['id']);
            $stmt = $connection->prepare("SELECT id, content, author, created_at FROM quotes WHERE id = ?");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result();
            if ($result->num_rows == 0) {
                respond_to_client(404, "Quote not found");
                exit;
            }
            $quote = new Quote($result->fetch_assoc());
            respond_to_client(200, "Quote fetched successfully", $quote);
        }  else if(isset($_GET['type']) && $_GET['type'] === 'random') {
            // Get a random quote
            $result = $connection->query("SELECT id, content, author, created_at FROM quotes ORDER BY RAND() LIMIT 1");
            if ($result->num_rows == 0) {
                respond_to_client(404, "No quotes found");
                exit;
            }
            $quote = new Quote($result->fetch_assoc());
            respond_to_client(200, "Quote fetched successfully", $quote);
        }
        else {
            // Get all quotes with pagination
            $default_page_start = 1;
            $default_page_size = 10;
            $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : $default_page_start;
            $limit = isset($_GET['limit']) ? max(1, intval($_GET['limit'])) : $default_page_size;
            $offset = ($page - 1) * $limit;

            $total_result = $connection->query("SELECT COUNT(*) as total FROM quotes");
            $total_quotes = $total_result->fetch_assoc()['total'];

            $stmt = $connection->prepare("SELECT id, content, author, created_at FROM quotes LIMIT ? OFFSET ?");
            $stmt->bind_param("ii", $limit, $offset);
            $stmt->execute();
            $result = $stmt->get_result();
            $quotes = [];
            while ($row = $result->fetch_assoc()) {
                $quotes[] = new Quote($row);
            }
            respond_to_client(200, "Quotes fetched successfully", [
                "quotes" => $quotes,
                "paging" => [
                    "page" => $page,
                    "limit" => $limit,
                    "total" => intval($total_quotes),
                    "pages" => ceil($total_quotes / $limit)
                ]
            ]);
        }
        break;

    case 'POST_DEFAULT':
        // Create a new quote
        $data = json_decode(file_get_contents("php://input"), true);
        if (isset($data['content']) && isset($data['author'])) {
            $stmt = $connection->prepare("INSERT INTO quotes (content, author) VALUES (?, ?)");
            $stmt->bind_param("ss", $data['content'], $data['author']);
            if ($stmt->execute()) {
                respond_to_client(201, "Quote added successfully", ["id" => $connection->insert_id]);
            } else {
                respond_to_client(500, "Failed to add quote");
            }
        } else {
            respond_to_client(400, "Invalid input");
        }
        break;

    case 'POST_UPDATE':
        // Update an existing quote
        if (isset($_GET['id'])) {
            $id = intval($_GET['id']);
            $data = json_decode(file_get_contents("php://input"), true);
            $stmt = $connection->prepare("UPDATE quotes SET content = ?, author = ? WHERE id = ?");
            $stmt->bind_param("ssi", $data['content'], $data['author'], $id);
            if ($stmt->execute()) {
                respond_to_client(200, "Quote updated successfully");
            } else {
                respond_to_client(500, "Failed to update quote");
            }
        } else {
            respond_to_client(400, "Quote ID is required");
        }
        break;

    case 'POST_DELETE':
        // Delete a quote
        if (isset($_GET['id'])) {
            $id = intval($_GET['id']);
            $stmt = $connection->prepare("DELETE FROM quotes WHERE id = ?");
            $stmt->bind_param("i", $id);
            if ($stmt->execute()) {
                respond_to_client(200, "Quote deleted successfully");
            } else {
                respond_to_client(500, "Failed to delete quote");
            }
        } else {
            respond_to_client(400, "Quote ID is required");
        }
        break;

    default:
        respond_to_client(405, "Method not allowed");
        break;
}

$connection->close();
?>
