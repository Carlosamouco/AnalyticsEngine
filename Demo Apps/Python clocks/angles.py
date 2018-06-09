import numpy as np

def _unit_vector(vector):
    return vector / np.linalg.norm(vector)

def angle_between_vectors(vector1, vector2):
    v1_u = _unit_vector(vector1)
    v2_u = _unit_vector(vector2)
    return np.arccos(np.clip(np.dot(v1_u, v2_u), -1.0, 1.0))

def angle_between_lines(line, line2):
    p1 = (line[0], line[1])
    p2 = (line[2], line[3])

    p3 = (line2[0], line2[1])
    p4 = (line2[2], line2[3])

    v1 = np.subtract(p2, p1)
    v2 = np.subtract(p4, p3)

    return angle_between_vectors(v1, v2)
