/* This runs on Vercel's server, not in the browser — so it
is not subject to the browser's CORS restrictions. The
frontend calls this endpoint instead of fetching the
target sitemap directly. */

module.exports = async (req, res) => {

    const url = req.query.url;

    if (!url) {

        res.status(400).json({ error: "Missing 'url' query parameter." });

        return;
    }

    let targetUrl;

    try {

        targetUrl = new URL(url);

    } catch (err) {

        res.status(400).json({ error: "That doesn't look like a valid URL." });

        return;
    }

    /* Only allow http/https, so this can't be pointed at
    internal or unexpected protocols */
    
    if (targetUrl.protocol !== "http:" && targetUrl.protocol !== "https:") {

        res.status(400).json({ error: "Only http and https URLs are allowed." });

        return;
    }

    try {

        const response = await fetch(targetUrl.toString());

        if (!response.ok) {

            res.status(response.status).json({
                error: "Target server responded with " + response.status,
            });

            return;
        }

        const text = await response.text();

        res.setHeader("Content-Type", "application/xml");
        res.status(200).send(text);

    } catch (err) {

        res.status(502).json({ error: "Could not reach that URL." });
    }
};
