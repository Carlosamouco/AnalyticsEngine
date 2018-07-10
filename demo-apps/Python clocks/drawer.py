import cv2

def drawcenter(circle, radious):
    cv2.circle(circle, (radious, radious), radious, (0, 255, 0), 2)
    cv2.circle(circle, (radious, radious), 2, (0, 0, 255), 3)

def drawaxis(circle, radious):
    cv2.line(circle, (0, radious), (circle.shape[0], radious), (0, 255, 255), 2)
    cv2.line(circle, (radious, 0), (radious, circle.shape[1]), (0, 255, 255), 2)

def drawtime(circle, pointers, time):
    cv2.putText(circle,"h",(pointers[0][0], pointers[0][1]), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
    cv2.putText(circle,"m",(pointers[1][0], pointers[1][1]), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
    if pointers[2] != None:
        cv2.putText(circle,"s",(pointers[2][0], pointers[2][1]), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
    cv2.putText(circle, time, (0, circle.shape[1] - 5), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

def drawlines(circle, lines):
    if lines is None:
        return
    
    for line in lines:
        if len(line) <= 1:
            drawline(circle, line[0])
        else:
            if(isinstance(line, tuple)):
                drawline(circle, line[0])
            else:
                drawline(circle, line)

def drawline(img, line):
    x1, y1, x2, y2 = line
    cv2.line(img, (x1, y1), (x2, y2), (0, 255, 0), 2)
    cv2.circle(img, (x1, y1), 1, (255, 0, 0), 3)
    cv2.circle(img, (x2, y2), 1, (255, 0, 0), 3)
