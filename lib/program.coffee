fs = require 'fs'
path = require 'path'
Ui = require(rootDir+'ui.js')

class PolyEdit
   constructor: () ->
      @ui = new Ui(@)

      @supportedFiles = ['.png', '.jpg', '.jpeg', '.gif']
      @window = gui.Window.get().window

      @spriteList = []
      @editorSprite = null

      @justOpened = false
      @unsaved = false
      @closeFlag = false


      @default = {
         file: null,
         importPaths: [],
         sprites: [],
         settings: {
            open: null
            exporter: 'JSON'
            leftWidth: 300
            rightWidth: 300
            zoom: 100
         }
      }

      @data = _.cloneDeep(@default)

      self = this
      gui.Window.get().on 'close', ->
         if self.unsaved
            self.confirmClose true, =>
               this.close true
         else
            this.close true
      # @open('C:\\Users\\Jack\\git\\game\\pj\\UI\\asd.plyed')

   # Current directory searching, original directory before recursion
   importDirectory: (directory, original) ->
      @ui.startLoading('sprites')

      if not original
         original = directory
         if not _.findWhere @data.importPaths, {path: original}
            @data.importPaths.push {
               type: 'dir'
               path: original
            }

      fs.readdir directory, (err, files) =>
         if !err and files
            for file in files
               combined = directory+'\\'+file

               try
                  info = fs.lstatSync combined
               catch e
                  console.error e

               if info
                  if info.isDirectory()
                     @importDirectory combined, original
                  else if path.extname(file) in @supportedFiles
                     @importFile combined, directory.slice(original.length+1)+'\\'+path.parse(file).name

   importFile: (file, key) ->
      @ui.stopLoading 'sprites'
      parse = path.parse file

      if not key # Originated from "import file" button
         key = parse.name
         @data.importPaths.push {
            type: 'file'
            path: file
         }

      duplicate = _.findWhere @spriteList, {path: file}
      sprite = {
         name: parse.name
         key: key
         path: file
         id: @spriteList.length
      }

      if duplicate
         duplicate = sprite
         @ui.updateSprite sprite
      else
         @spriteList.push sprite
         @ui.addSprite sprite

      if @data.settings.open is sprite.key
         @setEditor sprite.id

   export: (path) ->
      out = {}

      for sprite in @data.sprites
         data = []

         for polygon in sprite.data
            outData = {
               density: 2
               friction: 0
               bounce: 0
               filter: { categoryBits: 1, maskBits: 65535 }
               shape: []
            }
            for point in polygon.slice(0).reverse()
               outData.shape.push point[0]
               outData.shape.push point[1]

            data.push outData

         out[sprite.key] = data

      fs.writeFile path, JSON.stringify(out), (err) =>
         if err
            @window.alert "Couldn't save file: #{path}"

   setEditor: (id) ->
      @editorSprite = @spriteList[id]
      sprite = _.findWhere @data.sprites, { key: @editorSprite.key }
      @editorSprite.data = sprite?.data
      @ui.setEditor @editorSprite

   save: (path) ->
      if not path
         path = @data.file
      else
         @data.file = path
      fs.writeFile path, JSON.stringify(@data), (err) =>
         if err
            @window.alert "Couldn't save file: #{path}"
         else
            @unsaved = false

            if @closeFlag # We want to close the main window, just gotta save first
               gui.Window.get().close true

   newProject: () ->
      finishNew = =>
         @data = _.cloneDeep @default
         @spriteList = []
         @ui.reset()
         @data.unsaved = false

      if @unsaved
         @confirmClose false, =>
            finishNew()
      else
         finishNew()

   open: (path) ->
      finishOpen = =>
         @ui.reset()
         @spriteList = []
         @justOpened = true
         @data.unsaved = false

         for path in @data.importPaths
            if path.type is "dir"
               @importDirectory path.path
            else if path.type is "file"
               @importFile path.path

      fs.readFile path, (err, data) =>
         if err
            @window.alert "Couldn't open file #{path}"
         else if @unsaved
            @confirmClose false, =>
               @data = JSON.parse data
               finishOpen()
         else
            @data = JSON.parse data
            finishOpen()


   confirmClose: (closeAfter, cb) ->
      confirm = gui.Window.open 'confirm.html', {
         "title": "Confirm Close",
         "toolbar": false,
         "width": 350,
         "height": 150,
         "position": "mouse",
         "resizable": false,
         "always-on-top": true,
         "show_in_taskbar": false
      }
      confirm.resizeTo(350,150)
      confirm.setResizable(false)
      confirm.setAlwaysOnTop(true)

      global.confirmStatus = null

      self = this
      confirm.on 'close', ->
         this.close true
         if global.confirmStatus is -1 # Don't save
            do cb
         else if global.confirmStatus is 0 or global.confirmStatus is null # Cancel / Close Window
         else if global.confirmStatus is 1 # Save
            self.closeFlag = closeAfter
            $(".save-project").trigger('click') # Normally don't mix and match but it's event-based

   setSprite: (data) ->
      @unsaved = true
      if @editorSprite
         duplicate = _.findWhere @data.sprites, {key: @editorSprite.key}
         if duplicate
            duplicate.data = data
         else
            @editorSprite.data = data
            @data.sprites.push @editorSprite

         if data.length > 0
            @ui.setActive @editorSprite
         else
            @ui.setInactive @editorSprite
      else
         @window.alert 'Weird stuff is happening.'

polyEdit = new PolyEdit
module.exports = polyEdit
