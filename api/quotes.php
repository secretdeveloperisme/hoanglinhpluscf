<?php
require_once "connect_db.php";
header("Content-Type: application/json");

$method = $_SERVER['REQUEST_METHOD'];
$connect = getMariaDBConnection();

switch ($method) {
    case 'GET':
        $lengthOfQuotesQuery = "SELECT COUNT(id) as length_of_quotes FROM quotes";
        $result = $connect->query($lengthOfQuotesQuery);
        if ($result->num_rows > 0) {
            $lengthOfQuotes = intval($result->fetch_assoc()["length_of_quotes"]);
            $randomNumberQuote = random_int(0, $lengthOfQuotes - 1);
            $randomQuoteQuery = "SELECT * FROM quotes LIMIT $randomNumberQuote,1";
            $quoteResult = $connect->query($randomQuoteQuery);
            $quote = array();
            if ($quoteResult->num_rows > 0) {
                $row = $quoteResult->fetch_assoc();
                $quote["content"] = $row["content"];
                $quote["author"] = $row["author"];
            }
            echo json_encode($quote);
        } else {
            http_response_code(404);
            echo json_encode(["error" => "No quotes found"]);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        if (isset($data['content']) && isset($data['author'])) {
            $content = $connect->real_escape_string($data['content']);
            $author = $connect->real_escape_string($data['author']);
            $insertQuoteQuery = "INSERT INTO quotes (content, author) VALUES ('$content', '$author')";
            if ($connect->query($insertQuoteQuery)) {
                echo json_encode(["message" => "Quote added successfully", "id" => $connect->insert_id]);
            } else {
                http_response_code(500);
                echo json_encode(["error" => "Failed to add quote"]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["error" => "Invalid input"]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["error" => "Method not allowed"]);
        break;
}

$connect->close();
?>