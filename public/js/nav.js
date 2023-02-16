const searchInput = document.getElementById('search-input');
const searchLink = document.getElementById('search-link');

searchLink.addEventListener('click', function(event) {
    event.preventDefault(); // prevent the default link behavior

    const searchQuery = searchInput.value;

    if (searchQuery) {
        const newUrl = `/shop/?search=${encodeURIComponent(searchQuery)}`;
        window.location.href = newUrl;
    }
});

// Add event listener for keydown event on search input field
searchInput.addEventListener('keydown', function(event) {
    // Check if key pressed is the Enter key
    if (event.key === 'Enter') {
        event.preventDefault(); // prevent the default form submission behavior

        const searchQuery = searchInput.value;

        if (searchQuery) {
            const newUrl = `/shop/?search=${encodeURIComponent(searchQuery)}`;
            window.location.href = newUrl;
        }
    }
});