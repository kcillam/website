document.addEventListener("DOMContentLoaded", () => {
    const loadingOverlay = document.getElementById("loading-overlay");
    const loadingLogo = document.getElementById("loading-logo");
    const folderPath = "images/website-logo-transition/"; // Path to your images
    const totalImages = 29 - 8 + 1; // Total images (from 8.jpg to 29.jpg)
    const images = [];

    // Populate the array with image paths
    for (let i = 8; i <= 29; i++) {
        images.push(`${folderPath}${i}.png`);
    }

    let currentIndex = 0;

    // Function to cycle through images
    const playAnimation = () => {
        loadingLogo.src = images[currentIndex]; // Update the logo source
        currentIndex = (currentIndex + 1) % images.length; // Loop back to the first image
    };

    // Start the animation (play every 100ms)
    const animationInterval = setInterval(playAnimation, 100);

   /* window.onload = () => {
        setTimeout(() => {
            clearInterval(animationInterval); // Stop cycling images
            loadingOverlay.style.opacity = "0"; // Fade out the overlay
            setTimeout(() => {
                loadingOverlay.style.display = "none"; // Hide it completely
            }, 500); // Wait for fade-out transition to complete
        }, 1000); // Add 5 seconds of additional delay
    };*/

    // Stop animation and remove the overlay after the website loads
    window.onload = () => {
        clearInterval(animationInterval); // Stop cycling images
        loadingOverlay.style.opacity = "0"; // Fade out the overlay
        setTimeout(() => {
            loadingOverlay.style.display = "none"; // Hide it completely
        }, 300); // Wait for the fade-out transition to complete
    };
});
