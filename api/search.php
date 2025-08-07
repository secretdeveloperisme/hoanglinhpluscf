<?php

require_once __DIR__.'/connect_db.php';
require_once __DIR__.'/entities/Post.php';
require_once __DIR__.'/entities/Tag.php';
require_once __DIR__.'/utilities/ConfigUtility.php';
require_once __DIR__.'/utilities/Logger.php';

$logger = Logger::getInstance();
header('Content-Type: application/json');

$connection = getMariaDBConnection();
$searchPageSize = ConfigUtility::get("searchPageSize", 5);

$type = isset($_GET['type']) ? strtolower($_GET['type']) : 'post';
$query = isset($_GET['q']) ? trim($_GET['q']) : '';

if (empty($query)) {
    http_response_code(400);
    echo json_encode(["error" => "Missing search query"]);
    exit;
}

switch ($type) {
    case 'post':
        $sql = "SELECT " . implode(",", Post::$SEARCH_COLUMNS) . " FROM posts WHERE (title LIKE ? OR content LIKE ?) AND deleted_at IS NULL ORDER BY created_at DESC LIMIT $searchPageSize";
        $search = '%' . $query . '%';
        $stmt = $connection->prepare($sql);
        $stmt->bind_param("ss", $search, $search);
        $stmt->execute();
        $result = $stmt->get_result();
        $posts = [];
        while ($row = $result->fetch_assoc()) {
            $posts[] = new Post($row);
        }
        $cleanPosts = [];
        foreach ($posts as $post) {
            $cleanPosts[] = $post->get_object_without_null_property(ignore_null:true);
        }
        echo json_encode(["data" => $cleanPosts]);
        break;

    case 'tag':
        // Search tags by name
        $sql = "SELECT tag_id, name, created_at FROM tags WHERE name LIKE ? ORDER BY created_at DESC LIMIT 20";
        $search = '%' . $query . '%';
        $stmt = $connection->prepare($sql);
        $stmt->bind_param("s", $search);
        $stmt->execute();
        $result = $stmt->get_result();
        $tags = [];
        while ($row = $result->fetch_assoc()) {
            $tags[] = new Tag($row);
        }
        echo json_encode(["data" => $tags]);
        break;

    default:
        http_response_code(400);
        echo json_encode(["error" => "Invalid search type"]);
        break;
}
?>