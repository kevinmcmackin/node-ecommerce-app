var dropdown = document.getElementById("admin-drop");
    dropdown.addEventListener("change", function() {
        if (dropdown.value === "Sold") {
            window.location.href = "/admin/sold-items";
        } else if (dropdown.value === "For Sale") {
            window.location.href = "/admin/products";
        }
    });