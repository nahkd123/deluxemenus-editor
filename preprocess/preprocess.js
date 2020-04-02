//////////////////////
// Run with NodeJS! //
//////////////////////
const fs = require("fs");

const inputs = {
    css: "input_css.css",
    json: require("./input_json.json")
};
const output = "./output_json.json";

const cssIn = fs.readFileSync(inputs.css, {encoding: "utf8"}).replace("\r", "").split("\n");
let parsed = {};
cssIn.forEach(entry => {
    const arr = entry.split("{");
    let head = arr[0];
    if (head.startsWith(".icon-minecraft-sm.")) return;
    head = head.substr(16);
    let ctx = arr[1].substr(20);
    ctx = ctx.substr(0, ctx.length - 2);

    const arr2 = ctx.split(" ");
    const offX = -parseInt(arr2[0].substr(0, arr2[0].length - (arr2[0].endsWith("px")? 2: 0)));
    const offY = -parseInt(arr2[1].substr(0, arr2[1].length - (arr2[1].endsWith("px")? 2: 0)));

    parsed[head] = {x: offX, y: offY};
});

fs.writeFileSync(output, JSON.stringify(parsed), {encoding: "utf8"});