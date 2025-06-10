<?php
require_once __DIR__ . '/services/FileService.php';
header('Content-Type: application/json');

$ENTRY_POINT = '/api/files.php';

// Handle get file
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $filename = isset($_GET['fileName']) ? basename($_GET['fileName']) : null;

    if (!$filename) {
        http_response_code(400);
        echo json_encode(['error' => 'No filename specified']);
        exit;
    }
    $isTemp = isset($_GET['isTemp']) && $_GET['isTemp'] === 'true';

    $result = FileService::getFile($filename, $isTemp);

    if (isset($result['error'])) {
        http_response_code($result['status'] ?? 500);
        echo json_encode(['error' => $result['error']]);
        exit;
    }

    header('Content-Type: ' . $result['mimeType']);
    header('Content-Length: ' . $result['size']);
    readfile($result['filePath']);
    exit;
}

// Handle file upload
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_FILES['file'])) {
        http_response_code(400);
        echo json_encode(['error' => 'No file uploaded']);
        exit;
    }

    $result = FileService::uploadFile($_FILES['file']);

    if (isset($result['error'])) {
        http_response_code($result['status'] ?? 500);
        echo json_encode(['error' => $result['error']]);
        exit;
    }

    $targetPath = $ENTRY_POINT . "?isTemp=true&fileName=" . urlencode($result['filename']);
    echo json_encode([
        'success' => true,
        'filename' => $result['filename'],
        'fileType' => $result['fileType'],
        'filePath' => $targetPath
    ]);
    exit;
}

// Handle file delete using JSON request body
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $input = file_get_contents("php://input");
    $data = json_decode($input, true);

    $filename = isset($data['filename']) ? basename($data['filename']) : null;

    if (!$filename) {
        http_response_code(400);
        echo json_encode(['error' => 'No filename specified']);
        exit;
    }

    $result = FileService::deleteFile($filename);

    if (isset($result['error'])) {
        http_response_code($result['status'] ?? 500);
        echo json_encode(['error' => $result['error']]);
        exit;
    }

    echo json_encode(['success' => true]);
    exit;
}

// Handle unsupported methods
http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
exit;
?>