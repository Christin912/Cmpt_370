/* classes */

// Color constructor
class Color {
    constructor(r, g, b, a) {
        try {
            if ((typeof (r) !== "number") || (typeof (g) !== "number") || (typeof (b) !== "number") || (typeof (a) !== "number"))
                throw "color component not a number";
            else if ((r < 0) || (g < 0) || (b < 0) || (a < 0))
                throw "color component less than 0";
            else if ((r > 255) || (g > 255) || (b > 255) || (a > 255))
                throw "color component bigger than 255";
            else {
                this.r = r; this.g = g; this.b = b; this.a = a;
            }
        } // end try

        catch (e) {
            console.log(e);
        }
    } // end Color constructor

    // Color change method
    change(r, g, b, a) {
        try {
            if ((typeof (r) !== "number") || (typeof (g) !== "number") || (typeof (b) !== "number") || (typeof (a) !== "number"))
                throw "color component not a number";
            else if ((r < 0) || (g < 0) || (b < 0) || (a < 0))
                throw "color component less than 0";
            else if ((r > 255) || (g > 255) || (b > 255) || (a > 255))
                throw "color component bigger than 255";
            else {
                this.r = r; this.g = g; this.b = b; this.a = a;
            }
        } // end throw

        catch (e) {
            console.log(e);
        }
    } // end Color change method
} // end color class


// TODO1: Write function for checking edges
/**
 * Helper function for finding if point resides inside a side formed by 2 vertices
 */
function side(x1, y1, x2, y2, x, y) {
    return 1;
}   

// draw a pixel at x,y using color
function drawPixel(imagedata, x, y, color) {
    try {
        if ((typeof (x) !== "number") || (typeof (y) !== "number"))
            throw "drawpixel location not a number";
        else if ((x < 0) || (y < 0) || (x >= imagedata.width) || (y >= imagedata.height))
            throw "drawpixel location outside of image";
        else if (color instanceof Color) {
            var pixelindex = (y * imagedata.width + x) * 4;
            imagedata.data[pixelindex] = color.r;
            imagedata.data[pixelindex + 1] = color.g;
            imagedata.data[pixelindex + 2] = color.b;
            imagedata.data[pixelindex + 3] = color.a;
        } else
            throw "drawpixel color is not a Color";
    } // end try

    catch (e) {
        console.log(e);
    }
} // end drawPixel


function marchAndDraw(inputTriangles, rd) {
    var objectMaterial;
    let index;

    let returnPoint = vec3.fromValues(0, 0, 0);
    // Looping over objects
    for (var i = 0; i < inputTriangles.length; i++) {
        index = inputTriangles[i].triangles.length;
        objectMaterial = inputTriangles[i].material;

        // looping over all triangles that form an object
        for (var j = 0; j < index; j++) {

            // Grabbing the vertices of each "triangles"
            var vertex1 = inputTriangles[i].triangles[j][0];
            var vertex2 = inputTriangles[i].triangles[j][1];
            var vertex3 = inputTriangles[i].triangles[j][2];

            var vertexPos0 = inputTriangles[i].vertices[vertex1];
            var vertexPos1 = inputTriangles[i].vertices[vertex2];
            var vertexPos2 = inputTriangles[i].vertices[vertex3];

            // TODO1: checking if object is to be drawn
            //       implement function side (above)
            let check1 = side(vertexPos0[0], vertexPos0[1], vertexPos1[0], vertexPos1[1], rd[0], rd[1]) >= 0;
            let check2 = side(vertexPos1[0], vertexPos1[1], vertexPos2[0], vertexPos2[1], rd[0], rd[1]) >= 0;
            let check3 = side(vertexPos2[0], vertexPos2[1], vertexPos0[0], vertexPos0[1], rd[0], rd[1]) >= 0;

            if (check1 && check2 && check3) {
                // TODO2: return correct object diffuse color from json file
                returnPoint = vec3.fromValues(1, 0, 0);
            }
        }
    }
    return returnPoint;
}


function iterateAndDraw(context, inputTriangles) {
    var w = context.canvas.width;
    var h = context.canvas.height;
    var imagedata = context.createImageData(w, h);

    console.log("Starting pixel march...");

    for (var u = 0.0; u < w; u++) {
        for (var v = 0.0; v < h; v++) {
            //TODO3: get the correct screen point rd for the coordinate system description 
            var rd = vec3.fromValues(u / w , v / h , 0.5);
            var colour = marchAndDraw(inputTriangles, rd);
            var c = new Color(colour[0] * 255, colour[1] * 255, colour[2] * 255, 255);
            drawPixel(imagedata, u, v, c);
        }
    }
    context.putImageData(imagedata, 0, 0);
}

/* main -- here is where execution begins after window load */

function main() {
    // Get the canvas and context
    var canvas = document.getElementById("viewport");
    var context = canvas.getContext("2d");
    let url = "triangles.json";

    fetch(url, {
        mode: 'no-cors' // 'cors' by default
    }).then(res => {
        return res.text();
    }).then(data => {
        var inputTriangles = JSON.parse(data);
        lightSource = {
            location: vec3.fromValues(-1, 1, -1.5),
            shading: vec3.fromValues(1, 1, 1)
        }

        iterateAndDraw(context, inputTriangles);
    }).catch((e) => {
        console.error(e);
    });
}