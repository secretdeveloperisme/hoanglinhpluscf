<?php
    header('Content-type:text/html; charset=utf-8');
    include "ConnectDB.php";
    $connect = getConnectDB();
    $connect->set_charset("utf8");
    $sql = "insert into comment(user,comment) values('".$_POST["username"]."','".$_POST["comments"]."')";
    if($connect->query($sql)==true){
        echo "you commented successfully! <br>";
        echo "username : ".$_POST["username"]."<br>";
        echo "comment : ".$_POST["comments"];
    }
    else
        echo "Error: ".$sql."<br>".$connect->error;
    $connect->close();
?>   