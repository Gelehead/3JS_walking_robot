import * as utils from '.utils.js';

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

        this.initialMatrix = utils.idMat4();
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

                this.rotation_matrix = utils.idMat4();
                this.rotation_matrix = utils.rotateMat(this.rotation_matrix, angle, "y");
                this.rotation_matrix = utils.multMat(m, this.rotation_matrix);

                var m0 = utils.multMat(this.rotation_matrix, this.initialMatrix);
                this.self.setMatrix(m0);

                this.walkDirection = utils.rotateVec3(this.walkDirection, angle, "y");
            } 
            
            // if not torso
            else {
                //use passed on matrix 
                var m0 = utils.multMat(parentMatrix, utils.multMat(this.matrix, this.initialMatrix));
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
            this.matrix = utils.translateMat(this.matrix, speed * this.walkDirection.x, speed * this.walkDirection.y, speed * this.walkDirection.z);
            var m0 = utils.multMat(this.matrix, this.initialMatrix);
            this.self.setMatrix(m0);
        }
        else {
            this.matrix = utils.multMat(parentMatrix, this.matrix);
            var m0 = utils.multMat(this.matrix, this.initialMatrix);
            this.self.setMatrix(m0);
        }
        for (let e of listOfChildren){
            e.move(m0, speed);
        }
    }

    initialize_limb(){
        this.initialMatrix = utils.tranlsateMat(this.initialMatrix, p0[0], p0[1], p0[2]);
        this.self.setMatrix(this.initialMatrix);
    }
}