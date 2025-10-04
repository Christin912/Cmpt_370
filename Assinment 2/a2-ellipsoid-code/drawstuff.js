/* classes */
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
        }
        catch (e) {
            // alert(e);
        }
    }
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
        }
        catch (e) {
            // alert(e);
        }
    }
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
    }
    catch (e) {
        // alert(e);
    }
}


function raymarchInputEllipses(context, state) {
    var w = context.canvas.width;
    var h = context.canvas.height;
    var imagedata = context.createImageData(w, h);
    var lightSource = state.lightSource;

    console.log("Starting ray march...");
    
    function rayEllipsoidIntersection(ro, rd, center, radii) {
        // ransform ellipsoid to unit sphere for intersection testing
        let localRo = vec3.create();
        let localRd = vec3.create();
        
        // Translate ray origin relative to ellipsoid center
        vec3.subtract(localRo, ro, center);
        
        localRo[0] /= radii[0];
        localRo[1] /= radii[1];
        localRo[2] /= radii[2];
        
        // Apply same inverse scaling to ray direction
        localRd[0] = rd[0] / radii[0];
        localRd[1] = rd[1] / radii[1];
        localRd[2] = rd[2] / radii[2];
        
        //  at² + bt + c = 0
        let a = vec3.dot(localRd, localRd); 
        let b = 2.0 * vec3.dot(localRo, localRd); 
        let c = vec3.dot(localRo, localRo) - 1.0; 
        //used calude.ai for this section to understand how it worked
        
        // Check discriminant for intersection
        let discriminant = b * b - 4 * a * c;
        
        if (discriminant < 0) {
            return { hit: false, t: -1 }; // No intersection
        }
        
        // Calculate intersection points
        let sqrtDiscriminant = Math.sqrt(discriminant);
        let t1 = (-b - sqrtDiscriminant) / (2 * a); // Closer
        let t2 = (-b + sqrtDiscriminant) / (2 * a); // Far
        
        // Return smallest num
        let t = (t1 > 0) ? t1 : ((t2 > 0) ? t2 : -1);
        
        // [Part 2] Calculate intersection point and surface normal for lighting
        let intersectionPoint = vec3.create();
        let surfaceNormal = vec3.create();
        
        if (t > 0) {
            // Calculate intersection point in world coordinates
            vec3.scaleAndAdd(intersectionPoint, ro, rd, t);
            
            // Calculate surface normal at intersection point
            // Normal = (point - center) scaled by inverse radii
            vec3.subtract(surfaceNormal, intersectionPoint, center);
            surfaceNormal[0] /= (radii[0] * radii[0]);
            surfaceNormal[1] /= (radii[1] * radii[1]);
            surfaceNormal[2] /= (radii[2] * radii[2]);
            vec3.normalize(surfaceNormal, surfaceNormal); // normal vector
        }
        
        return {
            hit: t > 0,
            t: t,
            // [Part 2] Return intersection point and normal for lighting calculations
            point: intersectionPoint,
            normal: surfaceNormal
        };
    }

    function raymarch(ro, rd) {
        // TODO
        
        // castingfor ellipsoids, used gtp for this part couldnt figure out myself
        let closestT = Infinity; // Track closest intersection distance
        let closestColor = vec3.fromValues(0, 0, 0); //black
        
        // Loop over all 
        for (let i = 0; i < state.inputData.length; i++) {
            let ellipsoid = state.inputData[i];
            
            // Extract ellipsoid properties from JSON data
            let center = vec3.fromValues(ellipsoid.x, ellipsoid.y, ellipsoid.z);
            let radii = vec3.fromValues(ellipsoid.a, ellipsoid.b, ellipsoid.c);
            
            // Test ray-ellipsoid intersection
            let intersection = rayEllipsoidIntersection(ro, rd, center, radii);
            
            
            if (intersection.hit && intersection.t > 0 && intersection.t < closestT) {
                closestT = intersection.t; // Update closest distance
                
                // Calculate Blinn-Phong lighting at intersection point
                let lightingColor = vec3.create();
                
                // Calculate lighting vectors
                let lightPos = vec3.fromValues(0.5, 0.5, -2.0); 
                let lightDir = vec3.create();
                let viewDir = vec3.create();
                let halfVector = vec3.create();
                
                // light position - intersection point
                vec3.subtract(lightDir, lightPos, intersection.point);
                vec3.normalize(lightDir, lightDir);
                
                // ray origin - intersection point (]]
                vec3.subtract(viewDir, ro, intersection.point);
                vec3.normalize(viewDir, viewDir);
                
                // light direction + view direction
                vec3.add(halfVector, lightDir, viewDir);
                vec3.normalize(halfVector, halfVector);
                
                // Calculate dot products for lighting terms
                let NdotL = Math.max(0.0, vec3.dot(intersection.normal, lightDir)); // Diffuse term
                let NdotH = Math.max(0.0, vec3.dot(intersection.normal, halfVector)); // Specular term
                let shininess = ellipsoid.n; //  fom JSON
                
                // Calculate Blinn-Phong lighting components
                // Ambient: I_ambient = k_a * I_a
                let ambientR = ellipsoid.ambient[0] * 1.0; 
                let ambientG = ellipsoid.ambient[1] * 1.0;
                let ambientB = ellipsoid.ambient[2] * 1.0;
                
                // Diffuse: I_diffuse = k_d * I_d * (N · L)
                let diffuseR = ellipsoid.diffuse[0] * 1.0 * NdotL; 
                let diffuseG = ellipsoid.diffuse[1] * 1.0 * NdotL;
                let diffuseB = ellipsoid.diffuse[2] * 1.0 * NdotL;
                
                // Specular: I_specular = k_s * I_s * (N · H)^n
                let specularR = ellipsoid.specular[0] * 1.0 * Math.pow(NdotH, shininess);
                let specularG = ellipsoid.specular[1] * 1.0 * Math.pow(NdotH, shininess);
                let specularB = ellipsoid.specular[2] * 1.0 * Math.pow(NdotH, shininess);
                
                // Combine lighting terms: I_total = I_ambient + I_diffuse + I_specular
                lightingColor[0] = ambientR + diffuseR + specularR;
                lightingColor[1] = ambientG + diffuseG + specularG;
                lightingColor[2] = ambientB + diffuseB + specularB;
                
                // Clamp colors to [0,1] range
                lightingColor[0] = Math.min(1.0, Math.max(0.0, lightingColor[0]));
                lightingColor[1] = Math.min(1.0, Math.max(0.0, lightingColor[1]));
                lightingColor[2] = Math.min(1.0, Math.max(0.0, lightingColor[2]));
                
                closestColor = lightingColor; // Use lighting color instead of flat diffuse color, used gtp for this part
            }
        }
        
        return closestColor; 
    }

    for (var x = 0.0; x < w; x++) {
        for (var y = 0.0; y < h; y++) {
            
            //Camera setup
            var camera_position = vec3.fromValues(0.5, 0.5, -0.5); 
            var ro = camera_position;
            
            // pixel coordinates to world coordinates
            
            var pixelX = x / w;
            var pixelY = y / h;
            var worldX = pixelX;
            var worldY = 1.0 - pixelY; 
            var worldZ = 0.0;
            
           //ray direction from camera to pixel
            var rd = vec3.fromValues(worldX - ro[0], worldY - ro[1], worldZ - ro[2]);
            vec3.normalize(rd, rd); // Normalize 
            
            var colour = raymarch(ro, rd);
            var c = new Color(colour[0] * 255, colour[1] * 255, colour[2] * 255, 255);
            drawPixel(imagedata, x, y, c);
        }
    }
    context.putImageData(imagedata, 0, 0);
    
}




function main() {

    var canvas = document.getElementById("viewport");
    var context = canvas.getContext("2d");
    let url = "ellipsoids.json";

    let state = {};

//used gtp to better understdn what was going on here
    fetch(url, {
        mode: 'no-cors' 
    }).then(res => {
        return res.text();
    }).then(data => {
        var inputEllipses = JSON.parse(data);
        state.inputData = inputEllipses;
        state.lightSource = {
            location: vec3.fromValues(0.5,0.5, -2),
            shading: vec3.fromValues(1, 1, 1)
        }

        console.log(state.inputData)
   
        // This is the call to your raymarching code
        raymarchInputEllipses(context, state);

    }).catch((e) => {
        console.error(e);
    });
}