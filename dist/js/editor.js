(function() {
  var Editor, dist2, distToSegment, distToSegmentSquared, pointsForEach, sqr,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  Function.prototype.property = function(prop, desc) {
    return Object.defineProperty(this.prototype, prop, desc);
  };

  Editor = (function() {
    function Editor(main) {
      this.main = main;
      this.removePolygon = bind(this.removePolygon, this);
      this.setFocus = bind(this.setFocus, this);
      this.canvas = SVG("canvas").size('100%', '100%');
      this.polygons = [];
      this.handleRadius = 16;
      this.handleCanvasEvents();
    }

    Editor.property('zoom', {
      get: function() {
        return this.main.ui.zoom;
      }
    });

    Editor.prototype.start = function(data) {
      var k, len1, points, results;
      if (data) {
        results = [];
        for (k = 0, len1 = data.length; k < len1; k++) {
          points = data[k];
          results.push(this.newPolygon(points));
        }
        return results;
      }
    };

    Editor.prototype.newPolygon = function(points) {
      var canvasHeight, canvasWidth, k, len1, polygon, ref;
      canvasWidth = $(".sprite-image")[0].naturalWidth;
      canvasHeight = $(".sprite-image")[0].naturalHeight;
      ref = this.polygons;
      for (k = 0, len1 = ref.length; k < len1; k++) {
        polygon = ref[k];
        polygon.shape.attr('class', '');
      }
      polygon = {
        points: _.cloneDeep(points) || [[canvasWidth / 2, canvasHeight / 4], [canvasWidth / 4, canvasHeight * 3 / 4], [canvasWidth * 3 / 4, canvasHeight * 3 / 4]],
        shape: this.canvas.polygon().attr({
          'cursor': 'move',
          'class': 'focused',
          'data-index': this.polygons.length
        }),
        handles: this.canvas.group()
      };
      this.polygons.push(polygon);
      this.interactPolygon(polygon);
      this.setHandles(polygon);
      this.draw(polygon);
      return polygon;
    };

    Editor.prototype.handleZoom = function() {
      var k, len1, polygon, ref, results;
      ref = this.polygons;
      results = [];
      for (k = 0, len1 = ref.length; k < len1; k++) {
        polygon = ref[k];
        this.interactPolygon(polygon);
        this.setHandles(polygon);
        results.push(this.draw(polygon));
      }
      return results;
    };

    Editor.prototype.handleCanvasEvents = function() {
      $("body").unbind('keyup').keyup((function(_this) {
        return function(e) {
          if (e.keycode === 46 || e.keycode === 8) {
            console.log('mhm');
            if ($("polygon.focused").length > 0) {
              return _this.removePolygon($("polygon.focused").eq(0).attr('data-index'));
            }
          }
        };
      })(this));
      return interact('#editor').draggable({
        onstart: function(e) {
          return console.log('its begun');
        },
        onmove: (function(_this) {
          return function(event) {
            var target, x, y;
            console.log('let\'s go');
            target = event.target;
            x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
            y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
            target.style.transform = "translate(" + x + "px, " + y + "px)";
            target.setAttribute('data-x', x);
            return target.setAttribute('data-y', y);
          };
        })(this)
      });
    };

    Editor.prototype.draw = function(polygon) {
      var drawPoints, handles, i, k, l, len1, len2, point, ref;
      drawPoints = [];
      ref = polygon.points;
      for (k = 0, len1 = ref.length; k < len1; k++) {
        point = ref[k];
        drawPoints.push([point[0] * this.zoom, point[1] * this.zoom]);
      }
      polygon.shape.plot(drawPoints);
      handles = polygon.handles.children();
      for (i = l = 0, len2 = drawPoints.length; l < len2; i = ++l) {
        point = drawPoints[i];
        handles[i].move(point[0] - this.handleRadius / 2, point[1] - this.handleRadius / 2);
      }
      return this.broadcastChanges();
    };

    Editor.prototype.setHandles = function(polygon) {
      var handle, i, k, len1, point, ref, results;
      polygon.handles.clear();
      ref = polygon.points;
      results = [];
      for (i = k = 0, len1 = ref.length; k < len1; i = ++k) {
        point = ref[i];
        handle = this.canvas.circle(this.handleRadius).fill('#000');
        handle.attr({
          'class': 'point-handle',
          'data-index': i,
          'data-polygon': polygon.shape.attr('data-index')
        });
        polygon.handles.add(handle);
        results.push(this.interactHandle(handle));
      }
      return results;
    };

    Editor.prototype.interactHandle = function(handle) {
      var self;
      self = this;
      interact('.point-handle').draggable({
        snap: {
          targets: [
            interact.createSnapGrid({
              x: this.zoom,
              y: this.zoom
            })
          ]
        },
        restrict: {
          restriction: $("#canvas")
        },
        onmove: (function(_this) {
          return function(event) {
            var index, point, polygon;
            index = event.target.getAttribute('data-index') | 0;
            polygon = self.polygons[event.target.getAttribute('data-polygon') | 0];
            point = polygon.points[index];
            self.setFocus(event.target.getAttribute('data-polygon'));
            point[0] += event.dx / _this.zoom;
            point[1] += event.dy / _this.zoom;
            return _this.draw(polygon);
          };
        })(this)
      }).styleCursor(false);
      return handle.dblclick(function(event) {
        var polygon;
        polygon = self.polygons[event.target.getAttribute('data-polygon') | 0];
        if (polygon.points.length > 3) {
          polygon.points.splice(this.attr('data-index'), 1);
          self.setHandles(polygon);
          return self.draw(polygon);
        }
      });
    };

    Editor.prototype.interactPolygon = function(polygon) {
      var self;
      self = this;
      interact('svg polygon').draggable({
        snap: {
          targets: [
            interact.createSnapGrid({
              x: this.zoom,
              y: this.zoom
            })
          ]
        },
        restrict: {
          restriction: $(".canvas")[0]
        },
        onmove: (function(_this) {
          return function(event) {
            var k, len1, point, polygonIndex, ref;
            polygonIndex = event.target.getAttribute('data-index') | 0;
            self.setFocus(polygonIndex);
            polygon = self.polygons[polygonIndex];
            ref = polygon.points;
            for (k = 0, len1 = ref.length; k < len1; k++) {
              point = ref[k];
              point[0] = point[0] + (event.dx / _this.zoom);
              point[1] = point[1] + (event.dy / _this.zoom);
            }
            return _this.draw(polygon);
          };
        })(this)
      }).styleCursor(false);
      return $("#editor svg polygon").unbind('dblclick click').click(function(e) {
        e.stopPropagation();
        return self.setFocus($(this).attr('data-index'));
      }).dblclick(function(e) {
        var checkSegment, ePoint, i, index, k, len1, onEdge, point, points, segment;
        polygon = self.polygons[$(this).attr('data-index')];
        onEdge = false;
        segment = null;
        points = polygon.shape.array().value;
        ePoint = {
          x: e.offsetX,
          y: e.offsetY
        };
        checkSegment = function(a, b, i, j) {
          if (distToSegment(ePoint, a, b) < 5) {
            onEdge = true;
            return segment = {
              a: i,
              b: j
            };
          }
        };
        for (i = k = 0, len1 = points.length; k < len1; i = ++k) {
          point = points[i];
          if (i === points.length - 1) {
            checkSegment({
              x: points[i][0],
              y: points[i][1]
            }, {
              x: points[0][0],
              y: points[0][1]
            }, i, 0);
            checkSegment({
              x: points[i][0],
              y: points[i][1]
            }, {
              x: points[i - 1][0],
              y: points[i - 1][1]
            }, i, i - 1);
          } else if (i === 0) {
            checkSegment({
              x: points[i][0],
              y: points[i][1]
            }, {
              x: points[points.length - 1][0],
              y: points[points.length - 1][1]
            }, i, points.length - 1);
            checkSegment({
              x: points[i][0],
              y: points[i][1]
            }, {
              x: points[i + 1][0],
              y: points[i + 1][1]
            }, i, i + 1);
          } else {
            checkSegment({
              x: points[i][0],
              y: points[i][1]
            }, {
              x: points[i + 1][0],
              y: points[i + 1][1]
            }, i, i + 1);
            checkSegment({
              x: points[i][0],
              y: points[i][1]
            }, {
              x: points[i - 1][0],
              y: points[i - 1][1]
            }, i, i - 1);
          }
        }
        if (onEdge) {
          if (segment.a === points.length - 1 || segment.b === points.length - 1) {
            index = points.length;
          } else {
            index = Math.min(segment.a, segment.b);
          }
          polygon.points.splice(index + 1, 0, [ePoint.x / self.zoom, ePoint.y / self.zoom]);
          self.setHandles(polygon);
          return self.draw(polygon);
        }
      });
    };

    Editor.prototype.setFocus = function(polygonIndex) {
      var k, len1, polygon, ref;
      ref = this.polygons;
      for (k = 0, len1 = ref.length; k < len1; k++) {
        polygon = ref[k];
        polygon.shape.attr('class', '');
      }
      polygon = this.polygons[polygonIndex];
      polygon.shape.attr('class', 'focused').front();
      return polygon.handles.front();
    };

    Editor.prototype.removePolygon = function(polygonIndex) {
      var handle, i, k, l, len1, len2, polygon, ref, ref1;
      polygon = this.polygons[polygonIndex];
      polygon.shape.remove();
      polygon.handles.remove();
      this.polygons.splice(polygonIndex, 1);
      ref = this.polygons;
      for (i = k = 0, len1 = ref.length; k < len1; i = ++k) {
        polygon = ref[i];
        polygon.shape.attr('data-index', i);
        ref1 = polygon.handles.children();
        for (l = 0, len2 = ref1.length; l < len2; l++) {
          handle = ref1[l];
          handle.attr('data-polygon', i);
        }
      }
      return this.broadcastChanges();
    };

    Editor.prototype.broadcastChanges = function() {
      var data, k, len1, polygon, ref;
      if (!this.NO_BROADCAST) {
        data = [];
        ref = this.polygons;
        for (k = 0, len1 = ref.length; k < len1; k++) {
          polygon = ref[k];
          data.push(polygon.points);
        }
        return this.main.setSprite(data);
      }
    };

    Editor.prototype["delete"] = function() {
      var k, len1, polygon, ref;
      ref = this.polygons;
      for (k = 0, len1 = ref.length; k < len1; k++) {
        polygon = ref[k];
        polygon.shape.remove();
        polygon.handles.remove();
      }
      this.NO_BROADCAST = true;
      return this.canvas.remove();
    };

    return Editor;

  })();

  module.exports = Editor;

  sqr = function(x) {
    return x * x;
  };

  dist2 = function(v, w) {
    return sqr(v.x - w.x) + sqr(v.y - w.y);
  };

  distToSegmentSquared = function(p, v, w) {
    var l2, t;
    l2 = dist2(v, w);
    if (l2 === 0) {
      return dist2(p, v);
    }
    t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    if (t < 0) {
      return dist2(p, v);
    }
    if (t > 1) {
      return dist2(p, w);
    }
    return dist2(p, {
      x: v.x + t * (w.x - v.x),
      y: v.y + t * (w.y - v.y)
    });
  };

  distToSegment = function(p, v, w) {
    return Math.sqrt(distToSegmentSquared(p, v, w));
  };

  pointsForEach = function(points, cb) {
    var i, len, point, results;
    len = points.numberOfItems;
    i = 0;
    results = [];
    while (i < len) {
      point = points.getItem(i);
      cb(point, i);
      results.push(i++);
    }
    return results;
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,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ZTs7RUFHaEIsYUFBQSxHQUFnQixTQUFDLE1BQUQsRUFBUyxFQUFUO0FBQ2YsUUFBQTtJQUFBLEdBQUEsR0FBTSxNQUFNLENBQUM7SUFDYixDQUFBLEdBQUU7QUFDRjtXQUFNLENBQUEsR0FBSSxHQUFWO01BQ0MsS0FBQSxHQUFRLE1BQU0sQ0FBQyxPQUFQLENBQWUsQ0FBZjtNQUNSLEVBQUEsQ0FBRyxLQUFILEVBQVMsQ0FBVDttQkFDQSxDQUFBO0lBSEQsQ0FBQTs7RUFIZTtBQXpQaEIiLCJmaWxlIjoiZWRpdG9yLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIiwic291cmNlc0NvbnRlbnQiOlsiRnVuY3Rpb246OnByb3BlcnR5ID0gKHByb3AsIGRlc2MpIC0+XHJcblx0T2JqZWN0LmRlZmluZVByb3BlcnR5IEBwcm90b3R5cGUsIHByb3AsIGRlc2NcclxuXHJcbmNsYXNzIEVkaXRvclxyXG5cdGNvbnN0cnVjdG9yOiAoQG1haW4pIC0+XHJcblx0XHRAY2FudmFzID0gU1ZHKFwiY2FudmFzXCIpLnNpemUoJzEwMCUnLCAnMTAwJScpXHJcblxyXG5cdFx0QHBvbHlnb25zID0gW11cclxuXHJcblx0XHRAaGFuZGxlUmFkaXVzID0gMTZcclxuXHRcdEBoYW5kbGVDYW52YXNFdmVudHMoKVxyXG5cclxuXHJcblx0QHByb3BlcnR5ICd6b29tJyxcclxuXHRcdGdldDogLT4gQG1haW4udWkuem9vbVxyXG5cclxuXHRzdGFydDogKGRhdGEpIC0+XHJcblx0XHRpZiBkYXRhIHRoZW4gQG5ld1BvbHlnb24gcG9pbnRzIGZvciBwb2ludHMgaW4gZGF0YVxyXG5cclxuXHRuZXdQb2x5Z29uOiAocG9pbnRzKSAtPlxyXG5cdFx0Y2FudmFzV2lkdGggPSAkKFwiLnNwcml0ZS1pbWFnZVwiKVswXS5uYXR1cmFsV2lkdGhcclxuXHRcdGNhbnZhc0hlaWdodCA9ICQoXCIuc3ByaXRlLWltYWdlXCIpWzBdLm5hdHVyYWxIZWlnaHRcclxuXHJcblx0XHRwb2x5Z29uLnNoYXBlLmF0dHIgJ2NsYXNzJywgJycgZm9yIHBvbHlnb24gaW4gQHBvbHlnb25zXHJcblx0XHRwb2x5Z29uID0ge1xyXG5cdFx0XHRwb2ludHM6IF8uY2xvbmVEZWVwKHBvaW50cykgb3IgWyBbY2FudmFzV2lkdGgvMixjYW52YXNIZWlnaHQvNF0sIFtjYW52YXNXaWR0aC80LGNhbnZhc0hlaWdodCozLzRdLCBbY2FudmFzV2lkdGgqMy80LGNhbnZhc0hlaWdodCozLzRdIF1cclxuXHRcdFx0c2hhcGU6IEBjYW52YXMucG9seWdvbigpXHJcblx0XHRcdFx0XHRcdC5hdHRyKHtcclxuXHRcdFx0XHRcdFx0XHQnY3Vyc29yJzogJ21vdmUnLFxyXG5cdFx0XHRcdFx0XHRcdCdjbGFzcyc6ICdmb2N1c2VkJ1xyXG5cdFx0XHRcdFx0XHRcdCdkYXRhLWluZGV4JzogQHBvbHlnb25zLmxlbmd0aFxyXG5cdFx0XHRcdFx0XHR9KVxyXG5cdFx0XHRoYW5kbGVzOiBAY2FudmFzLmdyb3VwKClcclxuXHRcdH1cclxuXHJcblx0XHRAcG9seWdvbnMucHVzaCBwb2x5Z29uXHJcblxyXG5cdFx0QGludGVyYWN0UG9seWdvbiBwb2x5Z29uXHJcblx0XHRAc2V0SGFuZGxlcyBwb2x5Z29uXHJcblx0XHRAZHJhdyBwb2x5Z29uXHJcblxyXG5cdFx0cmV0dXJuIHBvbHlnb25cclxuXHJcblx0aGFuZGxlWm9vbTogKCkgLT5cclxuXHRcdGZvciBwb2x5Z29uIGluIEBwb2x5Z29uc1xyXG5cdFx0XHRAaW50ZXJhY3RQb2x5Z29uIHBvbHlnb25cclxuXHRcdFx0QHNldEhhbmRsZXMgcG9seWdvblxyXG5cdFx0XHRAZHJhdyBwb2x5Z29uXHJcblxyXG5cdGhhbmRsZUNhbnZhc0V2ZW50czogKCkgLT5cclxuXHRcdCMgJChcIiNlZGl0b3JcIikudW5iaW5kKCdjbGljaycpLmNsaWNrIChlKSA9PlxyXG5cdFx0IyBcdHBvbHlnb24uc2hhcGUuYXR0ciAnY2xhc3MnLCAnJyBmb3IgcG9seWdvbiBpbiBALnBvbHlnb25zXHJcblxyXG5cdFx0JChcImJvZHlcIikudW5iaW5kKCdrZXl1cCcpLmtleXVwIChlKSA9PlxyXG5cdFx0XHRpZiBlLmtleWNvZGUgaXMgNDYgb3IgZS5rZXljb2RlIGlzIDggIyBEZWxldGUgb3IgYmFja3NwYWNlIHByZXNzZWRcclxuXHRcdFx0XHRjb25zb2xlLmxvZyAnbWhtJ1xyXG5cdFx0XHRcdGlmICQoXCJwb2x5Z29uLmZvY3VzZWRcIikubGVuZ3RoID4gMFxyXG5cdFx0XHRcdFx0QHJlbW92ZVBvbHlnb24gJChcInBvbHlnb24uZm9jdXNlZFwiKS5lcSgwKS5hdHRyKCdkYXRhLWluZGV4JylcclxuXHJcblx0XHRpbnRlcmFjdCgnI2VkaXRvcicpLmRyYWdnYWJsZShcclxuXHRcdFx0b25zdGFydDogKGUpIC0+XHJcblx0XHRcdFx0Y29uc29sZS5sb2cgJ2l0cyBiZWd1bidcclxuXHRcdFx0b25tb3ZlOiAoZXZlbnQpID0+XHJcblx0XHRcdFx0Y29uc29sZS5sb2cgJ2xldFxcJ3MgZ28nXHJcblx0XHRcdFx0dGFyZ2V0ID0gZXZlbnQudGFyZ2V0XHJcblx0XHRcdFx0eCA9IChwYXJzZUZsb2F0KHRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEteCcpKSBvciAwKSArIGV2ZW50LmR4XHJcblx0XHRcdFx0eSA9IChwYXJzZUZsb2F0KHRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEteScpKSBvciAwKSArIGV2ZW50LmR5XHJcblx0XHRcdFx0dGFyZ2V0LnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlKCN7eH1weCwgI3t5fXB4KVwiXHJcblx0XHRcdFx0dGFyZ2V0LnNldEF0dHJpYnV0ZSAnZGF0YS14JywgeFxyXG5cdFx0XHRcdHRhcmdldC5zZXRBdHRyaWJ1dGUgJ2RhdGEteScsIHlcclxuXHRcdClcclxuXHJcblx0ZHJhdzogKHBvbHlnb24pIC0+XHJcblx0XHRkcmF3UG9pbnRzID0gW11cclxuXHRcdGZvciBwb2ludCBpbiBwb2x5Z29uLnBvaW50c1xyXG5cdFx0XHRkcmF3UG9pbnRzLnB1c2ggW3BvaW50WzBdKkB6b29tLCBwb2ludFsxXSpAem9vbV1cclxuXHJcblx0XHRwb2x5Z29uLnNoYXBlLnBsb3QgZHJhd1BvaW50c1xyXG5cclxuXHRcdGhhbmRsZXMgPSBwb2x5Z29uLmhhbmRsZXMuY2hpbGRyZW4oKVxyXG5cdFx0Zm9yIHBvaW50LCBpIGluIGRyYXdQb2ludHNcclxuXHRcdFx0aGFuZGxlc1tpXVxyXG5cdFx0XHRcdC5tb3ZlIHBvaW50WzBdIC0gQGhhbmRsZVJhZGl1cyAvIDIsIHBvaW50WzFdIC0gQGhhbmRsZVJhZGl1cyAvIDJcclxuXHJcblx0XHRAYnJvYWRjYXN0Q2hhbmdlcygpXHJcblxyXG5cdHNldEhhbmRsZXM6IChwb2x5Z29uKSAtPlxyXG5cdFx0cG9seWdvbi5oYW5kbGVzLmNsZWFyKClcclxuXHJcblx0XHRmb3IgcG9pbnQsIGkgaW4gcG9seWdvbi5wb2ludHNcclxuXHRcdFx0aGFuZGxlID0gQGNhbnZhcy5jaXJjbGUoQGhhbmRsZVJhZGl1cykuZmlsbCgnIzAwMCcpXHJcblx0XHRcdGhhbmRsZS5hdHRyIHtcclxuXHRcdFx0XHQnY2xhc3MnOiAncG9pbnQtaGFuZGxlJ1xyXG5cdFx0XHRcdCdkYXRhLWluZGV4JzogaVxyXG5cdFx0XHRcdCdkYXRhLXBvbHlnb24nOiBwb2x5Z29uLnNoYXBlLmF0dHIgJ2RhdGEtaW5kZXgnXHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHBvbHlnb24uaGFuZGxlcy5hZGQgaGFuZGxlXHJcblx0XHRcdEBpbnRlcmFjdEhhbmRsZSBoYW5kbGVcclxuXHJcblx0aW50ZXJhY3RIYW5kbGU6IChoYW5kbGUpIC0+XHJcblx0XHRzZWxmID0gdGhpc1xyXG5cclxuXHRcdGludGVyYWN0KCcucG9pbnQtaGFuZGxlJykuZHJhZ2dhYmxlKFxyXG5cdFx0XHRzbmFwOlxyXG5cdFx0XHRcdHRhcmdldHM6IFtcclxuXHRcdFx0XHRcdGludGVyYWN0LmNyZWF0ZVNuYXBHcmlkIHt4OiBAem9vbSwgeTogQHpvb219XHJcblx0XHRcdFx0XVxyXG5cdFx0XHRyZXN0cmljdDogcmVzdHJpY3Rpb246ICQoXCIjY2FudmFzXCIpXHJcblx0XHRcdG9ubW92ZTogKGV2ZW50KSA9PlxyXG5cdFx0XHRcdGluZGV4ID0gZXZlbnQudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1pbmRleCcpIHwgMFxyXG5cdFx0XHRcdHBvbHlnb24gPSBzZWxmLnBvbHlnb25zW2V2ZW50LnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtcG9seWdvbicpIHwgMF1cclxuXHRcdFx0XHRwb2ludCA9IHBvbHlnb24ucG9pbnRzW2luZGV4XVxyXG5cdFx0XHRcdHNlbGYuc2V0Rm9jdXMgZXZlbnQudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1wb2x5Z29uJylcclxuXHJcblx0XHRcdFx0cG9pbnRbMF0gKz0gZXZlbnQuZHggLyBAem9vbVxyXG5cdFx0XHRcdHBvaW50WzFdICs9IGV2ZW50LmR5IC8gQHpvb21cclxuXHJcblx0XHRcdFx0QGRyYXcgcG9seWdvblxyXG5cclxuXHRcdCkuc3R5bGVDdXJzb3IgZmFsc2VcclxuXHJcblx0XHRoYW5kbGUuZGJsY2xpY2sgKGV2ZW50KSAtPlxyXG5cdFx0XHRwb2x5Z29uID0gc2VsZi5wb2x5Z29uc1tldmVudC50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLXBvbHlnb24nKSB8IDBdXHJcblx0XHRcdGlmIHBvbHlnb24ucG9pbnRzLmxlbmd0aCA+IDNcclxuXHRcdFx0XHRwb2x5Z29uLnBvaW50cy5zcGxpY2UodGhpcy5hdHRyKCdkYXRhLWluZGV4JyksIDEpXHJcblx0XHRcdFx0c2VsZi5zZXRIYW5kbGVzIHBvbHlnb25cclxuXHRcdFx0XHRzZWxmLmRyYXcgcG9seWdvblxyXG5cclxuXHRpbnRlcmFjdFBvbHlnb246IChwb2x5Z29uKSAtPlxyXG5cdFx0c2VsZiA9IHRoaXNcclxuXHJcblx0XHRpbnRlcmFjdCgnc3ZnIHBvbHlnb24nKS5kcmFnZ2FibGUoXHJcblx0XHRcdHNuYXA6XHJcblx0XHRcdFx0dGFyZ2V0czogW1xyXG5cdFx0XHRcdFx0aW50ZXJhY3QuY3JlYXRlU25hcEdyaWQge3g6IEB6b29tLCB5OiBAem9vbX1cclxuXHRcdFx0XHRdXHJcblx0XHRcdHJlc3RyaWN0OiByZXN0cmljdGlvbjogJChcIi5jYW52YXNcIilbMF1cclxuXHRcdFx0b25tb3ZlOiAoZXZlbnQpID0+XHJcblx0XHRcdFx0cG9seWdvbkluZGV4ID0gZXZlbnQudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1pbmRleCcpIHwgMFxyXG5cdFx0XHRcdHNlbGYuc2V0Rm9jdXMgcG9seWdvbkluZGV4XHJcblx0XHRcdFx0cG9seWdvbiA9IHNlbGYucG9seWdvbnNbcG9seWdvbkluZGV4XVxyXG5cdFx0XHRcdGZvciBwb2ludCBpbiBwb2x5Z29uLnBvaW50c1xyXG5cdFx0XHRcdFx0cG9pbnRbMF0gPSBwb2ludFswXSsoZXZlbnQuZHgvQHpvb20pXHJcblx0XHRcdFx0XHRwb2ludFsxXSA9IHBvaW50WzFdKyhldmVudC5keS9Aem9vbSlcclxuXHJcblx0XHRcdFx0QGRyYXcgcG9seWdvblxyXG5cclxuXHRcdCkuc3R5bGVDdXJzb3IgZmFsc2VcclxuXHJcblx0XHQkKFwiI2VkaXRvciBzdmcgcG9seWdvblwiKVxyXG5cdFx0XHQudW5iaW5kICdkYmxjbGljayBjbGljaydcclxuXHRcdFx0LmNsaWNrIChlKSAtPlxyXG5cdFx0XHRcdGUuc3RvcFByb3BhZ2F0aW9uKClcclxuXHRcdFx0XHRzZWxmLnNldEZvY3VzICQodGhpcykuYXR0cignZGF0YS1pbmRleCcpXHJcblx0XHRcdC5kYmxjbGljayAoZSkgLT5cclxuXHRcdFx0XHRwb2x5Z29uID0gc2VsZi5wb2x5Z29uc1skKHRoaXMpLmF0dHIoJ2RhdGEtaW5kZXgnKV1cclxuXHJcblx0XHRcdFx0b25FZGdlID0gZmFsc2VcclxuXHRcdFx0XHRzZWdtZW50ID0gbnVsbFxyXG5cdFx0XHRcdHBvaW50cyA9IHBvbHlnb24uc2hhcGUuYXJyYXkoKS52YWx1ZVxyXG5cdFx0XHRcdGVQb2ludCA9IHt4OiBlLm9mZnNldFgsIHk6IGUub2Zmc2V0WX1cclxuXHJcblx0XHRcdFx0Y2hlY2tTZWdtZW50ID0gKGEsYixpLGopIC0+XHJcblx0XHRcdFx0XHRpZiBkaXN0VG9TZWdtZW50KGVQb2ludCwgYSwgYikgPCA1XHJcblx0XHRcdFx0XHRcdG9uRWRnZSA9IHRydWVcclxuXHRcdFx0XHRcdFx0c2VnbWVudCA9IHsgYTogaSwgYjogaiB9XHJcblxyXG5cdFx0XHRcdGZvciBwb2ludCxpIGluIHBvaW50c1xyXG5cclxuXHRcdFx0XHRcdGlmIGkgaXMgcG9pbnRzLmxlbmd0aC0xICMgTGFzdCBwb2ludCBpbiBvdXIgYXJyYXlcclxuXHRcdFx0XHRcdFx0Y2hlY2tTZWdtZW50IHsgeDogcG9pbnRzW2ldWzBdLCB5OiBwb2ludHNbaV1bMV0gfSwgeyB4OiBwb2ludHNbMF1bMF0sIHk6IHBvaW50c1swXVsxXSB9LCBpLCAwXHJcblx0XHRcdFx0XHRcdGNoZWNrU2VnbWVudCB7IHg6IHBvaW50c1tpXVswXSwgeTogcG9pbnRzW2ldWzFdIH0sIHsgeDogcG9pbnRzW2ktMV1bMF0sIHk6IHBvaW50c1tpLTFdWzFdIH0sIGksIGktMVxyXG5cclxuXHRcdFx0XHRcdGVsc2UgaWYgaSBpcyAwICMgRmlyc3QgcG9pbnQgaW4gb3VyIGFycmF5XHJcblx0XHRcdFx0XHRcdGNoZWNrU2VnbWVudCB7IHg6IHBvaW50c1tpXVswXSwgeTogcG9pbnRzW2ldWzFdIH0sIHsgeDogcG9pbnRzW3BvaW50cy5sZW5ndGgtMV1bMF0sIHk6IHBvaW50c1twb2ludHMubGVuZ3RoLTFdWzFdIH0sIGksIHBvaW50cy5sZW5ndGgtMVxyXG5cdFx0XHRcdFx0XHRjaGVja1NlZ21lbnQgeyB4OiBwb2ludHNbaV1bMF0sIHk6IHBvaW50c1tpXVsxXSB9LCB7IHg6IHBvaW50c1tpKzFdWzBdLCB5OiBwb2ludHNbaSsxXVsxXSB9LCBpLCBpKzFcclxuXHJcblx0XHRcdFx0XHRlbHNlXHJcblx0XHRcdFx0XHRcdGNoZWNrU2VnbWVudCB7IHg6IHBvaW50c1tpXVswXSwgeTogcG9pbnRzW2ldWzFdIH0sIHsgeDogcG9pbnRzW2krMV1bMF0sIHk6IHBvaW50c1tpKzFdWzFdIH0sIGksIGkrMVxyXG5cdFx0XHRcdFx0XHRjaGVja1NlZ21lbnQgeyB4OiBwb2ludHNbaV1bMF0sIHk6IHBvaW50c1tpXVsxXSB9LCB7IHg6IHBvaW50c1tpLTFdWzBdLCB5OiBwb2ludHNbaS0xXVsxXSB9LCBpLCBpLTFcclxuXHJcblx0XHRcdFx0aWYgb25FZGdlXHJcblx0XHRcdFx0XHRpZiBzZWdtZW50LmEgaXMgcG9pbnRzLmxlbmd0aC0xIG9yIHNlZ21lbnQuYiBpcyBwb2ludHMubGVuZ3RoLTFcclxuXHRcdFx0XHRcdFx0aW5kZXggPSBwb2ludHMubGVuZ3RoXHJcblx0XHRcdFx0XHRlbHNlXHJcblx0XHRcdFx0XHRcdGluZGV4ID0gTWF0aC5taW4gc2VnbWVudC5hLCBzZWdtZW50LmJcclxuXHRcdFx0XHRcdCMgY29uc29sZS5sb2cgc2VnbWVudC5hLCBzZWdtZW50LmIsIGluZGV4LCBlUG9pbnQueCwgZVBvaW50LnlcclxuXHRcdFx0XHRcdHBvbHlnb24ucG9pbnRzLnNwbGljZShpbmRleCsxLCAwLCBbZVBvaW50LnggLyBzZWxmLnpvb20sIGVQb2ludC55IC8gc2VsZi56b29tXSlcclxuXHJcblx0XHRcdFx0XHRzZWxmLnNldEhhbmRsZXMgcG9seWdvblxyXG5cdFx0XHRcdFx0c2VsZi5kcmF3IHBvbHlnb25cclxuXHJcblx0c2V0Rm9jdXM6IChwb2x5Z29uSW5kZXgpID0+XHJcblx0XHRwb2x5Z29uLnNoYXBlLmF0dHIgJ2NsYXNzJywgJycgZm9yIHBvbHlnb24gaW4gQHBvbHlnb25zXHJcblx0XHRwb2x5Z29uID0gQHBvbHlnb25zW3BvbHlnb25JbmRleF1cclxuXHRcdHBvbHlnb24uc2hhcGUuYXR0cignY2xhc3MnLCAnZm9jdXNlZCcpLmZyb250KClcclxuXHRcdHBvbHlnb24uaGFuZGxlcy5mcm9udCgpXHJcblxyXG5cdHJlbW92ZVBvbHlnb246IChwb2x5Z29uSW5kZXgpID0+XHJcblx0XHRwb2x5Z29uID0gQHBvbHlnb25zW3BvbHlnb25JbmRleF1cclxuXHRcdHBvbHlnb24uc2hhcGUucmVtb3ZlKClcclxuXHRcdHBvbHlnb24uaGFuZGxlcy5yZW1vdmUoKVxyXG5cdFx0QHBvbHlnb25zLnNwbGljZShwb2x5Z29uSW5kZXgsIDEpXHJcblxyXG5cdFx0Zm9yIHBvbHlnb24sIGkgaW4gQHBvbHlnb25zXHJcblx0XHRcdHBvbHlnb24uc2hhcGUuYXR0ciAnZGF0YS1pbmRleCcsIGlcclxuXHRcdFx0Zm9yIGhhbmRsZSBpbiBwb2x5Z29uLmhhbmRsZXMuY2hpbGRyZW4oKVxyXG5cdFx0XHRcdGhhbmRsZS5hdHRyICdkYXRhLXBvbHlnb24nLCBpXHJcblxyXG5cdFx0QGJyb2FkY2FzdENoYW5nZXMoKVxyXG5cclxuXHRicm9hZGNhc3RDaGFuZ2VzOiAoKSAtPlxyXG5cdFx0aWYgbm90IEBOT19CUk9BRENBU1RcclxuXHRcdFx0ZGF0YSA9IFtdXHJcblx0XHRcdGRhdGEucHVzaCBwb2x5Z29uLnBvaW50cyBmb3IgcG9seWdvbiBpbiBAcG9seWdvbnNcclxuXHRcdFx0QG1haW4uc2V0U3ByaXRlIGRhdGFcclxuXHJcblx0ZGVsZXRlOiAoKSAtPlxyXG5cdFx0Zm9yIHBvbHlnb24gaW4gQHBvbHlnb25zXHJcblx0XHRcdHBvbHlnb24uc2hhcGUucmVtb3ZlKClcclxuXHRcdFx0cG9seWdvbi5oYW5kbGVzLnJlbW92ZSgpXHJcblx0XHRATk9fQlJPQURDQVNUID0gdHJ1ZVxyXG5cdFx0QGNhbnZhcy5yZW1vdmUoKVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBFZGl0b3JcclxuXHJcbnNxciA9ICh4KSAtPlxyXG5cdHggKiB4XHJcblxyXG5kaXN0MiA9ICh2LCB3KSAtPlxyXG5cdHNxcih2LnggLSAody54KSkgKyBzcXIodi55IC0gKHcueSkpXHJcblxyXG5kaXN0VG9TZWdtZW50U3F1YXJlZCA9IChwLCB2LCB3KSAtPlxyXG5cdGwyID0gZGlzdDIodiwgdylcclxuXHRpZiBsMiA9PSAwXHJcblx0XHRyZXR1cm4gZGlzdDIocCwgdilcclxuXHR0ID0gKChwLnggLSAodi54KSkgKiAody54IC0gKHYueCkpICsgKHAueSAtICh2LnkpKSAqICh3LnkgLSAodi55KSkpIC8gbDJcclxuXHRpZiB0IDwgMFxyXG5cdFx0cmV0dXJuIGRpc3QyKHAsIHYpXHJcblx0aWYgdCA+IDFcclxuXHRcdHJldHVybiBkaXN0MihwLCB3KVxyXG5cdGRpc3QyIHAsXHJcblx0XHR4OiB2LnggKyB0ICogKHcueCAtICh2LngpKVxyXG5cdFx0eTogdi55ICsgdCAqICh3LnkgLSAodi55KSlcclxuXHJcbmRpc3RUb1NlZ21lbnQgPSAocCwgdiwgdykgLT5cclxuXHRNYXRoLnNxcnQgZGlzdFRvU2VnbWVudFNxdWFyZWQocCwgdiwgdylcclxuXHJcbnBvaW50c0ZvckVhY2ggPSAocG9pbnRzLCBjYikgLT5cclxuXHRsZW4gPSBwb2ludHMubnVtYmVyT2ZJdGVtc1xyXG5cdGk9MFxyXG5cdHdoaWxlIGkgPCBsZW5cclxuXHRcdHBvaW50ID0gcG9pbnRzLmdldEl0ZW0oaSlcclxuXHRcdGNiKHBvaW50LGkpXHJcblx0XHRpKytcclxuIl19