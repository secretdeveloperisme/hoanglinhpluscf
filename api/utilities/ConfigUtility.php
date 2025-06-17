<?php

class ConfigUtility
{
    private static $config = null;
    private static $configPath = __DIR__ . '/../configs/application_config.json';

    private static function loadConfig()
    {
        if (self::$config === null) {
            if (!file_exists(self::$configPath)) {
                throw new Exception("Config file not found: " . self::$configPath);
            }
            $json = file_get_contents(self::$configPath);
            self::$config = json_decode($json, true);
            if (self::$config === null) {
                throw new Exception("Invalid JSON in config file.");
            }
        }
    }

    public static function get($key, $default = null)
    {
        self::loadConfig();
        return array_key_exists($key, self::$config) ? self::$config[$key] : $default;
    }
}