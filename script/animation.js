document.addEventListener("DOMContentLoaded", () => {
    const animatedSections = [
        { 
            id: "microscope", 
            animation: "microscope-move 2s ease-in-out infinite", 
            resetTransform: "rotate(0deg)" 
        },
        { 
            id: "book", 
            animation: "microscope-move 2s ease-in-out infinite", 
            resetTransform: "rotate(0deg)" 
        },
        { 
            id: "chalkboard", 
            animation: "microscope-move 2s ease-in-out infinite", 
            resetTransform: "rotate(0deg)" 
        },
    ];

    animatedSections.forEach((section) => {
        const element = document.getElementById(section.id);
        let isClicked = false; // Tracks if the animation is stopped by clicking

        // Function to start the animation
        const startAnimation = () => {
            element.style.animation = section.animation; // Apply the animation
            element.style.animationPlayState = "running"; // Resume animation
        };

        // Function to stop the animation and reset to the original position
        const stopAnimation = () => {
            element.style.animationPlayState = "paused"; // Pause animation
            setTimeout(() => {
                element.style.animation = "none"; // Completely stop animation
                element.style.transform = section.resetTransform; // Reset to default position
            }, 10); // Small delay to ensure smooth stopping
        };

        // Initially start the animation for 2 seconds, then stop
        startAnimation();
        setTimeout(() => {
            stopAnimation();
        }, 2000);

        // Resume animation on hover if not clicked
        element.addEventListener("mouseenter", () => {
            if (!isClicked) {
                startAnimation();
            }
        });

        // Pause animation on hover out if not clicked
        element.addEventListener("mouseleave", () => {
            if (!isClicked) {
                stopAnimation();
            }
        });

        // Toggle animation state on click
        element.addEventListener("click", () => {
            isClicked = !isClicked; // Toggle clicked state
            if (isClicked) {
                stopAnimation(); // Stop completely
            } else {
                startAnimation(); // Resume animation
            }
        });
    });
});
