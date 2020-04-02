let images = {};
let tiles = {};
let tilesInfo = undefined;

(function() {
    "use strict";
    let chestGUIImg = new Image();
    chestGUIImg.onload = () => {
        images["chestGUI"] = chestGUIImg;
    };
    chestGUIImg.src = "./assets/gui/generic_54.png";

    let itemsTilesMapImg = new Image();
    itemsTilesMapImg.onload = () => {
        images["itemtiles"] = itemsTilesMapImg;
        if (tilesInfo !== undefined) tiles["itemtiles"] = new Tiles(itemsTilesMapImg, tilesInfo, 32, 32);
    };
    itemsTilesMapImg.src = "./assets/items/items_tiles.png";

    fetch("./assets/items/items_tiles.json").then(res => res.json()).then(tinf => {
        tilesInfo = tinf;
        if (images["itemtiles"] !== undefined) tiles["itemtiles"] = new Tiles(itemsTilesMapImg, tilesInfo, 32, 32);
    });
})();

let chestGUI = {
    canvas: document.querySelector("canvas#chestgui"),
    ctx: document.querySelector("canvas#chestgui").getContext("2d"),

    cursorX: 0,
    cursorY: 0,

    selectedSlotX: -1,
    selectedSlotY: -1,

    button: "no",
};
let itemslist = document.querySelector("div.panel.items");

let tabs = [];
let selectedTab = -1;
/**
 * idk
 * @param {MenuGUI} tab The menu gui thing
 */
function pushTab(tab) {
    selectedTab = tabs.push(tab) - 1;
    updateDOM(tab);
}
function updateDOM(tab) {
    // Items List
    while (itemslist.children.length > 1) itemslist.removeChild(itemslist.children[1]);
    for (let name in tab.items) addItemToDOM(tab.items[name], name, name === tab.editor.selectedItem);
}
class MenuGUI {
    constructor(file, title = "My Awesome GUI!", size = 9) {
        this.file = file;
        this.title = title;
        this.size = size;
        this.items = [
            {
                name: "test",
                item: {
                    material: "STAINED_GLASS_PANE_WHITE",
                    slots: [0, 1, 2]
                }
            }
        ];

        this.editor = {
            selectedItem: "test"
        };

        pushTab(this);
    }

    getDisplayFileName() {return this.file === undefined? "Unsaved GUI" : this.file}
}

//////////
// Test //
//////////
new MenuGUI();
//////////
// Test //
//////////

///////////////////
// The main part //
///////////////////
function mouseToSlot(mouseX, mouseY) {
    const slotX = Math.floor((mouseX - 16) / 36);
    const slotY = Math.floor((mouseY - 36) / 36);
    return slotY * 9 + slotX;
}
function tryPlace(item, mouseX, mouseY) {
    const slot = mouseToSlot(mouseX, mouseY);
    if (item.item.slots.includes(slot)) return;
    item.item.slots.push(slot);
}
function tryRemove(item, mouseX, mouseY) {
    const slot = mouseToSlot(mouseX, mouseY);
    if (!item.item.slots.includes(slot)) return;
    item.item.slots.splice(item.item.slots.indexOf(slot), 1);
}
function getItemByName(name) {
    let tab = tabs[selectedTab];
    for (let i = 0; i < tab.items.length; i++) if (tab.items[i].name === name) return tab.items[i];
}
function clickEvent(event) {
    if (chestGUI.button === "left") {
        let tab = tabs[selectedTab];
        tryPlace(getItemByName(tab.editor.selectedItem), event.offsetX, event.offsetY);
    } else if (chestGUI.button === "right") {
        let tab = tabs[selectedTab];
        tryRemove(getItemByName(tab.editor.selectedItem), event.offsetX, event.offsetY);
    }
}
function unselectAll() {
    for (let i = 0; i < itemslist.children.length; i++) itemslist.children[i].classList.remove("selected");
}
function rename(from, to) {
    let tab = tabs[selectedTab];
    if (tab.items[to] !== undefined) {
        alert("Cannot rename: There's another item with the name '" + to + "'");
        return false;
    }
    let item = tab.items[from];
    tab.items[from] = undefined;
    tab.items[to] = item;
    return true;
}
function addItemToDOM(item, selected = false) {
    let dom = document.createElement("div");
    dom.id = "itemlist-" + item.name;
    dom.className = "itemlistElement" + (selected? " selected" : "");
    dom.addEventListener("click", (event) => {
        unselectAll();
        dom.classList.add("selected");
        const tab = tabs[selectedTab];
        tab.editor.selectedItem = item.name;
    });

    let icon = document.createElement("i");
    icon.className = "icon-minecraft icon-minecraft-" + item.item.material.replace(/_/g, "-").toLowerCase();
    dom.append(icon);

    let texts = document.createElement("div");
    texts.className = "textcontainer";
    dom.append(texts);

    let head = document.createElement("h1");
    head.textContent = item.name;
    head.addEventListener("input", (event) => {
        const tab = tabs[selectedTab];
        if (tab.editor.selectedItem === item.name) tab.editor.selectedItem = event.target.textContent;
        item.name = event.target.textContent;
    })
    texts.append(head);

    let p = document.createElement("p");
    p.textContent = "Click to select";
    texts.append(p);

    itemslist.append(dom);
    return dom;
}
function addNewItem(name = Math.random() + "") {
    const tab = tabs[selectedTab];
    let item;
    tab.items.push(item = {
        name: name,
        item: {
            material: "STONE",
            slots: []
        }
    });
    addItemToDOM(item);
}

chestGUI.canvas.addEventListener("mousemove", (event) => {
    chestGUI.cursorX = event.offsetX;
    chestGUI.cursorY = event.offsetY;
    clickEvent(event);
});
chestGUI.canvas.addEventListener("mousedown", (event) => {
    chestGUI.button = event.which == 3? "right" : "left";
    clickEvent(event);
});
chestGUI.canvas.addEventListener("mouseup", (event) => {
    chestGUI.button = "no";
});
chestGUI.canvas.addEventListener("contextmenu", (event) => {
    event.preventDefault();
});

function render(timestamp) {
    if (chestGUI.ctx.imageSmoothingEnabled) chestGUI.ctx.imageSmoothingEnabled = false;
    if (images["chestGUI"] !== undefined) chestGUI.ctx.drawImage(images["chestGUI"], 0, 0, 176, 133, 0, 0, 352, 266);
    if (selectedTab !== -1) {
        if (tiles["itemtiles"] !== undefined) {
            // Render
            if (selectedTab !== -1) {
                const tab = tabs[selectedTab];
                if (tiles["itemtiles"] !== undefined) {
                    const tile = tiles["itemtiles"];
                    for (let i = 0; i < tab.items.length; i++) {
                        const item = tab.items[i].item;
                        item.slots.forEach(s => {
                            const x = s % 9;
                            const y = Math.floor(s / 9);
                            tile.drawTile(item.material.replace(/_/g, "-").toLowerCase(), chestGUI.ctx, x * 36 + 16, y * 36 + 36);
                        });
                    }
                }
            }
        }
    }

    if (chestGUI.cursorX >= 16 && chestGUI.cursorX <= 336 && chestGUI.cursorY >= 36 && chestGUI.cursorY <= 248) {
        const ctx = chestGUI.ctx;

        // Overlay
        ctx.fillStyle = "#ffffff7c";
        const slotX = Math.floor((chestGUI.cursorX - 16) / 36) * 36;
        const slotY = Math.floor((chestGUI.cursorY - 36) / 36) * 36;
        ctx.fillRect(16 + slotX, 36 + slotY, 32, 32);
    }

    window.requestAnimationFrame(render);
}
window.requestAnimationFrame(render);