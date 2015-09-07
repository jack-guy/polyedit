gui = require 'nw.gui'

global.$ = $
global._ = _
global.interact = interact
global.gui = gui
global.Mousetrap = Mousetrap
global.SVG = SVG

global.rootDir = rootDir = process.cwd() + '/dist/js/'

# My libraries

$ ->
   main = require(rootDir+'program.js')
   global.testtest = main
   events = require(rootDir+'events.js')(main)

   # win = gui.Window.get()
   # menubar = new gui.Menu { type: 'menubar' }
   #
   # file = new gui.Menu()
   #
   # file.append new gui.MenuItem {
   #    label: 'Open'
   #    tooltip: 'test'
   #    click: ->
   #       console.log 'Did it'
   #    key: 'o'
   #    modifiers: 'ctrl'
   # }
   #
   # menubar.append new gui.MenuItem {
   #    label: 'File'
   #    submenu: file
   # }
   # win.menu = menubar;
