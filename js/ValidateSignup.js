var form = document.forms[0];
var submit = document.getElementById("submit");
var username = document.getElementById("username");
var password = document.getElementById("password");
var cpass = document.getElementById("confirmpass");
validate = function(){

    if(username.value == ""){
        alert("username is not blank");
        return false;
    }
    if(password.value == ""){
        alert("password is not blank");
        return false;
    }
    if(cpass.value == ""){
        alert("confirm password is not blank");
        return false;
    }
    if(password.value != cpass.value){
        alert("password must like confirm password")
        return false;
    }
    return true;
}


