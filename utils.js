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

        this.parent = parent;
        this.children = listOfChildren;
        this.dof = dof;
        this.name = name;

        this.self = new THREE.Mesh(geometry, this.material);

        this.initialize_limb(initialPosition);
    }

    // rotate method which iteratively rotates every children by the same angle
    rotate(angle, axis){
        if (this.dof.includes(axis)){
            var m = this.matrix;

            this.matrix = this.parent == null ? idMat4() : multMat(this.parent.matrix, this.matrix);
            this.matrix = rotateMat(this.matrix, angle, axis);
            this.matrix = multMat(m, this.matrix);

            var m0 = multMat(this.matrix, this.initialMatrix);
            this.self.setMatrix(m0);

            this.walkDirection = rotateVec3(this.walkDirection, angle, axis);

            for (let c of this.children){
                var temp = multMat(c.matrix, c.initialMatrix);
                c.self.setMatrix(multMat(m0, temp));
            }
        } else {
            window.alert("could not rotate " + this.name + " along the " + axis + " axis, ilegal move");
        }
    }

    move(speed){
        this.matrix = translateMat(this.matrix, speed * this.walkDirection.x, speed * this.walkDirection.y, speed * this.walkDirection.z);
        var m0 = multMat(this.matrix, this.initialMatrix);
        this.self.setMatrix(m0);

        for (let c of this.children){
            var temp = multMat(c.matrix, c.initialMatrix);
            c.self.setMatrix(multMat(m0, temp));
        }
    }

    // p0 is the initial position
    initialize_limb(p0){
        this.initialMatrix = translateMat(idMat4(), p0[0], p0[1], p0[2]);
        this.matrix = idMat4();
        if (this.name.includes("arm")){
            this.matrix = rescaleMat(this.matrix, 1, 1.5, 1);
            this.self.setMatrix(this.matrix);
        }

        if (this.parent != null){
            this.self.setMatrix(multMat(this.parent.initialMatrix, this.initialMatrix));
        } else {
            this.self.setMatrix(this.initialMatrix);
        }
        console.log(this.name, this.matrix);
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
    const rows = [0, 4, 8, 12].map(i => mat.slice(i, i + 4).join(" "));
  
    return rows.join("\n");
  }
