<?php
header('Content-Type: application/json');
// Define the upload directory and temporary directory
$uploadDir = __DIR__ . "/../storage/uploads/";
$tempDir = __DIR__ . "/../storage/temp/";

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

    if($isTemp) {
        $filePath = $tempDir . $filename;
    } else {
        $filePath = $uploadDir . $filename;
    }

    if (file_exists($filePath)) {
           // Use finfo to detect MIME type
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $filePath);
        finfo_close($finfo);

        // Set headers
        header('Content-Type: ' . $mimeType);
        header('Content-Length: ' . filesize($filePath));


        // Output image
        $numberOfBytes = readfile($filePath);
        if ($numberOfBytes === false) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to read file']);
            exit;
        }
        
        exit;
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'File not found']);
        exit;
    }
}

// Handle file upload
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_FILES['file'])) {
        http_response_code(400);
        echo json_encode(['error' => 'No file uploaded']);
        exit;
    }
    
    $file = $_FILES['file'];
    $uniqueName = uniqid('', true) . '_' . basename($file['name']);
    $targetPath = $tempDir . $uniqueName;

    // Validate file size (optional, e.g., max 10MB)
    if ($file['size'] > 10 * 1024 * 1024) { // 10MB limit
        http_response_code(413);
        echo json_encode(['error' => 'File size exceeds limit']);
        exit;
    }

    // Get file type 
    $fileType = mime_content_type($file['tmp_name']);

    if (!is_dir($tempDir)) {
        mkdir($tempDir, 0777, true);
    }

    

    if (move_uploaded_file($file['tmp_name'], $targetPath)) {
        $targetPath = $ENTRY_POINT."?isTemp=true&fileName=". urlencode($uniqueName);
        echo json_encode(['success' => true, 'filename' => $uniqueName, 'fileType' => $fileType, 'filePath' => $targetPath]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to move uploaded file']);
    }
    exit;
}

/**
 * Handle file delete using JSON request body
 */
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $input = file_get_contents("php://input");
    $data = json_decode($input, true);

    $filename = isset($data['filename']) ? basename($data['filename']) : null;

    if (!$filename) {
        http_response_code(400);
        echo json_encode(['error' => 'No filename specified']);
        exit;
    }

    $filePath = $tempDir . $filename;
    if (file_exists($filePath)) {
        if (unlink($filePath)) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete file']);
        }
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'File not found']);
    }
    exit;
}

// Handle unsupported methods
http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
exit;

?>