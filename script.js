const editor = document.querySelector("#editor");
const highlightContent = document.querySelector("#highlight-content");

const testUrl = document.querySelector("#test-url");
const botSelect = document.querySelector("#bot-select");
const testButton = document.querySelector("#test-btn");
const resultBox = document.querySelector("#result-box");

const sitemapUrlInput = document.querySelector("#sitemap-url");
const sitemapButton = document.querySelector("#sitemap-btn");
const sitemapStatus = document.querySelector("#sitemap-status");
const sitemapResults = document.querySelector("#sitemap-results");


// DEVELOPER A — TEXT EDITOR

function escapeHTML(text) {
    return text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
}


function resetResult() {

    resultBox.textContent = "RESULT";

    resultBox.style.backgroundColor = "";
    resultBox.style.color = "";
}


function highlightText() {

    const text = editor.value;

    const lines = text.split("\n");

    let html = "";

    for (let i = 0; i < lines.length; i++) {

        const line = lines[i];

        if (line.startsWith("#")) {

            html += `<span class="comment">${escapeHTML(line)}</span>`;

        }

        else if (line.toLowerCase().startsWith("user-agent:")) {

            const parts = line.split(":");

            const directive = parts[0];
            const value = parts.slice(1).join(":");

            html +=
                `<span class="directive">${escapeHTML(directive)}:</span>` +
                `<span class="value">${escapeHTML(value)}</span>`;

        }

        else if (line.toLowerCase().startsWith("disallow:")) {

            const parts = line.split(":");

            const directive = parts[0];
            const value = parts.slice(1).join(":");

            html +=
                `<span class="disallow">${escapeHTML(directive)}:</span>` +
                `<span class="value">${escapeHTML(value)}</span>`;

        }

        else if (line.toLowerCase().startsWith("allow:")) {

            const parts = line.split(":");

            const directive = parts[0];
            const value = parts.slice(1).join(":");

            html +=
                `<span class="allow">${escapeHTML(directive)}:</span>` +
                `<span class="value">${escapeHTML(value)}</span>`;

        }

        else {

            html += escapeHTML(line);
        }

        html += "<br>";
    }

    highlightContent.innerHTML = html;

    resetResult();
}


editor.addEventListener("input", highlightText);


// DEVELOPER A — SCROLL SYNCHRONIZATION

editor.addEventListener("scroll", function () {

    highlightContent.scrollTop = editor.scrollTop;
    highlightContent.scrollLeft = editor.scrollLeft;

});


highlightText();


// DEVELOPER B — ROBOTS.TXT CHECKER

function isBlocked(robotsText, selectedBot, testPath) {

    const lines = robotsText.split("\n");

    let insideSection = false;
    let blocked = false;

    for (let i = 0; i < lines.length; i++) {

        const line = lines[i].trim();


        // FIND THE SELECTED BOT

        if (line.toLowerCase().startsWith("user-agent:")) {

            const agent = line.split(":").slice(1).join(":").trim();

            if (agent.toLowerCase() === selectedBot.toLowerCase()) {

                insideSection = true;

                continue;
            }

            insideSection = false;

            continue;
        }


        // IF WE ARE INSIDE THE BOT'S SECTION

        if (insideSection) {

            if (line === "") {
                break;
            }

            if (line.toLowerCase().startsWith("disallow:")) {

                const parts = line.split(":");

                const rulePath = parts.slice(1).join(":").trim();

                if (rulePath !== "") {

                    if (testPath.startsWith(rulePath)) {

                        blocked = true;

                        break;
                    }
                }
            }
        }
    }

    return blocked;
}


botSelect.addEventListener("change", resetResult);
testUrl.addEventListener("input", resetResult);


testUrl.addEventListener("keydown", function (event) {

    if (event.key === "Enter") {

        testButton.click();
    }
});


testButton.addEventListener("click", function () {

    const robotsText = editor.value;
    const testPath = testUrl.value.trim();
    const selectedBot = botSelect.value;

    const blocked = isBlocked(robotsText, selectedBot, testPath);

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


// SITEMAP BULK TEST

function setSitemapStatus(message, type) {

    sitemapStatus.textContent = message;

    sitemapStatus.classList.remove("error", "success");

    if (type === "error") {
        sitemapStatus.classList.add("error");
    }

    if (type === "success") {
        sitemapStatus.classList.add("success");
    }
}

function extractLocsFromSitemap(xmlText) {

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "application/xml");

    const parseError = xmlDoc.querySelector("parsererror");

    if (parseError) {
        throw new Error("That file doesn't look like valid XML.");
    }

    const locNodes = xmlDoc.getElementsByTagName("loc");

    const urls = [];

    for (let i = 0; i < locNodes.length; i++) {

        const value = locNodes[i].textContent.trim();

        if (value !== "") {
            urls.push(value);
        }
    }

    return urls;
}

function toPath(fullUrl) {

    try {

        const parsed = new URL(fullUrl);

        return parsed.pathname === "" ? "/" : parsed.pathname;

    } catch (err) {

        return fullUrl;
    }
}


// Build one result row for the sitemap results list
function renderSitemapRow(url, blocked) {

    const row = document.createElement("div");
    row.className = "sitemap-row";

    const urlText = document.createElement("span");
    urlText.className = "sitemap-row-url";
    urlText.textContent = url;

    const badge = document.createElement("span");
    badge.className = "sitemap-row-badge " + (blocked ? "blocked" : "allowed");
    badge.textContent = blocked ? "BLOCKED" : "ALLOWED";

    row.appendChild(urlText);
    row.appendChild(badge);

    sitemapResults.appendChild(row);
}


sitemapButton.addEventListener("click", async function () {

    const sitemapUrl = sitemapUrlInput.value.trim();

    sitemapResults.innerHTML = "";

    if (sitemapUrl === "") {

        setSitemapStatus("Enter a sitemap.xml URL first.", "error");

        return;
    }

    setSitemapStatus("Loading sitemap...", "");

    let xmlText;

    try {

        const response = await fetch(
            "/api/sitemap?url=" + encodeURIComponent(sitemapUrl)
        );

        if (!response.ok) {

            let message = "Server responded with " + response.status + ".";

            try {

                const errorBody = await response.json();

                if (errorBody && errorBody.error) {
                    message = errorBody.error;
                }

            } catch (parseErr) {

            }

            setSitemapStatus("Couldn't load that sitemap — " + message, "error");

            return;
        }

        xmlText = await response.text();

    } catch (err) {

        setSitemapStatus(
            "Couldn't reach the sitemap proxy. Make sure the site is " +
            "deployed with the /api/sitemap function included.",
            "error"
        );

        return;
    }

    let urls;

    try {

        urls = extractLocsFromSitemap(xmlText);

    } catch (err) {

        setSitemapStatus(err.message, "error");

        return;
    }

    if (urls.length === 0) {

        setSitemapStatus("No <loc> URLs found in that sitemap.", "error");

        return;
    }

    const robotsText = editor.value;
    const selectedBot = botSelect.value;

    let blockedCount = 0;

    for (let i = 0; i < urls.length; i++) {

        const path = toPath(urls[i]);

        const blocked = isBlocked(robotsText, selectedBot, path);

        if (blocked) {
            blockedCount++;
        }

        renderSitemapRow(urls[i], blocked);
    }

    setSitemapStatus(
        "Tested " + urls.length + " URL" + (urls.length === 1 ? "" : "s") +
        " — " + blockedCount + " blocked, " +
        (urls.length - blockedCount) + " allowed.",
        "success"
    );

});
