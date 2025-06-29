<?php

class CommonUtility
{
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
}
?>