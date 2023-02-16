const backdrop = document.querySelector('.backdrop'); // background behind the menu on mobile
const mobileNav = document.querySelector('.mobile-nav'); // mobile nav bar
const menuToggle = document.querySelector('#side-menu-toggle'); // menu button for mobile

const input = document.getElementById("amount");
const productIdInput = document.querySelector('input[name="productId"]');

// when we click off the mobile side menu, remove the backdrop and remove the 'open' class from the menu
function backdropClickHandler() {
  backdrop.style.display = 'none';
  mobileNav.classList.remove('open');
}

// when mobile 'menu' clicked, add the open class to the menu and add backdrop
function menuToggleClickHandler() {
  backdrop.style.display = 'block';
  mobileNav.classList.add('open'); 
}

backdrop.addEventListener('click', backdropClickHandler);
menuToggle.addEventListener('click', menuToggleClickHandler);

// if i add wish lists
// const heart = document.querySelector('.fa-heart');
// heart.addEventListener('mouseover', () => {
//   heart.classList.remove('fa-regular');
//   heart.classList.add('fa-solid');
// });
// heart.addEventListener('mouseout', () => {
//   heart.classList.remove('fa-solid');
//   heart.classList.add('fa-regular');
// });

// for uploading photo
// $('#upload-div').click(function() {
//   $('#add-prod-image').trigger('click');
// });
