const editor = document.querySelector("#editor");
const highlightContent = document.querySelector("#highlight-content");

const testUrl = document.querySelector("#test-url");
const botSelect = document.querySelector("#bot-select");
const testButton = document.querySelector("#test-btn");
const resultBox = document.querySelector("#result-box");


// DEVELOPER A — TEXT EDITOR

// This function changes special HTML characters
// so the user's input is displayed safely.
function escapeHTML(text) {
    return text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
}


// Highlight the robots.txt text
function highlightText() {

    const text = editor.value;

    // Break the entire text into individual lines
    const lines = text.split("\n");

    let html = "";

    // Go through every line
    for (let i = 0; i < lines.length; i++) {

        const line = lines[i];

        // Check for comments
        if (line.startsWith("#")) {

            html += `<span class="comment">${escapeHTML(line)}</span>`;

        }

        // Check for User-agent
        else if (line.toLowerCase().startsWith("user-agent:")) {

            const parts = line.split(":");

            const directive = parts[0];
            const value = parts.slice(1).join(":");

            html +=
                `<span class="directive">${escapeHTML(directive)}:</span>` +
                `<span class="value">${escapeHTML(value)}</span>`;

        }

        // Check for Disallow
        else if (line.toLowerCase().startsWith("disallow:")) {

            const parts = line.split(":");

            const directive = parts[0];
            const value = parts.slice(1).join(":");

            html +=
                `<span class="disallow">${escapeHTML(directive)}:</span>` +
                `<span class="value">${escapeHTML(value)}</span>`;

        }

        // Check for Allow
        else if (line.toLowerCase().startsWith("allow:")) {

            const parts = line.split(":");

            const directive = parts[0];
            const value = parts.slice(1).join(":");

            html +=
                `<span class="allow">${escapeHTML(directive)}:</span>` +
                `<span class="value">${escapeHTML(value)}</span>`;

        }

        // Normal line
        else {

            html += escapeHTML(line);
        }

        // Add the line break back
        html += "<br>";
    }

    // Put the styled HTML into the backdrop
    highlightContent.innerHTML = html;
}


// Run highlighting whenever the user types
editor.addEventListener("input", highlightText);


// DEVELOPER A — SCROLL SYNCHRONIZATION

editor.addEventListener("scroll", function () {

    highlightContent.scrollTop = editor.scrollTop;
    highlightContent.scrollLeft = editor.scrollLeft;

});


// Run once when the page loads
highlightText();


// DEVELOPER B — ROBOTS.TXT CHECKER

testButton.addEventListener("click", function () {

    // Get the robots.txt text
    const robotsText = editor.value;

    // Get the URL/path the user wants to test
    const testPath = testUrl.value.trim();

    // Get the selected bot
    const selectedBot = botSelect.value;

    // Break robots.txt into individual lines
    const lines = robotsText.split("\n");

    // This tells us whether we have found
    // the correct User-agent section
    let insideSection = false;

    // This tells us whether a matching
    // Disallow rule was found
    let blocked = false;


    // GO THROUGH EVERY LINE

    for (let i = 0; i < lines.length; i++) {

        const line = lines[i].trim();


        // FIND THE SELECTED BOT

if (line.toLowerCase().startsWith("user-agent:")) {
    const agent = line.split(":").slice(1).join(":").trim();
    if (agent.toLowerCase() === selectedBot.toLowerCase()) {
        insideSection = true;
        continue;
    }
}


        // IF WE ARE INSIDE THE BOT'S SECTION

        if (insideSection) {


            // Stop when we reach a blank line
            if (line === "") {
                break;
            }


            // Stop when we reach another User-agent
            if (line.toLowerCase().startsWith("user-agent:")) {
                break;
            }


            // CHECK DISALLOW

            if (line.toLowerCase().startsWith("disallow:")) {

                const parts = line.split(":");

                const rulePath = parts.slice(1).join(":").trim();


                // Ignore an empty Disallow rule
                if (rulePath !== "") {

                    // Check whether the test path
                    // starts with the blocked path
                    if (testPath.startsWith(rulePath)) {

                        blocked = true;

                        break;
                    }
                }
            }
        }
    }


    // UPDATE RESULT

    if (blocked) {

        resultBox.textContent = "BLOCKED";

        resultBox.style.backgroundColor = "red";
        resultBox.style.color = "white";

    }

    else {

        resultBox.textContent = "ALLOWED";

        resultBox.style.backgroundColor = "green";
        resultBox.style.color = "white";
    }

});