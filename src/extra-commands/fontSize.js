wysihtml.commands.fontSize = (function() {
  var REG_EXP = /text-font-[0-9a-z\-]+/g;

  return {
      exec: function(composer, command, size) {
          wysihtml.commands.formatInline.exec(composer, command, {className: "text-font-" + size, classRegExp: REG_EXP, toggle: true});
          // SW-1257, Cleaning up the editor.
          wysihtml.commands.formatInline.cleanEditor(composer);
      },

      state: function(composer, command, size) {
          var data = wysihtml.commands.formatInline.state(composer, command, {className: "text-font-" + size});
          if(data){
              $('.current-font').text(capitalise(data[0].className.replace("text-font-","")));
          }
          return data;
      }
  };
})();