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
    // Placement 
    this.mainBodyPos = [0,4,0];
    var m = this.mainBodyPos;

    var p = [];
    

    // limbs

    // Head
    var headGeometry = new THREE.CubeGeometry(0.64, 0.32, 0.32);
    p = [0,1.25,0];
    this.head = new utils.Limb(null, [], p, ["x","y","z"], headGeometry, "Head");    

    // hands
    var handsGeometry = new THREE.SphereGeometry(0.25, 50, 50, 0, Math.PI * 2, 0, Math.PI * 2);
    p = [1,-2,0];
    this.Lhand = new utils.Limb(null, [], p, ["x","y","z"], handsGeometry, "LHand");
    p = [-1,-2,0];
    this.Rhand = new utils.Limb(null,  [], p, ["x","y","z"], handsGeometry, "RHand");

    // forearms
    var farmsGeometry = new THREE.SphereGeometry(0.20, 50, 50, 0, Math.PI * 2, 0, Math.PI * 2);
    p = [1,-1,0];
    this.LFarm = new utils.Limb(null, [this.Lhand], p, ["x","y","z"], farmsGeometry, "LFarm");
    p = [-1,-1,0];
    this.RFarm = new utils.Limb(null, [this.Rhand], p, ["x","y","z"], farmsGeometry, "RFarm");

    // Arms
    var armsGeometry = new THREE.SphereGeometry(0.25, 50, 50, 0, Math.PI * 2, 0, Math.PI * 2);
    p = [1,0,0];
    this.Larm = new utils.Limb(null, [this.LFarm], p, ["x","y","z"], armsGeometry, "Larm");
    p = [-1,0,0];
    this.Rarm = new utils.Limb(null, [this.RFarm], p, ["x","y","z"], armsGeometry, "Rarm");

    // ----------------------------------- Lower Body -----------------------------------
    // feet
    var feetGeometry = new THREE.SphereGeometry(0.25, 50, 50, 0, Math.PI * 2, 0, Math.PI * 2);
    p = [0.4,-3.8,0];
    this.Lfoot = new utils.Limb(null, [], p, ["x","y","z"], feetGeometry, "Lfeet");
    p = [-0.4,-3.8,0];
    this.Rfoot = new utils.Limb(null, [], p, ["x","y","z"], feetGeometry, "Rfeet");

    //forelegs :)
    var flegsGeometry = new THREE.SphereGeometry(0.25, 50, 50, 0, Math.PI * 2, 0, Math.PI * 2);
    p = [0.4,-3,0];
    this.LFleg = new utils.Limb(null, [this.Lfoot], p, ["x","y","z"], flegsGeometry, "LFleg");
    p = [-0.4,-3,0];
    this.RFleg = new utils.Limb(null, [this.Rfoot], p, ["x","y","z"], flegsGeometry, "RFleg");

    //legs
    var legsGeometry = new THREE.SphereGeometry(0.30, 50, 50, 0, Math.PI * 2, 0, Math.PI * 2);
    p = [0.4,-1.5,0];
    this.Lleg = new utils.Limb(null, [this.LFleg], p, ["x","y","z"], legsGeometry, "Lleg");
    p = [-0.4, -1.5, 0];
    this.Rleg = new utils.Limb(null, [this.RFleg], p, ["x","y","z"], legsGeometry, "Rleg");

    // torso 
    let torsoGeometry = new THREE.CubeGeometry(1.5, 1.5, 0.75, 64);
    this.torso = new utils.Limb(null, [this.head, this.Larm, this.Rarm, this.Lleg, this.Rleg], m, ["x","y","z"], torsoGeometry, "Torso");

    this.head.set_previous(this.torso);
    this.Rarm.set_previous(this.torso); this.RFarm.set_previous(this.Rarm); this.Rhand.set_previous(this.RFarm);
    this.Larm.set_previous(this.torso); this.LFarm.set_previous(this.Larm); this.Lhand.set_previous(this.LFarm);
    this.Rleg.set_previous(this.torso); this.RFleg.set_previous(this.Rleg); this.Rfoot.set_previous(this.LFleg);
    this.Lleg.set_previous(this.torso); this.LFleg.set_previous(this.Lleg); this.Lfoot.set_previous(this.RFleg);



    // limbs list
    this.limbs = [
      this.torso, 
      this.head, 
      this.Larm, this.LFarm, this.Lhand,
      this.Rarm, this.RFarm, this.Rhand, 
      this.Lleg, this.LFleg, this.Lfoot, 
      this.Rleg, this.RFleg, this.Rfoot
    ];

    // Animation
    this.walkDirection = new THREE.Vector3( 0, 0, 1 );

    // Material
    this.material = new THREE.MeshNormalMaterial();

    // Initial pose
    this.initialize()
  }

  initialize() {

    for (let l of this.limbs){
      console.log(l);
    }
    // Add robot to scene
    scene.add(this.torso.self);
      scene.add(this.head.self);

      // Larm
      scene.add(this.Larm.self);
        scene.add(this.LFarm.self);
          scene.add(this.Lhand.self);

      // Rarm
      scene.add(this.Rarm.self);
        scene.add(this.RFarm.self);
          scene.add(this.Rhand.self);

      //Rleg
      scene.add(this.Rleg.self);
        scene.add(this.RFleg.self);
          scene.add(this.Rfoot.self);

      //Lleg
      scene.add(this.Lleg.self);
        scene.add(this.LFleg.self);
          scene.add(this.Lfoot.self);
      
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
  "Lfarm",
  "Rarm",
  "Rfarm",
  "Rleg",
  "RFleg",
  "Lleg",
  "LFleg"

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

  if (keyboard.pressed("u")){
    robot.Larm.anchor_rotate(0.1, "x", robot.torso);
  }

  if (keyboard.pressed("j")){
    robot.Larm.anchor_rotate(-0.1, "x", robot.torso);
  }

  // UP
  // could be generalized with smth like limbs.find(name, component[selectedComponent])
  if (keyboard.pressed("w")){
    switch (components[selectedRobotComponent]){
      case "Torso":
        robot.torso.move(0.1);
        break;
      case "Head":
        robot.head.anchor_rotate(0.1, "x", robot.torso); 
        break;
      case "Larm" :
        robot.Larm.anchor_rotate(0.1, "x", robot.torso);
        break
      case "Lfarm" :
        robot.LFarm.anchor_rotate(0.1, "x", robot.Larm);
        break
      case "Rarm" :
        robot.Rarm.anchor_rotate(0.1, "x", robot.torso);
        break
      case "Rfarm" :
        robot.RFarm.anchor_rotate(0.1, "x", robot.Rarm);
        break
      case "Lleg" :
        robot.Lleg.anchor_rotate(0.1, "x", robot.torso);
        break
      case "Rleg" : 
        robot.Rleg.anchor_rotate(0.1, "x", robot.torso);
        break
      case "":
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
          robot.head.anchor_rotate(-0.1, "x", robot.torso)
          break;
        case "Larm" :
          robot.Larm.anchor_rotate(-0.1, "x", robot.torso);
          break
        case "Lfarm" :
          robot.LFarm.anchor_rotate(-0.1, "x", robot.Larm);
          break
        case "Rarm" :
          robot.Rarm.anchor_rotate(-0.1, "x", robot.torso);
          break
        case "Rfarm" :
          robot.RFarm.anchor_rotate(-0.1, "x", robot.Rarm);
          break
        case "Lleg" :
          robot.Lleg.anchor_rotate(-0.1, "x", robot.torso);
          break
        case "Rleg" : 
          robot.Rleg.anchor_rotate(-0.1, "x", robot.torso)
          break
        case "":
          break
      // Add more cases
      // TODO
    }
  }

  // LEFT
  if (keyboard.pressed("a")){
    var rotation_speed = 0.05;
    switch (components[selectedRobotComponent]){
      case "Torso":
        robot.torso.rotate(rotation_speed, "y");
        break;
        case "Head":
          robot.head.rotate(0.1, "y")
          break;
        case "Larm" :
          robot.Larm.rotate(0.1, "y");
          break
        case "Lfarm" :
          robot.LFarm.rotate(0.1, "y")
          break
        case "Rarm" :
          robot.Rarm.rotate(0.1, "y")
          break
        case "Lleg" :
          robot.Lleg.rotate(0.1, "y")
          break
        case "Rleg" : 
          robot.Rleg.rotate(0.1, "y")
          break
        case "":
          break
      // Add more cases
      // TODO
    }
  }

  // RIGHT
  if (keyboard.pressed("d")){
    var rotation_speed = 0.05;
    switch (components[selectedRobotComponent]){
      case "Torso":
        robot.torso.rotate(-rotation_speed, "y");
        break;
        case "Head":
          robot.head.rotate(-0.1, "y")
          break;
        case "Larm" :
          robot.Larm.rotate(-0.1, "");
          break
        case "Lfarm" :
          robot.LFarm.rotate(-0.1, "y")
          break
        case "Rarm" :
          robot.Rarm.rotate(-0.1, "y")
          break
        case "Lleg" :
          robot.Lleg.rotate(-0.1, "y")
          break
        case "Rleg" : 
          robot.Rleg.rotate(-0.1, "y")
          break
        case "":
          break
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
      console.log(readableMat(robot.Larm.matrix));
      console.log(readableMat(robot.LFarm.matrix));
      console.log(readableMat(robot.Lhand.matrix));
      console.log("\n");
      console.log("\n");
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
