(function() {
    (function($) {
      // Append custom editor css
      $('head').append('<link rel="stylesheet" href="/static/css/customize-editor.css" type="text/css">');
      // Force hallotoolbar to be full width when possible
      $(document.body).on('halloactivated', function() {
        var $toolbar = $('.hallotoolbar');
        $toolbar.width('auto');
        // Remove re-undo buttons
        $toolbar.find('.halloreundo.ui-buttonset').remove();
      });
    })(jQuery);
}).call(this);
