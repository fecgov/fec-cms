/* Raw HTML button for hallo.js
 * Adapted from https://gist.github.com/ejucovy/5c5370dc73b80b8896c8
 */

(function() {
    (function($) {
        return $.widget('IKS.editHtmlButton', {
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
                    label: 'Edit HTML',
                    icon: 'icon-code',
                    command: null
                });

                toolbar.append(button);

                button.on('click', function(event) {
                    $('body > .modal').remove();
                    var container = $(
                        '<div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">' +
                            '<div class="modal-dialog">' +
                                '<div class="modal-content">' +
                                    '<button type="button" class="close icon text-replace icon-cross" data-dismiss="modal" aria-hidden="true">&times;</button>' +
                                    '<div class="modal-body">' +
                                        '<header class="nice-padding hasform">' +
                                            '<div class="row">' +
                                                '<div class="left">' +
                                                    '<div class="col">' +
                                                        '<h1>Edit HTML Code</h1>' +
                                                    '</div>' +
                                                '</div>' +
                                            '</div>' +
                                        '</header>' +
                                        '<div class="modal-body-body"></div>' +
                                    '</div>' +
                                '</div><!-- /.modal-content -->' +
                            '</div><!-- /.modal-dialog -->' +
                        '</div>'
                    );

                    // add container to body and hide it, so content can be added to it before display
                    $('body').append(container);
                    container.modal('hide');
                    var modalBody = container.find('.modal-body-body');
                    modalBody.html(
                        '<textarea style="height: 400px; border: 1px solid black" id="wagtail-edit-html-content"></textarea>' +
                        '<button id="wagtail-edit-html-save" type="button">Save</button>'
                    );
                    var editor = ace.edit('wagtail-edit-html-content');
                    editor.setOptions({
                        maxLines: 30,
                        mode: 'ace/mode/html',
                        autoScrollEditorIntoView: true
                    });
                    editor.setValue(html_beautify(widget.options.editable.element.html()));
                    $("#wagtail-edit-html-save").on("click", function() {
                        widget.options.editable.setContents(editor.getValue());
                        widget.options.editable.setModified();
                        container.modal('hide');
                        editor.destroy();
                    });
                    container.modal('show');
                });
            }
        });
    })(jQuery);
}).call(this);
