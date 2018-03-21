wysihtml.commands.subscript = (function() {
  var nodeOptions = {
    nodeName: "SUB",
    toggle: true
  };

  return {
    exec: function(composer, command) {
      wysihtml.commands.formatInline.exec(composer, command, nodeOptions);
      // SW-1257, Cleaning up the editor.
      wysihtml.commands.formatInline.cleanEditor(composer);
    },

    state: function(composer, command) {
      return wysihtml.commands.formatInline.state(composer, command, nodeOptions);
    }
  };

})();
