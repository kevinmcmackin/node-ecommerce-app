input.addEventListener("blur", function () {
  const productId = productIdInput.value;
  fetch(`${window.location.origin}/update-amount`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ amount: input.value, prodId: productId })
  });
});

const uploadDiv = document.getElementById('upload-div');
const fileInput = document.getElementById('add-prod-image');

uploadDiv.onclick = function() {
  fileInput.click();
}