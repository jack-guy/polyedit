path = require 'path'

events = (main) ->
   $ ->
      # Menu bar handling
      $(".import-dir").click ->
         $(this).children '.handler'
            .off 'change'
            .on 'change', ->
               files = $(this)[0].files
               if files.length isnt 0
                  main.unsaved = true
                  main.importDirectory( files[0].path )
               $(this).val('')
            .click (e) ->
               e.stopPropagation()
            .trigger 'click'

      $(".import-file").click ->
         $(this).children '.handler'
            .off 'change'
            .on 'change', ->
               files = $(this)[0].files
               for file in files
                  main.unsaved = true
                  main.importFile( file.path )
               $(this).val('')
            .click (e) ->
               e.stopPropagation()
            .attr 'accept', main.supportedFiles.join(',')
            .trigger 'click'

      $(".export-file").click ->
         $(".do-trigger-export").remove()
         console.log main.data.file
         if main.data?.file?
            fileName = path.parse(main.data.file).name
         else
            fileName = ""
         $("body").append("<input class='do-trigger-export' type='file' nwsaveas='#{fileName}.json' accept='.json'>");
         $('.do-trigger-export:file').change ->
            files = $(this)[0].files
            if files.length > 0
               main.export(files[0].path)
         $('.do-trigger-export').trigger('click')

      $(".new-project").click ->
         main.newProject()

      $(".open-project").click ->
         $(this).children '.handler'
            .off 'change'
            .on 'change', ->
               files = $(this)[0].files
               if files.length isnt 0
                  main.open( files[0].path )
               $(this).val('')
            .click (e) ->
               e.stopPropagation()
            .trigger 'click'

      $(".save-project").click ->
         if main.data.file
            main.save()
         else
            $(".do-trigger-save").remove()
            $("body").append('<input class="do-trigger-save" type="file" nwsaveas accept=".plyed">');
            $('.do-trigger-save:file').change ->
               files = $(this)[0].files
               if files.length > 0
                  main.save(files[0].path)
            $('.do-trigger-save').trigger('click')

      # Sprites pane handling
      $('.search-box').bind "propertychange change click keyup input paste", (e) ->
         $(".sprite-listing").hide()
         $(".sprite-listing:contains('#{$(this).val()}')").show()

      $("body").on 'click', '.sprite-listing', () ->
         main.setEditor $(this).attr('data-id')

      $(".exporter-box").change ->
         main.data?.settings?.exporter = $(this).val()
         main.unsaved = true

      $(".active-box").on 'change', ->
         if $(this).is(':checked')
            $(".sprite-listing:not(.activeSprite)").hide()
         else
            $(".sprite-listing").show()

      # Editor handling
      $(".zoom-box").change ->
         main.ui.setZoom($(".zoom-box").val())

      $(".polygon-button").click ->
         main.unsaved = true
         polygon = main.ui.editor.newPolygon()

      # Interact Draggable Stuff
   	interact('.left')
   		.resizable {
   			edges: { right: true }
   		}
      		.on 'resizemove', (event) ->
               event.preventDefault()
               $(".left").width(Math.min( Math.max(235,event.rect.width), 400))
               $("#editor").width($(".bottom").width() - $(".left").width() - $("#properties").width() - 2)

            .on 'resizeend', ->
               main.data?.settings?.leftWidth = $(".left").width()
               console.log main

   	interact('#properties')
   		.resizable {
   			edges: { left: true }
   		}
      		.on 'resizemove', (event) ->
               $("#properties").width(Math.min( Math.max(200,event.rect.width), 400))
               $("#editor").width($(".bottom").width() - $(".left").width() - $("#properties").width() - 2)

            .on 'resizeend', ->
               main.data?.settings?.rightWidth = $("#properties").width()
               console.log main.data.settings, $("#properties").width()

      # Hotkey Stuff
      Mousetrap.bind 'ctrl+shift+i', ->
         gui.Window.get().showDevTools()

      $("body").keydown (e) ->
         if e.keycode is 8
            e.preventDefault()


      # Handling ctrl-scroll

      isCtrl = false

      ctrlCheck = (e) ->
         if e.which is 17
            isCtrl = if e.type is 'keydown' then true else false
      wheelCheck = (e, delta) ->
         if isCtrl
            originalZoom = parseInt($(".zoom-box").val())
            $(".zoom-box").val( Math.max( Math.min(originalZoom + delta*25,1000), 25) )
            main.ui.setZoom($(".zoom-box").val())

      $("body")
         .keydown ctrlCheck
         .keyup ctrlCheck
         .mousewheel wheelCheck

module.exports = events
