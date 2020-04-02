/*
mcfont.js
Load Minecraft font

Requires:
- /assets/font
- /assets/fontinfo
*/

(function() {
    "use strict";

    let mappedNamespaces = {};
    function mapKey(namespace, target) {
        mappedNamespaces[namespace] = target;
    }
    function parseKey(val) {
        for (let a in mappedNamespaces) if (val.startsWith(a)) return val.replace(new RegExp(a + ":"), mappedNamespaces[a]);
    }
    mapKey("minecraft", "/assets/");

    /**
     * @param {String} ch
     * @param {Image} img 
     * @param {Number} x 
     * @param {Number} y 
     * @param {Number} sizeW 
     */
    function measureWidth(ch, img, x, y, sizeW = (img.width / 16), sizeH = (sizeW)) {
        if (ch === " ") return 3;
        if (ch === "\u0000") return 0;

        const imgX = x * sizeW;
        const imgY = y * sizeH;
        if (ch === "đ") console.log("abc", x, y, imgX, imgY, sizeW, sizeH);
        let cv = new OffscreenCanvas(sizeW, sizeH);
        cv.getContext("2d").drawImage(img, imgX, imgY, sizeW, sizeH, 0, 0, sizeW, sizeH);
        /**
         * 
         * @param {CanvasRenderingContext2D} ctx 
         * @param {Number} col 
         * @param {Number} size 
         */
        function hasPixelInColumn(ctx, col, size) {
            const dat = ctx.getImageData(col, 0, 1, size);
            for (let i = 0; i < dat.data.length; i++) {
                if (dat.data[i] !== 0) return true;
            }
            return false;
        }

        for (let i = 0; i < sizeW; i++) if (!hasPixelInColumn(cv.getContext("2d"), i, sizeW)) return i + 1;
        return sizeW;
    }
    function executeIfFileExist(src, succ, fail) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = (event) => {
            if (xhr.status === 200) succ(event, xhr);
            else fail(event, xhr);
        };
        xhr.open("GET", src);
        xhr.send(null);
    }

    let images = {};
    /**
     * 
     * @param {String} img 
     * @param {Function} callback 
     */
    function loadImage(img, callback) {
        if (images[img] !== undefined) {
            if (callback !== undefined) callback("loaded");
            return;
        }

        // Load
        img = parseKey(img);

        let image = new Image();
        image.addEventListener("load", (event) => {
            if (callback !== undefined) callback("loaded");
        });
        image.src = img;
        images[img] = image;
        mappedNamespaces[img] = image;
    }

    let fontMap = {};
    let imageMap = {};
    let fontMapCached = false;
    let checkedCacheInServer = false;
    function loadFontFile(path) {
        let ts = Date.now();
        fetch(path).then((response) => {
            if (response.ok) return response.json();
            else {
                console.log("[font] Failed to load font file '" + path + "'. Retry in 1 seconds...");
                setTimeout(() => {loadFontFile(path);}, 1000);
                return null;
            }
        }).then((json) => {
            if (json === null || json === undefined) return;
            console.log(json);
            json.providers.forEach(p => {if (p.type === "bitmap") {
                if (imageMap[p.file] === undefined) imageMap[p.file] = "";
                loadImage(p.file, (status) => {
                    // Replace with new width
                    /*if (fontMapCached) return;
                    if (!checkedCacheInServer) {
                        executeIfFileExist(
                            "/assets/fontinfo/cpusave.json",
                            (a, xhr) => {
                                if (xhr.readyState === XMLHttpRequest.DONE) {
                                    checkedCacheInServer = true;
                                    fontMapCached = true;
                                    fontMap = JSON.parse(xhr.response);
                                }
                            },
                            a => {checkedCacheInServer = true;}
                        );
                    }*/

                    setTimeout(() => {
                        let ts = Date.now();
                        imageMap[p.file].split("").forEach(ch => {
                            if (fontMapCached) return;
                            let image = images[fontMap[ch].img];
                            fontMap[ch].w = measureWidth(
                                ch,
                                image,
                                fontMap[ch].x,
                                fontMap[ch].y,
                                image.width / 16,
                                fontMap[ch].asc
                            );
                        });
                        console.log("[MCFont] Reloaded fontwidth for " + p.file + " in " + (Date.now() - ts) + "ms");
                    });
                });
                p.chars.forEach((line, y) => {
                    line = line.replace("\u0000", "");
                    imageMap[p.file] += line;
                    line.split("").forEach((ch, x) => {
                        fontMap[ch] = {img: parseKey(p.file), x: x, y: y, w: p.ascent, iclines: p.chars.length, asc: p.ascent};
                    });
                });
            }});
            console.log("[MCFont] Loaded map in " + (Date.now() - ts) + "ms");
        });
    }

    /**
     * Draw text to canvas. White color only
     * @param {CanvasRenderingContext2D} ctx 
     * @param {String} text 
     * @param {Number} canvasX 
     * @param {Number} canvasY 
     * @param {Number} scale 
     */
    function drawText(ctx, text, canvasX = 0, canvasY = 0, scale = 1.0) {
        text.split("").forEach(ch => {
            const char = fontMap[ch];
            const csizeW = images[char.img].width / 16;
            const csizeH = char.asc;
            console.log(ch, char);
            if (ch === " ") canvasX += 3;
            else ctx.drawImage(
                images[char.img],
                csizeW * char.x, csizeH * char.y, char.w, csizeH,
                canvasX, canvasY, char.w * scale, csizeH  * scale
            );
            canvasX += char.w;
        });
        return canvasX;
    }

    // Load font file (async)
    setTimeout(() => {
        loadFontFile("/assets/fontinfo/default.json");
    }, 0);
    globalThis.MCFont = {
        info: {version: 1, author: "nahkd123", description: "Load Minecraft font and use with HTML5 Canvas (1.15)"},
        drawText: drawText,
        m: fontMap
    };
})();