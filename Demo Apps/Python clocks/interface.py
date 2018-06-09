import argparse
import cv2
from clockhandler import clockhandler
from squares import squares
from webcam import getWebcamImage, ESC_KEY_CODE

#if no circle clocks detected try to detect square clocks
def processImage(img,debug,threshold):
    if threshold is None:
        ch = clockhandler(img, debug=debug)
    else:
        ch = clockhandler(img, debug=debug,threshold = threshold)
    if len(ch.getwatchcircle()) == 0:
        sq = squares(img,debug=debug)
        sq._process_square()

def check_positive(value):
    ivalue = int(value)
    if ivalue <= 0:
         raise argparse.ArgumentTypeError("%s is an invalid positive int value" % value)
    return ivalue


parser = argparse.ArgumentParser(description="Time detection on watch images.")
parser.add_argument("--filename","-f", help="relative path to image file to analyse.")
parser.add_argument("--threshold","-t", help="Circle detection threshold. Lower number means more false circles detected. Default: 150",type=check_positive)
parser.add_argument("--webcam","-w", help="use webcam to capture image.", action="store_true")
parser.add_argument("--debug","-d", help="to see the processing steps.", action="store_true")
args = parser.parse_args()
if args.webcam:
    while True:
        res = getWebcamImage()
        if res[1] == ESC_KEY_CODE:
            break

        processImage(res[0],args.debug,args.threshold)

elif args.filename is not None:
    img = cv2.imread(args.filename, 0)

    if img is not None:
        processImage(img,args.debug,args.threshold)
else:
    parser.print_help()
