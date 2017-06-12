/* Outdent button for hallo.js
 * If a list is indented, this outdents it. This is how you destroy a nested list
 */

(function() {
  (function($) {
    return $.widget('IKS.outdentButton', {
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
          label: 'Outdent list',
          icon: 'icon-arrow-left',
          command: null
        });
        toolbar.append(button);

        button.on('click', function() {
            var node = widget.options.editable.getSelection();
            var $li = $(node.endContainer.parentElement);
            if ($li.parent('ul ul').length) {
              // Remove the wrapping UL and move the LI after the current LI
              $li.unwrap();
              $li.parent('li').after($li);
              widget.options.editable.setModified();
            }
        });
      }
    });
  })(jQuery);

}).call(this);
