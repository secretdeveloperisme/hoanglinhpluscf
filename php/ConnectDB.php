<?php
    $serverName  = "127.0.0.1";  
    $userName = "root";
    $passWord = "";
    $dbName = "hoanglinh";

function getConnectDB(){
    $connect = new mysqli($GLOBALS["serverName"],$GLOBALS["userName"],$GLOBALS["passWord"],$GLOBALS["dbName"]);
    if($connect->connect_error)
        die("connect failed: ".mysqli_connect_error());
    else
        return $connect;

}
    
   
?>