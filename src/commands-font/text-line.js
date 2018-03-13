wysihtml.commands.subscript = (function() {
    var nodeOptions = {
        nodeName: "SUB",
        toggle: true
    };

    return {
        exec: function(composer, command) {
            wysihtml.commands.formatInline.exec(composer, command, nodeOptions);
        },

        state: function(composer, command) {
            return wysihtml.commands.formatInline.state(composer, command, nodeOptions);
        }
    };

})();

wysihtml.commands.superscript = (function() {
    var nodeOptions = {
        nodeName: "SUP",
        toggle: true
    };

    return {
        exec: function(composer, command) {
            wysihtml.commands.formatInline.exec(composer, command, nodeOptions);
        },

        state: function(composer, command) {
            return wysihtml.commands.formatInline.state(composer, command, nodeOptions);
        }
    };

})();

wysihtml.commands.underline = (function() {
    var nodeOptions = {
        nodeName: "U",
        toggle: true
    };

    return {
        exec: function(composer, command) {
            wysihtml.commands.formatInline.exec(composer, command, nodeOptions);
        },

        state: function(composer, command) {
            return wysihtml.commands.formatInline.state(composer, command, nodeOptions);
        }
    };

})();