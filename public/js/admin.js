const deleteProduct = (btn) => {
    // we pass the buttons html via 'onclick'. then 
    const prodId = btn.parentNode.querySelector('[name=productId').value;
    const csrf = btn.parentNode.querySelector('[name=_csrf]').value;

    const productElement = btn.closest('article'); // closest gives element closest to that selector

    fetch('/admin/product/' + prodId, {
        method: 'DELETE', 
        headers: {
            'csrf-token': csrf
        }
    })
        .then(result => {
            return result.json();
        })
        .then(data => {
            console.log(data);
            productElement.parentNode.removeChild(productElement); // to remove the article element (product)
        })
        .catch(err => {
        console.log(err);
    });
}