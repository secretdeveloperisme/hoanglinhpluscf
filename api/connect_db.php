<?php

function loadEnv($filePath) {
    if (!file_exists($filePath)) {
        die("Environment file not found: $filePath");
    }

    $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) {
            continue; // Skip comments
        }

        $parts = explode('=', $line, 2);
        if (count($parts) === 2) {
            $key = trim($parts[0]);
            $value = trim($parts[1]);
            $_ENV[$key] = $value;
        }
    }
}

function getMariaDBConnection() {
    // Load environment variables
    loadEnv(__DIR__ . '/../.env');

    $serverName = $_ENV['DB.HOST'];
    $userName = $_ENV['DB.USERNAME'];
    $passWord = $_ENV['DB.PASSWORD'];
    $dbName = $_ENV['DB.NAME'];
    $port = $_ENV['DB.PORT'];

    // Create connection
    $connect = new mysqli($serverName, $userName, $passWord, $dbName, $port);

    // Check connection
    if ($connect->connect_error) {
        die("Connection failed: " . $connect->connect_error);
    }

    return $connect;
}


?>