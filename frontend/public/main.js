const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;
const ASPECT = WIDTH / HEIGHT;
const UNITSIZE = 128; // In pixels
const WALLHEIGHT = UNITSIZE;
const AIMOVESPEED = 100;

// TODO: Remove this reference when we use the node module Three
const t = THREE;

// Set up the camera (the player's perspective)
var camera = new t.PerspectiveCamera(75, ASPECT, 1, 10000); // FOV, aspect, near, far
var canJump; // For later use when we handle the player's keyboard input
// Set up controls (custom first-person controls)
// TODO: This class needs to update the camera's position (right now it doesn't)
var controls = new t.PointerLockControls(camera);
// What we'll be using to render the scene - set antialias to false for better performance
var renderer = new t.WebGLRenderer({ antialias: false });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
// Set up the scene (a world in Three.js terms). We'll add objects to the scene later.
var scene = new t.Scene();

// Initialize constant for number of AI and global array variable to house AI objects
const NUMAI = 100;
const ai = [];

// Initialize global array variable to house AI animations
const aiAnimations = [];

// Set up camera listener for AI audio
const listener = new t.AudioListener();

// Variables for FPS controls
var direction = new t.Vector3();
var moveBackward = false;
var moveForward = false;
var moveLeft = false;
var moveRight = false;
var prevTime = performance.now();
var raycaster;
var velocity = new t.Vector3();

// Creates a 2D grid of 1s and 0s, which will be used to render the 3D world
var map = new BSPTree().generateLevel(25, 25);
for (let i = 0; i < map.length; i++) {
  for (let j = 0; j < map[0].length; j++) {
    if (j === 0 || i === 0 || j === map[0].length - 1 || i === map.length - 1) {
      map[i][j] = 1;
    }
  }
}
var mapW = map.length;
var mapH = map[0].length;


////// Set up the environment //////
const setupScene = () => {
  const units = mapW;

  // Floor and ceiling
  // TODO: Readjust plane sizing and replace all textures
  // Look for vaporwave grids:
  // https://res.cloudinary.com/teepublic/image/private/s--tQSSo6bK--/t_Preview/b_rgb:191919,c_limit,f_jpg,h_630,q_90,w_630/v1506824583/production/designs/1941165_0.jpg
  const floorCeilMat = new t.TextureLoader().load('https://pbs.twimg.com/media/DQG5kVSXkAAb03B.jpg');
  // It's possible to use max anisotropy, but performance might suffer
  floorCeilMat.anisotropy = 32;
  floorCeilMat.repeat.set(100, 100);
  floorCeilMat.wrapT = t.RepeatWrapping;
  floorCeilMat.wrapS = t.RepeatWrapping;
  // PlaneBufferGeometry is a lower memory alternative to PlaneGeometry
  const floorCeilGeo = new t.PlaneBufferGeometry(10000, 10000);
  let texture = new t.MeshLambertMaterial({
    map: floorCeilMat
  });

  // Three.Mesh takes in 1. geometry and 2. material/texture
  const floor = new t.Mesh(floorCeilGeo, texture);
  ceiling = new t.Mesh(floorCeilGeo, texture);

  floor.position.y = -10;
  floor.rotation.x = Math.PI / -2;

  // Rotation makes it so that the ceiling mirrors the floor on the opposite side
  ceiling.position.y = 100;
  ceiling.rotation.x = Math.PI / 2;

  // Add the floor and ceiling to the world
  scene.add(floor);
  scene.add(ceiling);

  // Walls - note MeshLambertMaterial is affected by lighting
  // TODO: Replace texture
  const wallMat = new t.TextureLoader().load('https://pbs.twimg.com/media/DQG5kVSXkAAb03B.jpg');
  wallMat.repeat.set(2, 2);
  wallMat.wrapT = t.RepeatWrapping;
  wallMat.wrapS = t.RepeatWrapping;
  const block = new t.CubeGeometry(WALLHEIGHT, WALLHEIGHT, WALLHEIGHT);
  let wallTexture = new t.MeshLambertMaterial({
    map: wallMat
  });

  // Iterate through the 2D map I computed above and place the walls where needed
  for (let i = 0; i < mapW; i++) {
    for (let j = 0, m = map[i].length; j < m; j++) {
      if (map[i][j]) {
        let wall = new t.Mesh(block, wallTexture);
        wall.position.x = (i - units / 2) * UNITSIZE;
        wall.position.y = WALLHEIGHT / 3;
        wall.position.z = (j - units / 2) * UNITSIZE;
        scene.add(wall);
      }
    }
  }

  // Lighting
  // Note that light1 and light2 are required. Both lights
  // face away from each other - without one, one side of
  // the wall will be pitch black from the player's perspective
  const directionalLight1 = new t.DirectionalLight(0xF7EFBE, 0.7);
  directionalLight1.position.set(0.5, 1, 0.5);
  scene.add(directionalLight1);
  const directionalLight2 = new t.DirectionalLight(0xF7EFBE, 0.5);
  directionalLight2.position.set(-0.5, -1, -0.5);
  scene.add(directionalLight2);
  // TODO: Remove temporary ambient lighting
  const allLight = new t.AmbientLight('purple');
  scene.add(allLight);
}

//Get a random integer between lo and hi, inclusive.
//Assumes lo and hi are integers and lo is lower than hi.
const getRandBetween = (lo, hi) => {
  return parseInt(Math.floor(Math.random() * (hi - lo + 1)) + lo, 10);
};

// Create and deploy a single AI object
function addAI() {

  // Array of three different sprite textures
  const aiSpriteTextures = [
    'https://s3-us-west-1.amazonaws.com/towndcloud-seed/buttergly-bugger-sprite.png',
    'https://s3-us-west-1.amazonaws.com/towndcloud-seed/galaga-bug-sprite.png',
    'https://s3-us-west-1.amazonaws.com/towndcloud-seed/winged-bug-sprite.png'
  ];

  let x, z;

  // Get camera position to avoid spawning on top of player
  const c = getMapSector(camera.position);

  // Sample from aiSpriteTextures array to create a random bugger
  const aiTexture = new t.TextureLoader().load(aiSpriteTextures[Math.floor(Math.random() * aiSpriteTextures.length)]);

  // Add texture, create sprite using material and set scale
  let aiMaterial = new t.SpriteMaterial({ /*color: 0xEE3333,*/
    map: aiTexture,
    fog: true
  });
  let o = new t.Sprite(aiMaterial);
  o.scale.set(40, 40, 1);

  // Generate random coords within the map until bugger is not on the player or in a wall
  do {
    x = getRandBetween(0, mapW - 1);
    z = getRandBetween(0, mapH - 1);
  } while (map[x][z] > 0 || (x == c.x && z == c.z));

  // Format coords, set position, and random directions (X and Z) to be used for animating direction
  x = Math.floor(x - mapW / 2) * UNITSIZE;
  z = Math.floor(z - mapW / 2) * UNITSIZE;
  o.position.set(x, UNITSIZE * 0.15, z);
  o.pathPos = 1;
  o.randomX = Math.random();
  o.randomZ = Math.random();

  // Add TextureAnimator to animations array to be iterated through and processed in animation function
  aiAnimations.push(new TextureAnimator(aiTexture, 2, 1, 2, 1000));

  // create the PositionalAudio object (passing in the listener)
  // const aiSound = new t.PositionalAudio(listener);

  // load AI sound and set it as the PositionalAudio object's buffer
  // const audioLoader = new t.AudioLoader();
  // audioLoader.load('https://s3-us-west-1.amazonaws.com/towndcloud-seed/bug-glitch-1.mp3', function (buffer) {
  //   aiSound.setBuffer(buffer);
  //   aiSound.setRefDistance(5);
  //   aiSound.setLoop(true);
  //   aiSound.setRolloffFactor(2);
  //   aiSound.play();
  // });

  ai.push(o);
  scene.add(o);
  // o.add(aiSound);
}

// Run addAI for each AI object
function setupAI() {
  for (var i = 0; i < NUMAI; i++) {
    addAI();
  }
}

// Setup the game
function init() {
  scene.fog = new t.FogExp2('black', 0.0020);
  camera.position.y = UNITSIZE * .1; // Ensures the player is above the floor
  // It may not look like it, but this adds the camera to the scene
  scene.add(controls.getObject());

  // TODO: Move the controls logic into another file if possible
  document.addEventListener('click', function () {
    controls.lock();
  }, false);

  var onKeyDown = function (event) {
    switch (event.keyCode) {
      case 38: // up
      case 87: // w
        moveForward = true;
        break;
      case 37: // left
      case 65: // a
        moveLeft = true;
        break;
      case 40: // down
      case 83: // s
        moveBackward = true;
        break;
      case 39: // right
      case 68: // d
        moveRight = true;
        break;
      case 32: // space
        if (canJump === true) velocity.y += 350;
        canJump = false;
        break;
      default:
        break;
    }
  };

  var onKeyUp = function (event) {
    switch (event.keyCode) {
      case 38: // up
      case 87: // w
        moveForward = false;
        break;
      case 37: // left
      case 65: // a
        moveLeft = false;
        break;
      case 40: // down
      case 83: // s
        moveBackward = false;
        break;
      case 39: // right
      case 68: // d
        moveRight = false;
        break;
      default:
        break;
    }
  };

  document.addEventListener('keydown', onKeyDown, false);
  document.addEventListener('keyup', onKeyUp, false);
  // TODO: Remove raycaster if there's no good use for it
  raycaster = new t.Raycaster(new t.Vector3(), new t.Vector3(0, - 1, 0), 0, 10);

  // Add objects to the world
  setupScene();

  // Add AI buggers
  setupAI();

  // Add the canvas to the document
  renderer.setClearColor('#D6F1FF'); // Sky color (if the sky was visible)
  document.body.appendChild(renderer.domElement);

  // Add the minimap
  $('body').append('<canvas id="radar" width="180" height="180"></canvas>');
}

// Helper function for browser frames
function animate() {
  requestAnimationFrame(animate);

  // TODO: Figure out best rotation
  // ceiling.rotation.z += .0005;

  // TODO: Not important for now. Remove this if there's no good use for it.
  raycaster.ray.origin.copy(controls.getObject().position);
  raycaster.ray.origin.y -= 10;

  // Controls/movement related logic
  var time = performance.now();
  var delta = (time - prevTime) / 1000;
  velocity.x -= velocity.x * 10.0 * delta;
  velocity.z -= velocity.z * 10.0 * delta;
  velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass
  direction.z = Number(moveForward) - Number(moveBackward);
  direction.x = Number(moveLeft) - Number(moveRight);
  direction.normalize(); // Ensures consistent movement in all directions

  // TODO: Update the camera position
  if (moveForward || moveBackward) velocity.z -= direction.z * 1200.0 * delta;
  if (moveLeft || moveRight) velocity.x -= direction.x * 1200.0 * delta;
  controls.getObject().translateX(velocity.x * delta);
  controls.getObject().translateY(velocity.y * delta);
  controls.getObject().translateZ(velocity.z * delta);

  if (controls.getObject().position.y < 10) {
    velocity.y = 0;
    controls.getObject().position.y = 10;
    canJump = true;
  }
  prevTime = time;

  // Animate AI
  aiAnimations.forEach(animation => {
    animation.update(Math.floor(Math.random() * 1800) * delta);
  });

  // Update AI.
  const aispeed = delta * AIMOVESPEED;
  for (let i = ai.length - 1; i >= 0; i--) {
    let aiObj = ai[i];

    // Generate new random coord values 
    let r = Math.random();
    if (r > 0.995) {
      aiObj.randomX = Math.random() * 2 - 1;
      aiObj.randomZ = Math.random() * 2 - 1;
    }

    // Attempt moving bugger across the axis at aispeed
    aiObj.translateX(aispeed * aiObj.randomX);
    aiObj.translateZ(aispeed * aiObj.randomZ);


    // Check if trajectory is leading off the map or hitting a wall
    // Reverse trajectory if true
    let aiPos = getMapSector(aiObj.position);
    if (aiPos.x < 0 || aiPos.x >= mapW || checkWallCollision(aiObj.position)) {
      aiObj.translateX(-2 * aispeed * aiObj.randomX);
      aiObj.translateZ(-2 * aispeed * aiObj.randomZ);
      aiObj.randomX = Math.random() * 2 - 1;
      aiObj.randomZ = Math.random() * 2 - 1;
    }
    // Checks if bug is off the map...maybe unecessary 
    // if (aiPos.x < -1 || aiPos.x > mapW || aiPos.z < -1 || aiPos.z > mapH) {
    //   ai.splice(i, 1);
    //   scene.remove(aiObj);
    //   addAI();
    // }
  }

  // Deals with what portion of the scene the player sees
  renderer.render(scene, camera);
}

////// Helper function(s) //////
const getMapSector = (v) => {
  let x = Math.floor(((v.x + 20) + UNITSIZE / 2) / UNITSIZE + mapW / 2);
  let z = Math.floor(((v.z + 20) + UNITSIZE / 2) / UNITSIZE + mapW / 2);
  let x2 = Math.floor(((v.x - 20) + UNITSIZE / 2) / UNITSIZE + mapW / 2);
  let z2 = Math.floor(((v.z - 20) + UNITSIZE / 2) / UNITSIZE + mapW / 2);
  return {
    x: x,
    z: z,
    x2: x2,
    z2: z2
  };
};

// Creates the minimap
// TODO: Clean up this code however possible before deployment
function drawMinimap() {
  var ai = [];
  var c = getMapSector(camera.position)
  var context = document.getElementById('radar').getContext('2d');
  context.font = '1px Georgia';
  for (var i = 0; i < mapW; i++) {
    for (var j = 0, m = map[i].length; j < m; j++) {
      var d = 0;
      for (var k = 0, n = ai.length; k < n; k++) {
        var e = getMapSector(ai[k].position);
        if (i === e.x && j === e.z) {
          d++;
        }
      }
      if (i === c.x && j === c.z && d === 0) {
        context.fillStyle = 'rgba(170, 51, 255, 1)';
        context.fillRect(i * 2, j * 2, (i + 1) * 2, (j + 1) * 2);
      }
      else if (i === c.x && j === c.z) {
        context.fillStyle = '#AA33FF';
        context.fillRect(i * 2, j * 2, (i + 1) * 2, (j + 1) * 2);
        context.fillStyle = '#000000';
        context.fillText('' + d, i * 2 + 8, j * 2 + 12);
      }
      else if (d > 0 && d < 10) {
        context.fillStyle = '#FF0000';
        context.fillRect(i * 2, j * 2, (i + 1) * 2, (j + 1) * 2);
        context.fillStyle = '#000000';
        context.fillText('' + d, i * 2 + 8, j * 2 + 12);
      }
      else if (map[i][j] > 0) {
        context.fillStyle = 'rgba(102, 102, 102, 1)';
        context.fillRect(i * 2, j * 2, (i + 1) * 2, (j + 1) * 2);
      }
      else {
        context.fillStyle = '#CCCCCC';
        context.fillRect(i * 2, j * 2, (i + 1) * 2, (j + 1) * 2);
      }
    }
  }
}

// Texture animator for AI utilizing sprites 
// Sprite frames are animated during the update function using the specified duration
function TextureAnimator(texture, tilesHoriz, tilesVert, numTiles, tileDispDuration) {
  // note: texture passed by reference, will be updated by the update function.

  this.tilesHorizontal = tilesHoriz;
  this.tilesVertical = tilesVert;
  // how many images does this spritesheet contain?
  //  usually equals tilesHoriz * tilesVert, but not necessarily,
  //  if there at blank tiles at the bottom of the spritesheet. 
  this.numberOfTiles = numTiles;
  texture.wrapS = texture.wrapT = t.RepeatWrapping;
  texture.repeat.set(1 / this.tilesHorizontal, 1 / this.tilesVertical);

  // how long should each image be displayed?
  this.tileDisplayDuration = tileDispDuration;

  // how long has the current image been displayed?
  this.currentDisplayTime = 0;

  // which image is currently being displayed?
  this.currentTile = 0;

  this.update = function (milliSec) {
    this.currentDisplayTime += milliSec;
    while (this.currentDisplayTime > this.tileDisplayDuration) {
      this.currentDisplayTime -= this.tileDisplayDuration;
      this.currentTile++;
      if (this.currentTile == this.numberOfTiles)
        this.currentTile = 0;
      var currentColumn = this.currentTile % this.tilesHorizontal;
      texture.offset.x = currentColumn / this.tilesHorizontal;
      var currentRow = Math.floor(this.currentTile / this.tilesHorizontal);
      texture.offset.y = currentRow / this.tilesVertical;
    }
  };
}

// Check for wall collision
const checkWallCollision = (obj) => {
  let currentPos = getMapSector(obj);
  if (map[currentPos.x][currentPos.z] > 0 || map[currentPos.x2][currentPos.z2] > 0 || 
    map[currentPos.x][currentPos.z2] > 0 || map[currentPos.x2][currentPos.z] > 0) 
    return true;
};

// Creates start screen
// TODO: Refactor this into a React component and move it to a different file
$(document).ready(() => {
  $('body').append('<div class="start-screen-container"></div>');
  $('.start-screen-container').append('<img class="logo" src="https://static1.textcraft.net/data1/4/7/47ec57212c1063d986640e55e8fffed17cc1603fda39a3ee5e6b4b0d3255bfef95601890afd80709da39a3ee5e6b4b0d3255bfef95601890afd8070911e0e0a6c9273f3b1ad5cf500cddc6e2.png"></img>');
  $('.start-screen-container').append('<button class="start-button">START</button>');
  $('.start-screen-container').one('click', function (e) {
    e.preventDefault();
    $(this).fadeOut();
    init();
    $('body').append('<img class="floor-title" src="https://static1.textcraft.net/data1/c/d/cd29149206b0527bd8c02af9bbf3d1bab8882c74da39a3ee5e6b4b0d3255bfef95601890afd80709da39a3ee5e6b4b0d3255bfef95601890afd807098626b16c099e53d50b4b4e9e7a56bd90.png"></img>');
    setInterval(() => {
      $('.floor-title').fadeOut(3000);
    }, 1000);
    setInterval(drawMinimap, 1000);
    animate();
  });
});

// TODO: Handle resizing the browser window
