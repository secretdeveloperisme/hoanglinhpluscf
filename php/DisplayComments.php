<!DOCTYPE html>
<html>
    <head>
        <link rel="stylesheet" href="../css/displaycomment.css">
    </head>
    <body>
        <table>
        <tr>
            <th>user name</th>
            <th>comment</th>
        </tr>
        <?php
            include "ConnectDB.php";
            $connect = getConnectDB();
            $sql = "SELECT * FROM  comments";
            $result = $connect->query($sql);
            while($row = $result->fetch_assoc()){
                echo    "<tr>
                        <td>".$row["user"]."</td>".
                        "<td>".$row["comment"]."</td>
                        </tr>";
                }
            

        ?>
        </table>
    </body>
</html>