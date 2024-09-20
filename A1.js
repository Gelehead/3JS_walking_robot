import * as utils from './utils.js';


// ASSIGNMENT-SPECIFIC API EXTENSION
THREE.Object3D.prototype.setMatrix = function(a) {
  this.matrix = a;
  this.matrix.decompose(this.position, this.quaternion, this.scale);
};

var start = Date.now();
// SETUP RENDERER AND SCENE
var scene = new THREE.Scene();
var renderer = new THREE.WebGLRenderer();
renderer.setClearColor(0xffffff); // white background colour
document.body.appendChild(renderer.domElement);

// SETUP CAMERA
var camera = new THREE.PerspectiveCamera(30, 1, 0.1, 1000); // view angle, aspect ratio, near, far
camera.position.set(10,5,10);
camera.lookAt(scene.position);
scene.add(camera);

// SETUP ORBIT CONTROL OF THE CAMERA
var controls = new THREE.OrbitControls(camera);
controls.damping = 0.2;

// ADAPT TO WINDOW RESIZE
function resize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

window.addEventListener('resize', resize);
resize();

// FLOOR WITH CHECKERBOARD
var floorTexture = new THREE.ImageUtils.loadTexture('images/tile.jpg');
floorTexture.wrapS = floorTexture.wrapT = THREE.MirroredRepeatWrapping;
floorTexture.repeat.set(4, 4);

var floorMaterial = new THREE.MeshBasicMaterial({ map: floorTexture, side: THREE.DoubleSide });
var floorGeometry = new THREE.PlaneBufferGeometry(15, 15);
var floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = Math.PI / 2;
floor.position.y = 0.0;
scene.add(floor);

// wall :)
var wallxGeometry = new THREE.PlaneBufferGeometry(7.5,15);
var wallx = new THREE.Mesh(wallxGeometry, floorMaterial);
wallx.rotation.z = Math.PI / 2;
wallx.rotation.y = Math.PI / 2;
wallx.position.x = -7.50;
wallx.position.y = 3.75;
scene.add(wallx);

// UTIL FUNCTIONS

// funky function
function readableMat(matrix) {
  const mat = matrix.toArray();
  const rows = [0, 4, 8, 12].map(i => mat.slice(i, i + 4).join(" "));

  return rows.join("\n");
}

class Robot {
  constructor() {
    // Geometry
    this.torsoHeight = 1.5;
    this.torsoRadius = 0.75;
    
    this.headRadius = 0.32;

    this.armsLength = 0.5;
    this.armsRadius = 0.2;

    // limbs



    // Head
    var headGeometry = new THREE.CubeGeometry(2*this.headRadius, this.headRadius, this.headRadius);
    this.head = new utils.Limb(this.torso, [], [0,2,0], ["x","y","z"], headGeometry, "head");    

    // Arms
    var armsGeometry = new THREE.SphereGeometry(0.25, 50, 50, 0, Math.PI * 2, 0, Math.PI * 2);
    this.Larm = new utils.Limb(this.torso, [], [1,0,0], ["x","y","z"], armsGeometry, "Larm");
    this.Rarm = new utils.Limb(this.torso, [], [-1,0,0], ["x","y","z"], armsGeometry, "Rarm");

    this.Larm.matrix = utils.rescaleMat(this.Larm.matrix, 1, 2, 1);
    this.Larm.self.setMatrix(this.Larm.matrix);


    // Apply scaling to the right arm
    this.Rarm.matrix = utils.rescaleMat(this.Rarm.matrix, 1, 2, 1);
    this.Rarm.self.setMatrix(this.Rarm.matrix);

    // torso 
    let torsoGeometry = new THREE.CubeGeometry(2*this.torsoRadius, this.torsoHeight, this.torsoRadius, 64);
    this.torso = new utils.Limb(null, [this.head, this.Larm, this.Rarm], [0, this.torsoHeight/ 2,0], ["x","y","z"], torsoGeometry, "torso");


    // Add parameters for parts
    // TODO

    // Animation
    this.walkDirection = new THREE.Vector3( 0, 0, 1 );

    // Material
    this.material = new THREE.MeshNormalMaterial();

    // Initial pose
    this.initialize()
  }

  initialize() {
	// Add robot to scene
	scene.add(this.torso.self);
    scene.add(this.head.self);
    scene.add(this.Larm.self);
    scene.add(this.Rarm.self);
    
    // Add parts
    // TODO
  }

  // Add methods for other parts
  // TODO

  look_at(point){
    // Compute and apply the correct rotation of the head and the torso for the robot to look at @point
      //TODO
  }
}

var robot = new Robot();

// LISTEN TO KEYBOARD
var keyboard = new THREEx.KeyboardState();

var selectedRobotComponent = 0;
var components = [
  "Torso",
  "Head",
  "Larm",
  "Rarm"
  // Add parts names
  // TODO
];
var numberComponents = components.length;

//MOUSE EVENTS
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
var sphere = null;

document.addEventListener('mousemove', onMouseMove, false);

var isRightButtonDown = false;

function checkKeyboard() {
  // Next element
  if (keyboard.pressed("e")){
    selectedRobotComponent = selectedRobotComponent + 1;

    if (selectedRobotComponent<0){
      selectedRobotComponent = numberComponents - 1;
    }

    if (selectedRobotComponent >= numberComponents){
      selectedRobotComponent = 0;
    }

    window.alert(components[selectedRobotComponent] + " selected");
  }

  // Previous element
  if (keyboard.pressed("q")){
    selectedRobotComponent = selectedRobotComponent - 1;

    if (selectedRobotComponent < 0){
      selectedRobotComponent = numberComponents - 1;
    }

    if (selectedRobotComponent >= numberComponents){
      selectedRobotComponent = 0;
    }

    window.alert(components[selectedRobotComponent] + " selected");
  }

  // UP
  if (keyboard.pressed("w")){
    switch (components[selectedRobotComponent]){
      case "Torso":
        robot.torso.move(0.1);
        break;
      case "Head":
        break;
      case "Larm" :
        robot.Larm.rotate(0.1, "x");
        break
      case "Rarm" :
        robot.Rarm.rotate(0.1, "z")
        break
      // Add more cases
      // TODO
    }
  }

  // DOWN
  if (keyboard.pressed("s")){
    switch (components[selectedRobotComponent]){
      case "Torso":
        robot.torso.move(-0.1);
        break;
      case "Head":
        break;
      // Add more cases
      // TODO
    }
  }

  // LEFT
  if (keyboard.pressed("a")){
    var rotation_speed = 0.1;
    switch (components[selectedRobotComponent]){
      case "Torso":
        robot.torso.rotate(rotation_speed, "y");
        break;
      case "Head":
        robot.head.rotate(rotation_speed, "y");
        break;
      // Add more cases
      // TODO
    }
  }

  // RIGHT
  if (keyboard.pressed("d")){
    var rotation_speed = 0.1;
    switch (components[selectedRobotComponent]){
      case "Torso":
        robot.torso.rotate(-rotation_speed, "y");
        break;
      case "Head":
        robot.head.rotate(-rotation_speed);
        break;
      // Add more cases
      // TODO
    }
    }

    if (keyboard.pressed("f")) {
        isRightButtonDown = true;

        var vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);

        vector.unproject(camera);

        var dir = vector.sub(camera.position).normalize();

        raycaster.ray.origin.copy(camera.position);
        raycaster.ray.direction.copy(dir);

        var intersects = raycaster.intersectObjects(scene.children, true);

        if (intersects.length > 0) {
            if (!sphere) {
                var geometry = new THREE.SphereGeometry(0.1, 32, 32);
                var material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
                sphere = new THREE.Mesh(geometry, material);
                scene.add(sphere);
            }
        }

        updateLookAtPosition();
    }
    else{
        isRightButtonDown = false;

        if (sphere) {
            scene.remove(sphere);
            sphere.geometry.dispose();
            sphere.material.dispose();
            sphere = null;
        }
    }

    // test function
    if(keyboard.pressed("x")){
      var m = new THREE.Matrix4();
      m.set(
          1,         0      ,          0          , 0,
          0, Math.cos(90), (-1)*Math.sin(90), 0,
          0, Math.sin(90),   Math.cos(90)   , 0,
          0,         0      ,          0          , 1
      );

      var v = new THREE.Vector4();
      v.set(0,1,0,1);
      //mat2 = translateMat(idMat4(), 2, 2, 2);
      //window.alert(readableMat(mat2));
    }
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

    if (isRightButtonDown) {
        updateLookAtPosition();
    }
}

function updateLookAtPosition() {
    var vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);

    vector.unproject(camera);

    var dir = vector.sub(camera.position).normalize();

    raycaster.ray.origin.copy(camera.position);
    raycaster.ray.direction.copy(dir);

    var intersects = raycaster.intersectObjects(scene.children.filter(obj => obj !== sphere), true);

    if (intersects.length > 0) {
        var intersect = intersects[0]
        sphere.position.copy(intersect.point);
        robot.look_at(intersect.point);
    }
}

// SETUP UPDATE CALL-BACK
function update() {
  checkKeyboard();
  requestAnimationFrame(update);
  renderer.render(scene, camera);
}

update();
