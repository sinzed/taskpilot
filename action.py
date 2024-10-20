import time
 
# a module which has functions related to time. 
# It can be installed using cmd command: 
# pip install time, in the same way as pyautogui.
import pyautogui
time.sleep(2) 
 
# makes program execution pause for 10 sec
pyautogui.moveTo(1000, 1000, duration = 1) 
 
# moves mouse to 1000, 1000.
pyautogui.dragRel(100, 0, duration = 1)
 
# drags mouse 100, 0 relative to its previous position, 
# thus dragging it to 1100, 1000
pyautogui.dragRel(0, 100, duration = 1)
pyautogui.dragRel(-100, 0, duration = 1)
pyautogui.dragRel(0, -100, duration = 1)