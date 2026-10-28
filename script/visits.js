/*
 * Visit counter in the footer.
 *
 * Fetches the site's total from GoatCounter and shows it at the bottom of the page.
 * It appears as soon as GoatCounter answers (GoatCounter refreshes the public total
 * every few hours). If GoatCounter is slow (over 5 seconds) or unavailable, nothing
 * is shown and the rest of the page is unaffected.
 */
(() => {
    "use strict";

    const code = document.currentScript?.dataset.code;
    const box = document.querySelector(".visits");
    const number = box?.querySelector(".visits-number");
    if (!code || !box || !number) return;

    const controller = new AbortController();
    setTimeout(() => controller.abort(), 5000);

    // "no-cache": always check with GoatCounter, so an old saved answer is never reused.
    fetch(`https://${code}.goatcounter.com/counter/TOTAL.json`, { cache: "no-cache", signal: controller.signal })
        .then((response) => (response.ok ? response.json() : Promise.reject(response.status)))
        .then((data) => {
            const digits = String(data?.count ?? "").replace(/\D/g, "");
            if (!digits) return;
            const total = Number(digits);
            number.textContent = total.toLocaleString("en-US");
            const label = box.querySelector(".visits-label");
            if (label) label.textContent = total === 1 ? "visit" : "visits";
            box.hidden = false;
            // Wait two frames so the fade-in transition runs after the element appears.
            requestAnimationFrame(() => requestAnimationFrame(() => box.classList.add("is-shown")));
        })
        .catch(() => {});
})();
