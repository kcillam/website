document.addEventListener("DOMContentLoaded", () => {
    const logo = document.getElementById("logo");
    const transitionImages = []; // Array to hold image paths
    const folderPath = "images/website-logo-transition/"; // Path to transition images
    const totalImages = 29 - 8 + 1; // Total images from "8.jpg" to "29.jpg"

    // Populate the array with image paths
    for (let i = 8; i <= 29; i++) {
        transitionImages.push(`${folderPath}${i}.png`);
    }

    let isHovered = false; // Tracks hover state
    let isClicked = false; // Tracks click state
    let currentIndex = 0; // Tracks the current image in transition
    let animationInterval = null; // Stores the interval for transitions

    // Function to start the transition
    const startTransition = () => {
        if (isClicked || animationInterval) return; // Do nothing if clicked or already transitioning

        animationInterval = setInterval(() => {
            // Update the image source
            currentIndex++;
            if (currentIndex >= transitionImages.length) {
                currentIndex = 0; // Reset to the beginning after 29
            }
            logo.src = transitionImages[currentIndex];

            // Stop the transition when we return to the first image (8.jpg)
            if (currentIndex === 0) {
                clearInterval(animationInterval);
                animationInterval = null;
            }
        }, 100); // Adjust interval duration between frames (100ms)
    };

    // Function to stop the transition
    const stopTransition = () => {
        clearInterval(animationInterval);
        animationInterval = null;
    };

    // Event: Hover starts the transition
    logo.addEventListener("mouseenter", () => {
        if (!isHovered && !isClicked) {
            isHovered = true;
            startTransition();
        }
    });

    // Event: Mouse leave resets hover state
    logo.addEventListener("mouseleave", () => {
        isHovered = false;
    });

    // Event: Click toggles the transition state
    logo.addEventListener("click", () => {
        if (isClicked) {
            // If clicked again, resume transition
            isClicked = false;
            startTransition();
        } else {
            // If clicked, stop transition
            isClicked = true;
            stopTransition();
        }
    });
});
