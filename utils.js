//limb
export class Limb {
    /**
     * @param {*} parent
     * @param {*} listOfChildren 
     * @param {*} initialMatrix 
     * @param {*} dof degree of freedom
     * @param {*} geometry
     * @param {*} name 
     */
    constructor(parent, listOfChildren, initialPosition, dof, geometry, name) {
        this.geometry = geometry;
        this.material = new THREE.MeshNormalMaterial();
        this.walkDirection = new THREE.Vector3(0, 0, 1);

        this.initialMatrix = idMat4();
        this.matrix = this.initialMatrix;
        this.p0 = initialPosition;

        this.children = listOfChildren;
        this.dof = dof;
        this.name = name;

        this.self = new THREE.Mesh(torsoGeometry, this.material);

        initialize_limb();
    }

    // rotate method which iteratively rotates every children by the same angle
    rotate(parentMatrix, angle, axis){
        if (axis in this.dof){
            //if torso
            if (this.parent = null){
                var m = this.matrix;

                this.rotation_matrix = idMat4();
                this.rotation_matrix = rotateMat(this.rotation_matrix, angle, "y");
                this.rotation_matrix = multMat(m, this.rotation_matrix);

                var m0 = multMat(this.rotation_matrix, this.initialMatrix);
                this.self.setMatrix(m0);

                this.walkDirection = rotateVec3(this.walkDirection, angle, "y");
            } 
            
            // if not torso
            else {
                //use passed on matrix 
                var m0 = multMat(parentMatrix, multMat(this.matrix, this.initialMatrix));
                this.self.setMatrix(m0);
            }

            for (let e of listOfChildren){
                e.rotate(m0, angle, axis);
            }
        } else {
            window.alert("could not rotate " + this.name + "along the " + axis + "axis, ilegal move");
        }
    }

    move(parentMatrix, speed){
        if (this.parent == null) {
            this.matrix = translateMat(this.matrix, speed * this.walkDirection.x, speed * this.walkDirection.y, speed * this.walkDirection.z);
            var m0 = multMat(this.matrix, this.initialMatrix);
            this.self.setMatrix(m0);
        }
        else {
            this.matrix = multMat(parentMatrix, this.matrix);
            var m0 = multMat(this.matrix, this.initialMatrix);
            this.self.setMatrix(m0);
        }
        for (let e of listOfChildren){
            e.move(m0, speed);
        }
    }

    initialize_limb(){
        this.initialMatrix = tranlsateMat(this.initialMatrix, p0[0], p0[1], p0[2]);
        this.self.setMatrix(this.initialMatrix);
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
    
    // TODO
}
