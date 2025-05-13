function removeAd(){
    let childOfBody = document.body.children;
    let divsOfBody = childOfBody[childOfBody.length-1]
    console.log(document.getElementsByTagName("body")[0].removeChild(divsOfBody));
}
  
document.addEventListener("DOMContentLoaded", function() {
    removeAd();
});