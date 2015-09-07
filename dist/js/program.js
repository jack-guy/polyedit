(function() {
  var PolyEdit, Ui, fs, path, polyEdit,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  fs = require('fs');

  path = require('path');

  Ui = require(rootDir + 'ui.js');

  PolyEdit = (function() {
    function PolyEdit() {
      var self;
      this.ui = new Ui(this);
      this.supportedFiles = ['.png', '.jpg', '.jpeg', '.gif'];
      this.window = gui.Window.get().window;
      this.spriteList = [];
      this.editorSprite = null;
      this.justOpened = false;
      this.unsaved = false;
      this.closeFlag = false;
      this["default"] = {
        file: null,
        importPaths: [],
        sprites: [],
        settings: {
          open: null,
          exporter: 'JSON',
          leftWidth: 300,
          rightWidth: 300,
          zoom: 100
        }
      };
      this.data = _.cloneDeep(this["default"]);
      self = this;
      gui.Window.get().on('close', function() {
        if (self.unsaved) {
          return self.confirmClose(true, (function(_this) {
            return function() {
              return _this.close(true);
            };
          })(this));
        } else {
          return this.close(true);
        }
      });
    }

    PolyEdit.prototype.importDirectory = function(directory, original) {
      this.ui.startLoading('sprites');
      if (!original) {
        original = directory;
        if (!_.findWhere(this.data.importPaths, {
          path: original
        })) {
          this.data.importPaths.push({
            type: 'dir',
            path: original
          });
        }
      }
      return fs.readdir(directory, (function(_this) {
        return function(err, files) {
          var combined, e, file, i, info, len, ref, results;
          if (!err && files) {
            results = [];
            for (i = 0, len = files.length; i < len; i++) {
              file = files[i];
              combined = directory + '\\' + file;
              try {
                info = fs.lstatSync(combined);
              } catch (_error) {
                e = _error;
                console.error(e);
              }
              if (info) {
                if (info.isDirectory()) {
                  results.push(_this.importDirectory(combined, original));
                } else if (ref = path.extname(file), indexOf.call(_this.supportedFiles, ref) >= 0) {
                  results.push(_this.importFile(combined, directory.slice(original.length + 1) + '\\' + path.parse(file).name));
                } else {
                  results.push(void 0);
                }
              } else {
                results.push(void 0);
              }
            }
            return results;
          }
        };
      })(this));
    };

    PolyEdit.prototype.importFile = function(file, key) {
      var duplicate, parse, sprite;
      this.ui.stopLoading('sprites');
      parse = path.parse(file);
      if (!key) {
        key = parse.name;
        this.data.importPaths.push({
          type: 'file',
          path: file
        });
      }
      duplicate = _.findWhere(this.spriteList, {
        path: file
      });
      sprite = {
        name: parse.name,
        key: key,
        path: file,
        id: this.spriteList.length
      };
      if (duplicate) {
        duplicate = sprite;
        this.ui.updateSprite(sprite);
      } else {
        this.spriteList.push(sprite);
        this.ui.addSprite(sprite);
      }
      if (this.data.settings.open === sprite.key) {
        return this.setEditor(sprite.id);
      }
    };

    PolyEdit.prototype["export"] = function(path) {
      var data, i, j, k, len, len1, len2, out, outData, point, polygon, ref, ref1, ref2, sprite;
      out = {};
      ref = this.data.sprites;
      for (i = 0, len = ref.length; i < len; i++) {
        sprite = ref[i];
        data = [];
        ref1 = sprite.data;
        for (j = 0, len1 = ref1.length; j < len1; j++) {
          polygon = ref1[j];
          outData = {
            density: 2,
            friction: 0,
            bounce: 0,
            filter: {
              categoryBits: 1,
              maskBits: 65535
            },
            shape: []
          };
          ref2 = polygon.slice(0).reverse();
          for (k = 0, len2 = ref2.length; k < len2; k++) {
            point = ref2[k];
            outData.shape.push(point[0]);
            outData.shape.push(point[1]);
          }
          data.push(outData);
        }
        out[sprite.key] = data;
      }
      return fs.writeFile(path, JSON.stringify(out), (function(_this) {
        return function(err) {
          if (err) {
            return _this.window.alert("Couldn't save file: " + path);
          }
        };
      })(this));
    };

    PolyEdit.prototype.setEditor = function(id) {
      var sprite;
      this.editorSprite = this.spriteList[id];
      sprite = _.findWhere(this.data.sprites, {
        key: this.editorSprite.key
      });
      this.editorSprite.data = sprite != null ? sprite.data : void 0;
      return this.ui.setEditor(this.editorSprite);
    };

    PolyEdit.prototype.save = function(path) {
      if (!path) {
        path = this.data.file;
      } else {
        this.data.file = path;
      }
      return fs.writeFile(path, JSON.stringify(this.data), (function(_this) {
        return function(err) {
          if (err) {
            return _this.window.alert("Couldn't save file: " + path);
          } else {
            _this.unsaved = false;
            if (_this.closeFlag) {
              return gui.Window.get().close(true);
            }
          }
        };
      })(this));
    };

    PolyEdit.prototype.newProject = function() {
      var finishNew;
      finishNew = (function(_this) {
        return function() {
          _this.data = _.cloneDeep(_this["default"]);
          _this.spriteList = [];
          _this.ui.reset();
          return _this.data.unsaved = false;
        };
      })(this);
      if (this.unsaved) {
        return this.confirmClose(false, (function(_this) {
          return function() {
            return finishNew();
          };
        })(this));
      } else {
        return finishNew();
      }
    };

    PolyEdit.prototype.open = function(path) {
      var finishOpen;
      finishOpen = (function(_this) {
        return function() {
          var i, len, ref, results;
          _this.ui.reset();
          _this.spriteList = [];
          _this.justOpened = true;
          _this.data.unsaved = false;
          ref = _this.data.importPaths;
          results = [];
          for (i = 0, len = ref.length; i < len; i++) {
            path = ref[i];
            if (path.type === "dir") {
              results.push(_this.importDirectory(path.path));
            } else if (path.type === "file") {
              results.push(_this.importFile(path.path));
            } else {
              results.push(void 0);
            }
          }
          return results;
        };
      })(this);
      return fs.readFile(path, (function(_this) {
        return function(err, data) {
          if (err) {
            return _this.window.alert("Couldn't open file " + path);
          } else if (_this.unsaved) {
            return _this.confirmClose(false, function() {
              _this.data = JSON.parse(data);
              return finishOpen();
            });
          } else {
            _this.data = JSON.parse(data);
            return finishOpen();
          }
        };
      })(this));
    };

    PolyEdit.prototype.confirmClose = function(closeAfter, cb) {
      var confirm, self;
      confirm = gui.Window.open('confirm.html', {
        "title": "Confirm Close",
        "toolbar": false,
        "width": 350,
        "height": 150,
        "position": "mouse",
        "resizable": false,
        "always-on-top": true,
        "show_in_taskbar": false
      });
      confirm.resizeTo(350, 150);
      confirm.setResizable(false);
      confirm.setAlwaysOnTop(true);
      global.confirmStatus = null;
      self = this;
      return confirm.on('close', function() {
        this.close(true);
        if (global.confirmStatus === -1) {
          return cb();
        } else if (global.confirmStatus === 0 || global.confirmStatus === null) {

        } else if (global.confirmStatus === 1) {
          self.closeFlag = closeAfter;
          return $(".save-project").trigger('click');
        }
      });
    };

    PolyEdit.prototype.setSprite = function(data) {
      var duplicate;
      this.unsaved = true;
      if (this.editorSprite) {
        duplicate = _.findWhere(this.data.sprites, {
          key: this.editorSprite.key
        });
        if (duplicate) {
          duplicate.data = data;
        } else {
          this.editorSprite.data = data;
          this.data.sprites.push(this.editorSprite);
        }
        if (data.length > 0) {
          return this.ui.setActive(this.editorSprite);
        } else {
          return this.ui.setInactive(this.editorSprite);
        }
      } else {
        return this.window.alert('Weird stuff is happening.');
      }
    };

    return PolyEdit;

  })();

  polyEdit = new PolyEdit;

  module.exports = polyEdit;

}).call(this);

//# sourceMappingURL=data:application/json;base64,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aUJkLFFBQUEsR0FBVyxJQUFJOztFQUNmLE1BQU0sQ0FBQyxPQUFQLEdBQWlCO0FBck9qQiIsImZpbGUiOiJwcm9ncmFtLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIiwic291cmNlc0NvbnRlbnQiOlsiZnMgPSByZXF1aXJlICdmcydcbnBhdGggPSByZXF1aXJlICdwYXRoJ1xuVWkgPSByZXF1aXJlKHJvb3REaXIrJ3VpLmpzJylcblxuY2xhc3MgUG9seUVkaXRcbiAgIGNvbnN0cnVjdG9yOiAoKSAtPlxuICAgICAgQHVpID0gbmV3IFVpKEApXG5cbiAgICAgIEBzdXBwb3J0ZWRGaWxlcyA9IFsnLnBuZycsICcuanBnJywgJy5qcGVnJywgJy5naWYnXVxuICAgICAgQHdpbmRvdyA9IGd1aS5XaW5kb3cuZ2V0KCkud2luZG93XG5cbiAgICAgIEBzcHJpdGVMaXN0ID0gW11cbiAgICAgIEBlZGl0b3JTcHJpdGUgPSBudWxsXG5cbiAgICAgIEBqdXN0T3BlbmVkID0gZmFsc2VcbiAgICAgIEB1bnNhdmVkID0gZmFsc2VcbiAgICAgIEBjbG9zZUZsYWcgPSBmYWxzZVxuXG5cbiAgICAgIEBkZWZhdWx0ID0ge1xuICAgICAgICAgZmlsZTogbnVsbCxcbiAgICAgICAgIGltcG9ydFBhdGhzOiBbXSxcbiAgICAgICAgIHNwcml0ZXM6IFtdLFxuICAgICAgICAgc2V0dGluZ3M6IHtcbiAgICAgICAgICAgIG9wZW46IG51bGxcbiAgICAgICAgICAgIGV4cG9ydGVyOiAnSlNPTidcbiAgICAgICAgICAgIGxlZnRXaWR0aDogMzAwXG4gICAgICAgICAgICByaWdodFdpZHRoOiAzMDBcbiAgICAgICAgICAgIHpvb206IDEwMFxuICAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBAZGF0YSA9IF8uY2xvbmVEZWVwKEBkZWZhdWx0KVxuXG4gICAgICBzZWxmID0gdGhpc1xuICAgICAgZ3VpLldpbmRvdy5nZXQoKS5vbiAnY2xvc2UnLCAtPlxuICAgICAgICAgaWYgc2VsZi51bnNhdmVkXG4gICAgICAgICAgICBzZWxmLmNvbmZpcm1DbG9zZSB0cnVlLCA9PlxuICAgICAgICAgICAgICAgdGhpcy5jbG9zZSB0cnVlXG4gICAgICAgICBlbHNlXG4gICAgICAgICAgICB0aGlzLmNsb3NlIHRydWVcbiAgICAgICMgQG9wZW4oJ0M6XFxcXFVzZXJzXFxcXEphY2tcXFxcZ2l0XFxcXGdhbWVcXFxccGpcXFxcVUlcXFxcYXNkLnBseWVkJylcblxuICAgIyBDdXJyZW50IGRpcmVjdG9yeSBzZWFyY2hpbmcsIG9yaWdpbmFsIGRpcmVjdG9yeSBiZWZvcmUgcmVjdXJzaW9uXG4gICBpbXBvcnREaXJlY3Rvcnk6IChkaXJlY3RvcnksIG9yaWdpbmFsKSAtPlxuICAgICAgQHVpLnN0YXJ0TG9hZGluZygnc3ByaXRlcycpXG5cbiAgICAgIGlmIG5vdCBvcmlnaW5hbFxuICAgICAgICAgb3JpZ2luYWwgPSBkaXJlY3RvcnlcbiAgICAgICAgIGlmIG5vdCBfLmZpbmRXaGVyZSBAZGF0YS5pbXBvcnRQYXRocywge3BhdGg6IG9yaWdpbmFsfVxuICAgICAgICAgICAgQGRhdGEuaW1wb3J0UGF0aHMucHVzaCB7XG4gICAgICAgICAgICAgICB0eXBlOiAnZGlyJ1xuICAgICAgICAgICAgICAgcGF0aDogb3JpZ2luYWxcbiAgICAgICAgICAgIH1cblxuICAgICAgZnMucmVhZGRpciBkaXJlY3RvcnksIChlcnIsIGZpbGVzKSA9PlxuICAgICAgICAgaWYgIWVyciBhbmQgZmlsZXNcbiAgICAgICAgICAgIGZvciBmaWxlIGluIGZpbGVzXG4gICAgICAgICAgICAgICBjb21iaW5lZCA9IGRpcmVjdG9yeSsnXFxcXCcrZmlsZVxuXG4gICAgICAgICAgICAgICB0cnlcbiAgICAgICAgICAgICAgICAgIGluZm8gPSBmcy5sc3RhdFN5bmMgY29tYmluZWRcbiAgICAgICAgICAgICAgIGNhdGNoIGVcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IgZVxuXG4gICAgICAgICAgICAgICBpZiBpbmZvXG4gICAgICAgICAgICAgICAgICBpZiBpbmZvLmlzRGlyZWN0b3J5KClcbiAgICAgICAgICAgICAgICAgICAgIEBpbXBvcnREaXJlY3RvcnkgY29tYmluZWQsIG9yaWdpbmFsXG4gICAgICAgICAgICAgICAgICBlbHNlIGlmIHBhdGguZXh0bmFtZShmaWxlKSBpbiBAc3VwcG9ydGVkRmlsZXNcbiAgICAgICAgICAgICAgICAgICAgIEBpbXBvcnRGaWxlIGNvbWJpbmVkLCBkaXJlY3Rvcnkuc2xpY2Uob3JpZ2luYWwubGVuZ3RoKzEpKydcXFxcJytwYXRoLnBhcnNlKGZpbGUpLm5hbWVcblxuICAgaW1wb3J0RmlsZTogKGZpbGUsIGtleSkgLT5cbiAgICAgIEB1aS5zdG9wTG9hZGluZyAnc3ByaXRlcydcbiAgICAgIHBhcnNlID0gcGF0aC5wYXJzZSBmaWxlXG5cbiAgICAgIGlmIG5vdCBrZXkgIyBPcmlnaW5hdGVkIGZyb20gXCJpbXBvcnQgZmlsZVwiIGJ1dHRvblxuICAgICAgICAga2V5ID0gcGFyc2UubmFtZVxuICAgICAgICAgQGRhdGEuaW1wb3J0UGF0aHMucHVzaCB7XG4gICAgICAgICAgICB0eXBlOiAnZmlsZSdcbiAgICAgICAgICAgIHBhdGg6IGZpbGVcbiAgICAgICAgIH1cblxuICAgICAgZHVwbGljYXRlID0gXy5maW5kV2hlcmUgQHNwcml0ZUxpc3QsIHtwYXRoOiBmaWxlfVxuICAgICAgc3ByaXRlID0ge1xuICAgICAgICAgbmFtZTogcGFyc2UubmFtZVxuICAgICAgICAga2V5OiBrZXlcbiAgICAgICAgIHBhdGg6IGZpbGVcbiAgICAgICAgIGlkOiBAc3ByaXRlTGlzdC5sZW5ndGhcbiAgICAgIH1cblxuICAgICAgaWYgZHVwbGljYXRlXG4gICAgICAgICBkdXBsaWNhdGUgPSBzcHJpdGVcbiAgICAgICAgIEB1aS51cGRhdGVTcHJpdGUgc3ByaXRlXG4gICAgICBlbHNlXG4gICAgICAgICBAc3ByaXRlTGlzdC5wdXNoIHNwcml0ZVxuICAgICAgICAgQHVpLmFkZFNwcml0ZSBzcHJpdGVcblxuICAgICAgaWYgQGRhdGEuc2V0dGluZ3Mub3BlbiBpcyBzcHJpdGUua2V5XG4gICAgICAgICBAc2V0RWRpdG9yIHNwcml0ZS5pZFxuXG4gICBleHBvcnQ6IChwYXRoKSAtPlxuICAgICAgb3V0ID0ge31cblxuICAgICAgZm9yIHNwcml0ZSBpbiBAZGF0YS5zcHJpdGVzXG4gICAgICAgICBkYXRhID0gW11cblxuICAgICAgICAgZm9yIHBvbHlnb24gaW4gc3ByaXRlLmRhdGFcbiAgICAgICAgICAgIG91dERhdGEgPSB7XG4gICAgICAgICAgICAgICBkZW5zaXR5OiAyXG4gICAgICAgICAgICAgICBmcmljdGlvbjogMFxuICAgICAgICAgICAgICAgYm91bmNlOiAwXG4gICAgICAgICAgICAgICBmaWx0ZXI6IHsgY2F0ZWdvcnlCaXRzOiAxLCBtYXNrQml0czogNjU1MzUgfVxuICAgICAgICAgICAgICAgc2hhcGU6IFtdXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgcG9pbnQgaW4gcG9seWdvbi5zbGljZSgwKS5yZXZlcnNlKClcbiAgICAgICAgICAgICAgIG91dERhdGEuc2hhcGUucHVzaCBwb2ludFswXVxuICAgICAgICAgICAgICAgb3V0RGF0YS5zaGFwZS5wdXNoIHBvaW50WzFdXG5cbiAgICAgICAgICAgIGRhdGEucHVzaCBvdXREYXRhXG5cbiAgICAgICAgIG91dFtzcHJpdGUua2V5XSA9IGRhdGFcblxuICAgICAgZnMud3JpdGVGaWxlIHBhdGgsIEpTT04uc3RyaW5naWZ5KG91dCksIChlcnIpID0+XG4gICAgICAgICBpZiBlcnJcbiAgICAgICAgICAgIEB3aW5kb3cuYWxlcnQgXCJDb3VsZG4ndCBzYXZlIGZpbGU6ICN7cGF0aH1cIlxuXG4gICBzZXRFZGl0b3I6IChpZCkgLT5cbiAgICAgIEBlZGl0b3JTcHJpdGUgPSBAc3ByaXRlTGlzdFtpZF1cbiAgICAgIHNwcml0ZSA9IF8uZmluZFdoZXJlIEBkYXRhLnNwcml0ZXMsIHsga2V5OiBAZWRpdG9yU3ByaXRlLmtleSB9XG4gICAgICBAZWRpdG9yU3ByaXRlLmRhdGEgPSBzcHJpdGU/LmRhdGFcbiAgICAgIEB1aS5zZXRFZGl0b3IgQGVkaXRvclNwcml0ZVxuXG4gICBzYXZlOiAocGF0aCkgLT5cbiAgICAgIGlmIG5vdCBwYXRoXG4gICAgICAgICBwYXRoID0gQGRhdGEuZmlsZVxuICAgICAgZWxzZVxuICAgICAgICAgQGRhdGEuZmlsZSA9IHBhdGhcbiAgICAgIGZzLndyaXRlRmlsZSBwYXRoLCBKU09OLnN0cmluZ2lmeShAZGF0YSksIChlcnIpID0+XG4gICAgICAgICBpZiBlcnJcbiAgICAgICAgICAgIEB3aW5kb3cuYWxlcnQgXCJDb3VsZG4ndCBzYXZlIGZpbGU6ICN7cGF0aH1cIlxuICAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHVuc2F2ZWQgPSBmYWxzZVxuXG4gICAgICAgICAgICBpZiBAY2xvc2VGbGFnICMgV2Ugd2FudCB0byBjbG9zZSB0aGUgbWFpbiB3aW5kb3csIGp1c3QgZ290dGEgc2F2ZSBmaXJzdFxuICAgICAgICAgICAgICAgZ3VpLldpbmRvdy5nZXQoKS5jbG9zZSB0cnVlXG5cbiAgIG5ld1Byb2plY3Q6ICgpIC0+XG4gICAgICBmaW5pc2hOZXcgPSA9PlxuICAgICAgICAgQGRhdGEgPSBfLmNsb25lRGVlcCBAZGVmYXVsdFxuICAgICAgICAgQHNwcml0ZUxpc3QgPSBbXVxuICAgICAgICAgQHVpLnJlc2V0KClcbiAgICAgICAgIEBkYXRhLnVuc2F2ZWQgPSBmYWxzZVxuXG4gICAgICBpZiBAdW5zYXZlZFxuICAgICAgICAgQGNvbmZpcm1DbG9zZSBmYWxzZSwgPT5cbiAgICAgICAgICAgIGZpbmlzaE5ldygpXG4gICAgICBlbHNlXG4gICAgICAgICBmaW5pc2hOZXcoKVxuXG4gICBvcGVuOiAocGF0aCkgLT5cbiAgICAgIGZpbmlzaE9wZW4gPSA9PlxuICAgICAgICAgQHVpLnJlc2V0KClcbiAgICAgICAgIEBzcHJpdGVMaXN0ID0gW11cbiAgICAgICAgIEBqdXN0T3BlbmVkID0gdHJ1ZVxuICAgICAgICAgQGRhdGEudW5zYXZlZCA9IGZhbHNlXG5cbiAgICAgICAgIGZvciBwYXRoIGluIEBkYXRhLmltcG9ydFBhdGhzXG4gICAgICAgICAgICBpZiBwYXRoLnR5cGUgaXMgXCJkaXJcIlxuICAgICAgICAgICAgICAgQGltcG9ydERpcmVjdG9yeSBwYXRoLnBhdGhcbiAgICAgICAgICAgIGVsc2UgaWYgcGF0aC50eXBlIGlzIFwiZmlsZVwiXG4gICAgICAgICAgICAgICBAaW1wb3J0RmlsZSBwYXRoLnBhdGhcblxuICAgICAgZnMucmVhZEZpbGUgcGF0aCwgKGVyciwgZGF0YSkgPT5cbiAgICAgICAgIGlmIGVyclxuICAgICAgICAgICAgQHdpbmRvdy5hbGVydCBcIkNvdWxkbid0IG9wZW4gZmlsZSAje3BhdGh9XCJcbiAgICAgICAgIGVsc2UgaWYgQHVuc2F2ZWRcbiAgICAgICAgICAgIEBjb25maXJtQ2xvc2UgZmFsc2UsID0+XG4gICAgICAgICAgICAgICBAZGF0YSA9IEpTT04ucGFyc2UgZGF0YVxuICAgICAgICAgICAgICAgZmluaXNoT3BlbigpXG4gICAgICAgICBlbHNlXG4gICAgICAgICAgICBAZGF0YSA9IEpTT04ucGFyc2UgZGF0YVxuICAgICAgICAgICAgZmluaXNoT3BlbigpXG5cblxuICAgY29uZmlybUNsb3NlOiAoY2xvc2VBZnRlciwgY2IpIC0+XG4gICAgICBjb25maXJtID0gZ3VpLldpbmRvdy5vcGVuICdjb25maXJtLmh0bWwnLCB7XG4gICAgICAgICBcInRpdGxlXCI6IFwiQ29uZmlybSBDbG9zZVwiLFxuICAgICAgICAgXCJ0b29sYmFyXCI6IGZhbHNlLFxuICAgICAgICAgXCJ3aWR0aFwiOiAzNTAsXG4gICAgICAgICBcImhlaWdodFwiOiAxNTAsXG4gICAgICAgICBcInBvc2l0aW9uXCI6IFwibW91c2VcIixcbiAgICAgICAgIFwicmVzaXphYmxlXCI6IGZhbHNlLFxuICAgICAgICAgXCJhbHdheXMtb24tdG9wXCI6IHRydWUsXG4gICAgICAgICBcInNob3dfaW5fdGFza2JhclwiOiBmYWxzZVxuICAgICAgfVxuICAgICAgY29uZmlybS5yZXNpemVUbygzNTAsMTUwKVxuICAgICAgY29uZmlybS5zZXRSZXNpemFibGUoZmFsc2UpXG4gICAgICBjb25maXJtLnNldEFsd2F5c09uVG9wKHRydWUpXG5cbiAgICAgIGdsb2JhbC5jb25maXJtU3RhdHVzID0gbnVsbFxuXG4gICAgICBzZWxmID0gdGhpc1xuICAgICAgY29uZmlybS5vbiAnY2xvc2UnLCAtPlxuICAgICAgICAgdGhpcy5jbG9zZSB0cnVlXG4gICAgICAgICBpZiBnbG9iYWwuY29uZmlybVN0YXR1cyBpcyAtMSAjIERvbid0IHNhdmVcbiAgICAgICAgICAgIGRvIGNiXG4gICAgICAgICBlbHNlIGlmIGdsb2JhbC5jb25maXJtU3RhdHVzIGlzIDAgb3IgZ2xvYmFsLmNvbmZpcm1TdGF0dXMgaXMgbnVsbCAjIENhbmNlbCAvIENsb3NlIFdpbmRvd1xuICAgICAgICAgZWxzZSBpZiBnbG9iYWwuY29uZmlybVN0YXR1cyBpcyAxICMgU2F2ZVxuICAgICAgICAgICAgc2VsZi5jbG9zZUZsYWcgPSBjbG9zZUFmdGVyXG4gICAgICAgICAgICAkKFwiLnNhdmUtcHJvamVjdFwiKS50cmlnZ2VyKCdjbGljaycpICMgTm9ybWFsbHkgZG9uJ3QgbWl4IGFuZCBtYXRjaCBidXQgaXQncyBldmVudC1iYXNlZFxuXG4gICBzZXRTcHJpdGU6IChkYXRhKSAtPlxuICAgICAgQHVuc2F2ZWQgPSB0cnVlXG4gICAgICBpZiBAZWRpdG9yU3ByaXRlXG4gICAgICAgICBkdXBsaWNhdGUgPSBfLmZpbmRXaGVyZSBAZGF0YS5zcHJpdGVzLCB7a2V5OiBAZWRpdG9yU3ByaXRlLmtleX1cbiAgICAgICAgIGlmIGR1cGxpY2F0ZVxuICAgICAgICAgICAgZHVwbGljYXRlLmRhdGEgPSBkYXRhXG4gICAgICAgICBlbHNlXG4gICAgICAgICAgICBAZWRpdG9yU3ByaXRlLmRhdGEgPSBkYXRhXG4gICAgICAgICAgICBAZGF0YS5zcHJpdGVzLnB1c2ggQGVkaXRvclNwcml0ZVxuXG4gICAgICAgICBpZiBkYXRhLmxlbmd0aCA+IDBcbiAgICAgICAgICAgIEB1aS5zZXRBY3RpdmUgQGVkaXRvclNwcml0ZVxuICAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHVpLnNldEluYWN0aXZlIEBlZGl0b3JTcHJpdGVcbiAgICAgIGVsc2VcbiAgICAgICAgIEB3aW5kb3cuYWxlcnQgJ1dlaXJkIHN0dWZmIGlzIGhhcHBlbmluZy4nXG5cbnBvbHlFZGl0ID0gbmV3IFBvbHlFZGl0XG5tb2R1bGUuZXhwb3J0cyA9IHBvbHlFZGl0XG4iXX0=