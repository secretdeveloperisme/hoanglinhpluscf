<?php


$uploadDir = __DIR__ . "/../../storage/uploads/";
$tempDir = __DIR__ . "/../../storage/temp/";

FileService::init($uploadDir, $tempDir);

class FileService
{
    private static $uploadDir;
    private static $tempDir;

    public static function init($uploadDir, $tempDir)
    {
        self::$uploadDir = $uploadDir;
        self::$tempDir = $tempDir;
    }

    public static function getFile($filename, $isTemp)
    {
        $dir = $isTemp ? self::$tempDir : self::$uploadDir;
        $filePath = $dir . $filename;

        if (!file_exists($filePath)) {
            return ['error' => 'File not found', 'status' => 404];
        }

        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $filePath);
        finfo_close($finfo);

        return [
            'filePath' => $filePath,
            'mimeType' => $mimeType,
            'size' => filesize($filePath)
        ];
    }


    public static function moveFilesToUpload($filenames)
    {
        foreach ($filenames as $filename) {
            $tempFilePath = self::$tempDir . $filename;
            $uploadFilePath = self::$uploadDir . $filename;

            if (!file_exists($tempFilePath)) {
                return false;
            }

            if (!is_dir(self::$uploadDir)) {
                mkdir(self::$uploadDir, 0777, true);
            }

            if (!rename($tempFilePath, $uploadFilePath)) {
                return false;
            }
        }
        return true;
    }

    public static function uploadFile($file)
    {
        $uniqueName = uniqid('', true) . '_' . basename($file['name']);
        $targetPath = self::$tempDir . $uniqueName;

        if ($file['size'] > 10 * 1024 * 1024) {
            return ['error' => 'File size exceeds limit', 'status' => 413];
        }

        $fileType = mime_content_type($file['tmp_name']);

        if (!is_dir(self::$tempDir)) {
            mkdir(self::$tempDir, 0777, true);
        }

        if (move_uploaded_file($file['tmp_name'], $targetPath)) {
            return [
                'success' => true,
                'filename' => $uniqueName,
                'fileType' => $fileType
            ];
        } else {
            return ['error' => 'Failed to move uploaded file', 'status' => 500];
        }
    }

    public static function deleteFile($filename)
    {
        $filePath = self::$tempDir . $filename;
        if (!file_exists($filePath)) {
            return ['error' => 'File not found', 'status' => 404];
        }
        if (unlink($filePath)) {
            return ['success' => true];
        } else {
            return ['error' => 'Failed to delete file', 'status' => 500];
        }
    }
}

?>