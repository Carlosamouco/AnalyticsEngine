"""Contains the functions required to process a clock image"""
from __future__ import division
import math
import cv2
import numpy as np
import drawer
from webcam import getWebcamImage
from angles import angle_between_lines

CENTER_X = 0
CENTER_Y = 1
RADIUS = 2
class clockhandler:
    def __init__(self, img, debug=False, test=False, threshold=150):
        self._test = test
        self._debug = debug
        self._img = cv2.medianBlur(img, 3)
        self._cimg = cv2.cvtColor(self._img, cv2.COLOR_GRAY2BGR)
        self._circleThreshold = threshold

    # isolate clock face from the image
    def _getcircleimg(self, img, radius):
        size = radius * 2

        mask = np.full((size, size), 255, dtype=np.uint8)
        cv2.circle(mask, (radius, radius), radius, (0, 0, 0), -1)

        background = np.full(img.shape, 255, dtype=np.uint8)
        background = cv2.bitwise_or(background, background, mask=mask)

        return cv2.bitwise_or(img, background)

    #cluster lines that similar slopes
    def _clusterlines(self, lines):
        threshold = math.pi * 10/ 180
        clusters = [[lines[0]]]
        for line in lines[1:]:
            added = False
            for cluster in clusters:
                for line2 in cluster:
                    rads = angle_between_lines(line, line2)
                    if rads < threshold and rads > -threshold:
                        cluster.append(line)
                        added = True
                        break
                if added:
                    break
            if not added:
                clusters.append([line])

        return clusters


    def _calcclosestpoint(self, center, line):
        v1 = (center - line[0], center - line[1])
        v2 = (center - line[2], center - line[3])

        dist = math.hypot(v1[0], v1[1])
        dist2 = math.hypot(v2[0], v2[1])

        if dist < dist2:
            return [line[0], line[1]]
        else:
            return [line[2], line[3]]

    def _pointdistancetoline(self, point, line):
        # return (ditance betewen the line and the point, point in the line closer to the point provided as param)
        vec = (line[0] - line[2], line[1] - line[3])
        if vec[0] != 0:
            m = vec[1] / vec[0]
            b = line[1] - m*line[0]
            b2 = point[1] + m*point[0]
            result = np.linalg.solve([[-m, 1], [m, 1]], [b, b2])
            vec2 = [result[0] - point[0], result[1] - point[1]]
        else:
            result = [line[1], point[1]]
            vec2 = [line[1], point[1]]

        return (math.hypot(vec2[0], vec2[1]), result)

    def _pointdistancetosegment(self, point, segment):
        dist, point2 = self._pointdistancetoline(point, segment)

        x1, y1, x2, y2 = segment

        v1 = (point[0] - x1, point[1] - y1)
        v2 = (point[0] - x2, point[1] - y2)

        size_v1 = math.hypot(v1[0], v1[1])
        size_v2 = math.hypot(v2[0], v2[1])

        pointsx = [x1, x2, point2[0]]
        pointsy = [y1, y2, point2[1]]

        dists = [size_v1, size_v2]

        if x1 != x2:
            if max(pointsx) != point2[0] and min(pointsx) != point2[0]:
                dists.append(dist)
        else:
            if max(pointsy) != point2[1] and min(pointsy) != point2[1]:
                dists.append(dist)

        return min(dists)


    def _calcdistance(self, line1, line2, radius):
        p1 = self._calcclosestpoint(radius, line1)
        p2 = self._calcclosestpoint(radius, line2)

        p = self._calcclosestpoint(radius, p1 + p2)

        if set(p2) == set(p):
            return self._pointdistancetoline(p2, line1)[0]
        else:
            return self._pointdistancetoline(p1, line2)[0]

    #Max distance between lines in the same cluster
    def _calcmaxdistance(self, clusters, radius):
        res = []
        for cluster in clusters:
            dist = [0]
            for line1 in cluster:
                for line2 in cluster:
                    try:
                        dist.append(self._calcdistance(line1, line2, radius))
                    except np.linalg.linalg.LinAlgError:
                        continue
            res.append((cluster, max(dist)))
        return res

    def _mergelines(self, clusters, radius):
        lines = []
        for cluster in clusters:
            lengths = []
            line = []
            avg = [0, 0, 0, 0]

            for line in cluster[0]:
                lengths.append(math.hypot(line[0] - radius, line[1] - radius))
                for i in range(0, 4):
                    avg[i] += line[i]

            for i in range(0, 4):
                avg[i] = int(round(avg[i] / len(cluster[0])))

            x1, y1, x2, y2 = avg
            dist = max(lengths)
            vec = [x1 - x2, y1 - y2]
            size = math.hypot(vec[0], vec[1])

            vec[0] = int(round(vec[0] / size * dist))
            vec[1] = int(round(vec[1] / size * dist))

            nvec = np.add((radius, radius), vec)

            line[0] = nvec[0]
            line[1] = nvec[1]
            line[2] = line[3] = radius

            newsize = math.hypot(line[0] - line[2], line[1] - line[3])

            lines.append((line, cluster[1], max(size, newsize)))

        return lines

    def _calclines(self, circle):
        #HoughLines parameters
        minlinelength = int(round(max(circle.shape) * 0.15))
        maxlinegap = int(round(max(circle.shape) * 0.015))
        threshold = int(round(max(circle.shape) * 0.15))
        hysteresis_threshold_1 = 70
        hysteresis_threshold_2 = 110

        if(len(circle.shape) == 2):
            gray = circle.copy()
        else:
            gray = cv2.cvtColor(circle, cv2.COLOR_BGR2GRAY)

        edges = cv2.Canny(gray, hysteresis_threshold_1, hysteresis_threshold_2)

        if self._debug:
            cv2.imshow("Edges", edges)
            cv2.waitKey(0)

        lines = cv2.HoughLinesP(edges, 1, np.pi/180, threshold, None, minlinelength, maxlinegap)

        if lines is None:
            return []
        else:
            return [line[0] for line in lines]

    def _filterlines(self, lines, radius):
        #threshold dependant on circle radius
        threshold = radius * 0.2
        res = []
        if lines is None:
            return res

        for line in lines:
            x1, y1, x2, y2 = line

            v1 = (radius - x1, radius - y1)
            v2 = (radius - x2, radius - y2)

            size_v1 = math.hypot(v1[0], v1[1])
            size_v2 = math.hypot(v2[0], v2[1])

            try:
                mindist = self._pointdistancetosegment([radius, radius], line)
            except np.linalg.linalg.LinAlgError:
                continue

            if mindist < threshold:
                if size_v1 < size_v2:
                    line[0] = x2
                    line[1] = y2
                    line[2] = x1
                    line[3] = y1
                    res.append(line)
                elif size_v1 > size_v2:
                    res.append(line)
        return res

    def _calcpointers(self, lines):
        if len(lines) > 3 or len(lines) < 1:
            return

        hours = minutes = seconds = None

        # hours and minutes hands overlap
        if len(lines) == 1:
            hours = minutes = lines[0][0]
        else:
            hindex = lines.index(min(lines, key=lambda x: x[2]))
            hours = lines[hindex][0]

            # check for seconds hand
            sindex = -1
            if len(lines) == 3:
                secwidth = -1
                for index in enumerate(lines):
                    if index[0] != hindex:
                        i = index[0]
                        if seconds is None or secwidth > lines[i][1]:
                            sindex = i
                            secwidth = lines[i][1]
                            seconds = lines[i][0]

            for index in enumerate(lines):
                if index[0] != sindex and index[0] != hindex:
                    minutes = lines[index[0]][0]
                    break

        return (hours, minutes, seconds)

    def _calctime(self, pointers):
        angles = []
        # Pt = [x1,y1,x2,y2]
        for pt in pointers:
            if pt is not None:
                ang = math.atan2(pt[0] - pt[2], -(pt[1] - pt[3]))
                ang = ang if ang > 0 else (2 * math.pi + ang)
                angles.append(ang)
            else:
                angles.append(None)

        h = math.floor(6 * angles[0] / math.pi) % 12
        m = math.floor(30 * angles[1] / math.pi) % 60

        s = 0
        if angles[2] is not None:
            s = math.floor(30 * angles[2] / math.pi) % 60
        else:
            s = 0

        return (h, m, s)

    def _calccolinearlines(self, lines, center):
        res = []
        threshold = math.pi * 2.5 / 180
        colinearlines = []
        for line1 in lines:
            added = False
            for cluster in colinearlines:
                for line2 in cluster:
                    points = [[line1[0], line1[1]], [line1[2], line1[3]]]
                    points += [[line2[0], line2[1]], [line2[2], line2[3]]]
                    points.sort(key=lambda x: x[0])

                    mab = math.atan2(points[0][1] - points[1][1], points[0][0] - points[1][0])
                    mac = math.atan2(points[0][1] - points[2][1], points[0][0] - points[2][0])
                    mad = math.atan2(points[0][1] - points[3][1], points[0][0] - points[3][0])

                    diff = [abs(mab - mac), abs(mab - mad), abs(mac - mad)]

                    try:
                        mindist1 = self._pointdistancetosegment([line2[0], line2[1]], line1)
                        mindist2 = self._pointdistancetosegment([line2[2], line2[3]], line1)
                    except np.linalg.linalg.LinAlgError:
                        continue

                    if max(diff) < threshold and min(mindist2, mindist1) < center * 0.05:
                        cluster.append(line1)
                        added = True
                        break

                if added:
                    break

            if not added:
                colinearlines.append([line1])

        for cluster in colinearlines:
            proclines = []
            for line in cluster:
                dist1 = math.hypot(line[0] - center, line[1] - center)
                proclines.append([[line[0], line[1]], dist1])

                dist2 = math.hypot(line[2] - center, line[3] - center)
                proclines.append([[line[2], line[3]], dist2])

            res.append(max(proclines, key=lambda x: x[1])[0] + min(proclines, key=lambda x: x[1])[0])

        return res


    def _processcircle(self, img, radius):
        # isolates the circle in a image
        circle = self._getcircleimg(img, radius)

        if self._debug:
            # debug image
            copy = circle.copy()
            drawer.drawcenter(copy, radius)
            cv2.imshow('Circle', copy)
            cv2.waitKey(0)

        # get all lines on the image
        lines = self._calclines(circle)

        if self._debug:
            # debug image
            copy = circle.copy()
            drawer.drawlines(copy, lines)
            drawer.drawcenter(copy, radius)
            cv2.imshow('Lines', copy)
            cv2.waitKey(0)


        lines = self._calccolinearlines(lines, radius)

        if self._debug:
            # debug image
            copy = circle.copy()
            drawer.drawlines(copy, lines)
            drawer.drawcenter(copy, radius)
            cv2.imshow('Colinear Lines', copy)
            cv2.waitKey(0)

        # eliminats the lines far away from the centre of the circle
        lines = self._filterlines(lines, radius)

        if self._debug:
            # debug image
            copy = circle.copy()
            drawer.drawlines(copy, lines)
            drawer.drawcenter(copy, radius)
            cv2.imshow('Filtered Lines', copy)
            cv2.waitKey(0)

        # if circle has no lines it cannot be a clock
        if not lines:
            return

        # group lines acording to their angle diference
        clusters = self._clusterlines(lines)

        # gets the max distance between all the lines in a cluster
        clusters = self._calcmaxdistance(clusters, radius)

        # calc the avg point in each cluster to obtain single lines
        lines = self._mergelines(clusters, radius)

        if self._debug:
            # debug image
            copy = circle.copy()
            drawer.drawaxis(copy, radius)
            drawer.drawlines(copy, lines)
            drawer.drawcenter(copy, radius)
            cv2.imshow('Merged Lines', copy)
            cv2.waitKey(0)

        # determines the (hours, minutes, secounds) pointers
        pointers = self._calcpointers(lines)

        if pointers is None:
            print("Too many lines found on the clock")
            return

        # calc the time correspondet to each pointer
        h, m, s = self._calctime(pointers)

        time = (str(h) if h > 9 else '0' + str(h)) + ':'\
         + (str(m) if m > 9 else '0' + str(m))\
          + ':' + (str(s) if s > 9 else '0' + str(s))

        # debug image
        if not self._test:
            copy = circle.copy()
            drawer.drawaxis(copy, radius)
            drawer.drawlines(copy, lines)
            drawer.drawcenter(copy, radius)
            drawer.drawtime(copy, pointers, time)
            #cv2.imshow('Final', copy)
            #cv2.waitKey(0)
            print("Time: " + time)
        return (h,m,s)

    def getwatchcircle(self):
        #minimum radius dependant on image original size
        minrad = int(round(min(self._img.shape) * 0.1))
        maxrad = 0
        mindist = int(round(min(self._img.shape) * 0.15))

        circles = cv2.HoughCircles(self._img, cv2.HOUGH_GRADIENT, 1,
                                   mindist, param1=50, param2=self._circleThreshold, minRadius=minrad, maxRadius=maxrad)
        if circles is None or len(circles) == 0:
            print("No circle clocks detected on image!")
            return []

        # rounds the circle points and converts to Mat
        circles = np.uint16(np.around(circles))
        clock_results = []

        for i in circles[0]:
            # ignore circles that are partially outside of the image
            if (np.int32(i[CENTER_X]) - np.int32(i[RADIUS]) < 0 or np.int32(i[CENTER_Y]) - np.int32(i[RADIUS]) < 0
                    or i[CENTER_X] + i[RADIUS] > self._img.shape[1] or i[CENTER_Y] + i[RADIUS] > self._img.shape[0]):
                print('skip')
                continue

            #crop circle from original image
            circle = self._cimg[i[CENTER_Y] - i[RADIUS]:i[CENTER_Y] + i[RADIUS], i[CENTER_X] - i[RADIUS]:i[CENTER_X] + i[RADIUS]].copy()

            clock_results.append(self._processcircle(circle, i[RADIUS]))

        return clock_results
