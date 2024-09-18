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



    // Arms
    // placeholder before making more complex arms
    this.armsLength = 1.0;
    this.armsRadius = 0.25;

    this.forearmsLength = 0.60;
    this.forearmsWidth = 0.25;


    // Add parameters for parts
    // TODO

    // Animation
    this.walkDirection = new THREE.Vector3( 0, 0, 1 );

    // Material
    this.material = new THREE.MeshNormalMaterial();

    // Initial pose
    this.initialize()
  }

  initialArmMatrix(string){
    var armMatrix = utils.idMat4();
    let lr = 1;
    if (string == "L") { lr = -1;}

    armMatrix = utils.translateMat(armMatrix, lr * (this.torsoRadius+0.1), this.torsoHeight/6, 0);
    armMatrix = utils.rotateMat(armMatrix, 85, "x");
    return armMatrix;
  }

  initialTorsoMatrix(){
    var initialTorsoMatrix = utils.idMat4();
    initialTorsoMatrix = utils.translateMat(initialTorsoMatrix, 0,this.torsoHeight/2, 0);

    return initialTorsoMatrix;
  }

  initialHeadMatrix(){
    var initialHeadMatrix = utils.idMat4();
    initialHeadMatrix = utils.translateMat(initialHeadMatrix, 0, this.torsoHeight/2 + this.headRadius, 0);

    return initialHeadMatrix;
  }

  initialize() {
    // Torso
    var torsoGeometry = new THREE.CubeGeometry(2*this.torsoRadius, this.torsoHeight, this.torsoRadius, 64);
    this.torso = new THREE.Mesh(torsoGeometry, this.material);

    // Head
    var headGeometry = new THREE.CubeGeometry(2*this.headRadius, this.headRadius, this.headRadius);
    this.head = new THREE.Mesh(headGeometry, this.material);

    // Arms
    var armsGeometry = new THREE.CubeGeometry(2*this.armsRadius, this.armsLength, this.armsRadius);
    this.Larm = new THREE.Mesh(armsGeometry, this.material);
    this.Rarm = new THREE.Mesh(armsGeometry, this.material);

    // Add parts
    // TODO


    // Torse transformation
    this.torsoInitialMatrix = this.initialTorsoMatrix();
    this.torsoMatrix = utils.idMat4();
    this.torso.setMatrix(this.torsoInitialMatrix);

    // Head transformation
    this.headInitialMatrix = this.initialHeadMatrix();
    this.headMatrix = utils.idMat4();
    var matrix = utils.multMat(this.torsoInitialMatrix, this.headInitialMatrix);
    this.head.setMatrix(matrix);

    //Arms transformation
    // left arm
    this.LarmInitialMatrix = this.initialArmMatrix("L");
    this.LarmMatrix = utils.idMat4();

    var mL = utils.multMat(this.torsoInitialMatrix, this.LarmInitialMatrix);
    this.Larm.setMatrix(mL);

    // right arm
    this.RarmInitialMatrix  = this.initialArmMatrix();
    this.RarmMatrix = utils.idMat4();

    var mR = utils.multMat(this.torsoInitialMatrix, this.RarmInitialMatrix);
    this.Rarm.setMatrix(mR);
    
    // Add transformations
    // TODO

	// Add robot to scene
	scene.add(this.torso);
    scene.add(this.head);
    scene.add(this.Larm);
    scene.add(this.Rarm);
    
    // Add parts
    // TODO
  }

  //DONE
  rotateTorso(angle){
    var torsoMatrix = this.torsoMatrix;

    this.torsoMatrix = utils.idMat4();
    this.torsoMatrix = utils.rotateMat(this.torsoMatrix, angle, "y");
    this.torsoMatrix = utils.multMat(torsoMatrix, this.torsoMatrix);

    var matrix = utils.multMat(this.torsoMatrix, this.torsoInitialMatrix);
    this.torso.setMatrix(matrix);

    var matrix2 = utils.multMat(this.headMatrix, this.headInitialMatrix);
    matrix = utils.multMat(matrix, matrix2);
    this.head.setMatrix(matrix);

    this.walkDirection = utils.rotateVec3(this.walkDirection, angle, "y");
  }

  moveTorso(speed){
    this.torsoMatrix = utils.translateMat(this.torsoMatrix, speed * this.walkDirection.x, speed * this.walkDirection.y, speed * this.walkDirection.z);

    var MainMat = utils.multMat(this.torsoMatrix, this.torsoInitialMatrix);
    this.torso.setMatrix(MainMat);

    var headMat = utils.multMat(this.headMatrix, this.headInitialMatrix);
    var Hmat = utils.multMat(MainMat, headMat);
    this.head.setMatrix(Hmat);

    var LarmMat = utils.multMat(this.LarmMatrix, this.LarmInitialMatrix);
    var LAMat = utils.multMat(MainMat, LarmMat);
    this.Larm.setMatrix(LAMat);

    var RarmMat = utils.multMat(this.RarmMatrix, this.RarmInitialMatrix);
    var RAMat = utils.multMat(MainMat, RarmMat);
    this.Rarm.setMatrix(RAMat);
    
  }

  rotateHead(angle){
    var headMatrix = this.headMatrix;

    this.headMatrix = utils.idMat4();
    this.headMatrix = utils.rotateMat(this.headMatrix, angle, "y");
    this.headMatrix = utils.multMat(headMatrix, this.headMatrix);

    var matrix = utils.multMat(this.headMatrix, this.headInitialMatrix);
    matrix = utils.multMat(this.torsoMatrix, matrix);
    matrix = utils.multMat(this.torsoInitialMatrix, matrix);
    this.head.setMatrix(matrix);
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
        robot.moveTorso(0.1);
        break;
      case "Head":
        break;
      // Add more cases
      // TODO
    }
  }

  // DOWN
  if (keyboard.pressed("s")){
    switch (components[selectedRobotComponent]){
      case "Torso":
        robot.moveTorso(-0.1);
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
        robot.rotateTorso(rotation_speed);
        break;
      case "Head":
        robot.rotateHead(rotation_speed);
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
        robot.rotateTorso(-rotation_speed);
        break;
      case "Head":
        robot.rotateHead(-rotation_speed);
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
