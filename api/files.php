<?php
header('Content-Type: application/json');

require_once __DIR__ . '/services/FileService.php';
require_once __DIR__ . '/utilities/Logger.php';
require_once __DIR__ . '/utilities/HttpUtility.php';


$ENTRY_POINT = '/api/files.php';


$logger = Logger::getInstance();
$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action'])?$_GET['action']:'default';
$method_action = strtoupper($method.'_'.$action);


// Handle get file
if ($method_action === 'GET_DEFAULT') {
    $filename = isset($_GET['fileName']) ? basename($_GET['fileName']) : null;

    if (!$filename) {
        respond_to_client(400, "No filename specified");
        exit;
    }
    $isTemp = isset($_GET['isTemp']) && $_GET['isTemp'] === 'true';

    $result = FileService::getFile($filename, $isTemp);

    if (isset($result['error'])) {
        respond_to_client(500, message: "File retrieval failed", data: null, errors: $result['error']);
        exit;
    }

    header('Content-Type: ' . $result['mimeType']);
    header('Content-Length: ' . $result['size']);
    readfile($result['filePath']);
    exit;
}

// Handle file upload
if ($method_action === 'POST_DEFAULT') {
    $logger->debug("File upload request received");

    if (!isset($_FILES['file'])) {
        respond_to_client(400, message: "No file uploaded");
        exit;
    }

    $logger->debug("File upload: " . $_FILES['file']['name']);
    $result = FileService::uploadFile($_FILES['file']);

    if (isset($result['error'])) {
        respond_to_client(500, message: "Upload to file failed", data: null, errors: $result['error']);
        exit;
    }

    $targetPath = $ENTRY_POINT . "?isTemp=true&fileName=" . urlencode($result['filename']);

    respond_to_client(200, "Files fetched successfully", [
        'success' => true,
        'filename' => $result['filename'],
        'fileType' => $result['fileType'],
        'filePath' => $targetPath
    ]);
    exit;
}

// Handle file delete using JSON request body
if ($method_action === 'POST_DELETE') {
    $input = file_get_contents("php://input");
    $data = json_decode($input, true);

    $filename = isset($data['filename']) ? basename($data['filename']) : null;

    if (!$filename) {
        respond_to_client(400, message: "No filename specified");
        exit;
    }

    $result = FileService::deleteFile($filename);

    if (isset($result['error'])) {
        respond_to_client(500, message: "File deletion failed", data: null, errors: $result['error']);
        exit;
    }

    respond_to_client(200, "File uploaded successfully", ['success' => true]);
    exit;
}

// Handle unsupported methods
respond_to_client(405, message: "Method not allowed", data: null, errors: "Unsupported HTTP method: " . $_SERVER['REQUEST_METHOD']);
exit;
?>
