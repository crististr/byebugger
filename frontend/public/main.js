const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;
const ASPECT = WIDTH / HEIGHT;
const UNITSIZE = 128; // In pixels
const AIMOVESPEED = 100;

// TODO: Remove this reference when we use the node module Three
const t = THREE;

// Set up the camera (the player's perspective)
const camera = new t.PerspectiveCamera(75, ASPECT, 1, 10000); // FOV, aspect, near, far
let mouse = new t.Vector2(); //SUE: declaring mouse for later use (to track mouse movement for raycasting)
let canJump; // For later use when we handle the player's keyboard input
// Set up controls (custom first-person controls)
const controls = new t.PointerLockControls(camera);
// What we'll be using to render the scene - set antialias to false for better performance
const models = {};
const renderer = new t.WebGLRenderer({ antialias: false });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = t.BasicShadowMap;
// Set up the scene (a world in Three.js terms). We'll add objects to the scene later.
const scene = new t.Scene();

// Initialize constant for number of AI and global array variable to house AI objects
//SUE: changed number of bugs (originally 100)
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
var velocity = new t.Vector3();

// Creates a 2D grid of 1s and 0s, which will be used to render the 3D world
//SUE: changed map size (originally 100, 100)
var map = new BSPTree().generateLevel(100, 100);
var mapW = map.length;
var mapH = map[0].length;

// SETTING UP THE WORLD
const setupScene = () => {
  sceneSetup(scene, map);

  // player weapon
  let gun;
  var mtlLoader = new t.MTLLoader();
  mtlLoader.setPath("./assets/models/");
  mtlLoader.load('shotgun.mtl', function (materials) {
    materials.preload();

    var objLoader = new t.OBJLoader();
    objLoader.setMaterials(materials);
    objLoader.setPath("./assets/models/");
    objLoader.load('shotgun.obj', function (object) {

      gun = object;
      models['gun'] = gun.clone();
      models['gun'].position.y = 18
      models['gun'].scale.set(200, 200, 200);
      models['gun'].rotation.set(0, 3.2, 0);
      scene.add(models['gun']);
    });
  });
}

// Run addAI for each AI object
function setupAI() {
  for (var i = 0; i < NUMAI; i++) {
    addAI(controls.getObject(), map, scene, ai, aiAnimations);
  }
}

//SUE: function to check if two line segments intersect (called in checkIfBugHit)
//    returns a boolean (returns true iff the line from (a,b)->(c,d) intersects with (p,q)->(r,s))
// line1start (player's position), line1end (hammer's end position)
// line2start (vertex1 of rectangle), line2end (vertex2 of rectangle)
function checkLineIntersection(line1start, line1end, line2start, line2end) {
  let det, gamma, lambda;
  const a = line1start.x;
  const b = line1start.z;
  const c = line1end.x;
  const d = line1end.z;
  const p = line2start.x;
  const q = line2start.z;
  const r = line2end.x;
  const s = line2end.z;
  det = (c - a) * (s - q) - (r - p) * (d - b);
  if (det === 0) {
    return false;
  } else {
    lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
    gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
    return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
  }
}

//SUE: function called in swingHammer that checks if player's hammer (line segment) intersects with bug (rectangle)
//    returns a boolean
function checkIfBugHit(playerPosition, hammerEnd, bugCenterPosition) {
  //find coordinates for vertices of bug from bug's center (numbering done in clockwise direction from bottom left corner)
  const vertex1 = {
    x: bugCenterPosition.x - 20,
    z: bugCenterPosition.z - 20
  };
  const vertex2 = {
    x: bugCenterPosition.x + 20,
    z: bugCenterPosition.z - 20
  };
  const vertex3 = {
    x: bugCenterPosition.x + 20,
    z: bugCenterPosition.z + 20
  };
  const vertex4 = {
    x: bugCenterPosition.x - 20,
    z: bugCenterPosition.z + 20
  };

  //check if any of the rectangle's sides intersect with line from player's position to hammer's end
  if (checkLineIntersection(playerPosition, hammerEnd, vertex1, vertex2)
    || checkLineIntersection(playerPosition, hammerEnd, vertex2, vertex3)
    || checkLineIntersection(playerPosition, hammerEnd, vertex3, vertex4)
    || checkLineIntersection(playerPosition, hammerEnd, vertex4, vertex1)) {
    return true;
  } else {
    return false;
  }
}

//SUE: swingHammer logic
function swingHammer() {
  //NOTE: bug offset ~= 20 (from center)

  //determine direction of the swing 
  //  1) position of player 2) point of click => these two will determine direction of swing vector
  let player = controls.getObject()
  let playerPosition = player.position;
  const vector = new t.Vector3();
  camera.getWorldDirection(vector);
  // swing vector has a fixed length (equal to hammer length)
  const hammerLength = 150;
  vector.setLength(hammerLength);
  // set camera-direction vector's origin to player's position
  const playerPositionX = playerPosition.x;
  const playerPositionZ = playerPosition.z;
  const vectorX = vector.x;
  const vectorZ = vector.z;
  const hammerVectorX = playerPositionX + vectorX;
  const hammerVectorZ = playerPositionZ + vectorZ;
  const hammerHeadPosition = {
    x: hammerVectorX,
    z: hammerVectorZ
  };


  // console.log(vector);
  // if bug is in direction of vector and hammerLength away - collision = true
  ai.forEach(bug => {
    if (checkIfBugHit(playerPosition, hammerHeadPosition, bug.position)) {
      console.log("SPLAT");
    }
    ///// 3) Using actual vectors//////
    //   const lowerBoundX = bug.position.x - 20;
    //   const upperBoundX = bug.position.x + 20;
    //   const lowerBoundZ = bug.position.z - 20;
    //   const upperBoundZ = bug.position.z + 20;

    //   if ((hammerVectorX < upperBoundX && hammerVectorX > lowerBoundX)
    //     && (hammerVectorZ < upperBoundZ && hammerVectorZ > lowerBoundZ)) {
    //     console.log('lower bound x below');
    //     console.log(lowerBoundX);
    //     console.log('upper bound x below');
    //     console.log(upperBoundX);
    //     console.log('player x below');
    //     console.log(hammerVectorX);
    //     console.log('lower bound z below');
    //     console.log(lowerBoundZ);
    //     console.log('upper bound z below');
    //     console.log(upperBoundZ);
    //     console.log('player z below');
    //     console.log(hammerVectorZ);
    //     console.log("SPLAT");
    //   }
  });
}


//SUE: Used in conjunction with Raycaster - helper function to track mouse movement (used in init)
function onDocumentMouseMove(e) {
  e.preventDefault();
  mouse.x = (e.clientX / WIDTH) * 2 - 1;
  mouse.y = - (e.clientY / HEIGHT) * 2 + 1;
}

// Setup the game
function init() {
  scene.fog = new t.FogExp2('black', 0.0015);
  camera.position.y = UNITSIZE * .1; // Ensures the player is above the floor
  checkSpawn(map, controls.getObject());

  //////////////////////////////////////////////////////////////////
  //SUE: add crosshair for aiming hammer
  const material = new t.LineBasicMaterial({
    color: 0xffffff,
    linewidth: 1
  });

  // crosshair size
  let x = 10;
  let y = 10;

  const geometry = new t.Geometry();

  // crosshair
  geometry.vertices.push(new t.Vector3(0, y, 0));
  geometry.vertices.push(new t.Vector3(0, -y, 0));
  geometry.vertices.push(new t.Vector3(0, 0, 0));
  geometry.vertices.push(new t.Vector3(x, 0, 0));
  geometry.vertices.push(new t.Vector3(-x, 0, 0));

  let crosshair = new t.Line(geometry, material);

  // place it in the center
  let crosshairPercentX = 50;
  let crosshairPercentY = 50;
  let crosshairPositionX = (crosshairPercentX / 100) * 2 - 1;
  let crosshairPositionY = (crosshairPercentY / 100) * 2 - 1;

  crosshair.position.x = crosshairPositionX * camera.aspect;
  crosshair.position.y = crosshairPositionY;

  crosshair.position.z = -0.3;

  camera.add(crosshair);

  // It may not look like it, but this adds the camera to the scene
  scene.add(controls.getObject());
  //////////////////////////////////////////////////////////////////

  //SUE: Used in conjunction w Raycaster - tracks mouse position (set mouse.x and mouse.y to pointer coordinates) so we know where to shoot
  document.addEventListener('mousemove', onDocumentMouseMove, false);
  // TODO: Move the controls logic into another file if possible
  document.addEventListener('click', function () {
    controls.lock();
    //SUE: invoke swingHammer function upon clicking
    swingHammer();
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

  // Add objects to the world
  setupScene();
  // Add buggers
  setupAI();

  // Add the canvas to the document
  renderer.setClearColor('#111111'); // Sky color (if the sky was visible)
  document.body.appendChild(renderer.domElement);

  // Add the minimap
  $('body').append('<canvas id="radar" width="180" height="180"></canvas>');
}

// Helper function for browser frames
function animate() {
  requestAnimationFrame(animate);

  // TODO: Try to access ceiling a different way
  ceiling.rotation.y += .0001;

  // Controls/movement related logic
  var time = performance.now();
  var delta = (time - prevTime) / 1000;
  velocity.x -= velocity.x * 10.0 * delta;
  velocity.z -= velocity.z * 10.0 * delta;
  velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass
  direction.z = Number(moveForward) - Number(moveBackward);
  direction.x = Number(moveLeft) - Number(moveRight);
  direction.normalize(); // Ensures consistent movement in all directions

  let camPos = controls.getObject().position;
  if (moveForward || moveBackward) {
    velocity.z -= direction.z * 1200.0 * delta;
    if (checkWallCollision(camPos)) {
      let audio = new Audio('./assets/sounds/oof.mp3');
      audio.play();
      velocity.z -= velocity.z * 4;
    }
  }

  if (moveLeft || moveRight) {
    velocity.x -= direction.x * 1200.0 * delta;
    if (checkWallCollision(camPos)) {
      let audio = new Audio('./assets/sounds/oof.mp3');
      audio.play();
      velocity.x -= velocity.x * 4;
    }
  }

  controls.getObject().translateX(velocity.x * delta);
  controls.getObject().translateY(velocity.y * delta);
  controls.getObject().translateZ(velocity.z * delta);

  if (models['gun']) {
    models['gun'].position.set(
      controls.getObject().position.x - Math.sin(controls.getObject().rotation.y + Math.PI / 6) * 0.75,
      18,
      controls.getObject().position.z + Math.cos(controls.getObject().rotation.y + Math.PI / 6) * 0.75
    );
    models['gun'].rotation.set(
      controls.getObject().rotation.x,
      controls.getObject().rotation.y - Math.PI,
      controls.getObject().rotation.z
    );
  }

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

    if (map[aiPos.x][aiPos.z] || aiPos.x < 0 || aiPos.x >= mapW || checkWallCollision(aiObj.position)) {
      aiObj.translateX(-2 * aispeed * aiObj.randomX);
      aiObj.translateZ(-2 * aispeed * aiObj.randomZ);
      aiObj.randomX = Math.random() * 2 - 1;
      aiObj.randomZ = Math.random() * 2 - 1;
    }

    // Check if bug is off the map, and if true remove and add a new one
    if (aiPos.x < -1 || aiPos.x > mapW || aiPos.z < -1 || aiPos.z > mapH) {
      ai.splice(i, 1);
      scene.remove(aiObj);
      addAI();
    }
  }

  // SUE: detection of player attacking bug

  // Deals with what portion of the scene the player sees
  renderer.render(scene, camera);
}

// Check for wall collision
const checkWallCollision = (obj) => {
  let currentPos = getMapSector(obj);
  if (map[currentPos.x][currentPos.z] > 0 || map[currentPos.x2][currentPos.z2] > 0 ||
    map[currentPos.x][currentPos.z2] > 0 || map[currentPos.x2][currentPos.z] > 0) {
    return true;
  } else {
    return false;
  }
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
    setInterval(drawMinimap(controls.getObject(), map, ai), 1000);
    animate();
  });
});

// TODO: Handle resizing the browser window
