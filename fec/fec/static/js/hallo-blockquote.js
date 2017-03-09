/* Blockquote button for hallo.js
 * Adapted from https://gist.github.com/SalahAdDin/347e4fab78a64eaadd5c
 */
 
(function() {
  (function($) {
    return $.widget("IKS.blockquotebutton", {
      options: {
        uuid: '',
        editable: null
      },
      populateToolbar: function(toolbar) {
        var button, widget;
 
        widget = this;
        button = $('<span></span>');
        button.hallobutton({
          uuid: this.options.uuid,
          editable: this.options.editable,
          label: 'Blockquote',
          icon: 'icon-blockquote',
          command: null
        });
        toolbar.append(button);
        return button.on("click", function(event) {
          var insertionPoint, lastSelection;
 
          lastSelection = widget.options.editable.getSelection();
          insertionPoint = $(lastSelection.endContainer).parentsUntil('.richtext').last();
                    var elem;
                    elem = "<blockquote>" + lastSelection + "</blockquote>";
 
                    var node = lastSelection.createContextualFragment(elem);
 
                    lastSelection.deleteContents();
                    lastSelection.insertNode(node);
 
                    return widget.options.editable.element.trigger('change');
        });
      }
    });
  })(jQuery);
 
}).call(this);