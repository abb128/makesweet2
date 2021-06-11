function initShaderProgram(gl, vsSource, fsSource) {
	const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
	const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

	const shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);

	if(!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
		return null;
	}

	return shaderProgram;
}

function loadShader(gl, type, source) {
	const shader = gl.createShader(type);

	gl.shaderSource(shader, source);

	gl.compileShader(shader);

	if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
		gl.deleteShader(shader);
		return null;
	}

	return shader;
}

// make rectangle
function initBuffers(gl) {
	const positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	const positions = [
		0.0, 1.0,
		1.0, 1.0,
		0.0, 0.0,
		1.0, 0.0,
	];
	
	gl.bufferData(gl.ARRAY_BUFFER,
		new Float32Array(positions),
		gl.STATIC_DRAW);

	return {
		position: positionBuffer,
	};
}


var textures = [];
var textureCount = 1;


function setupTexture(gl, i, redrawCallback) {
	const texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);

	const level = 0;
	const internalFormat = gl.RGBA;
	const width = 1;
	const height = 1;
	const border = 0;
	const srcFormat = gl.RGBA;
	const srcType = gl.UNSIGNED_BYTE;
	const pixel = new Uint8Array([0, 0, 255, 255]); // blue for no image
	gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
		width, height, border, srcFormat, srcType,
		pixel);

	textures[i] = texture;


	const callback = function(e) {
		if(!e.files || !e.files[0]) return;

		const FR = new FileReader();
		FR.addEventListener("load", (evt) => {
			const img = new Image();
			img.addEventListener("load", () => {
				gl.bindTexture(gl.TEXTURE_2D, texture);
				gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
					srcFormat, srcType, img);

				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

				redrawCallback();
			});
			img.src = evt.target.result;
		});
		FR.readAsDataURL(e.files[0]);
	}
	document.querySelector("#textureUpload" + String(i)).addEventListener("change", function() {
		callback(this)
	});

	callback(document.querySelector("#textureUpload" + String(i)));
}

function drawScene(gl, programInfo, buffers, textureSlots) {
	gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
	gl.clearDepth(1.0); // Clear everything

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	const projectionMatrix = mat4.create();
	mat4.ortho(projectionMatrix, 0.0, 1.0, 0.0, 1.0, 0.0, 1.0);

	const modelViewMatrix = mat4.create();
	mat4.translate(modelViewMatrix, // destination matrix
		modelViewMatrix, // matrix to translate
		[-0.0, 0.0, -0.0]); // amount to translate

	{
		const numComponents = 2;
		const type = gl.FLOAT;
		const normalize = false;
		const stride = 0;
		const offset = 0;
		gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
		gl.vertexAttribPointer(
			programInfo.attribLocations.vertexPosition,
			numComponents,
			type,
			normalize,
			stride,
			offset);
		gl.enableVertexAttribArray(
			programInfo.attribLocations.vertexPosition);
	}
	
	gl.useProgram(programInfo.program);

	gl.uniformMatrix4fv(
		programInfo.uniformLocations.projectionMatrix,
		false,
		projectionMatrix);
	gl.uniformMatrix4fv(
		programInfo.uniformLocations.modelViewMatrix,
		false,
		modelViewMatrix);
	for(var i = 0; i < textureCount; i++) {
		gl.activeTexture(gl.TEXTURE0 + i);
		gl.bindTexture(gl.TEXTURE_2D, textures[i]);
		gl.uniform1i(textureSlots[i], i);
	}

	{
		const offset = 0;
		const vertexCount = 4;
		gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
	}
}
var canvas;

function main() {
	const canvas = document.querySelector("#main");
	const gl = canvas.getContext("webgl");

	if(gl === null) {
		alert("Unable to initialize WebGL. Your browser or machine may not support it.");
		return;
	}

	gl.clearColor(0.0, 1.0, 0.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT);


	const vertexShader = document.querySelector("#shader-vs").innerHTML;

	const fragmentShader = document.querySelector("#shader-fs").innerHTML;

	const shaderProgram = initShaderProgram(gl, vertexShader, fragmentShader);

	const programInfo = {
		program: shaderProgram,
		attribLocations: {
			vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
		},
		uniformLocations: {
			projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
			modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
			img0: gl.getUniformLocation(shaderProgram, 'img0'),
			img1: gl.getUniformLocation(shaderProgram, 'img1'),
			img2: gl.getUniformLocation(shaderProgram, 'img2'),
			img3: gl.getUniformLocation(shaderProgram, 'img3'),
			img4: gl.getUniformLocation(shaderProgram, 'img4'),
			img5: gl.getUniformLocation(shaderProgram, 'img5'),
			img6: gl.getUniformLocation(shaderProgram, 'img6')
		},
	};

	const buffers = initBuffers(gl);

	const textureSlots = [
		programInfo.uniformLocations.img0,
		programInfo.uniformLocations.img1,
		programInfo.uniformLocations.img2,
		programInfo.uniformLocations.img3,
		programInfo.uniformLocations.img4,
		programInfo.uniformLocations.img5,
		programInfo.uniformLocations.img6
	];

	textureCount = textureSlots.length;


	const drawCallback = () => {
		drawScene(gl, programInfo, buffers, textureSlots);
	}

	for(var i = 0; i < textureCount; i++) {
		setupTexture(gl, i, drawCallback);
	}
	loadTexture(gl, textures[0], "/anim0/light/" + (1).pad(4) + ".png", drawCallback);
	loadTexture(gl, textures[1], "/anim0/dark/" + (1).pad(4) + ".png", drawCallback);
	loadTexture(gl, textures[2], "/anim0/mapper/" + (1).pad(4) + ".png", drawCallback);
	loadTexture(gl, textures[3], "/anim0/mapper2/" + (1).pad(4) + ".png", drawCallback);

	drawCallback();

	document.querySelector("#animateBtn").addEventListener("click", function() {
		doAnimation(gl, drawCallback, canvas);
	});
}

function loadTexture(gl, texture, url, callbackLoad) {

	const level = 0;
	const internalFormat = gl.RGBA;
	const width = 1;
	const height = 1;
	const border = 0;
	const srcFormat = gl.RGBA;
	const srcType = gl.UNSIGNED_BYTE;

	const image = new Image();
	image.onload = function() {
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
			srcFormat, srcType, image);


		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

		callbackLoad();
	};
	image.src = url;

	return texture;
}

Number.prototype.pad = function(size) {
	var s = String(this);
	while(s.length < (size || 2)) {
		s = "0" + s;
	}
	return s;
}

function doAnimation(gl, drawCallback, canvas) {
	console.log("animating");
	var gif = new GIF({
		workers: 2,
		quality: 10,
		transparent: 0x00FF00,
		dither: "FloydSteinberg-serpentine",
	});

	var i = 1;
	var loads = 0;

	const render_and_next = () => {
		//console.log("frame");
		drawCallback();
		gif.addFrame(canvas, {
			copy: true,
			delay: 30
		});
		i++;


		if(i < 181) {
			loadTexture(gl, textures[0], "/anim0/light/" + i.pad(4) + ".png", loadCallback);
			loadTexture(gl, textures[1], "/anim0/dark/" + i.pad(4) + ".png", loadCallback);
			loadTexture(gl, textures[2], "/anim0/mapper/" + i.pad(4) + ".png", loadCallback);
			loadTexture(gl, textures[3], "/anim0/mapper2/" + i.pad(4) + ".png", loadCallback);
		} else {
			console.log("End of animation!");
			gif.on('finished', function(blob) {
				console.log("Download");
				download(blob, "avali.gif", "image/gif");
			});

			gif.render();
		}
	}

	const loadCallback = () => {
		loads++;
		if(loads == 4) {
			loads = 0;
			render_and_next();
		}
	}

	render_and_next();
}

window.onload = main;