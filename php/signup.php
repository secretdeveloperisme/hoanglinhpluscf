<?php
    header('Content-type:text/html; charset=utf-8');
    include "../php/ConnectDB.php"; 
    if($_SERVER['REQUEST_METHOD'] == 'POST'){
    $connect = getConnectDB();
    $fullName = $username = $password = $dob = $gender=$bio= "";
    if(isset($_POST["fullname"])&&!empty($_POST["fullname"]))
        $fullName = $_POST["fullname"];
    if(isset($_POST["username"]))
        $username = $_POST["username"];
    if(isset($_POST["password"]))
        $password = $_POST["password"];
    if(isset($_POST["dob"])&&!empty($_POST["dob"])){
        $dob = $_POST["dob"];
    }
    if(isset($_POST["gender"])&&!empty($_POST["gender"])){
        if($_POST["gender"] == "male"){
            $gender = "m";
        }
        else{
            $gender ="f";
        }
    }
    $sql = "INSERT INTO account(fullname,username,PASSWORD,gender,dob,bio) values('".
                 $fullName."','".$username."','".$password."','".$gender."','".$dob."','".$bio."')";
    $connect->set_charset("utf8");
    if($connect->query($sql)==true){
        echo "success";
    }
    else{
        echo $connect->error;
    }
    $connect->close();
    }
?>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign up</title>
    <link rel="stylesheet" href="../css/signup.css">
</head>
<body>
    <form accept-charset="utf-8" action="<?php echo htmlspecialchars($_SERVER["PHP_SELF"])?>" class="container"  onsubmit="return validate();" method="POST">
        <h1>Sign up</h1>
        <div class="container__item">
            <label for="fullname">Full Name:<br></label>
            <input type="text" name="fullname" id="fullname" >
        </div>
        <div class="container__item">
            <label for="username">User Name:<br></label>
            <input type="text" name="username" id="username"  >
        </div>
        <div class="container__item">
            <label for="password">Password:<br></label>
            <input type="password" name="password" id="password"  >
        </div>
        <div class="container__item">
            <label for="confirmpass">Confirm Password<br></label>
            <input type="password" name="confirmpass" id="confirmpass">
        </div>
        <div class="container__item">
            <h3>Gender</h3>
            <label for="male">Male</label>
            <input type="radio" name="gender" id="male" value="male">
            <label for="female">FeMale</label>
            <input type="radio" name="gender" id="female" value="female">
        </div>
        <div class="container__item">
            <label for="dob">Date of Birth<br></label>
            <input type="date" name="dob" id="dob">
        </div>
        <div class="container__item">
            <input type="submit" value="Create Account" id="submit">
        </div>
    </form>
    <script  src="../js/ValidateSignup.js"></script>
</body>
</html>