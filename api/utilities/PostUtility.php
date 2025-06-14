<?php



class PostUtility
{
    public static string $FILE_IS_TEMP_SEARCHING_TEXT = 'isTemp=true';
    /**
     * Replace all occurrences of $search with $replace in $text.
     *
     * @param string $text The original text.
     * @param string $search The value to search for.
     * @param string $replace The replacement value.
     * @return string The modified text.
     */
    public static function replaceText($text, $search, $replace)
    {
        return str_replace($search, $replace, $text);
    }


    /** Extract file name from file path regex */
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


    // check string is null or empty
    public static function isNullOrEmptyString($string)
    {
        return !isset($string) || trim($string) === '';
    }
    
}

?>