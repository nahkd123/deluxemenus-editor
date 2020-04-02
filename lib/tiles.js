class Tiles {
    /**
     * Create a tile map
     * @param {Image} image 
     * @param {Object} tileinfo 
     */
    constructor(image, tileinfo, tw = 32, th = 32) {
        this.image = image;
        this.tileinfo = tileinfo;

        this.tilewidth = tw;
        this.tileheight = th;
    }

    /**
     * 
     * @param {String} tilename 
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Number} cx 
     * @param {Number} cy 
     * @param {Number} scalex 
     * @param {Number} scaley 
     */
    drawTile(tilename, ctx, cx, cy, scalex = 1.0, scaley = 1.0) {
        const t = this.tileinfo[tilename];
        ctx.drawImage(this.image,
            t.x, t.y, this.tilewidth, this.tileheight,
            cx, cy, this.tilewidth * scalex, this.tileheight * scaley
        );
    }
}