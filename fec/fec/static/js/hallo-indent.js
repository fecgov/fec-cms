/* Indent button for hallo.js
 * Takes a list item and wraps it in another list and puts that list in the
 * previous list item. This is how you make nested lists!
 */

(function() {
  (function($) {
    return $.widget('IKS.indentButton', {
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
          label: 'Indent list',
          icon: 'icon-arrow-right',
          command: null
        });
        toolbar.append(button);

        button.on('click', function() {
            var node = widget.options.editable.getSelection();
            var text = node.endContainer;
            var parent = text.parentElement;
            if (parent.nodeName === 'LI') {
              // Find the previous LI
              var $sibling = $(parent).prev('li');
              if ($sibling.length) {
                // Create a new UL with this as the first item
                $sibling.append('<ul>' + parent.outerHTML + '</ul>');
                $(parent).remove();
                widget.options.editable.setModified();
              }
            }
        });
      }
    });
  })(jQuery);

}).call(this);
