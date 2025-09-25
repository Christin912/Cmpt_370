
import math

def write_cylinder_with_normals(n=32, radius=1.0, height=2.0, filename="cylinder_with_normals.obj"):
    h2 = height/2.0
    verts = []
    # top ring vertices 1..n
    for i in range(n):
        theta = 2*math.pi*i/n
        verts.append((radius*math.cos(theta),  h2, radius*math.sin(theta)))
    
    for i in range(n):
        theta = 2*math.pi*i/n
        verts.append((radius*math.cos(theta), -h2, radius*math.sin(theta)))
    # centers
    verts.append((0.0, h2, 0.0))    
    verts.append((0.0,-h2, 0.0))    

    # normals: top ring normals (n), bottom ring normals (n), top cap, bottom cap
    normals = []
    for i in range(n):
        theta = 2*math.pi*i/n
        normals.append((math.cos(theta), 0.0, math.sin(theta)))  # top 
    for i in range(n):
        theta = 2*math.pi*i/n
        normals.append((math.cos(theta), 0.0, math.sin(theta)))  # bottom normals
    normals.append((0.0, 1.0, 0.0))   
    normals.append((0.0,-1.0, 0.0))   

    faces = []
    face_normals = []  # list of tuples of normal indices matching each face's vertices

    # side faces
    for i in range(n):
        inext = (i+1) % n
        t1 = i+1
        t2 = inext+1
        b1 = n + i + 1
        b2 = n + inext + 1
        # normal indices
        tn1 = i+1
        tn2 = inext+1
        bn1 = n + i + 1
        bn2 = n + inext + 1
        faces.append((t1, b2, b1))
        face_normals.append((tn1, bn2, bn1))
        faces.append((t1, t2, b2))
        face_normals.append((tn1, tn2, bn2))

    # caps
    top_center = 2*n + 1
    top_norm_idx = 2*n + 1
    for i in range(n):
        inext = (i+1) % n
        faces.append((top_center, i+1, inext+1))
        face_normals.append((top_norm_idx, top_norm_idx, top_norm_idx))

    bottom_center = 2*n + 2
    bottom_norm_idx = 2*n + 2
    for i in range(n):
        inext = (i+1) % n
        faces.append((bottom_center, n + inext + 1, n + i + 1))
        face_normals.append((bottom_norm_idx, bottom_norm_idx, bottom_norm_idx))

    # write OBJ with vn and f v//vn
    with open(filename, "w") as f:
        for v in verts:
            f.write("v {:.6f} {:.6f} {:.6f}\n".format(*v))
        for vn in normals:
            f.write("vn {:.6f} {:.6f} {:.6f}\n".format(*vn)) #used gtp's help to figure out norms
        for face, fn in zip(faces, face_normals):
            parts = ["{}/{}{}".format(v_idx, "", vn_idx) for v_idx, vn_idx in zip(face, fn)]
            
            f.write("f " + " ".join(f"{v}//{vn}" for v, vn in zip(face, fn)) + "\n")
    print("Wrote", filename)

if __name__ == "__main__":
    write_cylinder_with_normals()
