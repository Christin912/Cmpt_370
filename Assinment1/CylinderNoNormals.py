# cylinder_no_normals.py

import math

def write_cylinder_no_normals(n=32, radius=1.0, height=2.0, filename="cylinder_no_normals.obj"):
    h2 = height/2.0
    verts = []
    # top ring
    for i in range(n):
        theta = 2*math.pi*i/n
        verts.append((radius*math.cos(theta),  h2, radius*math.sin(theta)))
    # bottom ring
    for i in range(n):
        theta = 2*math.pi*i/n
        verts.append((radius*math.cos(theta), -h2, radius*math.sin(theta)))
    # centers
    verts.append((0.0, h2, 0.0))    # top center
    verts.append((0.0,-h2, 0.0))    # bottom center

    faces = []
    # sides
    for i in range(n):
        inext = (i+1) % n
        t1 = i+1
        t2 = inext+1
        b1 = n + i + 1
        b2 = n + inext + 1
        faces.append((t1, b2, b1))
        faces.append((t1, t2, b2))
    # top
    top_center = 2*n + 1
    for i in range(n):
        inext = (i+1) % n
        faces.append((top_center, i+1, inext+1))
    # bottom
    bottom_center = 2*n + 2
    for i in range(n):
        inext = (i+1) % n
        faces.append((bottom_center, n + inext + 1, n + i + 1))

    # write OBJ
    with open(filename, "w") as f:
        for v in verts:
            f.write("v {:.6f} {:.6f} {:.6f}\n".format(*v))
        for face in faces:
            f.write("f {} {} {}\n".format(*face))
    print("Wrote", filename)

if __name__ == "__main__":
    write_cylinder_no_normals()


#used calude.ai to debugg code and for help with some math 
