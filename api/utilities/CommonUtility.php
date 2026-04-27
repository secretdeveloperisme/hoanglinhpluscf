<?php

require_once __DIR__ .'/JWTUtility.php';
class CommonUtility
{
     // check string is null or empty
    public static function isNullOrEmptyString($string)
    {
        return !isset($string) || trim($string) === '';
    }

    public static function findExistenceIds($ids, $allIds){
        $data = [];
        if (!is_array($allIds) || empty($allIds)) {
            $data['diff'] = [];
            $data['existing'] = [];
            $data['not_existing'] = [];
            if (is_array($ids) && !empty($ids)) {
                $data['not_existing'] = $ids;
            }
            return $data;
        }
        if (!is_array($ids) || empty($ids)) {
            $data['diff'] = $allIds;
            $data['existing'] = [];
            $data['not_existing'] = [];
            return $data;
        }
        $existingId = [];
        $notExistingIds = [];
        foreach ($ids as $id) {
            if (is_numeric($id) && in_array($id, $allIds)) {
                $existingId[] = $id;
            } else {
                $notExistingIds[] = $id;
            }
        }
        $data['diff'] = array_diff($allIds, $existingId);
        $data['existing'] = $existingId;
        $data['not_existing'] = $notExistingIds;
        return $data;

    }

    public static function getUserFromTokenCookie(): JwtUser|null {
        $user = null;
        if (isset($_COOKIE['access_token']) && !empty($_COOKIE['access_token'])) {
            $user = JwtUtility::get_instance()->decode($_COOKIE['access_token']);
        }
        return $user;
    }
}
?>
