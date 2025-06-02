document.addEventListener("DOMContentLoaded", () => {
    const searchContainer = document.querySelector(".search-container");
    const searchWrapper = document.querySelector(".search-wrapper");
    const searchBar = document.querySelector(".search-bar");
    const searchIcon = document.querySelector(".search-icon");
    const tooltip = document.querySelector(".tooltip");
    let nextIcon = null;
    let matches = [];
    let currentMatchIndex = 0;

    // Show tooltip on hover
    searchIcon.addEventListener("mouseenter", () => {
        if (!searchContainer.classList.contains("active")) {
            tooltip.style.opacity = "1"; // Show tooltip
        }
    });

    // Hide tooltip on hover out if the search bar is not expanded
    searchIcon.addEventListener("mouseleave", () => {
        if (!searchContainer.classList.contains("active")) {
            tooltip.style.opacity = "0"; // Hide tooltip
        }
    });

    // Expand search bar on clicking the search icon
    searchIcon.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent closing the bar on icon click
        if (!searchContainer.classList.contains("active")) {
            // Expand search bar
            searchContainer.classList.add("active");
            searchWrapper.classList.add("active");
            searchWrapper.appendChild(searchIcon); // Move icon inside the bar
            searchBar.focus();
            tooltip.style.opacity = "0"; // Hide tooltip initially
        } else {
            performSearch(); // Perform search if already expanded
        }
    });

    // Collapse search bar and reset on clicking outside
    document.addEventListener("click", (e) => {
        if (!searchContainer.contains(e.target)) {
            searchContainer.classList.remove("active");
            searchWrapper.classList.remove("active");
            tooltip.textContent = "Search"; // Reset tooltip to default
            tooltip.style.opacity = "0"; // Hide tooltip when search bar is collapsed
            searchContainer.appendChild(searchIcon); // Reset icon position
            searchIcon.style.display = "inline-block"; // Ensure icon is visible
            if (nextIcon) nextIcon.style.display = "none"; // Hide next icon if present
            clearHighlights(); // Reset all highlights
        }
    });

    // Hide tooltip if search box is empty
    searchBar.addEventListener("input", () => {
        if (searchBar.value.trim() === "") {
            tooltip.style.opacity = "0"; // Hide tooltip when empty
        }
    });

    // Execute search on pressing Enter
    searchBar.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            performSearch();
        }
    });

    // Perform the search
    const performSearch = () => {
        const query = searchBar.value.trim().toLowerCase();
        if (!query) {
            tooltip.style.opacity = "0"; // Hide tooltip if query is empty
            return;
        }

        // Clear previous highlights
        clearHighlights();

        // Find all matches and highlight them
        const searchableElements = document.querySelectorAll("p, h2, h3, h4"); // Searchable tags
        matches = [];
        searchableElements.forEach((element) => {
            const regex = new RegExp(query, "gi");
            const content = element.textContent;
            const highlightedContent = content.replace(regex, (match) => {
                matches.push(element);
                return `<span class="highlight">${match}</span>`;
            });
            element.innerHTML = highlightedContent;
        });

        // Update tooltip based on results
        if (matches.length > 0) {
            currentMatchIndex = 0;
            scrollToMatch(currentMatchIndex);
            tooltip.textContent = `${currentMatchIndex + 1} of ${matches.length}`; // Update tooltip with counter
            tooltip.style.opacity = "1"; // Redisplay tooltip
            showNextIcon(); // Display next button
        } else {
            tooltip.textContent = "No occurrences found"; // No matches
            tooltip.style.opacity = "1"; // Redisplay tooltip
            hideNextIcon(); // Keep the search icon visible
        }
    };

    // Scroll to a specific match
    const scrollToMatch = (index) => {
        const highlights = document.querySelectorAll(".highlight");
        if (highlights.length > 0 && highlights[index]) {
            highlights.forEach((highlight) => highlight.classList.remove("current-match"));
            highlights[index].scrollIntoView({ behavior: "smooth", block: "center" });
            highlights[index].classList.add("current-match");
        }
    };

    // Clear previous highlights
    const clearHighlights = () => {
        const highlights = document.querySelectorAll(".highlight");
        highlights.forEach((highlight) => {
            const parent = highlight.parentNode;
            parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
        });
    };

    // Update the tooltip with the counter
    const updateTooltip = () => {
        tooltip.textContent = `${currentMatchIndex + 1} of ${matches.length}`;
    };

    // Navigate to the next match
    const goToNextMatch = () => {
        if (matches.length > 0) {
            currentMatchIndex = (currentMatchIndex + 1) % matches.length;
            scrollToMatch(currentMatchIndex);
            updateTooltip(); // Update tooltip with new index
        }
    };

    // Display the next navigation button
    const showNextIcon = () => {
        if (!nextIcon) {
            nextIcon = document.createElement("i");
            nextIcon.className = "fas fa-chevron-down next-icon";
            searchWrapper.appendChild(nextIcon);
            nextIcon.addEventListener("click", goToNextMatch);
        }
        nextIcon.style.display = "inline-block"; // Show the next button
        searchIcon.style.display = "none"; // Hide the search icon
    };

    // Hide the next navigation button and reset the search icon
    const hideNextIcon = () => {
        if (nextIcon) nextIcon.style.display = "none"; // Hide next icon
        searchIcon.style.display = "inline-block"; // Show the search icon
    };
});
