/*
 * Page search.
 *
 * Matches are highlighted with the browser's CSS Custom Highlight API, which colours
 * text without changing the page's HTML, so links and formatting are never touched.
 * In browsers without that API the search button simply stays hidden, and the
 * browser's own Find (Cmd/Ctrl + F) still works.
 */
(() => {
    "use strict";

    const toggle = document.querySelector(".search-toggle");
    const form = document.getElementById("search");
    const nav = document.querySelector(".nav");
    const scope = document.querySelector("main");
    if (!toggle || !form || !nav || !scope || !("highlights" in CSS) || typeof Highlight !== "function") {
        return;
    }

    const input = form.querySelector("input");
    const count = form.querySelector(".search-count");
    const prevButton = form.querySelector('[data-search="prev"]');
    const nextButton = form.querySelector('[data-search="next"]');
    const header = document.querySelector(".site-header");
    const BLOCKS = "p, li, h1, h2, h3, h4, div, section, td, th, dt, dd, figcaption";

    let matches = [];
    let current = -1;
    let lastQuery = "";
    let typingTimer = null;

    toggle.hidden = false;

    // Visible text nodes inside <main>, in reading order.
    function textNodes() {
        const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, {
            acceptNode(node) {
                const parent = node.parentElement;
                if (!parent || parent.closest("[hidden], script, style, svg")) {
                    return NodeFilter.FILTER_REJECT;
                }
                return parent.getClientRects().length ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
            },
        });
        const nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);
        return nodes;
    }

    // Find every occurrence of the query as a Range. The page text is flattened into one
    // lower-case string (runs of spaces collapsed, a break between separate blocks), so a
    // match may span formatting such as "Top-<i>k</i>", but never jumps between paragraphs.
    function findRanges(query) {
        const needle = query.toLowerCase().replace(/\s+/g, " ").trim();
        if (!needle) return [];

        let flat = "";
        const origin = []; // origin[i] = [text node, offset] for flat[i]
        let lastBlock = null;
        for (const node of textNodes()) {
            const block = node.parentElement.closest(BLOCKS);
            if (block !== lastBlock && flat) {
                flat += "\u0000";
                origin.push(null);
            }
            lastBlock = block;
            for (let i = 0; i < node.data.length; i++) {
                let ch = node.data[i];
                if (/\s/.test(ch)) {
                    if (flat.endsWith(" ")) continue;
                    ch = " ";
                } else {
                    const lower = ch.toLowerCase();
                    if (lower.length === 1) ch = lower; // keep one character per position
                }
                flat += ch;
                origin.push([node, i]);
            }
        }

        const ranges = [];
        for (let at = flat.indexOf(needle); at !== -1; at = flat.indexOf(needle, at + needle.length)) {
            const start = origin[at];
            const end = origin[at + needle.length - 1];
            if (!start || !end) continue;
            const range = new Range();
            range.setStart(start[0], start[1]);
            range.setEnd(end[0], end[1] + 1);
            ranges.push(range);
        }
        return ranges;
    }

    function showCount() {
        if (!input.value.trim()) {
            count.textContent = "";
        } else if (!matches.length) {
            count.textContent = "No matches";
        } else {
            count.textContent = `${current + 1} of ${matches.length}`;
        }
        prevButton.disabled = nextButton.disabled = matches.length < 2;
    }

    function scrollToCurrent() {
        const rect = matches[current].getBoundingClientRect();
        const top = header.getBoundingClientRect().bottom;
        const visible = rect.top >= top + 8 && rect.bottom <= window.innerHeight - 8;
        if (visible) return;
        const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const target = window.scrollY + rect.top - top - (window.innerHeight - top) / 3;
        window.scrollTo({ top: Math.max(0, target), behavior: smooth ? "smooth" : "auto" });
    }

    function goTo(index) {
        if (!matches.length) return;
        current = (index + matches.length) % matches.length;
        CSS.highlights.set("search-current", new Highlight(matches[current]));
        showCount();
        scrollToCurrent();
    }

    function runSearch() {
        lastQuery = input.value;
        matches = findRanges(lastQuery);
        current = -1;
        CSS.highlights.set("search", new Highlight(...matches));
        CSS.highlights.delete("search-current");
        if (matches.length) {
            goTo(0);
        } else {
            showCount();
        }
    }

    function clearSearch() {
        matches = [];
        current = -1;
        lastQuery = "";
        CSS.highlights.delete("search");
        CSS.highlights.delete("search-current");
        showCount();
    }

    const isOpen = () => nav.classList.contains("search-open");

    function open() {
        nav.classList.add("search-open");
        toggle.setAttribute("aria-expanded", "true");
        toggle.setAttribute("aria-label", "Close search");
        input.focus();
        input.select();
        if (input.value.trim()) runSearch();
    }

    function close(returnFocus = true) {
        nav.classList.remove("search-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Search this page");
        clearSearch();
        if (returnFocus) toggle.focus();
    }

    toggle.addEventListener("click", () => (isOpen() ? close() : open()));

    // Clicking anywhere outside the navigation bar closes the search.
    document.addEventListener("click", (event) => {
        if (isOpen() && !nav.contains(event.target)) close(false);
    });

    // Search as you type (after a short pause).
    input.addEventListener("input", () => {
        clearTimeout(typingTimer);
        typingTimer = setTimeout(runSearch, 200);
    });

    // Enter = next match, Shift+Enter = previous match.
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        clearTimeout(typingTimer);
        if (input.value !== lastQuery) {
            runSearch();
        } else if (matches.length) {
            goTo(current + (event.submitter === prevButton ? -1 : 1));
        }
    });

    input.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && event.shiftKey) {
            event.preventDefault();
            clearTimeout(typingTimer);
            if (input.value !== lastQuery) runSearch();
            else goTo(current - 1);
        }
    });

    nav.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && isOpen()) {
            event.preventDefault();
            close();
        }
    });

    form.addEventListener("click", (event) => {
        const action = event.target.closest("[data-search]")?.dataset.search;
        if (action === "prev") goTo(current - 1);
        if (action === "next") goTo(current + 1);
    });
})();
