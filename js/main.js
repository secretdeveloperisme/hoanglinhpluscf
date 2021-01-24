//add sticky navigation bar 
window.onscroll = function() {myFunction()};
var x = document.getElementsByClassName("header__nav");
var navbar = x[0];
var sticky = navbar.offsetTop;
function myFunction() {
  if (window.pageYOffset >= sticky) {
    navbar.classList.add("sticky");
  } else {
    navbar.classList.remove("sticky");
  }
}
//display a huge picture
var modal = document.getElementById("modal");
var img = document.getElementById("modal__content");
var close = document.getElementById("modal__close");
var caption = document.getElementById("modal__caption");
var imgs = document.getElementsByClassName("grid__gallery__img");
for(i=0; i < imgs.length; i++){
  imgs[i].onclick = function(){
    img.src = this.src; 
    modal.style.display = "block"
    caption.innerHTML = this.alt;
}
}

close.onclick = function(){
  modal.style.display = "none";
}
// slide show 
  const slideshow_container = document.getElementsByClassName("slideshow_container")[0];
  const items = document.getElementsByClassName("slideshow_container__item");
  var index = 1;
  showDiv(1);
  function plusDiv(n){
      showDiv(index+=n);
  }
  function showDiv(n){
      if(n > items.length)
          index = 1;
      if (n < 1 )
          index = items.length;
      for(i = 0;i< items.length; i++){
          items[i].style.display = "none";
      }
      items[index -1 ].style.display="block";
  }
  function removeAd(){
    var childOfBody = document.body.children;
    var divsOfBody = childOfBody[childOfBody.length-2]
    console.log(document.getElementsByTagName("body")[0].removeChild(divsOfBody));
  }