function removeAd(){
    let hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1")
        return;
    let childOfBody = document.body.children;
    let divsOfBody = childOfBody[childOfBody.length-1]
    console.log(document.getElementsByTagName("body")[0].removeChild(divsOfBody));
}
  
document.addEventListener("DOMContentLoaded", function() {
    removeAd();
});