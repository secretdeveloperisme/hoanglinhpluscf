<?php

function respond_to_client($status, $message, $data = null, $errors = null) {
    http_response_code($status);

    $data_response = [];
    $data_response['status'] = $status;
     $data_response['message'] = $message;
    if($status == 200  || $status == 201) {
        if ($data !== null) {
            $data_response['data'] = $data;
        }
    }  else {
        if ($errors !== null) {
            $data_response['errors'] = $errors;
        }
    }

    echo json_encode($data_response);
}


?>