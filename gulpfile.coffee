gulp = require 'gulp'
gutil = require 'gulp-util'
# watch = require 'gulp-watch'
sourcemaps = require 'gulp-sourcemaps'
coffee = require 'gulp-coffee'
jade = require 'gulp-jade'
stylus = require 'gulp-stylus'
nib = require 'nib'

NwBuilder = require 'nw-builder'
evb = require 'enigmavirtualbox'

paths =
   jade: './views/*.jade'
   stylus: './stylesheets/*.styl'
   coffee: './lib/**/*.coffee'
   build: ['./**/**', '!./stylesheets/**', '!./views/**', '!./node_modules/**', '!./lib/**', '!./build/**', '!./cache/**']
   # main: './lib/main/**/*.coffee'

output =
   jade: './dist/templates/'
   stylus: './dist/css/'
   coffee: './dist/js/'
   # main: './main/'

gulp.task 'jade', ->
   gulp.src paths.jade
      .pipe jade()
      .pipe gulp.dest(output.jade)

gulp.task 'stylus', ->
   gulp.src paths.stylus
      .pipe stylus({
         use: nib()
         compress: true
      })
      .pipe gulp.dest(output.stylus)

gulp.task 'coffee', ->
   gulp.src paths.coffee
      .pipe sourcemaps.init()
      .pipe coffee().on('error', handleError)
      .pipe sourcemaps.write()
      .pipe gulp.dest(output.coffee)

gulp.task 'build', ->
   nw = new NwBuilder {
      files: paths.build
      platforms: ['win64']
      winIco: './icon.ico'
   }

   nw.on 'log', (msg) ->
      console.log msg

   return nw.build().catch (err) ->
      console.error err

gulp.task 'vb', (done) ->

   console.log 'Bundling files...'
   evb
      .gen 'build/PolyEdit/app.evb',
         'build/PolyEdit/app-bundled.exe',
         'build/PolyEdit/win64/PolyEdit.exe',
         'build/PolyEdit/win64/nw.pak',
         'build/PolyEdit/win64/icudtl.dat',
         'build/PolyEdit/win64/ffmpegsumo.dll',
         'build/PolyEdit/win64/libEGL.dll',
         'build/PolyEdit/win64/libGLESv2.dll'
      .then () ->
         console.log 'Finished.'
         console.log 'Packing bundle...'

         evb.cli('build/PolyEdit/app.evb').then () ->
            console.log 'Finished.'
            done()
            return

         return
   return

gulp.task 'default', ['jade', 'stylus', 'coffee']

gulp.task 'watch', ->
   gulp.watch paths.jade, ['jade']
   gulp.watch paths.stylus, ['stylus']
   gulp.watch paths.coffee, ['coffee']

handleError = (err) ->
   console.log err.toString()
   this.emit 'end'
