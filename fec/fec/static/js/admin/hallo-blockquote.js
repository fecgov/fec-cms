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
          icon: 'icon-openquote',
          command: null
        });
        toolbar.append(button);

        button.on('click', function() {
            var node = widget.options.editable.getSelection();
            var parent = $(node.endContainer).parentsUntil('.richtext').last();
            $(parent).wrap('<blockquote></blockquote>');
            widget.options.editable.setModified();
        });
      }
    });
  })(jQuery);
 
}).call(this);