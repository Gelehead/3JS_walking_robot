//limb
export class Limb {
    /**
     * @param {*} next 
     * @param {*} initialMatrix 
     * @param {*} dof degree of freedom
     * @param {*} geometry
     * @param {*} name 
     */
    constructor(previous, next, initialPosition, dof, geometry, name) {
        this.geometry = geometry;
        this.material = new THREE.MeshNormalMaterial();
        this.walkDirection = new THREE.Vector3(0, 0, 1);

        this.children = next;
        this.dof = dof;
        this.name = name;
        this.previous = previous;

        this.self = new THREE.Mesh(geometry, this.material);

        this.initialize_limb(initialPosition);
    }

    // rotate method which iteratively rotates every children by the same angle
    rotate(angle, axis){
        if (this.dof.includes(axis)){
            var m = this.matrix;

            this.matrix = idMat4();
            this.matrix = rotateMat(this.matrix, angle, axis);
            this.matrix = multMat(m, this.matrix);

            var m0 = multMat(this.matrix, this.initialMatrix);
            this.self.setMatrix(m0);

            this.walkDirection = rotateVec3(this.walkDirection, angle, axis);

            this.apply_to_children(m0);
        } else {
            window.alert("could not rotate " + this.name + " along the " + axis + " axis, ilegal move");
        }
    }

    
    rotateArm(angle, axis, torso, farm, hand){
        var m = idMat4();
        var a;
        var final_matrix;

        //transformations
        m = multMat(torso.matrix, torso.initialMatrix);
        m = multMat(m, this.matrix);
        a = this.get_anchor(m);
        this.matrix = translateMat(this.matrix, -a[0], -a[1], -a[2]);
        this.matrix = rotateMat(this.matrix, angle, axis);
        this.matrix = translateMat(this.matrix, a[0], a[1], a[2]);
        
        final_matrix = multMat(m, this.matrix);
        
        m = multMat(m, this.initialMatrix);
        //application
        this.self.setMatrix(multMat(final_matrix, this.initialMatrix));
        
        farm.self.setMatrix(multMat(multMat(final_matrix, farm.matrix),farm.initialMatrix))
        hand.self.setMatrix(multMat(multMat(final_matrix, hand.matrix),hand.initialMatrix))
    }
    rotateFarm(angle, axis, torso, arm, hand){
        var m = idMat4();
        var m1 = idMat4();
        var m2 = idMat4();
        var a;
        var final_matrix;

        //transformations
        m1 = multMat(torso.matrix, torso.initialMatrix);
        console.log(readableMat(arm.initialMatrix))
        m2 = multMat(arm.matrix, arm.initialMatrix)
        
        m = multMat(m1,arm.matrix);
        m = multMat(m, this.matrix);
        a = this.get_anchor(m);
        this.matrix = translateMat(this.matrix, -a[0], -a[1], -a[2]);
        this.matrix = rotateMat(this.matrix, angle, axis);
        this.matrix = translateMat(this.matrix, a[0], a[1], a[2]);
        
        final_matrix = multMat(m, this.matrix);
        
        m = multMat(m, this.initialMatrix);
        //application
        this.self.setMatrix(multMat(final_matrix, this.initialMatrix));
        hand.self.setMatrix(multMat(multMat(final_matrix, hand.matrix),hand.initialMatrix))
    }

    getFootHeight(torso, leg){
        var m = idMat4();
        var torsoMatrix = multMat(torso.matrix, torso.initialMatrix)
        var legMatrix = multMat(leg.matrix, leg.initialMatrix)
        var footMatrix = multMat(this.matrix, this.initialMatrix)

        var m1 = multMat(torsoMatrix, legMatrix);
        var m2 = multMat(leg.matrix, footMatrix)

        //return this.get_anchor()[1]
    }

    /**anchor parameter is a point3 vector at which post rotation matrix will be translated
     * 
     * @param {*} angle 
     * @param {*} axis 
     * @param {*} papa is the father's matrix (see README.md)
     */
    anchor_rotate(angle, axis, papa){ 

        // initialisation
        var m = idMat4();
        var a;
        var final_matrix;

        //transformations
        //m = multMat(papa.matrix, papa.initialMatrix);

        m = this.root_transformation();
        m = multMat(m, this.matrix);
        a = this.get_anchor(m);

        this.matrix = translateMat(this.matrix, -a[0], -a[1], -a[2]);
        this.matrix = rotateMat(this.matrix, angle, axis);
        this.matrix = translateMat(this.matrix, a[0], a[1], a[2]);
        
        final_matrix = multMat(m, this.matrix);

        //application
        this.self.setMatrix(multMat(final_matrix, this.initialMatrix));
        this.apply_to_children(final_matrix);
    }

    move(speed){
        // initialisation
        var m = this.matrix;

        // transformation
        m = translateMat(m, speed * this.walkDirection.x, speed * this.walkDirection.y, speed * this.walkDirection.z);
        let final_matrix = multMat(m, this.initialMatrix);

        //application
        this.self.setMatrix(final_matrix);
        this.matrix = m;

        this.apply_to_children(final_matrix);
    }

    root_transformation(){
        var current_limb = this.previous;
        var m = idMat4();
        while (true){
            m = multMat(m, current_limb.matrix);
            if (current_limb.previous != null)
            {
                current_limb = current_limb.previous;
            } 
            else{
                break;
            }
        }
        m = multMat(m, current_limb.initialMatrix);

        return m;
    }

    apply_to_children(matrix){
        for (let c of this.children){
            let m = multMat(matrix, c.matrix);
            c.self.setMatrix(multMat(m, c.initialMatrix));
            c.apply_to_children(m)
        }
    }

    apply_to_children1(){
        for (let c of this.children){
            let m = multMat(c.matrix, this.getAllTransformations(this));
            m = multMat(c.matrix, m);
            c.self.setMatrix(m);
        }
    }

    // p0 is the intended initial position of the limb
    initialize_limb(p0){
        //intiialisation
        this.initialMatrix = idMat4();
        this.matrix = idMat4();
        var m = idMat4();

        //transformations
        if (this.name.includes("arm") || this.name.includes("leg")){
            m = rescaleMat(m, 1, 2, 1);
        }
        if (this.name.includes("leg")){
            m = rescaleMat(m, 1.2, 1.5, 1);
        }
        m = translateMat(m, p0[0], p0[1], p0[2]);

        // application
        this.initialMatrix = multMat(this.initialMatrix, m);
        this.self.setMatrix(this.initialMatrix);

        //transmission
        this.apply_to_children(this.initialMatrix);
    }


    //setters
    set_previous(l){this.previous = l;}

    // returns [x,y,z] of actual limb
    get_anchor(matrix){
        var a = matrix.elements;
        return [a[12], a[13], a[14]];
    }
    // returns [cosx, cosy, cosz]
    get_angles(){
        let m = this.matrix.elements;
        return [m[0], m[4], m[8]];
    }
}

// TRANSFORMATIONS
export function multMat(m1, m2){
    return new THREE.Matrix4().multiplyMatrices(m1, m2);
}
  
export function inverseMat(m){
    return new THREE.Matrix4().getInverse(m, true);
}
  
export function idMat4() {
    var m = new THREE.Matrix4();
    m.set(
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    );
    return m;
}

export function negIdMat4() {
    var m = new THREE.Matrix4();
    m.set(
        -1, 0, 0, 0,
        0, -1, 0, 0,
        0, 0, -1, 0,
        0, 0, 0, 1
    );
    return m;
}
  
// matrix: THREE.Matrix4
// x, y, z: float
export function translateMat(matrix, x, y, z) {
    var m = new THREE.Matrix4();
    m.set(
      1, 0, 0, x,
      0, 1, 0, y,
      0, 0, 1, z,
      0, 0, 0, 1
    );
    // window.alert(m.toArray())
    // check order of not working
    return multMat(m, matrix);
}
  
export function getRotationMatrix(angle, axis){
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
  
// note : assumes the angle is given in radiants
// Apply rotation by @angle with respect to @axis to @matrix
// matrix: THREE.Matrix3
// angle: float
// axis: string "x", "y" or "z"
export function rotateMat(matrix, angle, axis){  
    return multMat(matrix, getRotationMatrix(angle, axis));
}
  
// Apply rotation by @angle with respect to @axis to vector @v
// v: THREE.Vector3
// angle: float
// axis: string "x", "y" or "z"
export function rotateVec3(v, angle, axis){
    return v.applyMatrix4(getRotationMatrix(angle, axis));
}
  
// Apply scaling @x, @y and @z to @matrix
// matrix:THREE.Matrix3
// x, y, z: float
export function rescaleMat(matrix, x, y, z){
    var m = idMat4();
    m.set(
        x, 0, 0, 0,
        0, y, 0, 0,
        0, 0, z, 0,
        0, 0, 0, 1
    );
    return multMat(m, matrix)
}

// UTILS FUNCTION

// funky function
function readableMat(matrix) {
    const mat = matrix.toArray();
    
    // Transpose the matrix by rearranging the indices
    const transposedRows = [0, 1, 2, 3].map(row =>
        [0, 4, 8, 12].map(col => mat[row + col]).join(" ")
    );

    return transposedRows.join("\n");
}