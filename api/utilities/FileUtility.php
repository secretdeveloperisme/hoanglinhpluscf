<?php
    class FileUtility{
        public static string $FILE_IS_TEMP_SEARCHING_TEXT = 'isTemp=true';
        public static function extractFileNameFromPath($filePath)
        {
            $pattern = '/([^\/]+)$/';
            preg_match($pattern, $filePath, $matches);
            return $matches[1] ?? '';
        }

        public static function extractFileNameFromUrl($url)
        {
            $pattern = '/fileName=(.+)$/';
            preg_match($pattern, $url, $matches);
            return $matches[1] ?? '';
        }
   }

?>
