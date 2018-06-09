import cv2

webcam = cv2.VideoCapture(0)
ESC_KEY_CODE = 27
def getWebcamImage():
    while True:
        ret, img = webcam.read()
        img_c = img.copy()
        cv2.putText(img_c,"Press any key to take a frame.",(15, 15), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
        cv2.putText(img_c,"Press ESC to exit.",(15, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 0), 2)
        cv2.imshow('Webcam Preview',img_c)
        code = cv2.waitKey(1)
        if code == ESC_KEY_CODE:
            return (None, code)
        if code != -1:
            break
    return (cv2.cvtColor(img, cv2.COLOR_RGB2GRAY), code)
