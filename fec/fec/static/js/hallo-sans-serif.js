(function() {
  (function($) {
    return $.widget('IKS.sansSerifButton', {
      options: {
        uuid: '',
        editable: null
      },
      populateToolbar: function(toolbar) {
        var button,
            widget = this;

        var checkClass = function() {
            var node = widget.options.editable.getSelection().commonAncestorContainer;
            var parent = $(node).parents('span').get(0);
            if (parent) {
                return parent.classList.contains('t-sans');
            } else {
                return false;
            }
        };

        button = $('<span></span>');
        button.hallobutton({
          uuid: this.options.uuid,
          editable: this.options.editable,
          label: 'Sans-serif link',
          icon: 'icon-edit',
          command: null,
          queryState: function(e) {
            // Show the active state if it has the t-sans class already
            return button.hallobutton('checked', checkClass());
          }
        });

        toolbar.append(button);

        button.on('click', function() {
            // Get the selected node, find it's parent element and wrap it in a t-sans span
            var node = widget.options.editable.getSelection().commonAncestorContainer;
            var parent = $(node).parents('a').get(0);
            $(parent).wrap('<span class="t-sans"></span>');
            widget.options.editable.setModified();
        });
      }
    });
  })(jQuery);
}).call(this);
