import cv2
from clockhandler import clockhandler

test_cases = [
("1.jpg",{"h":10,"m":7,"s":47}),
("2.jpg",{"h":10,"m":7,"s":25}),
("3.jpg",{"h":1,"m":51,"s":33}),
("4.jpg",{"h":10,"m":10,"s":0}),
("5.jpg",{"h":1,"m":51,"s":34}),
("6.jpg",{"h":10,"m":10,"s":0}),
("7.jpg",{"h":10,"m":10,"s":0}),
("8.jpg",{"h":10,"m":8,"s":36}),
("9.jpg",{"h":10,"m":12,"s":35})
]

tolerance = {"h":1,"m":5,"s":5}
failed =  []
accuratePredictions = 0

def highlightText(prediction, answer):
    return str(answer-prediction)

print("Testing Detection Accuracy")
print("-"*49)
print('{:16} {:>10} {:>10} {:>10}'.format("","Hours","Minutes","Seconds"))
for img_path,answer in test_cases:
    img = cv2.imread(img_path, 0);
    ch = clockhandler(img, test=True)
    h,m,s = ch.getwatchcircle()[0]
    h,m,s = int(h),int(m),int(s)
    if abs(answer['h']-h) < tolerance['h'] and abs(answer['m']-m) < tolerance['m'] and abs(answer['s']-s) < tolerance['s']:
        accuratePredictions = accuratePredictions+1
    else:
        failed.append(img_path)
    print("Test case {}".format(img_path))
    print('{:16} {:10} {:10} {:10}'.format("Expected",answer['h'],answer['m'],answer['s']))
    print('{:16} {:10} {:10} {:10}'.format("Observation",h,m,s))
    print("{:16} {:>10} {:>10} {:>10}\n".format("Difference",highlightText(answer['h'],h),highlightText(answer['m'],m),highlightText(answer['s'],s)))

print("-"*49)
print("Total Statistics:")
print("Total tests: {}\nAccurate Predictions using tolerance ({},{},{}): {}".format(len(test_cases),
tolerance['h'],tolerance['m'],tolerance['s'],accuratePredictions))
print("Failed tests:")
for test in failed:
    print("-> {}".format(test))
