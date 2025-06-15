const UPLOAD_FILE_API_URL = "/api/files.php";


function removeAd(){
    let hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1")
        return;
    let childOfBody = document.body.children;
    let divsOfBody = childOfBody[childOfBody.length-1]
    console.log(document.getElementsByTagName("body")[0].removeChild(divsOfBody));
}

function objectifyForm(formArray) {
  let duplicateArray = countDuplicateArray(formArray);
  //serialize data function
  console.log(formArray)
  let returnArray = {};
  for (let i = 0; i < formArray.length; i++){
    if(duplicateArray[formArray[i]['name']] > 1){
      if(formArray[i]['name'].includes(".")){
        let attributes = formArray[i]['name'].split(".");
        let arr = []
        let object = {}
        object[attributes[1]] = formArray[i]['value']
        if(returnArray[attributes[0]] === undefined)
          returnArray[attributes[0]]=[]
        arr = [...returnArray[attributes[0]]];
        arr.push(object)
        returnArray[attributes[0]] = arr;
      }
      else {
        let attributeName = formArray[i]['name'];
        let arr = []
        if(returnArray[attributeName] === undefined)
          returnArray[attributeName]=[]
        arr = [...returnArray[attributeName]];
        arr.push(formArray[i]['value'])
        returnArray[attributeName] = arr;
      }
      continue;
    }
    if(formArray[i]['name'].includes(".")){
      let attributes = formArray[i]['name'].split(".");
      let object = {}
      if(returnArray[attributes[0]] !== undefined)
        object = returnArray[attributes[0]];
      object[attributes[1]] = formArray[i]['value'];
      returnArray[attributes[0]] = object;
      continue;
    }
    returnArray[formArray[i]['name']] = formArray[i]['value'];
  }
  return returnArray;
}

function countDuplicateArray(arr){
  const counts = {};
  arr.forEach(function (x) { counts[x.name] = (counts[x.name] || 0) + 1; });
  return counts
}

function callUploadFile(file, method = 'POST', url = UPLOAD_FILE_API_URL, async = true, onSuccess = () => {}, onError = () => {}) {
  if (!file) return;

  let form = new FormData();
  form.append('file', file);
  let xhr = new XMLHttpRequest();
  xhr.open(method, url, async);
  xhr.onload = function () {
    try {
      let res = JSON.parse(this.responseText);
      if (xhr.status === 200) {
        onSuccess(res);
      } else {
        onError(res);
      }
    } catch (err) {
      onError(err);
    }
  };
  xhr.onerror = function () {
    onError(new Error('Network error'));
  };
  xhr.send(form);
}

// display login response  from server
function toast($toast,type, title, content){
  if(type === "success"){
    $toast.find(".toast-icon").attr("class","toast-icon fas fa-check text-primary")
  }
  else if(type === "failed"){
    $toast.find(".toast-icon").attr("class","toast-icon fas fa-exclamation-circle text-danger");
  }
  $toast.find(".toast-title").text(title);
  $toast.find(".toast-body").text(content);
  $toast.toast("show");
}

export {UPLOAD_FILE_API_URL, objectifyForm, callUploadFile };

document.addEventListener("DOMContentLoaded", removeAd);