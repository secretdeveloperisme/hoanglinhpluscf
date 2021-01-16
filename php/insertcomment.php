<?php
    include "ConnectDB.php";
    $connect = getConnectDB();
    $sql = "insert into comments(user,comment) values('".$_POST["username"]."','".$_POST["comments"]."')";
    if($connect->query($sql)==true){
        echo "you commented successfully! <br>";
        echo "username : ".$_POST["username"]."<br>";
        echo "comment : ".$_POST["comments"];
    }
    else
        echo "Error: ".$sql."<br>".$connect->error;
    $connect->close();
?>   