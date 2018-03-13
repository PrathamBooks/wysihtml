wysihtml.commands.bold = (function() {
    var nodeOptions = {
        nodeName: "B",
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

wysihtml.commands.fontSize = (function() {
    var REG_EXP = /text-font-[0-9a-z\-]+/g;
  
    return {
        exec: function(composer, command, size) {
            wysihtml.commands.formatInline.exec(composer, command, {className: "text-font-" + size, classRegExp: REG_EXP, toggle: true});
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


/* Set font size by inline style */
wysihtml.commands.fontSizeStyle = (function() {
    return {
        exec: function(composer, command, size) {
            size = size.size || size;
            if (!(/^\s*$/).test(size)) {
                wysihtml.commands.formatInline.exec(composer, command, {styleProperty: "fontSize", styleValue: size, toggle: false});
            }
        },

        state: function(composer, command, size) {
            return wysihtml.commands.formatInline.state(composer, command, {styleProperty: "fontSize", styleValue: size || undefined});
        },

        remove: function(composer, command) {
            return wysihtml.commands.formatInline.remove(composer, command, {styleProperty: "fontSize"});
        },

        stateValue: function(composer, command) {
            var styleStr,
                st = this.state(composer, command);

            if (st && wysihtml.lang.object(st).isArray()) {
                st = st[0];
            }
            if (st) {
                styleStr = st.getAttribute("style");
                if (styleStr) {
                return wysihtml.quirks.styleParser.parseFontSize(styleStr);
                }
            }
            return false;
        }
    };
})();

wysihtml.commands.italic = (function() { 
    var nodeOptions = {
        nodeName: "I",
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
