/**
 * WYSIHTML Editor
 *
 * @param {Element} editableElement Reference to the textarea which should be turned into a rich text interface
 * @param {Object} [config] See defaults object below for explanation of each individual config option
 *
 * @events
 *    load
 *    beforeload (for internal use only)
 *    focus
 *    focus:composer
 *    focus:textarea
 *    blur
 *    blur:composer
 *    blur:textarea
 *    change
 *    change:composer
 *    change:textarea
 *    paste
 *    paste:composer
 *    paste:textarea
 *    newword:composer
 *    destroy:composer
 *    undo:composer
 *    redo:composer
 *    beforecommand:composer
 *    aftercommand:composer
 *    enable:composer
 *    disable:composer
 *    change_view
 */
(function(wysihtml) {
  var undef;

  wysihtml.Editor = wysihtml.lang.Dispatcher.extend({
    /** @scope wysihtml.Editor.prototype */
    defaults: {
      // Give the editor a name, the name will also be set as class name on the iframe and on the iframe's body
      name:                 undef,
      // Whether the editor should look like the textarea (by adopting styles)
      style:                true,
      // Whether urls, entered by the user should automatically become clickable-links
      autoLink:             true,
      // Tab key inserts tab into text as default behaviour. It can be disabled to regain keyboard navigation
      handleTabKey:         true,
      // Object which includes parser rules to apply when html gets cleaned
      // See parser_rules/*.js for examples
      parserRules:          { tags: { br: {}, span: {}, div: {}, p: {}, b: {}, i: {}, u: {} }, classes: {} },
      // Object which includes parser when the user inserts content via copy & paste. If null parserRules will be used instead
      pasteParserRulesets: null,
      // Parser method to use when the user inserts content
      parser:               wysihtml.dom.parse,
      // By default wysihtml will insert a <br> for line breaks, set this to false to use <p>
      useLineBreaks:        true,
      // Double enter (enter on blank line) exits block element in useLineBreaks mode.
      // It enables a way of escaping out of block elements and splitting block elements
      doubleLineBreakEscapesBlock: true,
      // Array (or single string) of stylesheet urls to be loaded in the editor's iframe
      stylesheets:          [],
      // Placeholder text to use, defaults to the placeholder attribute on the textarea element
      placeholderText:      undef,
      // Whether the rich text editor should be rendered on touch devices (wysihtml >= 0.3.0 comes with basic support for iOS 5)
      supportTouchDevices:  true,
      // Whether senseless <span> elements (empty or without attributes) should be removed/replaced with their content
      cleanUp:              true,
      // Whether to use div instead of secure iframe
      contentEditableMode: false,
      classNames: {
        // Class name which should be set on the contentEditable element in the created sandbox iframe, can be styled via the 'stylesheets' option
        composer: "wysihtml-editor",
        // Class name to add to the body when the wysihtml editor is supported
        body: "wysihtml-supported",
        // classname added to editable area element (iframe/div) on creation
        sandbox: "wysihtml-sandbox",
        // class on editable area with placeholder
        placeholder: "wysihtml-placeholder",
        // Classname of container that editor should not touch and pass through
        uneditableContainer: "wysihtml-uneditable-container"
      },
      // Browsers that support copied source handling will get a marking of the origin of the copied source (for determinig code cleanup rules on paste)
      // Also copied source is based directly on selection - 
      // (very useful for webkit based browsers where copy will otherwise contain a lot of code and styles based on whatever and not actually in selection).
      // If falsy value is passed source override is also disabled
      copyedFromMarking: '<meta name="copied-from" content="wysihtml">'
    },
    
    constructor: function(editableElement, config) {
      this.editableElement  = typeof(editableElement) === "string" ? document.getElementById(editableElement) : editableElement;
      this.config           = wysihtml.lang.object({}).merge(this.defaults).merge(config).get();
      this._isCompatible    = wysihtml.browser.supported();

      // merge classNames
      if (config && config.classNames) {
        wysihtml.lang.object(this.config.classNames).merge(config.classNames);
      }

      if (this.editableElement.nodeName.toLowerCase() != "textarea") {
          this.config.contentEditableMode = true;
          this.config.noTextarea = true;
      }
      if (!this.config.noTextarea) {
          this.textarea         = new wysihtml.views.Textarea(this, this.editableElement, this.config);
          this.currentView      = this.textarea;
      }

      // Sort out unsupported/unwanted browsers here
      if (!this._isCompatible || (!this.config.supportTouchDevices && wysihtml.browser.isTouchDevice())) {
        var that = this;
        setTimeout(function() { that.fire("beforeload").fire("load"); }, 0);
        return;
      }

      // Add class name to body, to indicate that the editor is supported
      wysihtml.dom.addClass(document.body, this.config.classNames.body);

      this.composer = new wysihtml.views.Composer(this, this.editableElement, this.config);
      this.currentView = this.composer;

      if (typeof(this.config.parser) === "function") {
        this._initParser();
      }

      this.on("beforeload", this.handleBeforeLoad);
    },

    handleBeforeLoad: function() {
        if (!this.config.noTextarea) {
          this.synchronizer = new wysihtml.views.Synchronizer(this, this.textarea, this.composer);
        } else {
          this.sourceView = new wysihtml.views.SourceView(this, this.composer);
        }
        this.runEditorExtenders();
    },
    
    runEditorExtenders: function() {
      wysihtml.editorExtenders.forEach(function(extender) {
        extender(this);
      }.bind(this));
    },

    isCompatible: function() {
      return this._isCompatible;
    },

    clear: function() {
      this.currentView.clear();
      return this;
    },

    getValue: function(parse, clearInternals) {
      return this.currentView.getValue(parse, clearInternals);
    },

    setValue: function(html, parse) {
      this.fire("unset_placeholder");

      if (!html) {
        return this.clear();
      }

      this.currentView.setValue(html, parse);
      return this;
    },

    cleanUp: function(rules) {
        this.currentView.cleanUp(rules);
    },

    focus: function(setToEnd) {
      this.currentView.focus(setToEnd);
      return this;
    },

    /**
     * Deactivate editor (make it readonly)
     */
    disable: function() {
      this.currentView.disable();
      return this;
    },

    /**
     * Activate editor
     */
    enable: function() {
      this.currentView.enable();
      return this;
    },

    isEmpty: function() {
      return this.currentView.isEmpty();
    },

    hasPlaceholderSet: function() {
      return this.currentView.hasPlaceholderSet();
    },

    destroy: function() {
      if (this.composer && this.composer.sandbox) {
        this.composer.sandbox.destroy();
      }
      this.fire("destroy:composer");
      this.off();
    },

    parse: function(htmlOrElement, clearInternals, customRules) {
      var parseContext = (this.config.contentEditableMode) ? document : ((this.composer) ? this.composer.sandbox.getDocument() : null);
      var returnValue = this.config.parser(htmlOrElement, {
        "rules": customRules || this.config.parserRules,
        "cleanUp": this.config.cleanUp,
        "context": parseContext,
        "uneditableClass": this.config.classNames.uneditableContainer,
        "clearInternals" : clearInternals
      });
      if (typeof(htmlOrElement) === "object") {
        wysihtml.quirks.redraw(htmlOrElement);
      }
      return returnValue;
    },

    /**
     * Prepare html parser logic
     *  - Observes for paste and drop
     */
    _initParser: function() {
      var oldHtml;

      if (wysihtml.browser.supportsModernPaste()) {
        this.on("paste:composer", function(event) {
          event.preventDefault();
          oldHtml = wysihtml.dom.getPastedHtml(event);
          if (oldHtml) {
            this._cleanAndPaste(oldHtml);
          }
        }.bind(this));

      } else {
        this.on("beforepaste:composer", function(event) {
          event.preventDefault();
          var scrollPos = this.composer.getScrollPos();

          wysihtml.dom.getPastedHtmlWithDiv(this.composer, function(pastedHTML) {
            if (pastedHTML) {
              this._cleanAndPaste(pastedHTML);
            }
            this.composer.setScrollPos(scrollPos);
          }.bind(this));

        }.bind(this));
      }
    },

    _cleanAndPaste: function (oldHtml) {
      var cleanHtml = wysihtml.quirks.cleanPastedHTML(oldHtml, {
        "referenceNode": this.composer.element,
        "rules": this.config.pasteParserRulesets || [{"set": this.config.parserRules}],
        "uneditableClass": this.config.classNames.uneditableContainer
      });
      
      // Date :09.02.2017  Author : Manoj
      // Getting the initial nodes and position of the marker
      var beginSel = window.getSelection();
      var bAncNode = beginSel.anchorNode;
      var bOffSet = beginSel.anchorOffset;

      this.composer.selection.deleteContents();
      this.composer.selection.insertHTML(cleanHtml);

      // Adding a dummy last node to identify the end of copy/paste

      // Node which is before the caret.
      var caretPreviousNode = this.composer.selection.getBeforeSelection(true).node;

      var dummyPNode = this.composer.doc.createElement('span');
      dummyPNode.setAttribute("id", "dummyNode");

      if (caretPreviousNode.nextSibling !== null){
        caretPreviousNode.nextSibling.parentNode.insertBefore(dummyPNode, caretPreviousNode.nextSibling);
      } else {
        caretPreviousNode.parentNode.appendChild(dummyPNode);
      }

      this.composer.selection.setAfter(caretPreviousNode);


      // Default case
      try {
        // Limit node where we have to close the tags
        beginLimParent = bAncNode
        if (beginLimParent.nodeName == 'P') {
          //No need to do additional processing
          parentPNode = beginLimParent;
        }
        else {
          if (beginLimParent.nodeType ===3 && beginLimParent.parentNode.nodeName == 'P') {
            // No need to do additional processing
            parentPNode = beginLimParent.parentNode;  
          } else {
            while(beginLimParent.parentNode.nodeName != 'P'){
              beginLimParent = beginLimParent.parentNode;
            }

            parentPNode = beginLimParent.parentNode;

            // Node which contains the copy/pasted content
            if (bAncNode.parentNode.nodeName !== 'P') {
              cutoffNode = bAncNode.parentNode
            } else {
              cutoffNode = bAncNode;
            }

            //getting the last copy node: created a dummy node to 
            //keep track of the last node we are copying
            var dummyNode = document.getElementById('dummyNode');
            lastCopyNode = dummyNode.previousSibling;

            // Closing the tags before pasted content
            parent = beginLimParent.parentNode
            var parentOffset = getNodeIndex(parent,beginLimParent)
            var doc = bAncNode.ownerDocument
            var leftRange = doc.createRange()
            leftRange.setStart(parent,parentOffset)
            leftRange.setEnd(bAncNode,bOffSet)
            var left = leftRange.extractContents()
            parent.insertBefore(left,beginLimParent)
            var innerEl;
            // If there are no element parent nodes until P node, skip this  
            if(beginLimParent.nodeType != 3){               
              while (cutoffNode.firstChild != null) {
                child = cutoffNode.firstChild;
                parent.insertBefore(child, beginLimParent)
                if (child == lastCopyNode) {
                  break;
                }
              }
            }
          }
        }        

        pElements = parentPNode.getElementsByTagName("p")
        numP = pElements.length

        // handling P tags, removing p tags inside of p

        if (numP == 0) {
          // If there are no p's the tree is already correct as all the tags
          // can be nested
          cleanUpBrTags(parentPNode)
        } else if(numP == 1) {

          pNode = pElements[0]
          // Move the children to outside of 'p' and delete the 'p' Node
          var innerEl;
          while(innerEl=pNode.firstChild){
            parentPNode.insertBefore(innerEl,pNode)
          }
          parentPNode.removeChild(pNode)

          cleanUpBrTags(parentPNode)

        } else {
          firstPNode = pElements[0]
          lastPNode = pElements[pElements.length - 1]

          // Splitting the node at beginning of copy-paste
          divParent = parentPNode.parentNode
          var divParentOffSet = getNodeIndex(divParent, parentPNode)
          var bdoc = parentPNode.ownerDocument
          var lRange = bdoc.createRange()
          lRange.setStart(divParent, divParentOffSet)
          lRange.setEndAfter(firstPNode)
          var lCon = lRange.extractContents()
          divParent.insertBefore(lCon,parentPNode)

          // First P node of the line
          fPrevNode = parentPNode.previousSibling
          // Moving the middle copy/pasted content outside of parent 'p' tag
          var innerEl = parentPNode.firstChild;
          while(innerEl != lastPNode){
            divParent.insertBefore(innerEl,parentPNode)
            innerEl = parentPNode.firstChild
          }
          // Merging the first 'p' of copy/paste with the first 'p' of the line
          firstPToRemove = fPrevNode.getElementsByTagName('P')
          var innerEl;
          while(innerEl=firstPToRemove[0].firstChild){
            fPrevNode.insertBefore(innerEl,firstPToRemove[0])
          }
          fPrevNode.removeChild(firstPToRemove[0])
          
          // Merging the last 'p' of copy/paste with the last 'p' of the line 
          lastPToRemove = parentPNode.getElementsByTagName('P')
          var innerEl;
          while(innerEl=lastPToRemove[0].firstChild){
            parentPNode.insertBefore(innerEl,lastPToRemove[0])
          }
          parentPNode.removeChild(lastPToRemove[0]) 
          // Cleanup the br tags from fPrevNode to parentPnode (since this is the end P node)

          var currNode = fPrevNode;
          var nextNode;
          while((currNode !== null) && (currNode.previousSibling != parentPNode) ){
            nextNode = currNode.nextSibling;
            cleanUpBrTags(currNode);
            currNode = nextNode;
          }
        }

        // Removing br and replacing them with the the 'p' tags to maintain styling
        function cleanUpBrTags(parentNode){
          if(parentNode.nodeType === 3){
            return;
          }
          var isPNode = (parentNode.nodeName === 'P')
          if(isPNode){
            //Split P node
            brTags = parentNode.getElementsByTagName('BR')
            while(brTags[0]){
              // split the p node into two and delete the br tag
              splitPNodesOnBr(parentNode, brTags[0])
              brTags[0].parentNode.removeChild(brTags[0])              
            }
          }else{
            // find previous p and put the contents from that to here in a new p tag
            prevPNode = parentNode.previousSibling
            while(prevPNode.nodeName != 'P'){
              prevPNode = prevPNode.previousSibling
            }

            if (parentNode.nodeName === 'BR') {
              brTag = parentNode
            } else {
              brTags = parentNode.getElementsByTagName('BR')
              brTag = brTags[0]
            }

            while(brTag){
              parent = prevPNode.parentNode
              var doc = prevPNode.ownerDocument;
              var leftRange = doc.createRange();
              leftRange.setStartAfter(prevPNode);
              leftRange.setEndBefore(brTag);
              var newPNode = doc.createElement("p");
              leftRange.surroundContents(newPNode);
              brTag.parentNode.removeChild(brTag)
            }
          }
        }

        function splitPNodesOnBr(node,brNode){
          parent = node.parentNode;
          var parentOffset = getNodeIndex(parent,node);
          var doc = brNode.ownerDocument;
          var leftRange = doc.createRange();
          leftRange.setStart(parent,parentOffset);
          leftRange.setEndBefore(brNode);
          var left = leftRange.extractContents();
          parent.insertBefore(left,node);
        }


        function getNodeIndex(parent, node) {
          var index = parent.childNodes.length;
          while (index--) {
            if (node === parent.childNodes[index]) {
              break;
            }
          }
          return index;
        }
      }catch(e){
        
      }

      // Adding span's to all p's for normal text.

      if(this.composer.element.id === "txtEditor"){

        // Adding p's to any non p element.
        divElem = this.composer.element;
        childNodes = divElem.childNodes;
        var k;
        for(k=0; k < childNodes.length; k++){
          if(childNodes[k].nodeName !== 'P'){
            if(childNodes[k].nodeName === "BR"){
              childNodes[k].parentNode.removeChild(childNodes[k]);
              k--;
              continue;
            }
            newPNode = this.composer.doc.createElement("P");
            innerNode = childNodes[k];
            newPNode.appendChild(innerNode);
            if(childNodes[k]){
              divElem.insertBefore(newPNode, childNodes[k]);
            }else{
              divElem.appendChild(newPNode);
            }
          }
        }


        // Removing empty p tags and adding span class to tags where style is not applied
        var getPElements = this.composer.element.getElementsByTagName("P")
        var i;
        for(i=0; i < getPElements.length; i++){
          var pNode = getPElements[i];

          if (pNode.childNodes.length == 0){
            pNode.parentNode.removeChild(pNode);
            i--;
            continue;
          }

          if (hasTextNodes(pNode)){
            spNode = this.composer.doc.createElement("span");
            spNode.className = "text-font-normal";
            spNode.innerHTML = pNode.innerHTML;
            pNode.innerHTML = "";
            pNode.appendChild(spNode);
          }
        }
      }

      function hasTextNodes(pNode){
        cNodes = pNode.childNodes;
        var l;
        for (l=0; l < cNodes.length; l++){
          if(cNodes[l].nodeName !== "SPAN"){
            return true;
          }
        }
        return false;
      }

      var after = false; // TO set the cursor after/before of the node
      var cursorNode;

      // Calculating the caret position based on this dummyNode.
      dNode = document.getElementById('dummyNode');
      if(dNode.nextSibling){
        cursorNode = dNode.nextSibling;
      }else{
        cursorNode = dNode.parentNode;
        after = true;
      }

      dNode.parentNode.removeChild(dNode);

      if(after){
        if(!cursorNode.nextSibling){
          //create a new span node
          newSpNode = this.composer.doc.createElement("span");
          this.composer.element.appendChild(newSpNode);
        }
        this.composer.selection.setAfter(cursorNode)
      }else {
        this.composer.selection.setBefore(cursorNode)
      }
      
      wysihtml.commands.formatInline.cleanEditor(this.composer);

      //End of modification
    }
  });
})(wysihtml);


// Added : Manoj
function capitalise(string){
  if(string.length>0){
    return string.charAt(0).toUpperCase() + string.slice(1);
  }else{
    return string
  }
}