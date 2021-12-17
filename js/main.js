//add sticky navigation bar 
window.onscroll = function() {myFunction()};
let x = document.getElementsByClassName("header__nav");
let navbar = x[0];
let sticky = navbar.offsetTop;
function myFunction() {
  if (window.pageYOffset >= sticky) {
    navbar.classList.add("sticky");
  } else {
    navbar.classList.remove("sticky");
  }
}
// display random quote
let quoteSentenceTag = document.querySelector("#quoteSentence");
let quoteAuthorTag = document.querySelector("#quoteAuthor")

let xhr = new XMLHttpRequest();
xhr.open("GET","php/getRandomQuote.php");
xhr.onreadystatechange = function(){
  if(this.readyState==4 && this.status==200){
    quoteObject = JSON.parse(this.responseText);
    quoteSentenceTag.textContent = quoteObject.content;
    quoteAuthorTag.textContent = quoteObject.author;
  } 
}
xhr.send();

//display a huge picture
let modal = document.getElementById("modal");
let img = document.getElementById("imageShow");
let close = document.getElementById("modal__close");
let caption = document.getElementById("modal__caption");
let imgs = document.getElementsByClassName("grid__gallery__img");
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
let index = 1;
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
setInterval(() => {
  plusDiv(1)
}, 7000);
function removeAd(){
  let childOfBody = document.body.children;
  let divsOfBody = childOfBody[childOfBody.length-1]
  console.log(document.getElementsByTagName("body")[0].removeChild(divsOfBody));
}

