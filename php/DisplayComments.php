<!DOCTYPE html>
<html>
    <head>
        <meta charset="UTF-8">
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
            $sql = "SELECT * FROM  comment";
            $result = $connect->query($sql);
            while($row = $result->fetch_assoc()){
                echo    "<tr>
                        <td>".htmlspecialchars($row["user"])."</td>".
                        "<td>".htmlspecialchars($row["comment"])."</td>
                        </tr>";
                }
            

        ?>
        </table>
    </body>
</html>