(function() {
    (function($) {
      // Force hallotoolbar to be full width when possible
      $(document.body).on('halloactivated', function() {
        var $toolbar = $('.hallotoolbar');
        $toolbar.width('auto');
        // Remove re-undo buttons
        $toolbar.find('.halloreundo.ui-buttonset').remove();
      });
    })(jQuery);
}).call(this);
