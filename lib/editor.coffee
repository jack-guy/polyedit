Function::property = (prop, desc) ->
	Object.defineProperty @prototype, prop, desc

class Editor
	constructor: (@main) ->
		@canvas = SVG("canvas").size('100%', '100%')

		@polygons = []

		@handleRadius = 16
		@handleCanvasEvents()


	@property 'zoom',
		get: -> @main.ui.zoom

	start: (data) ->
		if data then @newPolygon points for points in data

	newPolygon: (points) ->
		canvasWidth = $(".sprite-image")[0].naturalWidth
		canvasHeight = $(".sprite-image")[0].naturalHeight

		polygon.shape.attr 'class', '' for polygon in @polygons
		polygon = {
			points: _.cloneDeep(points) or [ [canvasWidth/2,canvasHeight/4], [canvasWidth/4,canvasHeight*3/4], [canvasWidth*3/4,canvasHeight*3/4] ]
			shape: @canvas.polygon()
						.attr({
							'cursor': 'move',
							'class': 'focused'
							'data-index': @polygons.length
						})
			handles: @canvas.group()
		}

		@polygons.push polygon

		@interactPolygon polygon
		@setHandles polygon
		@draw polygon

		return polygon

	handleZoom: () ->
		for polygon in @polygons
			@interactPolygon polygon
			@setHandles polygon
			@draw polygon

	handleCanvasEvents: () ->
		# $("#editor").unbind('click').click (e) =>
		# 	polygon.shape.attr 'class', '' for polygon in @.polygons

		$("body").unbind('keyup').keyup (e) =>
			if e.keycode is 46 or e.keycode is 8 # Delete or backspace pressed
				console.log 'mhm'
				if $("polygon.focused").length > 0
					@removePolygon $("polygon.focused").eq(0).attr('data-index')

		interact('#editor').draggable(
			onstart: (e) ->
				console.log 'its begun'
			onmove: (event) =>
				console.log 'let\'s go'
				target = event.target
				x = (parseFloat(target.getAttribute('data-x')) or 0) + event.dx
				y = (parseFloat(target.getAttribute('data-y')) or 0) + event.dy
				target.style.transform = "translate(#{x}px, #{y}px)"
				target.setAttribute 'data-x', x
				target.setAttribute 'data-y', y
		)

	draw: (polygon) ->
		drawPoints = []
		for point in polygon.points
			drawPoints.push [point[0]*@zoom, point[1]*@zoom]

		polygon.shape.plot drawPoints

		handles = polygon.handles.children()
		for point, i in drawPoints
			handles[i]
				.move point[0] - @handleRadius / 2, point[1] - @handleRadius / 2

		@broadcastChanges()

	setHandles: (polygon) ->
		polygon.handles.clear()

		for point, i in polygon.points
			handle = @canvas.circle(@handleRadius).fill('#000')
			handle.attr {
				'class': 'point-handle'
				'data-index': i
				'data-polygon': polygon.shape.attr 'data-index'
			}

			polygon.handles.add handle
			@interactHandle handle

	interactHandle: (handle) ->
		self = this

		interact('.point-handle').draggable(
			snap:
				targets: [
					interact.createSnapGrid {x: @zoom, y: @zoom}
				]
			restrict: restriction: $("#canvas")
			onmove: (event) =>
				index = event.target.getAttribute('data-index') | 0
				polygon = self.polygons[event.target.getAttribute('data-polygon') | 0]
				point = polygon.points[index]
				self.setFocus event.target.getAttribute('data-polygon')

				point[0] += event.dx / @zoom
				point[1] += event.dy / @zoom

				@draw polygon

		).styleCursor false

		handle.dblclick (event) ->
			polygon = self.polygons[event.target.getAttribute('data-polygon') | 0]
			if polygon.points.length > 3
				polygon.points.splice(this.attr('data-index'), 1)
				self.setHandles polygon
				self.draw polygon

	interactPolygon: (polygon) ->
		self = this

		interact('svg polygon').draggable(
			snap:
				targets: [
					interact.createSnapGrid {x: @zoom, y: @zoom}
				]
			restrict: restriction: $(".canvas")[0]
			onmove: (event) =>
				polygonIndex = event.target.getAttribute('data-index') | 0
				self.setFocus polygonIndex
				polygon = self.polygons[polygonIndex]
				for point in polygon.points
					point[0] = point[0]+(event.dx/@zoom)
					point[1] = point[1]+(event.dy/@zoom)

				@draw polygon

		).styleCursor false

		$("#editor svg polygon")
			.unbind 'dblclick click'
			.click (e) ->
				e.stopPropagation()
				self.setFocus $(this).attr('data-index')
			.dblclick (e) ->
				polygon = self.polygons[$(this).attr('data-index')]

				onEdge = false
				segment = null
				points = polygon.shape.array().value
				ePoint = {x: e.offsetX, y: e.offsetY}

				checkSegment = (a,b,i,j) ->
					if distToSegment(ePoint, a, b) < 5
						onEdge = true
						segment = { a: i, b: j }

				for point,i in points

					if i is points.length-1 # Last point in our array
						checkSegment { x: points[i][0], y: points[i][1] }, { x: points[0][0], y: points[0][1] }, i, 0
						checkSegment { x: points[i][0], y: points[i][1] }, { x: points[i-1][0], y: points[i-1][1] }, i, i-1

					else if i is 0 # First point in our array
						checkSegment { x: points[i][0], y: points[i][1] }, { x: points[points.length-1][0], y: points[points.length-1][1] }, i, points.length-1
						checkSegment { x: points[i][0], y: points[i][1] }, { x: points[i+1][0], y: points[i+1][1] }, i, i+1

					else
						checkSegment { x: points[i][0], y: points[i][1] }, { x: points[i+1][0], y: points[i+1][1] }, i, i+1
						checkSegment { x: points[i][0], y: points[i][1] }, { x: points[i-1][0], y: points[i-1][1] }, i, i-1

				if onEdge
					if segment.a is points.length-1 or segment.b is points.length-1
						index = points.length
					else
						index = Math.min segment.a, segment.b
					# console.log segment.a, segment.b, index, ePoint.x, ePoint.y
					polygon.points.splice(index+1, 0, [ePoint.x / self.zoom, ePoint.y / self.zoom])

					self.setHandles polygon
					self.draw polygon

	setFocus: (polygonIndex) =>
		polygon.shape.attr 'class', '' for polygon in @polygons
		polygon = @polygons[polygonIndex]
		polygon.shape.attr('class', 'focused').front()
		polygon.handles.front()

	removePolygon: (polygonIndex) =>
		polygon = @polygons[polygonIndex]
		polygon.shape.remove()
		polygon.handles.remove()
		@polygons.splice(polygonIndex, 1)

		for polygon, i in @polygons
			polygon.shape.attr 'data-index', i
			for handle in polygon.handles.children()
				handle.attr 'data-polygon', i

		@broadcastChanges()

	broadcastChanges: () ->
		if not @NO_BROADCAST
			data = []
			data.push polygon.points for polygon in @polygons
			@main.setSprite data

	delete: () ->
		for polygon in @polygons
			polygon.shape.remove()
			polygon.handles.remove()
		@NO_BROADCAST = true
		@canvas.remove()

module.exports = Editor

sqr = (x) ->
	x * x

dist2 = (v, w) ->
	sqr(v.x - (w.x)) + sqr(v.y - (w.y))

distToSegmentSquared = (p, v, w) ->
	l2 = dist2(v, w)
	if l2 == 0
		return dist2(p, v)
	t = ((p.x - (v.x)) * (w.x - (v.x)) + (p.y - (v.y)) * (w.y - (v.y))) / l2
	if t < 0
		return dist2(p, v)
	if t > 1
		return dist2(p, w)
	dist2 p,
		x: v.x + t * (w.x - (v.x))
		y: v.y + t * (w.y - (v.y))

distToSegment = (p, v, w) ->
	Math.sqrt distToSegmentSquared(p, v, w)

pointsForEach = (points, cb) ->
	len = points.numberOfItems
	i=0
	while i < len
		point = points.getItem(i)
		cb(point,i)
		i++
