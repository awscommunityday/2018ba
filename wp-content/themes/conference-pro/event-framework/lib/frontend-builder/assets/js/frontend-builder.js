var ef_fe;
jQuery(function ($) {
    Vue.config.debug = true;
    // $.fn.editable.defaults.mode = 'inline';
    var editor_html;
    var editor_text;
    var main_iframe = $('#ef_main_iframe');
    var textarea = $('#ef_main_content');
    var styles_textarea = $('#ef_custom_styles');
    var main_edit = $('#ef_fe_main_edit');
    var main_edit_content = $('#ef_fe_edit_content');
    var main_edit_styles = $('#ef_fe_edit_styles');
    var frame;
    var frame_option;
    var highlighter;
    window.current_components = {};
    var wh;
    $(window).resize(function () {
        set_iframe_height();
    });
    main_iframe.on('load',
        function () {
            // register_components();
            first_run();
            bind_editor();
        });

    set_iframe_height();

    var call_on_load = function () {
        $(window).unbind("ajaxSuccess", call_on_load);
        // console.log(efCb);
        // $.each(efCb.sections, function (i, v) {
        //     $('#ef_fe_available_sections > ul').append('<li><a href="#" class="add_section" data-id="' + i + '"><i class="' + v.iconCssClass + '"></i> ' + v.name + '</a></li>');
        // });
    };
    $(window).on('ajaxSuccess', call_on_load);

    $('.ef_fe_toggler').on('click', function (e) {
        e.preventDefault();
        var target = $(this).data('target');
        $(target).slideToggle();
    });

    $('#ef_fe_available_sections').on('click', '.add_section', function (e) {
        e.preventDefault();
        var id = $(this).data('id');
        var item_data = efCb.sections[id];
        // console.log(item_data.shortcode);
        append_shortcode_rendered(id, item_data.options);
        $('.toggler_target').slideUp();
    });
    $('.toggler_target').slideUp();

    function show_edit_panel(th) {
        main_edit.removeClass('show');
        var id = th.attr('id');
        var shortcode = th.data('shortcode');
        var type = shortcode.replace('efcb-section-', '');
        // main_edit.html('');
        main_edit_content.html('');
        main_edit_content.prev().show();
        main_edit_styles.html('');
        var shortcode_el = find_shortcode(shortcode,id, 0);
        if ( typeof(shortcode_el) !== 'undefined' ) {
            $.each( efCb.sections[type].options, function (i,v) {
                handle_input_type(v,id);
            });
            bind_inputs();
            if ( typeof(efCb.sections[type].styles) !== 'undefined' ) {
                handle_styles_edit(efCb.sections[type].styles['section'],current_components[id],'section');
            }
        }
        current_components[id].$compile(main_edit[0]);
        main_edit.addClass('show');
        // current_components[id].$el = main_edit;
    }

    function show_edit_part(component, option, el) {
        if ( el.hasClass('fe_editable_image') ) {
            show_media(component,option);
        }
        var th = el.closest('.ef-fe-element');
        var id = th.attr('id');
        var shortcode = th.data('shortcode');
        // main_edit.html('');
        main_edit_content.html('');
        main_edit_content.prev().show();
        main_edit_styles.html('');
        var type = shortcode.replace('efcb-section-', '');
        $.each( efCb.sections[type].options, function (i,v) {
            if ( v.ID == option ) {
                handle_input_type(v,id);
            }
        });
        bind_inputs();
        if ( typeof(efCb.sections[type].styles[option]) !== 'undefined' ) {
            handle_styles_edit(efCb.sections[type].styles[option], component, option);
        } else {
            main_edit_styles.html('No styles to edit');
        }
        component.$compile(main_edit[0]);
        if ( main_edit_content.is(':empty') ) {
            main_edit_content.prev().hide();
            main_edit_content.next().next().slideDown();
        }
        main_edit.addClass('show');
    }

    function bind_inputs() {
        jQuery('.ef_fe_datetime').each(function (i, el) {
            jQuery(el).datetimepicker({
                changeMonth: true,
                changeYear: true,
                altField: '#' + jQuery(this).next().attr('id'),
                altFieldTimeOnly: false,
                altFormat: 'yy-mm-dd',
                altTimeFormat: 'HH:mm'
            });
        });
    }

    function show_media(component,option) {
        frame_option = [component,option];
        if ( frame ) {
            frame.open();
            return;
        }
        frame = wp.media({
            title: 'Select or Upload Image',
            button: {
                text: 'Insert image'
            },
            multiple: false  // Set to true to allow multiple files to be selected
        });
        frame.on( 'select', function() {
            var attachment = frame.state().get('selection').first().toJSON();
            frame_option[0].$set(frame_option[1], attachment.url);
        });
        frame.open();
    }

    function handle_input_type(v,id) {
        if ( v.type == 'text' ) {
            main_edit_content.append('<div><label>'+v.name+'</label><input type="text" v-model="'+v.ID+'" /></div>');
        }
        if ( v.type == 'textarea' || v.type == 'wysiwyg' ) {
            main_edit_content.append('<div><label>'+v.name+'</label><textarea v-model="'+v.ID+'" ></textarea></div>');
        }
        if ( v.type == 'image' ) {
            main_edit_content.append('<div><label>'+v.name+'</label><button class="button ef_image_chooser" data-id="'+id+'" data-option="'+v.ID+'">Choose Image</button><input type="hidden" v-model="'+v.ID+'" /></div>');
        }
        if ( v.type == 'datetime' ) {
            main_edit_content.append('<div><label>'+v.name+'</label><input class="ef_fe_datetime" type="text" v-model="'+v.ID+'" /></div>');
        }
        if ( v.type == 'select' ) {
            var html = '<div><label>'+v.name+'</label></div>';
            html += '<select v-model="'+v.ID+'">';
            $.each(v.values, function(i,v) {
                html+= '<option value="'+i+'">'+v+'</option>';
            });
            html += '</select>';
            main_edit_content.append(html);
        }
    }

    function handle_styles_edit(styles,component, option) {
        // console.log(component);
        if ( typeof(component.styles[option]) == 'undefined' ) {
            if ( !define_styles(component,option) ) { return false; }
        }
        var html = '<div><label>'+styles.name+'</label>';
        $.each( styles.properties, function (ii,vv) {
            if ( vv.type == 'color' ) {
                html += '<div>';
                html += '<label>'+vv.name+'</label>';
                var val = component.styles[option][vv.property];
                html += '<input type="text" class="colorpicker" value="'+val+'" data-el="'+option+'" data-prop="'+vv.property+'" />';
                html += '</div>';
            }
            if ( vv.type == 'text' ) {
                html += '<div>';
                html += '<label>'+vv.name+'</label>';
                html += '<input type="text" v-model="styles.'+option+'.'+vv.property+'" />';
                html += '</div>';
            }
            if ( vv.type == 'select' ) {
                html += '<div><label>'+vv.name+'</label>';
                html += '<select v-model="styles.'+option+'.'+vv.property+'">';
                $.each(vv.options, function(iii,vvv) {
                    html+= '<option value="'+iii+'">'+vvv+'</option>';
                });
                html += '</select></div>';
            }
        });
        html += '</div>';
        main_edit_styles.append(html);

        $('.colorpicker').wpColorPicker({
            change: function(event, ui){
                var prop = $(event.target).data('prop');
                var el = $(event.target).data('el');
                var props = prop.split(",");
                if ( props.length > 1 ) {
                    $.each(props, function(i,v) {
                        component.$set('styles.'+el+'.'+v, ui.color.toString());
                    });
                } else {
                    component.$set('styles.'+el+'.'+prop, ui.color.toString());
                }
            },
            clear : function(event) {
                var prop = $(event.target).closest('.wp-picker-container').find('.wp-color-picker').data('prop');
                var el = $(event.target).closest('.wp-picker-container').find('.wp-color-picker').data('el');
                component.$set('styles.'+el+'.'+prop, '');
            }
        });
    }

    function define_styles(component,option) {
        var added = false;
        var shortcode_tag = main_iframe.contents().find('#'+component.$el.id).data('shortcode');
        $.each(efCb.sections, function (i, section) {
            if ( section['clientID'] == shortcode_tag ) {
                if ( typeof(section.styles[option]) !== 'undefined' ) {
                    var new_option = {};
                    $.each( section.styles[option].properties, function (i,property) {
                        new_option[property['property']] = '';
                    });
                    new_option.selector = '#'+component.$el.id+' '+section.styles[option].type;
                    component.$set('styles.'+option, new_option);
                    added = true;
                }
            }
        });
        return added;
    }

    main_edit.on('click', '.close', function(e) {
        e.preventDefault();
        main_edit.removeClass('show');
    });
    main_edit.on('click', '.toggleside', function(e) {
        e.preventDefault();
        main_edit.toggleClass('forceleft');
    });
    main_edit.on('click', '.ef_image_chooser', function(e) {
        e.preventDefault();
        var id = $(this).data('id');
        var component = window.current_components[id];
        var option = $(this).data('option');
        show_media(component,option);
    });

    function find_shortcode(tag,id, i) {
        var shortcode = wp.shortcode.next(tag, textarea.val(), i);
        if ( typeof(shortcode) !== 'undefined' ) {
            if ( shortcode.shortcode.attrs.named.id !== id ) {
                return find_shortcode(tag,id, shortcode.index+1)
            }
        }
        return shortcode;
    }

    function find_shortcode_without_id(tag,i) {
        return wp.shortcode.next(tag, textarea.val(), i);
    }

    function set_iframe_height() {
        wh = $(window).height();
        var iframe_height = wh - 64;
        main_iframe.height(iframe_height)
    }

    function append_shortcode_rendered(shortcode, options) {
        var attrs = {};
        $.each(efCb.sections[shortcode].options, function (i, v) {
            attrs[v.ID] = ' ';
        });
        var d = new Date();
        attrs['id'] = 'efcb-' + shortcode + '-' + d.getTime();
        var built_shortcode = new wp.shortcode({
            'tag': 'efcb-section-' + shortcode,
            'attrs': attrs,
            'type': 'single'
        });
        $.post(ajaxurl, {
            'shortcode': built_shortcode.string(),
            'action': 'ef_get_shortcode_rendered',
            'ef_iframe' : 1
        }, function (data) {
            if (data == '') {
                return;
            }
            main_iframe.contents().find('.site__content').append(data);
            attrs['styles'] = {};
            current_components[attrs['id']] = new Vue({
                data : attrs,
                el : main_iframe.contents().find('#'+attrs['id'])[0]
            });
            current_components[attrs['id']].$watch('$data', function() { update_textarea(); },{ deep: true });
            register_components();
            // console.log(current_components);
        });
    }

    function register_components() {
        var elements = main_iframe.contents().find('.ef-fe-element').not('registered');
        // current_components = [];
        // console.log(elements);
        elements.each(function (i) {
            add_component_toolbar($(this));
            $(this).addClass('registered');
        });
        update_textarea();
    }

    function update_textarea() {
        var content = '';
        // console.log(current_components);
        // return;
        $.each(current_components, function (i,v) {
            var shortcode_tag = main_iframe.contents().find('#'+v.$el.id).data('shortcode');
            var sh_content = '';
            var attrs = jQuery.extend({}, v._data);
            var orig_options;
            if ( typeof(efCb.sections) !== 'undefined') {
                $.each( efCb.sections, function (ii,vv) {
                    if ( vv.clientID == shortcode_tag ) {
                        orig_options = vv.options;
                    }
                });
            }
            $.each(orig_options, function (iii,vvv) {
                if ( vvv.nested ) {
                    var content_shortcode = new wp.shortcode( {
                        'tag' : vvv.ID,
                        'type' : 'closed',
                        'content' : attrs[vvv.ID]
                    });
                    sh_content += content_shortcode.string();
                    delete attrs[vvv.ID];
                }
                if ( attrs[vvv.ID] === ef_fe.default_text ) {
                    attrs[vvv.ID] = ' ';
                }
                if ( attrs[vvv.ID] === ef_fe.placeholder ) {
                    attrs[vvv.ID] = ' ';
                }
            });
            delete attrs.styles;
            var shortcode = new wp.shortcode( {
                'tag' : shortcode_tag,
                'attrs' : attrs,
                'type' : 'closed',
                'content' : sh_content
            });
            // console.log(shortcode);
            content += shortcode.string();
        });

        textarea.val(content);
        write_styles();
    }

    function first_run() {
        var elements = main_iframe.contents().find('.ef-fe-element');
        var saved_styles = JSON.parse(styles_textarea.val());
        var x = 0;
        var y = 0;
        var shortcodes_count = {};
        // clientID
        elements.each(function (i) {
            var th = $(this);
            var attrs = {};
            var shortcode_tag = th.data('shortcode');
            if ( typeof(shortcodes_count[shortcode_tag]) == 'undefined' ) {
                shortcodes_count[shortcode_tag] = 0;
            }
            var shortcode = '';
            var id = th.attr('id');
            shortcode = find_shortcode(shortcode_tag,id, 0);
            if ( id == ' ' || id == '' ||  typeof(shortcode) == 'undefined' ) {
                var d = new Date();
                var ri = getRandomInt(0,199);
                id = shortcode_tag + '-' + d.getTime() + ri;
                th.attr('id',id);
                shortcode = find_shortcode_without_id(shortcode_tag,shortcodes_count[shortcode_tag]);
                shortcode.shortcode.attrs.named['id'] = id;
                shortcodes_count[shortcode_tag] = shortcode.index+1;
            }
            if ( typeof(shortcode) == 'undefined' ) {
                return;
            }
            var type = shortcode_tag.replace('efcb-section-', '');
            var orig_options;
            if ( typeof(efCb.sections) !== 'undefined') {
                $.each( efCb.sections, function (i,v) {
                    if ( v.clientID == shortcode_tag ) {
                        orig_options = v.options;
                    }
                });
            }
            var styles = saved_styles[id];
            if ( typeof(shortcode) !== 'undefined' ) {
                attrs = shortcode.shortcode.attrs.named;
                if ( shortcode.content !== "" ) {
                    $.each( orig_options, function(i,v) {
                        if ( v.nested ) {
                            var content_shortcode = wp.shortcode.next(v.ID, shortcode.content);
                            if ( typeof(content_shortcode) !== 'undefined' ) {
                                attrs[v.ID] = content_shortcode.shortcode.content;
                            }
                        }
                        if ( v.type == 'image' ) {
                            if ( attrs[v.ID] == ' ' ) {
                                attrs[v.ID] = ef_fe.placeholder;
                            }
                        }
                        if ( v.type == 'text' ) {
                            if ( attrs[v.ID] == ' ' ) {
                                attrs[v.ID] = ef_fe.default_text;
                            }
                        }
                    });
                }
                attrs['styles'] = {};
                // console.log(attrs);
                if ( typeof(styles) !== 'undefined' ) {
                    attrs['styles'] = styles;
                } else {
                    $.each(efCb.sections[type].styles, function (i,v) {
                        attrs.styles[i] = {};
                        var cel = th.find(v.type);
                        $.each( v.properties, function (ii,vv) {
                            attrs.styles[i][vv.property] = cel.css(vv.property);
                        });
                        attrs.styles[i]['type'] = v.type;
                    });
                }

                current_components[attrs['id']] = new Vue({
                    data : attrs,
                    beforeCompile : function(e) {
                        var v_els = main_iframe.contents().find('#'+attrs['id']).find('[v-html]');
                        v_els.addClass('fe_editable');
                        v_els.addClass('fe_editable_html');
                        v_els.each( function(i) {
                            var opt = $(this).attr('v-html');
                            $(this).attr('data-option', opt);
                            $(this).attr('data-ef-index',x );
                            x++;
                        });
                        var v_text_els = main_iframe.contents().find('#'+attrs['id']).find('[v-text]');
                        v_text_els.addClass('fe_editable');
                        v_text_els.addClass('fe_editable_text');
                        v_text_els.each( function(i) {
                            var opt = $(this).attr('v-text');
                            $(this).attr('data-option', opt);
                            $(this).attr('data-ef-index',y );
                            y++;
                        });
                        var v_image_els = main_iframe.contents().find('#'+attrs['id']).find('img');
                        v_image_els.addClass('fe_editable');
                        v_image_els.addClass('fe_editable_image');
                        v_image_els.each( function(i) {
                            var opt = $(this).attr('v-text');
                            $(this).attr('data-option', opt);
                            $(this).attr('data-ef-index',y );
                            y++;
                        });
                    },
                    el : main_iframe.contents().find('#'+attrs['id'])[0],
                    methods : {
                        'doEdit' : function (option,e,sp) {
                            if ( typeof(sp) !== 'undefined' ) {
                                e.stopPropagation();
                            }
                            show_edit_highlighter($(e.currentTarget));
                            show_edit_part(this,option,$(e.currentTarget));
                        }
                    }
                });
                current_components[attrs['id']].$watch('$data', function() { update_textarea(); },{ deep: true });
            }
            add_component_toolbar(th);
            th.addClass('registered');
        });

        main_iframe.contents().on( 'click', '.ef-fe-edit-section', function (e) {
            e.preventDefault();
            var el = $(this).closest('.ef-fe-element');
            show_edit_panel(el);
        });

        main_iframe.contents().on( 'click', '.ef-fe-reset-section', function (e) {
            e.preventDefault();
            var c = confirm(ef_fe.reset_text);
            if ( c === true ) {
                var el = $(this).closest('.ef-fe-element');
                reset_component(el);
            }
        });

        main_iframe.contents().on( 'click', '.ef-fe-remove-section', function (e) {
            e.preventDefault();
            var el = $(this).closest('.ef-fe-element');
            remove_component(el);
        });

        main_iframe.contents().on( 'click', '.ef_fe_entity_link', function (e) {
            e.preventDefault();
            var win = window.open( $(this).attr('href'), '_blank');
        });

        main_iframe.contents().on( 'click', 'a', function (e) {
            e.preventDefault();
        });

        // console.log(current_components);
    }

    function add_component_toolbar(el) {
        var html = '<div class="ef-fe-controls">' +
            '<a href="#" class="ef-fe-edit-section">Edit Component</a>' +
            '<a href="#" class="ef-fe-reset-section">Reset Component</a>' +
            '</div>';
        el.append(html);
    }

    function remove_component(th) {
        var c = confirm('Remove component?');
        if ( c === true) {
            var id = th.attr('id');
            delete current_components[id];
            th.remove();
            update_textarea();
        }
    }

    function write_styles() {

        var custom_styles = {};

        $.each( current_components, function( i , v )  {
            var styles = v.$get('styles');
            custom_styles[i] = {};
            if ( styles ) {
                $.each(styles, function(ii,vv) {
                    var selector = '';
                    if ( typeof(vv.selector) == 'undefined' ) {
                        if ( ii == 'section' ) {
                            selector = '#'+i;
                        } else {
                            selector = '#'+i+ ' ' + vv.type;
                        }
                    } else {
                        selector = vv.selector;
                    }
                    var saved_styles = jQuery.extend({}, vv);
                    // delete saved_styles.type;
                    custom_styles[i][ii] = saved_styles;
                    custom_styles[i][ii]['selector'] = selector;
                });
            }
        });

        styles_textarea.val(JSON.stringify(custom_styles));
    }

    function bind_editor() {
        var iframe = main_iframe[0];
        var iWin = iframe.contentWindow;
        $('.fe_editable').off('click');
        editor_html = new MediumEditor('.fe_editable_html' , {
            contentWindow: iWin,
            ownerDocument: iWin.document,
            elementsContainer: document.body,
            toolbar : true,
            static: true
        });
        editor_html.subscribe('blur', function(e,el) {
            var content_el = $(el);
            var index = content_el.data('ef-index');
            var section = content_el.closest('.ef-fe-element');
            var id = section.attr('id');
            var option = content_el.data('option');
            current_components[id].$set(option, editor_html.getContent(index));
        });
        editor_text = new MediumEditor('.fe_editable_text' , {
            contentWindow: iWin,
            ownerDocument: iWin.document,
            elementsContainer: document.body,
            toolbar : false
        });
        editor_text.subscribe('editableBlur', function(e,el) {
            var content_el = $(el);
            var index = content_el.data('ef-index');
            var section = content_el.closest('.ef-fe-element');
            var id = section.attr('id');
            var option = content_el.data('option');
            current_components[id].$set(option, content_el.text());
        });
        $('#ef_tooltip').appendTo(main_iframe.contents().find('body'));
        var tooltip = main_iframe.contents().find('#ef_tooltip');
        $('#ef_highlighter').appendTo(main_iframe.contents().find('body'));
        highlighter = main_iframe.contents().find('#ef_highlighter');

        main_iframe.contents().find('.fe_editable').hover( function() {
            var o = $(this).offset();
            tooltip.css({
                left : o.left + 'px',
                top : o.top + 'px'
            }).show();
        }, function() {
            tooltip.hide();
        });
        main_iframe[0].contentWindow.jQuery('body').on('ef_fe_ajax', function() {
            $.each(current_components, function (i,v) {
                v.$compile(v.$el);
            });
            main_iframe.contents().find('.ef_fe_entity').not('.entity_link_added').each( function () {
                var th = $(this);
                var id = th.data('id');
                if ( typeof(id) !== 'undefined' ) {
                    th.addClass('entity_link_added');
                    var edit_link = ef_fe.edit_link + 'post.php?post='+id+'&action=edit';
                    th.prepend('<a href="'+edit_link+'" target="_blank" class="ef_fe_entity_link">Edit this</a>');
                }
            });
        });
    }

    $('.ef_fe_change_iframe').click( function(e) {
        e.preventDefault();
        var size = $(this).data('size');
        if ( size == 'mobile' ) {
            change_frame_size(375,776);
        }
        if ( size == 'tablet' ) {
            change_frame_size(768,1024);
        }
        if ( size == 'desktop' ) {
            main_iframe.width('100%');
            set_iframe_height();
        }
    });

    function change_frame_size(width, height) {
        main_iframe.width(width);
        main_iframe.height(height);
        // main_iframe.trigger('load');
    }

    function reset_component(th) {
        show_edit_panel(th);
        var id = th.attr('id');
        main_edit_content.find(':input').each( function () {
            if ( $(this).attr('type') == 'text'  || $(this).is('textarea') ) {
                $(this).val('Type your text');
            } else {
                $(this).val(' ');
            }
            $(this).trigger('change');
        });
        var current_styles = current_components[id].$get('styles');
        console.log(current_styles);
        $.each( current_styles, function (i,v) {
            $.each(v, function (ii,vv) {
                if ( ii !== 'selector' && ii !== 'type' ) {
                    current_components[id].$set('styles.'+i+'.'+ii, '');
                }
            });
        });
    }

    function show_edit_highlighter(el) {

        var offset = el.offset();
        var width = el.outerWidth();
        var height = el.outerHeight();

        highlighter.css({
            top : (offset.top-2)+'px',
            left : (offset.left-2)+'px',
            width: (width+4)+'px',
            height: (height+4)+'px'
        });

    }

});