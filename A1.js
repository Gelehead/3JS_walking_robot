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

// TRANSFORMATIONS

function multMat(m1, m2){
  return new THREE.Matrix4().multiplyMatrices(m1, m2);
}

function inverseMat(m){
  return new THREE.Matrix4().getInverse(m, true);
}

function idMat4() {
  var m = new THREE.Matrix4();
  m.set(
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
  );
  return m;
}

function translateMat(matrix, x, y, z) {
  var m = new THREE.Matrix4();
  m.set(
    1, 0, 0, x,
    0, 1, 0, y,
    0, 0, 1, z,
    0, 0, 0, 1
  );
  return multMat(m, matrix);
}

function getRotationMatrix(angle, axis){
  var m = idMat4();
  if (axis == "x") {
      m.set(
          1,         0      ,          0          , 0,
          0, Math.cos(angle), (-1)*Math.sin(angle), 0,
          0, Math.sin(angle),   Math.cos(angle)   , 0,
          0,         0      ,          0          , 1
      );
  }

  if (axis == "y") {
    m.set(
         Math.cos(angle)  , 0,   Math.sin(angle)   , 0,
               0          , 1,          0          , 0,
      (-1)*Math.sin(angle), 0,   Math.cos(angle)   , 0,
               0          , 0,          0          , 1
    );
  }

  if (axis == "z") {
    m.set(
      Math.cos(angle), (-1)*Math.sin(angle), 0, 0,
      Math.sin(angle),   Math.cos(angle)   , 0, 0,
              0      ,          0          , 1, 0,
              0      ,          0          , 0, 1
    );
  }
  return m;
}

function rotateMat(matrix, angle, axis){
  return multMat(matrix, getRotationMatrix(angle, axis));
}

function rotateVec3(v, angle, axis){
  return v.applyMatrix4(getRotationMatrix(angle, axis));
}

function rescaleMat(matrix, x, y, z){
  var m = idMat4();
  m.set(
    x, 0, 0, 0,
    0, y, 0, 0,
    0, 0, z, 0,
    0, 0, 0, 1
  );
  return multMat(m, matrix)
}

class Robot {
  constructor() {
    // Geometry

    this.torsoHeight = 1.5;
    this.torsoPos = [0, 4, 0]

    this.torsoRadius = 0.75;
    this.headRadius = 0.32;

    this.armsRadius = 0.35;
    this.farmsRadius = 0.20;
    this.handRadius = 0.25;

    this.legsRadius = 0.40;
    this.flegRadius = 0.25;
    this.feetRadius = 0.25;


    // Animation
    this.walkDirection = new THREE.Vector3( 0, 0, 1 );

    // Material
    this.material = new THREE.MeshNormalMaterial();

    // Initial pose
    this.initialize()
  }

  // torso initial matrix
  initialTorsoMatrix(){
    var initialTorsoMatrix = idMat4();
    initialTorsoMatrix = translateMat(initialTorsoMatrix, this.torsoPos[0], this.torsoPos[1], this.torsoPos[2]);

    return initialTorsoMatrix;
  }

  // head initial matrix
  initialHeadMatrix(){
    var initialHeadMatrix = idMat4();
    initialHeadMatrix = translateMat(initialHeadMatrix, 0, this.torsoHeight/2 + this.headRadius, 0);

    return initialHeadMatrix;
  }

  // left arm initial matrix
  initialLarmMatrix(){
    var initialLarmMatrix = idMat4();
    initialLarmMatrix = rescaleMat(initialLarmMatrix, 1, 2, 1);
    initialLarmMatrix = translateMat(initialLarmMatrix, 1.5*this.torsoRadius, 0, 0 );

    return initialLarmMatrix;
  }

  // left forearm initial matrix
  initialLfarmMatrix(){
    var initialLfarmMatrix = idMat4();
    initialLfarmMatrix = rescaleMat(initialLfarmMatrix, 1, 2, 1);
    initialLfarmMatrix = translateMat(initialLfarmMatrix, 1.5*this.torsoRadius, -this.torsoHeight, 0 );

    return initialLfarmMatrix;
  }

  // right arm initial matrix
  initialRarmMatrix(){
    var initialRarmMatrix = idMat4();
    initialRarmMatrix = rescaleMat(initialRarmMatrix, 1, 2, 1);
    initialRarmMatrix = translateMat(initialRarmMatrix, -1.5*this.torsoRadius, 0, 0 );

    return initialRarmMatrix;
  }

  // right forearm initial matrix
  initialRfarmMatrix(){
    var initialRfarmMatrix = idMat4();
    initialRfarmMatrix = rescaleMat(initialRfarmMatrix, 1, 2, 1);
    initialRfarmMatrix = translateMat(initialRfarmMatrix, -1.5*this.torsoRadius, -this.torsoHeight, 0 );

    return initialRfarmMatrix;
  }

  // right leg initial matrix
  initialLlegMatrix(){
    var initialLlegMatrix = idMat4();
    initialLlegMatrix = rescaleMat(initialLlegMatrix, 1.2, 1.8, 1);
    initialLlegMatrix = translateMat(initialLlegMatrix, -0.5*this.torsoRadius, -this.torsoHeight, 0 );

    return initialLlegMatrix;
  }

  // left foreleg initial matrix
  initialLflegMatrix(){
    var initialLflegMatrix = idMat4();
    initialLflegMatrix = rescaleMat(initialLflegMatrix, 1.2, 1.8, 1);
    initialLflegMatrix = translateMat(initialLflegMatrix, -0.5*this.torsoRadius, -2*this.torsoHeight, 0 );

    return initialLflegMatrix;
  }
  
  // right leg initial matrix
  initialRlegMatrix(){
    var initialRlegMatrix = idMat4();
    initialRlegMatrix = rescaleMat(initialRlegMatrix, 1.2, 1.8, 1);
    initialRlegMatrix = translateMat(initialRlegMatrix, 0.5*this.torsoRadius, -this.torsoHeight, 0 );

    return initialRlegMatrix;
  }

  // right foreleg initial matrix
  initialRflegMatrix(){
    var initialRflegMatrix = idMat4();
    initialRflegMatrix = rescaleMat(initialRflegMatrix, 1.2, 1.8, 1);
    initialRflegMatrix = translateMat(initialRflegMatrix, 0.5*this.torsoRadius, -2*this.torsoHeight, 0 );

    return initialRflegMatrix;
  }



  initialize() {
    // Torso
    var torsoGeometry = new THREE.CubeGeometry(2*this.torsoRadius, this.torsoHeight, this.torsoRadius, 64);
    this.torso = new THREE.Mesh(torsoGeometry, this.material);

    // Head
    var headGeometry = new THREE.CubeGeometry(2*this.headRadius, this.headRadius, this.headRadius);
    this.head = new THREE.Mesh(headGeometry, this.material);

    // arms
    var armsGeometry = new THREE.SphereGeometry(this.armsRadius, 25, 25, 0, Math.PI * 2, 0, Math.PI * 2);
    this.Larm = new THREE.Mesh(armsGeometry, this.material);
    this.Rarm = new THREE.Mesh(armsGeometry, this.material);

    // arms
    var farmsGeometry = new THREE.SphereGeometry(this.farmsRadius, 25, 25, 0, Math.PI * 2, 0, Math.PI * 2);
    this.Lfarm = new THREE.Mesh(farmsGeometry, this.material);
    this.Rfarm = new THREE.Mesh(farmsGeometry, this.material);

    // legs
    var legsGeometry = new THREE.SphereGeometry(this.legsRadius, 10, 10, 0, Math.PI * 2, 0, Math.PI * 2);
    this.Lleg = new THREE.Mesh(legsGeometry, this.material);
    this.Rleg = new THREE.Mesh(legsGeometry, this.material);

    // Forelegs
    var flegsGeometry = new THREE.SphereGeometry(this.flegRadius, 10, 10, 0, Math.PI * 2, 0, Math.PI * 2);
    this.Lfleg = new THREE.Mesh(flegsGeometry, this.material);
    this.Rfleg = new THREE.Mesh(flegsGeometry, this.material);

    // Add parts
    // TODO

    // Torse transformation
    this.torsoInitialMatrix = this.initialTorsoMatrix();
    this.torsoMatrix = idMat4();
    this.torso.setMatrix(this.torsoInitialMatrix);

    // Head transformation
    this.headInitialMatrix = this.initialHeadMatrix();
    this.headMatrix = idMat4();
    var matrix = multMat(this.torsoInitialMatrix, this.headInitialMatrix);
    this.head.setMatrix(matrix);

    // arms transformation
    // left arm transformation
    this.LarmInitialMatrix = this.initialLarmMatrix();
    this.LarmMatrix = idMat4();
    var matrix = multMat(this.torsoInitialMatrix, this.LarmInitialMatrix);
    this.Larm.setMatrix(matrix);

    // left arm transformation
    this.LfarmInitialMatrix = this.initialLfarmMatrix();
    this.LfarmMatrix = idMat4();
    var matrix = multMat(this.torsoInitialMatrix, this.LfarmInitialMatrix);
    this.Lfarm.setMatrix(matrix);

    // Right arm transformation
    this.RarmInitialMatrix = this.initialRarmMatrix();
    this.RarmMatrix = idMat4();
    var matrix = multMat(this.torsoInitialMatrix, this.RarmInitialMatrix);
    this.Rarm.setMatrix(matrix);

    // Right forearm transformation
    this.RfarmInitialMatrix = this.initialRfarmMatrix();
    this.RfarmMatrix = idMat4();
    var matrix = multMat(this.torsoInitialMatrix, this.RfarmInitialMatrix);
    this.Rfarm.setMatrix(matrix);
    

    // legs transformation
    // right leg transformation
    this.LleginitialMatrix = this.initialLlegMatrix();
    this.LlegMatrix = idMat4();
    var matrix = multMat(this.torsoInitialMatrix, this.LleginitialMatrix);
    this.Lleg.setMatrix(matrix);


    // right foreleg transformation
    this.LfleginitialMatrix = this.initialLflegMatrix();
    this.LflegMatrix = idMat4();
    var matrix = multMat(this.torsoInitialMatrix, this.LfleginitialMatrix);
    this.Lfleg.setMatrix(matrix);

    // right leg transformation
    this.RleginitialMatrix = this.initialRlegMatrix();
    this.RlegMatrix = idMat4();
    var matrix = multMat(this.torsoInitialMatrix, this.RleginitialMatrix);
    this.Rleg.setMatrix(matrix);

    // right leg transformation
    this.RfleginitialMatrix = this.initialRflegMatrix();
    this.RflegMatrix = idMat4();
    var matrix = multMat(this.torsoInitialMatrix, this.RfleginitialMatrix);
    this.Rfleg.setMatrix(matrix);


    // Add transformations
    // TODO

	// Add robot to scene
	scene.add(this.torso);
    scene.add(this.head);
    
    scene.add(this.Rarm);
      scene.add(this.Rfarm);
    scene.add(this.Larm);
      scene.add(this.Lfarm);

    scene.add(this.Lleg);
      scene.add(this.Lfleg);
    scene.add(this.Rleg);
      scene.add(this.Rfleg);
    
    // Add parts
    // TODO
  }

  rotateTorso(angle, axis){
    var torsoMatrix = this.torsoMatrix;

    this.torsoMatrix = idMat4();
    this.torsoMatrix = rotateMat(this.torsoMatrix, angle, axis);
    this.torsoMatrix = multMat(torsoMatrix, this.torsoMatrix);

    var matrix = multMat(this.torsoMatrix, this.torsoInitialMatrix);
    this.torso.setMatrix(matrix);

    var matrix2 = multMat(this.headMatrix, this.headInitialMatrix);
    matrix = multMat(matrix, matrix2);
    this.head.setMatrix(matrix);

    this.walkDirection = rotateVec3(this.walkDirection, angle, axis);

    rotateLarm(angle, axis);
    //rotateRarm(angle, axis);

    //rotateLleg(angle, axis);
    //rotateRleg(angle, axis);
  }

  rotateLarm(angle, axis){
    var LarmMatrix = this.LarmMatrix;

    this.LarmMatrix = idMat4();
    this.LarmMatrix = rotateMat(this.LarmMatrix, angle, axis);
    this.LarmMatrix = multMat(LarmMatrix, this.LarmMatrix);

    var matrix = multMat(this.torsoMatrix, this.torsoInitialMatrix);
    this.torso.setMatrix(matrix);

    var matrix2 = multMat(this.headMatrix, this.headInitialMatrix);
    matrix = multMat(matrix, matrix2);
    this.head.setMatrix(matrix);
  }

  rotateRarm(angle, axis){
    var torsoMatrix = this.torsoMatrix;

    this.torsoMatrix = idMat4();
    this.torsoMatrix = rotateMat(this.torsoMatrix, angle, axis);
    this.torsoMatrix = multMat(torsoMatrix, this.torsoMatrix);

    var matrix = multMat(this.torsoMatrix, this.torsoInitialMatrix);
    this.torso.setMatrix(matrix);

    var matrix2 = multMat(this.headMatrix, this.headInitialMatrix);
    matrix = multMat(matrix, matrix2);
    this.head.setMatrix(matrix);
  }

  rotateLleg(angle, axis){
    var torsoMatrix = this.torsoMatrix;

    this.torsoMatrix = idMat4();
    this.torsoMatrix = rotateMat(this.torsoMatrix, angle, axis);
    this.torsoMatrix = multMat(torsoMatrix, this.torsoMatrix);

    var matrix = multMat(this.torsoMatrix, this.torsoInitialMatrix);
    this.torso.setMatrix(matrix);

    var matrix2 = multMat(this.headMatrix, this.headInitialMatrix);
    matrix = multMat(matrix, matrix2);
    this.head.setMatrix(matrix);
  }

  rotateRleg(angle, axis){
    var torsoMatrix = this.torsoMatrix;

    this.torsoMatrix = idMat4();
    this.torsoMatrix = rotateMat(this.torsoMatrix, angle, axis);
    this.torsoMatrix = multMat(torsoMatrix, this.torsoMatrix);

    var matrix = multMat(this.torsoMatrix, this.torsoInitialMatrix);
    this.torso.setMatrix(matrix);

    var matrix2 = multMat(this.headMatrix, this.headInitialMatrix);
    matrix = multMat(matrix, matrix2);
    this.head.setMatrix(matrix);
  }


  moveTorso(speed){
    this.torsoMatrix = translateMat(this.torsoMatrix, speed * this.walkDirection.x, speed * this.walkDirection.y, speed * this.walkDirection.z);

    var Mainmatrix = multMat(this.torsoMatrix, this.torsoInitialMatrix);
    this.torso.setMatrix(Mainmatrix);

    // move Head
    var matrix2 = multMat(this.headMatrix, this.headInitialMatrix);
    var Hmatrix = multMat(Mainmatrix, matrix2);
    this.head.setMatrix(Hmatrix);

    // move Right leg
    var matrix3 = multMat(this.RlegMatrix, this.RleginitialMatrix);
    var RLmatrix = multMat(Mainmatrix, matrix3);
    this.Rleg.setMatrix(RLmatrix);
    
    // move Left leg
    var matrix4 = multMat(this.LlegMatrix, this.LleginitialMatrix);
    var LLmatrix = multMat(Mainmatrix, matrix4);
    this.Lleg.setMatrix(LLmatrix);
    
    // move Right foreleg
    var matrix5 = multMat(this.RflegMatrix, this.RfleginitialMatrix);
    var RFLmatrix = multMat(Mainmatrix, matrix5);
    this.Rfleg.setMatrix(RFLmatrix);
    
    // move Left foreleg
    var matrix10 = multMat(this.LflegMatrix, this.LfleginitialMatrix);
    var LFLmatrix = multMat(Mainmatrix, matrix10);
    this.Lfleg.setMatrix(LFLmatrix);
    
    // move Right arm
    var matrix6 = multMat(this.RarmMatrix, this.RarmInitialMatrix);
    var RAmatrix = multMat(Mainmatrix, matrix6);
    this.Rarm.setMatrix(RAmatrix);
    
    // move Right forearm
    var matrix7 = multMat(this.RfarmMatrix, this.RfarmInitialMatrix);
    var RFAmatrix = multMat(Mainmatrix, matrix7);
    this.Rfarm.setMatrix(RFAmatrix);
    
    // move left arm
    var matrix8 = multMat(this.LarmMatrix, this.LarmInitialMatrix);
    var LAmatrix = multMat(Mainmatrix, matrix8);
    this.Larm.setMatrix(LAmatrix);
    
    // move left forearm
    var matrix9 = multMat(this.LfarmMatrix, this.LfarmInitialMatrix);
    var LFAmatrix = multMat(Mainmatrix, matrix9);
    this.Lfarm.setMatrix(LFAmatrix);
  }

  rotateHead(angle){
    var headMatrix = this.headMatrix;

    this.headMatrix = idMat4();
    this.headMatrix = rotateMat(this.headMatrix, angle, "y");
    this.headMatrix = multMat(headMatrix, this.headMatrix);

    var matrix = multMat(this.headMatrix, this.headInitialMatrix);
    matrix = multMat(this.torsoMatrix, matrix);
    matrix = multMat(this.torsoInitialMatrix, matrix);
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
    switch (components[selectedRobotComponent]){
      case "Torso":
        robot.rotateTorso(0.1);
        break;
      case "Head":
        robot.rotateHead(0.1);
        break;
      // Add more cases
      // TODO
    }
  }

  // RIGHT
  if (keyboard.pressed("d")){
    switch (components[selectedRobotComponent]){
      case "Torso":
        robot.rotateTorso(-0.1);
        break;
      case "Head":
        robot.rotateHead(-0.1);
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
