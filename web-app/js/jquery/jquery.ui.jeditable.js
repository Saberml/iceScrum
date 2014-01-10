/*
 * Copyright (c) 2010 iceScrum Technologies.
 *
 * This file is part of iceScrum.
 *
 * iceScrum is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License.
 *
 * iceScrum is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with iceScrum.  If not, see <http://www.gnu.org/licenses/>.
 *
 * Authors:
 *
 * Vincent Barrier (vbarrier@kagilum.com)
 * Stéphane Maldini (stephane.maldini@icescrum.com)
 * Manuarii Stein (manuarii.stein@icescrum.com)
 * Damien Vitrac (damien@oocube.com)
 * Nicolas Noullet (nnoullet@kagilum.com)
 *
 */
(function($){
    $.editable.addInputType('datepicker', {
        element: function(settings, original) {

            var input = jQuery('<input size=8 />');

            // Catch the blur event on month change
            settings.onblur = function(e) {
            };

            input.datepicker({
                        dateFormat: 'yy-mm-dd',
                        onSelect: function(dateText, inst) {
                            jQuery(this).parents("form").submit();
                        },
                        onClose: function(dateText, inst) {
                            jQuery(this).parents("form").submit();
                        }

                    });

            input.datepicker('option', 'showAnim', 'slide');

            jQuery(this).append(input);
            return (input);
        }
    });


    $.editable.addInputType('richarea', {
        element : $.editable.types.textarea.element,
        plugin  : function(settings, original) {
            settings.markitup.resizeHandle = false;
            $('textarea', this).markItUp(settings.markitup);
            settings.placeholder = '';
            $('textarea', this).css('height', '100px');
        }
    });


    $.editable.addInputType('selectui', {
        element : function(settings, original) {
            settings.onblur = 'ignore';
            var select = $('<select id="' + new Date().getTime() + '"/>');
            $(this).append(select);
            return(select);
        },
        content : function(data, settings, original) {
            /* If it is string assume it is json. */
            if (String == data.constructor) {
                eval('var json = ' + data);
            } else {
                /* Otherwise assume it is a hash already. */
                var json = data;
            }
            for (var key in json) {
                if (!json.hasOwnProperty(key)) {
                    continue;
                }
                if ('selected' == key) {
                    continue;
                }
                var option = $('<option />').attr('value', key).append($('<div/>').text(json[key]).html());
                $('select', this).append(option);
            }
            if ($(original).data('placeholder')) {
                $('select', this).prepend('<option></option>');
            }
            /* Loop option again to set selected. IE needed this... */
            $('select', this).children().each(function() {
                if ($(this).val() == json['selected'] ||
                        $(this).text() == $.trim(original.revert)) {
                    $(this).attr('selected', 'selected');
                }
            }
            );
        },
        plugin: function(settings, original) {
            var select = $('select', this);
            var defaultOptions = {
                minimumResultsForSearch: -1,
                width: 'element'
            };
            select.one("change select2-close select2-blur", function(){
                select.off();
                select.parents("form").submit();
            }).select2($.extend(defaultOptions, $(original).data()));
            $.doTimeout(25, function() {
                select.select2("open");
            });
        }
    });

    $.editable.addInputType('inputselect', {
        element : function(settings) {
            settings.onblur = 'ignore';
            var multiselect = $('<input type="hidden""/>');
            $(this).append(multiselect);
            return(multiselect);
        },
        plugin: function(settings, original) {
            var select = $('input', this);
            var editable = $(original);
            var defaultOptions = {
                minimumResultsForSearch: 6,
                initSelection : function (element, callback) {
                    callback({id: editable.data('select-id'), text: element.val()});
                }
            };
            if (editable.data('url')) {
                defaultOptions.ajax = {
                    url: editable.data('url'),
                    data: function() {},
                    cache: 'true',
                    data: function(term) {
                        return { term: term };
                    },
                    results: function(data) {
                        return { results: data };
                    }
                };
            }
            select.one("change select2-close select2-blur", function(){
                select.off();
                select.parents("form").submit();
            }).select2($.extend(defaultOptions, editable.data()));
            $.doTimeout(25, function() {
                select.select2("open");
            });
        }
    });
})($);
