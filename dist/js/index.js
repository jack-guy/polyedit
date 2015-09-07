(function() {
  var gui, rootDir;

  gui = require('nw.gui');

  global.$ = $;

  global._ = _;

  global.interact = interact;

  global.gui = gui;

  global.Mousetrap = Mousetrap;

  global.SVG = SVG;

  global.rootDir = rootDir = process.cwd() + '/dist/js/';

  $(function() {
    var events, main;
    main = require(rootDir + 'program.js');
    global.testtest = main;
    return events = require(rootDir + 'events.js')(main);
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsR0FBQSxHQUFNLE9BQUEsQ0FBUSxRQUFSOztFQUVOLE1BQU0sQ0FBQyxDQUFQLEdBQVc7O0VBQ1gsTUFBTSxDQUFDLENBQVAsR0FBVzs7RUFDWCxNQUFNLENBQUMsUUFBUCxHQUFrQjs7RUFDbEIsTUFBTSxDQUFDLEdBQVAsR0FBYTs7RUFDYixNQUFNLENBQUMsU0FBUCxHQUFtQjs7RUFDbkIsTUFBTSxDQUFDLEdBQVAsR0FBYTs7RUFFYixNQUFNLENBQUMsT0FBUCxHQUFpQixPQUFBLEdBQVUsT0FBTyxDQUFDLEdBQVIsQ0FBQSxDQUFBLEdBQWdCOztFQUkzQyxDQUFBLENBQUUsU0FBQTtBQUNDLFFBQUE7SUFBQSxJQUFBLEdBQU8sT0FBQSxDQUFRLE9BQUEsR0FBUSxZQUFoQjtJQUNQLE1BQU0sQ0FBQyxRQUFQLEdBQWtCO1dBQ2xCLE1BQUEsR0FBUyxPQUFBLENBQVEsT0FBQSxHQUFRLFdBQWhCLENBQUEsQ0FBNkIsSUFBN0I7RUFIVixDQUFGO0FBYkEiLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiL3NvdXJjZS8iLCJzb3VyY2VzQ29udGVudCI6WyJndWkgPSByZXF1aXJlICdudy5ndWknXHJcblxyXG5nbG9iYWwuJCA9ICRcclxuZ2xvYmFsLl8gPSBfXHJcbmdsb2JhbC5pbnRlcmFjdCA9IGludGVyYWN0XHJcbmdsb2JhbC5ndWkgPSBndWlcclxuZ2xvYmFsLk1vdXNldHJhcCA9IE1vdXNldHJhcFxyXG5nbG9iYWwuU1ZHID0gU1ZHXHJcblxyXG5nbG9iYWwucm9vdERpciA9IHJvb3REaXIgPSBwcm9jZXNzLmN3ZCgpICsgJy9kaXN0L2pzLydcclxuXHJcbiMgTXkgbGlicmFyaWVzXHJcblxyXG4kIC0+XHJcbiAgIG1haW4gPSByZXF1aXJlKHJvb3REaXIrJ3Byb2dyYW0uanMnKVxyXG4gICBnbG9iYWwudGVzdHRlc3QgPSBtYWluXHJcbiAgIGV2ZW50cyA9IHJlcXVpcmUocm9vdERpcisnZXZlbnRzLmpzJykobWFpbilcclxuXHJcbiAgICMgd2luID0gZ3VpLldpbmRvdy5nZXQoKVxyXG4gICAjIG1lbnViYXIgPSBuZXcgZ3VpLk1lbnUgeyB0eXBlOiAnbWVudWJhcicgfVxyXG4gICAjXHJcbiAgICMgZmlsZSA9IG5ldyBndWkuTWVudSgpXHJcbiAgICNcclxuICAgIyBmaWxlLmFwcGVuZCBuZXcgZ3VpLk1lbnVJdGVtIHtcclxuICAgIyAgICBsYWJlbDogJ09wZW4nXHJcbiAgICMgICAgdG9vbHRpcDogJ3Rlc3QnXHJcbiAgICMgICAgY2xpY2s6IC0+XHJcbiAgICMgICAgICAgY29uc29sZS5sb2cgJ0RpZCBpdCdcclxuICAgIyAgICBrZXk6ICdvJ1xyXG4gICAjICAgIG1vZGlmaWVyczogJ2N0cmwnXHJcbiAgICMgfVxyXG4gICAjXHJcbiAgICMgbWVudWJhci5hcHBlbmQgbmV3IGd1aS5NZW51SXRlbSB7XHJcbiAgICMgICAgbGFiZWw6ICdGaWxlJ1xyXG4gICAjICAgIHN1Ym1lbnU6IGZpbGVcclxuICAgIyB9XHJcbiAgICMgd2luLm1lbnUgPSBtZW51YmFyO1xyXG4iXX0=