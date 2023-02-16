
document.getElementById("add-prod-image").addEventListener("change", function() {
  document.getElementById("upload-div").style.display = 'none';

  var preview = document.getElementById("preview");
  var file = document.querySelector('input[name="image"]').files[0];
  var reader = new FileReader();

  reader.addEventListener("load", function () {
    preview.src = reader.result;
  }, false);

  if (file) {
    reader.readAsDataURL(file);
  }
});

document.getElementById("add-prod-price").addEventListener("input", function() {
  let value = this.value;
  let decimalIndex = value.indexOf(".");
  
  if (decimalIndex >= 0 && value.length - decimalIndex - 1 > 2) {
    this.value = value.substring(0, decimalIndex + 3);
  }
});

document.getElementById("add-prod-quantity").addEventListener("input", function() {
  let value = this.value;
  
  let hasNonNumber = !value.match(/^[0-9]+$/);

  if (hasNonNumber) {
    this.value = value.substring(0, value.length - 1);
  }
});

const uploadDiv = document.getElementById('upload-div');
const fileInput = document.getElementById('add-prod-image');

uploadDiv.onclick = function() {
  fileInput.click();
}