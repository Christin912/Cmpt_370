import math

def write_sphere_no_normals(n=32, m=16, radius=1.0, filename="sphere_no_normals.obj"): #define

    verts = []
    
    verts.append((0.0, radius, 0.0))
    # intermediate rings
    for j in range(1, m):
        phi = math.pi * j / m
        for i in range(n):
            theta = 2*math.pi*i / n
            x = radius * math.sin(phi) * math.cos(theta)
            y = radius * math.cos(phi)
            z = radius * math.sin(phi) * math.sin(theta)
            verts.append((x,y,z))
    # bott
    verts.append((0.0, -radius, 0.0))

    faces = []
    north_idx = 1
    south_idx = len(verts)
    def ring_start(j):  
        return 2 + (j-1)*n

    # top 
    for i in range(n):
        inext = (i+1) % n
        faces.append((north_idx, ring_start(1)+i, ring_start(1)+inext))
    # middle
    for j in range(1, m-1):
        a = ring_start(j)
        b = ring_start(j+1)
        for i in range(n):
            inext = (i+1) % n
            a_i = a + i
            a_in = a + inext
            b_i = b + i
            b_in = b + inext
            faces.append((a_i, b_in, b_i))
            faces.append((a_i, a_in, b_in))
    #used gtp for this section couldnt get it to work
    if m > 1:
        last = ring_start(m-1)
        for i in range(n):
            inext = (i+1) % n
            faces.append((last + i, last + inext, south_idx))

    # wrie acctual obj file
    with open(filename, "w") as f:
        for v in verts:
            f.write("v {:.6f} {:.6f} {:.6f}\n".format(*v))
        for face in faces:
            f.write("f {} {} {}\n".format(*face))
    print("Wrote", filename)

if __name__ == "__main__":
    write_sphere_no_normals()
