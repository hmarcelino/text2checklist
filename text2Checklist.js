(function($) {

    var pluginName = 'text2Checklist';

    var defaults = {
        keepSync: true,

        canEdit: true,
        canCheck: true,
        onChange: undefined,

        buttons: {
            edit: "Edit",

            save: "Ok",
            cancel: "Cancel"
        }
    };

    var _getUniqueId = function() {
        return "txt2chkl-" + Math.floor((Math.random() * 1000000));
    };

    var _buildHtml = function(thisInstance, line, idx) {
        var html,
            label,
            uniqueId;

        var applyBoldIfRequired = function(text){
            // Don't capture the first '*' from a
            // bold text inside a bullet point
            //
            // Ex: * **Bullet point 1**
            //   should return * <strong>Bullet point 1</strong>
            //
            return text.replace(/\*\*([^\s].+)\*\*/, "<strong>$1</strong>");
        };

        line = applyBoldIfRequired(line);

        // build checkboxes
        if (line.indexOf("-") === 0 || line.indexOf("+") === 0) {
            uniqueId = _getUniqueId();
            label = line.replace(/^[-+](\s*)/, "");
            html = [
                "<div class='entry'>",
                "   <label for='" + uniqueId + "'>",
                "       <input id='" + uniqueId + "' type='checkbox' data-idx='" + idx + "' "
                + (line.indexOf("+") === 0 ? "checked='checked'" : "")
                + (!thisInstance.options["canCheck"] ? "disabled='disabled'" : "")
                + "' >",
                "     " + label + "",
                "   </label>",
                "</div>"
            ].join("");

            // build bullet points
        } else if (line.indexOf("*") === 0){
            html = [
                "<div class='entry'>",
                "   <ul>",
                "      <li> " + line.replace(/^[\*](\s*)/, "") + "</li>",
                "   </ul>",
                "</div>"
            ].join("");

        } else {
            html = "<div class='description' data-idx='" + idx + "'>" + line + "</div>";
        }

        return html;
    };

    var _parseTextAndSetHtml = function(thisInstance) {
        var $input = $(thisInstance.element),
            textLines,
            checklistHtml;

        if ($input.val().length === 0) {
            thisInstance.$checklist.addClass("hidden");
            return "";

        }else {
            textLines = $input.val().trim()
                .replace(/\n|\r\n|\r/g, "<br>")
                .replace(/<br>\s+/g, "<br>")
                .split("<br>");

            thisInstance.textLines = textLines;

            checklistHtml = textLines.map(function(line, idx) {
                return _buildHtml(thisInstance, line, idx);
            }).join("");

            thisInstance.$checklist.html(checklistHtml);
            thisInstance.$checklist.removeClass("hidden");
        }
    };

    var _editInPlace = function(thisInstance) {
        var initialHeight = parseInt(thisInstance.$container.css("height").replace(/px/, "")),
            $input = $(thisInstance.element);

        if (initialHeight < 50) {
            initialHeight = 50;
        }

        thisInstance.$inputWrapper.attr("data-prev-value", $input.val());
        $input.val(thisInstance.value());

        $input.addClass("editor")
            .css("height", (initialHeight + 10) + "px")
            .css("min-height", (initialHeight + 10) + "px");

        thisInstance.$inputWrapper.removeClass("hidden");

        thisInstance.$checklist.addClass("hidden");
        thisInstance.$editLink.addClass("hidden");
        thisInstance.$saveLink.removeClass("hidden");

        if (thisInstance.$cancelLink.length === 1) {
            thisInstance.$cancelLink.removeClass("hidden");
        }

        $input.focus();
    };

    var _persistEditorChanges = function(thisInstance, onDone) {
        thisInstance.$inputWrapper.removeAttr("data-prev-value");
        thisInstance.$inputWrapper.addClass("hidden");
        thisInstance.$checklist.html("");

        thisInstance.$checklist.removeClass("hidden");
        thisInstance.$editLink.removeClass("hidden");
        thisInstance.$saveLink.addClass("hidden");

        if (thisInstance.$cancelLink) {
            thisInstance.$cancelLink.addClass("hidden");
        }

        onDone();
    };

    var _cancelEditorChanges = function(thisInstance) {
        thisInstance.$inputWrapper.removeAttr("data-prev-value");
        thisInstance.$inputWrapper.addClass("hidden");

        thisInstance.$checklist.removeClass("hidden");
        thisInstance.$editLink.removeClass("hidden");
        thisInstance.$saveLink.addClass("hidden");

        if (thisInstance.$cancelLink) {
            thisInstance.$cancelLink.addClass("hidden");
        }
    };

    var _updateTextLines = function(thisInstance, idx, isChecked) {
        thisInstance.textLines[idx] = thisInstance.textLines[idx]
            .replace(/^[-+]/, isChecked ? "+" : "-");

        if (thisInstance.options.keepSync) {
            $(thisInstance.element).text(thisInstance.value());
        }
    };

    var _notifyChange = function(thisInstance) {
        if (thisInstance.options.onChange) {
            thisInstance.options.onChange();
        }
    };

    // The actual plugin constructor
    function Plugin(el, opts) {
        var dataProps = $(el).data();

        this.element = el;

        this.options = $.extend({}, defaults, opts);

        if (dataProps['checkable'] !== undefined) {
            this.options['canCheck'] = (dataProps['checkable'] + "") === "true";
        }

        if (dataProps['editable'] !== undefined) {
            this.options['canEdit'] = (dataProps['editable'] + "") === "true";
        }

        this._defaults = defaults;
        this._name = pluginName;

        this.textLines = [];

        this.$inputWrapper = undefined;
        this.$checklist = undefined;
        this.$editLink = undefined;
        this.$saveLink = undefined;
        this.$cancelLink = undefined;

        this.init();
    }

    Plugin.prototype = {
        // Plugin initialization
        init: function() {
            var _this = this,
                $el = $(_this.element),
                checklists;

            if (!$el.is("textarea")) {
                throw "This is only applicable to textarea";
            }

            _this.$container = $([
                "<div class='js-txt2chkl txt2chkl'>",
                "    <div class='js-input-wrapper input-wrapper hidden'></div>",
                "    <div class='js-checklist checklist'></div>",
                "    <div class='actions'>",
                "        <span class='js-edit link'>" + this.options.buttons["edit"] + "</span>",
                "        <span class='js-save link hidden'>" + this.options.buttons["save"] + "</span>",
                "        <span class='js-cancel link hidden'>" + this.options.buttons["cancel"] + "</span>",
                "    </div>",
                "</div>"
            ].join(""));

            _this.$inputWrapper = _this.$container.find('.js-input-wrapper');
            _this.$checklist = _this.$container.find('.js-checklist');
            _this.$editLink = _this.$container.find('.js-edit');
            _this.$saveLink = _this.$container.find('.js-save');
            _this.$cancelLink = _this.$container.find('.js-cancel');

            _parseTextAndSetHtml(_this);

            // Replace the current html element
            // with the new html
            _this.$container.insertAfter($el);
            $el.appendTo(_this.$inputWrapper);

            if (_this.options['canEdit']) {
                _this.$editLink.on('click', function() {
                    _editInPlace(_this)
                });

                _this.$saveLink.on('click', function() {
                    _persistEditorChanges(_this, function() {
                        _parseTextAndSetHtml(_this);
                        _notifyChange(_this);
                    })
                });

                _this.$cancelLink.on('click', function() {
                    _cancelEditorChanges(_this);
                });


            } else {
                _this.$container.find(".js-edit").remove();
            }

            if (_this.options['canCheck']) {
                _this.$checklist.on("change", "*[type='checkbox']", function() {
                    var $checkbox = $(this),
                        idx = $checkbox.data("idx"),
                        isChecked = $checkbox.is(":checked");

                    _updateTextLines(_this, $checkbox.data("idx"), isChecked);
                    _notifyChange(_this);
                });
            }

        },

        value: function() {
            var _this = this;

            return _this.textLines.join("\n");
        },

        // unbind the events and
        // return to the normal state
        destroy: function() {
            var _this = this;

            _this.$editLink.off('click');
            _this.$saveLink.off('click');
            _this.$cancelLink.off('click');
            _this.$checklist.off("change", "*[type='checkbox']");
        }

    };

    $.fn[pluginName] = function(options) {
        if (typeof arguments[0] === 'string') {

            var methodName = arguments[0],
                args = Array.prototype.slice.call(arguments, 1),
                returnVal;

            this.each(function() {
                var pluginInstance = $.data(this, 'plugin_' + pluginName);

                if (pluginInstance && typeof pluginInstance[methodName] === 'function') {
                    returnVal = pluginInstance[methodName].apply(pluginInstance, args);
                } else {
                    throw new Error('Method ' + methodName + ' does not exist on jQuery.' + pluginName);
                }
            });

            if (returnVal !== undefined) {
                return returnVal;

            } else {
                return this;
            }

        } else if (typeof options === "object" || !options) {
            return this.each(function() {
                if (!$.data(this, 'plugin_' + pluginName)) {
                    $.data(this, 'plugin_' + pluginName, new Plugin(this, options));
                }
            });
        }

        return this.each(function() {
            if (!$.data(this, 'plugin_' + pluginName)) {
                $.data(this, 'plugin_' + pluginName, new Plugin(this, options));
            }
        });
    }

}(jQuery, window));
