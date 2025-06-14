<?php

class Logger
{
    private static string $logFilePath = __DIR__ . '/../configs/log_config.json';
    private static ?Logger $instance = null;

    private const LEVELS = ["DEBUG" => 0, "INFO" => 1, "WARNING" => 2, "ERROR" => 3];
    private string $logDir;
    private int $minLevel;
    private int $maxFiles;
    private string $logFile;

    private function __construct()
    {
        $config = json_decode(file_get_contents(Logger::$logFilePath), true);

        $this->logDir = rtrim($config['log_dir'], '/');
        $this->minLevel = self::LEVELS[strtoupper($config['log_level'])] ?? 1;
        $this->maxFiles = $config['max_files'] ?? 5;
        $this->logFile = $this->logDir . '/app.log';

        if (!file_exists($this->logDir)) {
            mkdir($this->logDir, 0777, true);
        }
    }

    public static function getInstance(): Logger
    {
        if (self::$instance === null) {
            self::$instance = new Logger();
        }
        return self::$instance;
    }

    private function shouldLog(string $level): bool
    {
        return self::LEVELS[$level] >= $this->minLevel;
    }

    private function rollLog()
    {
        if (!file_exists($this->logFile)) return;

        for ($i = $this->maxFiles - 1; $i >= 1; $i--) {
            $src = "{$this->logFile}.$i";
            $dst = "{$this->logFile}." . ($i + 1);
            if (file_exists($src)) {
                rename($src, $dst);
            }
        }

        rename($this->logFile, "{$this->logFile}.1");
    }

    private function write(string $level, string $message)
    {
        if (!$this->shouldLog($level)) return;

        if (file_exists($this->logFile) && filesize($this->logFile) > 1024 * 1024) {
            $this->rollLog();
        }

        $time = date("Y-m-d H:i:s");
        $logLine = "[$time][$level] $message\n";
        file_put_contents($this->logFile, $logLine, FILE_APPEND);
    }

    public function error(string $msg)   { $this->write("ERROR", $msg); }
    public function warning(string $msg) { $this->write("WARNING", $msg); }
    public function info(string $msg)    { $this->write("INFO", $msg); }
    public function debug(string $msg)   { $this->write("DEBUG", $msg); }
}
