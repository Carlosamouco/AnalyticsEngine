import numpy as np
import cv2
from angles import angle_between_lines
from clockhandler import clockhandler


class squares:
    def __init__(self, img, debug=False):
        self._img = img
        self._debug = debug
        self._MAX_X = img.shape[1]
        self._MAX_Y = img.shape[0]

    def _angle_cos(self, p0, p1, p2):
        d1, d2 = (p0-p1).astype('float'), (p2-p1).astype('float')
        return abs( np.dot(d1, d2) / np.sqrt( np.dot(d1, d1)*np.dot(d2, d2) ) )

    def _findsquares(self,img):
        img = cv2.GaussianBlur(img, (5, 5), 0)
        squares = []
        for gray in cv2.split(img):
            for thrs in range(0, 255, 26):
                if thrs == 0:
                    bin = cv2.Canny(gray, 0, 50, apertureSize=5)
                    bin = cv2.dilate(bin, None)
                else:
                    _retval, bin = cv2.threshold(gray, thrs, 255, cv2.THRESH_BINARY)

                bin, contours, _hierarchy = cv2.findContours(bin, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
                for cnt in contours:
                    cnt_len = cv2.arcLength(cnt, True)
                    cnt = cv2.approxPolyDP(cnt, 0.02*cnt_len, True)
                    if len(cnt) == 4 and cv2.contourArea(cnt) > 1000 and cv2.isContourConvex(cnt):
                        cnt = cnt.reshape(-1, 2)
                        max_cos = np.max([self._angle_cos( cnt[i], cnt[(i+1) % 4], cnt[(i+2) % 4] ) for i in range(4)])
                        if max_cos < 0.1:
                            squares.append(cnt)
        return squares

    def _distance(self,v1,v2): 
        return sum([(x-y)**2 for (x,y) in zip(v1,v2)])**(0.5)


    def _filtersquares(self,squares):
        good_squares = []
        corner_threshold = int(0.05*(self._MAX_X+self._MAX_Y)/2)
        x_y_delta = int(0.03*(self._MAX_X+self._MAX_Y)/2)

        # Margin Thresholds
        tlt = [corner_threshold, corner_threshold]
        trt = [self._MAX_X - corner_threshold, corner_threshold]
        brt = [self._MAX_X - corner_threshold, self._MAX_Y - corner_threshold]
        blt = [corner_threshold, self._MAX_Y - corner_threshold]

        # Ignore all Squares too close to the outside of the image, and also ignore all squares
        # that deviate too much from a horizontal/vertical line
        for square in squares:
            error = 0
            for i in range(4):
                
                # Top left
                if(square[i][0] < self._MAX_X/2 and square[i][1] < self._MAX_Y/2):
                    
                    # Check if it's too close to top left
                    if(square[i][0] < tlt[0] or square[i][1] < tlt[1]):
                        error = 1
                    sqtl = np.copy(square[i])

                # Bottom left
                elif(square[i][0] < self._MAX_X/2 and square[i][1] > self._MAX_Y/2):
                    
                    # Check if it's too close to Bottom left
                    if(square[i][0] < blt[0] or square[i][1] > blt[1]):
                        error = 1
                    sqbl = np.copy(square[i])

                # Top right
                elif(square[i][0] > self._MAX_X/2 and square[i][1] < self._MAX_Y/2):
                    
                    # Check if it's too close to Top right
                    if(square[i][0] > trt[0] or square[i][1] < trt[1]):
                        error = 1
                    sqtr = np.copy(square[i])

                # Bottom right
                elif(square[i][0] > self._MAX_X/2 and square[i][1] > self._MAX_Y/2):
                    # Check if it's too close to Bottom right
                    if(square[i][0] > brt[0] or square[i][1] > brt[1]):
                        error = 1
                    sqbr = np.copy(square[i])

            if(error):
                continue
            # Check for x/y deviations now.

            # Top line
            if(sqtr[1] < sqtl[1] - x_y_delta or sqtr[1] > sqtl[1] + x_y_delta):
                continue

            # Right line
            if(sqbr[0] < sqtr[0] - x_y_delta or sqbr[0] > sqtr[0] + x_y_delta):
                continue

            # Bottom line
            if(sqbl[1] < sqbr[1] - x_y_delta or sqbl[1] > sqbr[1] + x_y_delta):
                continue

            # Left line
            if(sqtl[0] < sqbl[0] - x_y_delta or sqtl[0] > sqbl[0] + x_y_delta):
                continue

            good_squares.append(square)

        return good_squares

    def _findaveragesquare(self,squares):
        
        # Calculating average of each of the 4 points.
        ttl = [0,0]
        ttr = [0,0]
        tbr = [0,0]
        tbl = [0,0]

        for square in squares:
            for i in range(4):
                # Top left
                if(square[i][0] < self._MAX_X/2 and square[i][1] < self._MAX_Y/2):
                    ttl += square[i]

                # Bottom left
                elif(square[i][0] < self._MAX_X/2 and square[i][1] > self._MAX_Y/2):
                    tbl += square[i]

                # Top right
                if(square[i][0] > self._MAX_X/2 and square[i][1] < self._MAX_Y/2):
                    ttr += square[i]

                # Bottom right
                elif(square[i][0] > self._MAX_X/2 and square[i][1] > self._MAX_Y/2):
                    tbr += square[i]

        ttl = ttl/len(squares)
        ttr = ttr/len(squares)
        tbr = tbr/len(squares)
        tbl = tbl/len(squares)

        avg_square = []
        avg_square.append(ttl)
        avg_square.append(ttr)
        avg_square.append(tbr)
        avg_square.append(tbl)

        avg_square = np.array(avg_square)
        return avg_square


    def _process_square(self):

        all_squares = self._findsquares(self._img)
        if(self._debug):
            copy = self._img.copy()
            cv2.drawContours(copy,all_squares,-1,(0,255,0),3)
            cv2.imshow('Detected Squares', copy)
            cv2.waitKey(0)


        good_squares = self._filtersquares(all_squares)
        if(self._debug):
            copy = self._img.copy()
            cv2.drawContours(copy,good_squares,-1,(0,255,0),3)
            cv2.imshow('Filtered Squares', copy)
            cv2.waitKey(0)

        if not good_squares:
            print("No Square clocks detected on image!\n")
            return []

        avg_square = self._findaveragesquare(good_squares)
        if(self._debug):
            copy = self._img.copy()
            cv2.drawContours(copy,[avg_square],-1,(0,255,0),3)
            cv2.imshow('Average Squares', copy)
            cv2.waitKey(0)

        # Draw circle in center of the Avg square
        xc =  int(round(avg_square[0][0] + (avg_square[1][0] - avg_square[0][0]) / 2))
        yc =  int(round(avg_square[1][1] + (avg_square[2][1] - avg_square[1][1]) / 2))

        center = np.array((xc,yc))
        midpoint = np.array((xc,avg_square[0][1]))
        radius =  int(self._distance(center,midpoint))
    
        # Cropping circle from original image
        circle = self._img[yc - radius:yc + radius, xc - radius:xc + radius].copy()

        if(self._debug):
            cv2.imshow("Cropped",circle)
            cv2.waitKey(0)
            cv2.destroyAllWindows()

        # Process circle using the clockhandler class
        ch = clockhandler(circle,debug = self._debug)
        ch._processcircle(circle,radius)
