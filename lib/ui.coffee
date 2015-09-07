Editor = require(rootDir+'editor.js')

class Ui
   constructor: (@main) ->
      @zoom = 1
      $(window).resize @resize
      @resize()

   startLoading: (header) ->
      switch header
         when 'files' then $("#files .header .loader").show()
         when 'sprites' then $("#sprites .header .loader").show()

   stopLoading: (header) ->
      switch header
         when 'files' then $("#files .header .loader").hide()
         when 'sprites' then $("#sprites .header .loader").hide()

   setEditor: (sprite) ->
      if @editor then @editor.delete()
      @editor = new Editor @main

      @main.data?.settings?.open = sprite.key

      $(".sprite-listing").removeClass('editor')
      $(".sprite-listing[data-id=#{sprite.id}]").addClass('editor')

      $(".tools").show()
      $(".canvas")
         .show()
         .find(".sprite-image").attr('src', sprite.path)

      $(".sprite-image")
         .unbind('load')
         .load =>
            zoom = Math.max( 1, Math.min(10, Math.floor($("#editor").width() / $(".sprite-image")[0].naturalWidth * 3 / 4) ) )
            $(".zoom-box").val(zoom*100)
            @.setZoom(zoom*100)

      @editor.start sprite.data

      if @main.justOpened and @main.data.settings.zoom
         zoom = Math.max( 1, Math.min(10, Math.floor($("#editor").width() / $(".sprite-image")[0].naturalWidth * 3 / 4) ) )
         $(".zoom-box").val(zoom*100)
         @.setZoom(zoom*100)

      @main.justOpened = false

   setActive: (sprite) ->
      el = $(".sprite-listing[data-id=#{sprite.id}]")
      el.addClass('activeSprite')

   setInactive: (sprite) ->
      el = $(".sprite-listing[data-id=#{sprite.id}]")
      el.removeClass('activeSprite')

   addSprite: (sprite) ->
      match = _.findWhere @main.data.sprites, {key: sprite.key}
      if match and match.data then extraClass = "activeSprite" else extraClass = ""

      $("<a />", {
         "href": '#',
         "data-id": sprite.id
         "class": "list-group-item sprite-listing #{extraClass}"
      })
         .append(
            $("<div />", {
               "class": "list-group-item-float"
            })
            .append $("<img />", {
               "class": 'icon',
               "src": sprite.path
            })
         )

         .append(
            $("<div />", {
               "class": "list-group-item-float"
            })
            .append $("<span />", {
               "class": "title"
               "text": sprite.name
            })
         )
         .append $("<div />", {
            "class": 'path',
            "text": sprite.key
         })
         .appendTo("#sprites .list-group")

      @resize()

   updateSprite: (sprite) ->
      el = $(".sprite-listing[data-id=#{sprite.id}]")
      el.find(".icon").attr('src', sprite.path)
      el.find(".title").text(sprite.name)
      el.find(".path").text(sprite.key)

      @resize()

   reset: () ->
      settings = @main.data.settings

      $("#sprites .list-group").html('')
      $("#sprites .search-box").val('')
      $("#sprites .active-box").val('off')

      $(".canvas").hide()

      $("#properties .exporter-box").val(settings.exporter)

      $(".left").width settings.leftWidth
      $("#properties").width settings.rightWidth

      if settings.zoom then @setZoom settings.zoom
      @resize()

   resize: () ->
      $("#editor").width($(".bottom").width() - $(".left").width() - $("#properties").width() - 2)

   setZoom: (zoom) ->
      @main.data.settings.zoom = zoom
      @zoom = zoom/100
      @editor?.handleZoom()

      $(".sprite-image")
         .width($(".sprite-image")[0].naturalWidth * @zoom)
         .height($(".sprite-image")[0].naturalHeight * @zoom)

      $(".canvas")
         .width($(".sprite-image").width())
         .height($(".sprite-image").height())
         .css('background-size', "#{@zoom*2}px #{@zoom*2}px")

module.exports = Ui
