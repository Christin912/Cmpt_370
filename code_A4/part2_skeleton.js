main();

/************************************
 * MAIN
 ************************************/


function main() {

    console.log("Setting up the canvas");

    // Find the canavas tag in the HTML document
    const canvas = document.querySelector("#assignmentCanvas");

    // Initialize the WebGL2 context
    var gl = canvas.getContext("webgl2");

    // Only continue if WebGL2 is available and working
    if (gl === null) {
        printError('WebGL 2 not supported by your browser',
            'Check to see you are using a <a href="https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API#WebGL_2_2" class="alert-link">modern browser</a>.');
        return;
    }

    // Hook up the button
    const fileUploadButton = document.querySelector("#fileUploadButton");
    fileUploadButton.addEventListener("click", () => {
        console.log("Submitting file...");
        let fileInput = document.getElementById('inputFile');
        let files = fileInput.files;
        let url = URL.createObjectURL(files[0]);

        fetch(url, {
            mode: 'no-cors' // 'cors' by default
        }).then(res => {
            return res.text();
        }).then(data => {
            var inputTriangles = JSON.parse(data);

            doDrawing(gl, canvas, inputTriangles);

        }).catch((e) => {
            console.error(e);
        });

    });
}

function doDrawing(gl, canvas, inputTriangles) {
    // Create a state for our scene

    var state = {
        camera: {
            position: vec3.fromValues(0.5, 0.5, -0.5),
            center: vec3.fromValues(0.5, 0.5, 0.0),
            up: vec3.fromValues(0.0, 1.0, 0.0),
        },
        objects: [],
        canvas: canvas,
        selectedIndex: 0,
    };

    for (var i = 0; i < inputTriangles.length; i++) {
       
        state.objects.push(
            {
                name: inputTriangles[i].name,
                model: {
                    position: vec3.fromValues(0.0, 0.0, 0.0),
                    rotation: mat4.create(), // Identity matrix
                    scale: vec3.fromValues(1.0, 1.0, 1.0),
                },
                programInfo: transformShader(gl),
                buffers: undefined, 
                centroid: calculateCentroid(inputTriangles[i].vertices),
                // Need to store parent (note this is a string not the actual object!!)
                parent: inputTriangles[i].parent,
                // TODO: need to store modelmatrix (to use for children)
                // Store model matrix for parent-child relationships
                modelMatrix: mat4.create(),
                // TODO: Add more object specific state like material color
                // Store diffuse color from JSON
                color: vec3.fromValues(
                    inputTriangles[i].material.diffuse[0],
                    inputTriangles[i].material.diffuse[1],
                    inputTriangles[i].material.diffuse[2]
                ),
            }
        );
      
        initBuffers(gl, state.objects[i], inputTriangles[i].vertices.flat(), inputTriangles[i].triangles.flat());
    }

    // select arm
    changeSelectionText(state.objects[state.selectedIndex].name);
    // translate arm with 0.5
    arm = getObjectByName(state, "arm");
    arm.model.position = vec3.fromValues(0.0, 0.0, 0.5); 

    setupKeypresses(state);

    //console.log(state)

    console.log("Starting rendering loop");
    startRendering(gl, state);
}


/************************************
 * RENDERING CALLS
 ************************************/

function startRendering(gl, state) {
    // A variable for keeping track of time between frames
    var then = 0.0;

    // This function is called when we want to render a frame to the canvas
    function render(now) {
        now *= 0.001; // convert to seconds
        const deltaTime = now - then;
        then = now;

        // Draw our scene
        drawScene(gl, deltaTime, state);

        // Request another frame when this one is done
        requestAnimationFrame(render);
    }

    // Draw the scene
    requestAnimationFrame(render);
}

/**
 * Draws the scene. Should be called every frame
 * 
 * @param  {} gl WebGL2 context
 * @param {number} deltaTime Time between each rendering call
 */
function drawScene(gl, deltaTime, state) {
    // Set clear colour
    // This is a Red-Green-Blue-Alpha colour
    // See https://en.wikipedia.org/wiki/RGB_color_model
    // Here we use floating point values. In other places you may see byte representation (0-255).
    gl.clearColor(0.5, 0.5, 0.5, 1.0);

    // Depth testing allows WebGL to figure out what order to draw our objects such that the look natural.
    // We want to draw far objects first, and then draw nearer objects on top of those to obscure them.
    // To determine the order to draw, WebGL can test the Z value of the objects.
    // The z-axis goes out of the screen
    gl.enable(gl.DEPTH_TEST); // Enable depth testing
    gl.depthFunc(gl.LEQUAL); // Near things obscure far things
    gl.clearDepth(1.0); // Clear everything

    // Clear the color and depth buffer with specified clear colour.
    // This will replace everything that was in the previous frame with the clear colour.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    state.objects.forEach((object) => {
        // Choose to use our shader
        gl.useProgram(object.programInfo.program);

        // Update uniforms
        {
            // TODO update unforms related to 
            // projection, view and modeling transforms
            // like in part1 
            
            // Create projection matrix
            const projectionMatrix = mat4.create();
            mat4.perspective(projectionMatrix, 
                60 * Math.PI / 180,
                state.canvas.width / state.canvas.height,
                0.1,
                100.0
            );
            gl.uniformMatrix4fv(object.programInfo.uniformLocations.projection, false, projectionMatrix);
            
            // Create view matrix
            const viewMatrix = mat4.create();
            mat4.lookAt(viewMatrix, state.camera.position, state.camera.center, state.camera.up);
            gl.uniformMatrix4fv(object.programInfo.uniformLocations.view, false, viewMatrix);
                    
            // Update model transform (curent object) 
            // TODO: apply correct order of transformations
            // for correct rotation object has to have centroid at origin
            
            
            // Build model matrix with correct transformation order
            const modelMatrix = mat4.create();
            mat4.translate(modelMatrix, modelMatrix, vec3.negate(vec3.create(), object.centroid));
            mat4.multiply(modelMatrix, modelMatrix, object.model.rotation);
            mat4.translate(modelMatrix, modelMatrix, object.centroid);
            mat4.translate(modelMatrix, modelMatrix, object.model.position);

            //TODO: if has parent update modelview with parent model view (new in part2)
            //      (at the end of modeling transform)
            // save modeling transform in state.object variable for future children
            // link to correct uniform from shader
            
            // If object has parent, multiply with parent's model matrix
            if (object.parent) {
                const parentObject = getObjectByName(state, object.parent);
                if (parentObject) {
                    mat4.multiply(modelMatrix, parentObject.modelMatrix, modelMatrix);
                }
            }
            
            // Save model matrix for children to use
            mat4.copy(object.modelMatrix, modelMatrix);
            
            gl.uniformMatrix4fv(object.programInfo.uniformLocations.model, false, modelMatrix);
           
            // TODO Update colors
            
            // Pass object color to shader
            gl.uniform3fv(object.programInfo.uniformLocations.color, object.color);

        }
        // Draw 
        {
            // Bind the buffer we want to draw
            gl.bindVertexArray(object.buffers.vao);

            // Draw the object
            const offset = 0; // Number of elements to skip before starting
            gl.drawElements(gl.TRIANGLES, object.buffers.numVertices, gl.UNSIGNED_SHORT, offset);
        }
    });
}


/************************************
 * UI EVENTS
 ************************************/

function setupKeypresses(state) {
    document.addEventListener("keydown", (event) => {
        //console.log(event.code);

        //console.log(state.hasSelected);
        var object = state.objects[state.selectedIndex];
        
        // Step sizes for movement and rotation
        const translateStep = 0.1;
        const rotateStep = 5 * Math.PI / 180;
        
        switch (event.code) {
            // keep camera motion on a,d,s,w,q,e (same as part1)
            case "KeyA":
                if (event.getModifierState("Shift")) {
                    // TODO: rotate camera around Y
                    // Rotate camera left around Y axis
                    const at = vec3.subtract(vec3.create(), state.camera.center, state.camera.position);
                    const rotMat = mat4.create();
                    mat4.fromRotation(rotMat, rotateStep, state.camera.up);
                    vec3.transformMat4(at, at, rotMat);
                    vec3.add(state.camera.center, state.camera.position, at);
                    
                } else {
                    // TODO: translate camera along X
                    // Move camera left along X (these two parts wrent't workign propelty so ahrd use to use calude ai to fix it    )
                    const at = vec3.subtract(vec3.create(), state.camera.center, state.camera.position);
                    const right = vec3.cross(vec3.create(), at, state.camera.up);
                    vec3.normalize(right, right);
                    vec3.scaleAndAdd(state.camera.position, state.camera.position, right, -translateStep);
                    vec3.scaleAndAdd(state.camera.center, state.camera.center, right, -translateStep);
                   
                }
                break;
            case "KeyD":
                if (event.getModifierState("Shift")) {
                    // TODO: rotate camera around Y
                    // Rotate camera right around Y axis
                    const at = vec3.subtract(vec3.create(), state.camera.center, state.camera.position);
                    const rotMat = mat4.create();
                    mat4.fromRotation(rotMat, -rotateStep, state.camera.up);
                    vec3.transformMat4(at, at, rotMat);
                    vec3.add(state.camera.center, state.camera.position, at);
                    
                } else {
                    // TODO:translate along X
                    // Move camera right along X
                    const at = vec3.subtract(vec3.create(), state.camera.center, state.camera.position);
                    const right = vec3.cross(vec3.create(), at, state.camera.up);
                    vec3.normalize(right, right);
                    vec3.scaleAndAdd(state.camera.position, state.camera.position, right, translateStep);
                    vec3.scaleAndAdd(state.camera.center, state.camera.center, right, translateStep);
                   
                }
                break;
            case "KeyW":
                if (event.getModifierState("Shift")) {
                    // TODO:rotate camera around X
                    // Rotate camera up around X axis
                    const at = vec3.subtract(vec3.create(), state.camera.center, state.camera.position);
                    const right = vec3.cross(vec3.create(), at, state.camera.up);
                    vec3.normalize(right, right);
                    const rotMat = mat4.create();
                    mat4.fromRotation(rotMat, rotateStep, right);
                    vec3.transformMat4(at, at, rotMat);
                    vec3.transformMat4(state.camera.up, state.camera.up, rotMat);
                    vec3.add(state.camera.center, state.camera.position, at);
                   
                } else {
                    // TODO:translate camera along Y
                    // Move camera forward along Z
                    const at = vec3.subtract(vec3.create(), state.camera.center, state.camera.position);
                    vec3.normalize(at, at);
                    vec3.scaleAndAdd(state.camera.position, state.camera.position, at, translateStep);
                    vec3.scaleAndAdd(state.camera.center, state.camera.center, at, translateStep);
                    
                }
                break;
            case "KeyS":
                if (event.getModifierState("Shift")) {
                    // TODO: rotate camera around X
                    // Rotate camera down around X axis
                    const at = vec3.subtract(vec3.create(), state.camera.center, state.camera.position);
                    const right = vec3.cross(vec3.create(), at, state.camera.up);
                    vec3.normalize(right, right);
                    const rotMat = mat4.create();
                    mat4.fromRotation(rotMat, -rotateStep, right);
                    vec3.transformMat4(at, at, rotMat);
                    vec3.transformMat4(state.camera.up, state.camera.up, rotMat);
                    vec3.add(state.camera.center, state.camera.position, at);
                   
                } else {
                    // TODO: translate camera along Y
                    // Move camera backward along Z
                    const at = vec3.subtract(vec3.create(), state.camera.center, state.camera.position);
                    vec3.normalize(at, at);
                    vec3.scaleAndAdd(state.camera.position, state.camera.position, at, -translateStep);
                    vec3.scaleAndAdd(state.camera.center, state.camera.center, at, -translateStep);
                   
                }
                break;
            case "KeyQ":
                if (!event.getModifierState("Shift")) {
                    // TODO: translate camera along Z
                    // Move camera up along Y
                    vec3.scaleAndAdd(state.camera.position, state.camera.position, state.camera.up, translateStep);
                    vec3.scaleAndAdd(state.camera.center, state.camera.center, state.camera.up, translateStep);
                    
                }

                break;
            case "KeyE":
                if (!event.getModifierState("Shift")) {
                    // TODO: translate camera along Z
                    // Move camera down along Y
                    vec3.scaleAndAdd(state.camera.position, state.camera.position, state.camera.up, -translateStep);
                    vec3.scaleAndAdd(state.camera.center, state.camera.center, state.camera.up, -translateStep);
                   
                }
                break;
            case "ArrowLeft":
                // Decreases object selected index value  
                state.selectedIndex = state.selectedIndex - 1;
                if (state.selectedIndex <0) {
                    state.selectedIndex = state.objects.length-1;
                }
                changeSelectionText(state.objects[state.selectedIndex].name);
                break;
            case "ArrowRight":
                // Increases object selected index value
                state.selectedIndex = state.selectedIndex + 1;
                if (state.selectedIndex >= state.objects.length) {
                    state.selectedIndex = 0;
                }
                changeSelectionText(state.objects[state.selectedIndex].name);
                break;
            case "KeyZ":
                // TODO rotate object around Z
                // Rotate selected object counter-clockwise around Z
                mat4.rotateZ(object.model.rotation, object.model.rotation, rotateStep);
                
                break;

            case "KeyX":
                // TODO rotate object around Z
                // Rotate selected object clockwise around Z
                mat4.rotateZ(object.model.rotation, object.model.rotation, -rotateStep);
               
                break;
            default:
                break;
        }
    });


}

/************************************
 * SHADER SETUP
 ************************************/
 // shaders are the same as in part1 
function transformShader(gl) {
    // Vertex shader source code
    const vsSource =
        `#version 300 es
    in vec3 aPosition;


    // TODO add uniforms for projection, view and model matrices
    // type uniform mat4 
    // Uniforms for transformation matrices
    uniform mat4 uProjection;
    uniform mat4 uView;
    uniform mat4 uModel;
   

 
    void main() {
        // Position needs to be a vec4 with w as 1.0
        // TODO apply transformation stored in uniforms 
        // Apply transformations
        gl_Position = uProjection * uView * uModel * vec4(aPosition, 1.0);
        
    }
    `;

    // Fragment shader source code
    const fsSource =
        `#version 300 es
    precision highp float;

    out vec4 fragColor;
    // TODO: add uniform for object material color
    // type vec3 
    // Uniform for color
    uniform vec3 uColor;
    
  
    void main() {
        // TODO: replace with corresponding color from uniform
        // Use color from uniform
        fragColor = vec4(uColor, 1.0);
    }
    `;

    // Create our shader program with our custom function
    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

    // Collect all the info needed to use the shader program.
    const programInfo = {
        // The actual shader program
        program: shaderProgram,
        // The attribute locations. WebGL will use there to hook up the buffers to the shader program.
        // NOTE: it may be wise to check if these calls fail by seeing that the returned location is not -1.
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aPosition'),
        },
        uniformLocations: {
            // TODO: add the locations for the 3 uniforms related to projection, view, modeling transforms
            // Get uniform locations
            projection: gl.getUniformLocation(shaderProgram, 'uProjection'),
            view: gl.getUniformLocation(shaderProgram, 'uView'),
            model: gl.getUniformLocation(shaderProgram, 'uModel'),
            
            // TODO: Add location to additional uniforms here (ex related to material color)
            // Get color uniform location
            color: gl.getUniformLocation(shaderProgram, 'uColor'),
        },
    };

    // Check to see if we found the locations of our uniforms and attributes
    // Typos are a common source of failure
    // TODO add testes for all your uniform locations 
    if (programInfo.attribLocations.vertexPosition === -1 ||
        programInfo.uniformLocations.projection === -1 ||
        programInfo.uniformLocations.view === -1 ||
        programInfo.uniformLocations.model === -1 ||
        programInfo.uniformLocations.color === -1) {

        printError('Shader Location Error', 'One or more of the uniform and attribute variables in the shaders could not be located');
    }
    

    return programInfo;
}

/************************************
 * BUFFER SETUP
 ************************************/

function initBuffers(gl, object, positionArray, indicesArray) {

    // We have 3 vertices with x, y, and z values
    const positions = new Float32Array(positionArray);

    // We are using gl.UNSIGNED_SHORT to enumerate the indices
    const indices = new Uint16Array(indicesArray);


    // Allocate and assign a Vertex Array Object to our handle
    var vertexArrayObject = gl.createVertexArray();

    // Bind our Vertex Array Object as the current used object
    gl.bindVertexArray(vertexArrayObject);

    object.buffers = {
        vao: vertexArrayObject,
        attributes: {
            position: initPositionAttribute(gl, object.programInfo, positions),
        },
        indices: initIndexBuffer(gl, indices),
        numVertices: indices.length,
    };
}

function initPositionAttribute(gl, programInfo, positionArray) {

    // Create a buffer for the positions.
    const positionBuffer = gl.createBuffer();

    // Select the buffer as the one to apply buffer
    // operations to from here out.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Now pass the list of positions into WebGL to build the
    // shape. We do this by creating a Float32Array from the
    // JavaScript array, then use it to fill the current buffer.
    gl.bufferData(
        gl.ARRAY_BUFFER, // The kind of buffer this is
        positionArray, // The data in an Array object
        gl.STATIC_DRAW // We are not going to change this data, so it is static
    );

    // Tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute.
    {
        const numComponents = 3; // pull out 3 values per iteration, ie vec3
        const type = gl.FLOAT; // the data in the buffer is 32bit floats
        const normalize = false; // don't normalize between 0 and 1
        const stride = 0; // how many bytes to get from one set of values to the next
        // Set stride to 0 to use type and numComponents above
        const offset = 0; // how many bytes inside the buffer to start from


        // Set the information WebGL needs to read the buffer properly
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexPosition,
            numComponents,
            type,
            normalize,
            stride,
            offset
        );
        // Tell WebGL to use this attribute
        gl.enableVertexAttribArray(
            programInfo.attribLocations.vertexPosition);
    }

    return positionBuffer;
}


function initColourAttribute(gl, programInfo, colourArray) {

    // Create a buffer for the positions.
    const colourBuffer = gl.createBuffer();

    // Select the buffer as the one to apply buffer
    // operations to from here out.
    gl.bindBuffer(gl.ARRAY_BUFFER, colourBuffer);

    // Now pass the list of positions into WebGL to build the
    // shape. We do this by creating a Float32Array from the
    // JavaScript array, then use it to fill the current buffer.
    gl.bufferData(
        gl.ARRAY_BUFFER, // The kind of buffer this is
        colourArray, // The data in an Array object
        gl.STATIC_DRAW // We are not going to change this data, so it is static
    );

    // Tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute.
    {
        const numComponents = 4; // pull out 4 values per iteration, ie vec4
        const type = gl.FLOAT; // the data in the buffer is 32bit floats
        const normalize = false; // don't normalize between 0 and 1
        const stride = 0; // how many bytes to get from one set of values to the next
        // Set stride to 0 to use type and numComponents above
        const offset = 0; // how many bytes inside the buffer to start from

        // Set the information WebGL needs to read the buffer properly
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexColour,
            numComponents,
            type,
            normalize,
            stride,
            offset
        );
        // Tell WebGL to use this attribute
        gl.enableVertexAttribArray(
            programInfo.attribLocations.vertexColour);
    }

    return colourBuffer;
}

function initIndexBuffer(gl, elementArray) {

    // Create a buffer for the positions.
    const indexBuffer = gl.createBuffer();

    // Select the buffer as the one to apply buffer
    // operations to from here out.
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    // Now pass the list of positions into WebGL to build the
    // shape. We do this by creating a Float32Array from the
    // JavaScript array, then use it to fill the current buffer.
    gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER, // The kind of buffer this is
        elementArray, // The data in an Array object
        gl.STATIC_DRAW // We are not going to change this data, so it is static
    );

    return indexBuffer;
}
/**
 * 
 * @param {array of x,y,z vertices} vertices 
 */
function calculateCentroid(vertices) {

    var center = vec3.fromValues(0.0, 0.0, 0.0);
    for (let t = 0; t < vertices.length; t++) {
        vec3.add(center,center,vertices[t]);
    }
    vec3.scale(center,center,1/vertices.length);
    return center;

}


/**
 * 
 * @param {state object} state 
 * @param {string with object name} objectName 
 */
function getObjectByName(state, objectName) {
    for (let i = 0; i < state.objects.length; i++) {
        if (objectName === state.objects[i].name) {
            return state.objects[i];
        }
    }
    console.log("ERROR: object name not found")
    return null;
}