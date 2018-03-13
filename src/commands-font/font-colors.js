/* Sets text background color by inline styles */
wysihtml.commands.bgColorStyle = (function() {
  return {
    exec: function(composer, command, color) {
      var colorVals  = wysihtml.quirks.styleParser.parseColor("background-color:" + (color.color || color), "background-color"),
          colString;

      if (colorVals) {
        colString = (colorVals[3] === 1 ? "rgb(" + [colorVals[0], colorVals[1], colorVals[2]].join(', ') : "rgba(" + colorVals.join(', ')) + ')';
        wysihtml.commands.formatInline.exec(composer, command, {styleProperty: 'backgroundColor', styleValue: colString});
      }
    },

    state: function(composer, command, color) {
      var colorVals  = color ? wysihtml.quirks.styleParser.parseColor("background-color:" + (color.color || color), "background-color") : null,
          colString;

      if (colorVals) {
        colString = (colorVals[3] === 1 ? "rgb(" + [colorVals[0], colorVals[1], colorVals[2]].join(', ') : "rgba(" + colorVals.join(', ')) + ')';
      }

      return wysihtml.commands.formatInline.state(composer, command, {styleProperty: 'backgroundColor', styleValue: colString});
    },

    remove: function(composer, command) {
      return wysihtml.commands.formatInline.remove(composer, command, {styleProperty: 'backgroundColor'});
    },

    stateValue: function(composer, command, props) {
      var st = this.state(composer, command),
          colorStr,
          val = false;

      if (st && wysihtml.lang.object(st).isArray()) {
        st = st[0];
      }

      if (st) {
        colorStr = st.getAttribute('style');
        if (colorStr) {
          val = wysihtml.quirks.styleParser.parseColor(colorStr, "background-color");
          return wysihtml.quirks.styleParser.unparseColor(val, props);
        }
      }
      return false;
    }
  };
})();

wysihtml.commands.foreColor = (function() {
  var REG_EXP = /wysiwyg-color-[0-9a-z]+/g;

  return {
    exec: function(composer, command, color) {
      wysihtml.commands.formatInline.exec(composer, command, {className: "wysiwyg-color-" + color, classRegExp: REG_EXP, toggle: true});
    },

    state: function(composer, command, color) {
      return wysihtml.commands.formatInline.state(composer, command, {className: "wysiwyg-color-" + color});
    }
  };
})();

/* Sets text color by inline styles */
wysihtml.commands.foreColorStyle = (function() {
  return {
    exec: function(composer, command, color) {
      var colorVals, colString;

      if (!color) { return; }

      colorVals = wysihtml.quirks.styleParser.parseColor("color:" + (color.color || color), "color");

      if (colorVals) {
        colString = (colorVals[3] === 1 ? "rgb(" + [colorVals[0], colorVals[1], colorVals[2]].join(", ") : "rgba(" + colorVals.join(', ')) + ')';
        wysihtml.commands.formatInline.exec(composer, command, {styleProperty: "color", styleValue: colString});
      }
    },

    state: function(composer, command, color) {
      var colorVals  = color ? wysihtml.quirks.styleParser.parseColor("color:" + (color.color || color), "color") : null,
          colString;


      if (colorVals) {
        colString = (colorVals[3] === 1 ? "rgb(" + [colorVals[0], colorVals[1], colorVals[2]].join(", ") : "rgba(" + colorVals.join(', ')) + ')';
      }

      return wysihtml.commands.formatInline.state(composer, command, {styleProperty: "color", styleValue: colString});
    },

    remove: function(composer, command) {
      return wysihtml.commands.formatInline.remove(composer, command, {styleProperty: "color"});
    },

    stateValue: function(composer, command, props) {
      var st = this.state(composer, command),
          colorStr,
          val = false;

      if (st && wysihtml.lang.object(st).isArray()) {
        st = st[0];
      }

      if (st) {
        colorStr = st.getAttribute("style");
        if (colorStr) {
          val = wysihtml.quirks.styleParser.parseColor(colorStr, "color");
          return wysihtml.quirks.styleParser.unparseColor(val, props);
        }
      }
      return false;
    }
  };
})();