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

    // compare 2 strings or numbers return true if they are equal, else return false
    public static function isEqual($a, $b)
    {
        if (is_numeric($a) && is_numeric($b)) {
            return $a == $b;
        } elseif (is_string($a) && is_string($b)) {
            return strcmp($a, $b) === 0;
        } else {
            return false;
        }
    }
     
    /**
     * Generates a URL-friendly slug from the given title.
     *
     * @param string $title The input string to convert into a slug.
     * @return string The generated slug.
     */
    public static function generateSlug($title) {
        $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $title)));
        return $slug;
    }

    
}

?>