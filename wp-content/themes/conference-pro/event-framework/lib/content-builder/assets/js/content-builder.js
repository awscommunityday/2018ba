var efCb = {data: [], relationship: [], sections: []};
var builderWrapper = jQuery('#ef-cb-builder');
var sectionsWrapper = jQuery('#ef-cb-sections');
var templatesWrapper = jQuery('#ef-cb-templates');
var sectionsFormWrapper = jQuery('#ef-cb-sections-form');
var contentWrapper = jQuery('#ef-cb-content');
var contentField = jQuery('#content');
var sectionFormDialog;
var templatesSelectorButton = jQuery('.selector .templates-selector');
var sectionsSelectorButton = jQuery('.selector .sections-selector');
var backtoTopButton = jQuery('.selector .back-to-top');
var hideEditorButton = jQuery('.ef-cb-editor-button');
var styles_textarea = jQuery('#ef_custom_styles');
var saved_styles = JSON.parse(styles_textarea.val());
var dialogs = [];
jQuery(document).ready(function () {
    jQuery.ajax(ajaxurl, {
	data: {
	    action: 'ef-cb-get-builder-data'
	},
	dataType: 'json',
	type: 'POST',
	error: function (jqXHR, textStatus, errorThrown) {
	    alert(errorThrown);
	},
	success: function (data, textStatus, jqXHR) {
	    efCb.sections = data.sections;
	    efCb.relationship = data.relationship;
	    efCb.templates = data.templates;
	    buildSections(efCb.sections);
	    buildTemplates(efCb.templates);
	    createBuilderElements();
	    fixSelectorOnScroll(jQuery('#ef-cb-builder .selector'));
	}
    });
    contentWrapper.sortable({
	placeholder: 'section-placeholder',
	handle: '.handle'
    });

    // add a new section
    sectionsWrapper.on('click', '.ef-cb-section', function (e) {
	e.preventDefault();
	addBuilderSection(jQuery(this).attr('data-id'), false, false, true);
	dialogElement = jQuery('<p>' + ef_strings.section_added + '</p>').uniqueId();
	dialogElement.dialog({
	    hide: 500,
	    height: 70,
	    width: 200,
	    dialogClass: 'ef-cb-dialog success',
	    open: function (event, ui) {
		dialogs[dialogElement.attr('id')] = setTimeout(function () {
		    dialogElement.dialog('close');
		    for (var dialogID in dialogs) {
			jQuery('#' + dialogID).dialog('close');
			clearTimeout(dialogs[dialogID]);
		    }
		}, 2000);
	    }
	});
    });

    // remove section
    contentWrapper.on('click', '.ef-cb-section .controls .remove', function (e) {
	e.preventDefault();
	removeBuilderSection(jQuery(this).closest('.ef-cb-section').attr('id'));
    });

    // show section edit form
    contentWrapper.on('click', '.ef-cb-section .controls .edit', function (e) {
	e.preventDefault();
	section = jQuery(this).closest('.ef-cb-section');
	optionForm = jQuery('#' + section.attr('id') + ' .options');
	if (optionForm.hasClass('opened')) {
	    jQuery(this).val(ef_strings.edit);
	} else {
	    jQuery(this).val(ef_strings.close);
	}
	showSectionOptionsForm(section.attr('data-id'), section.attr('id'));
    });

    // show section reset form
    contentWrapper.on('click', '.ef-cb-section .controls .reset', function (e) {
	e.preventDefault();
	section = jQuery(this).closest('.ef-cb-section');
	optionForm = jQuery('#' + section.attr('id') + ' [data-type=options]');
	optionForm.find(':input').val('').trigger('change');
	optionForm.find('.wp-picker-clear').trigger('click');
    });

    contentWrapper.on('keypress', '.ef-cb-section .search-text', function (e) {
	if (e.which === 13) {
	    e.preventDefault();
	    jQuery(this).siblings('.search-button').trigger('click');
	}
    });

    contentWrapper.on('click', '.ef-cb-section .search-button', function (e) {
	e.preventDefault();
	clickSender = this;
	searchText = jQuery(this).siblings('.search-text').val();
	searchContainer = jQuery(this).siblings('.search-entities').find('.container');
	if (searchText.length > 0) {
	    searchContainer.html('<i class="fa fa-refresh fa-spin"></i>');
	    jQuery.ajax(ajaxurl, {
		data: {
		    action: 'ef-cb-search-entities',
		    type: jQuery(this).closest('.ef-cb-section').attr('data-entity-type'),
		    text: searchText
		},
		dataType: 'json',
		type: 'POST',
		error: function (jqXHR, textStatus, errorThrown) {
		    alert(errorThrown);
		},
		success: function (data, textStatus, jqXHR) {
		    html = '';
		    for (var entityID in data) {
			html += '<a href="#" class="ef-cb-entity ' + data[entityID].type + '" data-id="' + entityID + '" data-type="' + data[entityID].type + '" data-title="' + data[entityID].title + '">';
			html += '<span>' + data[entityID].title + '</span>';
			html += '<i class="fa fa-arrows drag"></i>';
			html += '<i class="fa fa-remove remove"></i>';
			html += '</a>';
		    }
		    searchContainer.find('.ef-cb-entity').remove();
		    searchContainer.html(html);
		}
	    });
	}
    });

    contentWrapper.on('click', '.ef-cb-section .add-all', function (e) {
	e.preventDefault();
	clickSender = this;
	searchText = '';
	entitiesContainer = jQuery(this).closest('.entities-search').find('.entities');
	jQuery.ajax(ajaxurl, {
	    data: {
		action: 'ef-cb-search-entities',
		type: jQuery(this).closest('.ef-cb-section').attr('data-entity-type'),
		text: searchText
	    },
	    dataType: 'json',
	    type: 'POST',
	    error: function (jqXHR, textStatus, errorThrown) {
		alert(errorThrown);
	    },
	    success: function (data, textStatus, jqXHR) {
		html = '';
		for (var entityID in data) {
		    html += '<a href="#" class="ef-cb-entity ' + data[entityID].type + '" data-id="' + entityID + '" data-type="' + data[entityID].type + '" data-title="' + data[entityID].title + '">';
		    html += '<span>' + data[entityID].title + '</span>';
		    html += '<i class="fa fa-arrows drag"></i>';
		    html += '<i class="fa fa-remove remove"></i>';
		    html += '</a>';
		}
		entitiesContainer.find('.ef-cb-entity').remove();
		entitiesContainer.html(html);
		sectionForm = jQuery(clickSender).closest('.ef-cb-section');
		entitiesContainer = sectionForm.find('.entities');
		entities = entitiesContainer.find('[data-id]');
		if (entities.size() > 0) {
		    entitiesArray = [];
		    entitiesIDs = [];
		    jQuery(entities).each(function (i, el) {
			entityID = jQuery(el).attr('data-id');
			entitiesArray[entityID] = {
			    type: jQuery(el).attr('data-type'),
			    title: jQuery(el).attr('data-title'),
			    order: i
			};
		    });
		} else {
		    entitiesArray = false;
		}
		updateSectionData(sectionForm.attr('id'), false, entitiesArray);

		// specific rule for map component
		//if (sectionForm.attr('data-id') === 'map') {
		//    var poisField = jQuery(sectionForm).find('[name=' + sectionForm.attr('id') + '_pois]');
		//    var poisFieldValue = [];
		//
		//    jQuery(sectionForm).find('.group .entities').each(function (i, el) {
		//        var poisArr = [];
		//        jQuery(el).find('[data-id]').each(function (i, el) {
		//            poisArr.push(jQuery(el).attr('data-id'));
		//        });
		//        poisFieldValue.push(poisArr);
		//    });
		//    poisField.val(poisFieldValue.join('##')).trigger('change');
		//}
	    }
	});
    });

    contentWrapper.on('click', '.ef-cb-section .remove-all', function (e) {
	e.preventDefault();
	sectionForm = jQuery(this).closest('.ef-cb-section');
	entitiesContainer = jQuery(this).closest('.entities-search').find('.entities');
	entitiesContainer.find('.ef-cb-entity').remove();
	updateSectionData(sectionForm.attr('id'), false, []);
    });

    contentWrapper.on('click', '.ef-cb-section .add-media', function (e) {
	e.preventDefault();
	sender = this;
	file_frame = wp.media.frames.file_frame = wp.media({
	    multiple: true
	});
	file_frame.on('select', function () {
	    file_frame.state().get('selection').map(function (attachment) {
		attachment = attachment.toJSON();
		jQuery(sender).closest('.ef-cb-section').find('.entities').append('<div class="ef-cb-entity media" data-id="' + attachment.id + '"><a href="#"><i class="remove fa fa-remove"></i></a><img src="' + attachment.url + '" alt="" height="70" /></div>');
		sectionForm = jQuery(sender).closest('.ef-cb-section');
		entitiesContainer = sectionForm.find('.entities');
		entities = entitiesContainer.find('[data-id]');
		if (entities.size() > 0) {
		    entitiesArray = [];
		    entitiesIDs = [];
		    jQuery(entities).each(function (i, el) {
			entityID = jQuery(el).attr('data-id');
			entitiesArray[entityID] = {
			    type: jQuery(el).attr('data-type'),
			    title: jQuery(el).attr('data-title'),
			    order: i
			};
		    });
		} else {
		    entitiesArray = false;
		}
		updateSectionData(sectionForm.attr('id'), false, entitiesArray);

	    });
	});
	file_frame.open();
    });

    contentWrapper.on('blur', '[data-id=map] .group_title input', function (e) {
	e.preventDefault();
	sectionForm = jQuery(this).closest('.ef-cb-section');
	titlesField = jQuery(sectionForm).find('[name=' + sectionForm.attr('id') + '_groups]');
	titles = [];
	jQuery(sectionForm).find('.group_title input').each(function (i, el) {
	    titles.push(jQuery(el).val());
	});
	titlesField.val(titles.join('##')).trigger('change');
    });

    contentWrapper.on('click', '.ef-cb-section .add-poi-group', function (e) {
	e.preventDefault();
	newGroup = jQuery(this).next('.group').clone();
	newGroup.find('.ef-cb-entity').remove();
	newGroup.find('input').val('');
	container = jQuery(this).parent();
	container.append(newGroup);
	newGroup.find('.entities').sortable({
	    placeholder: 'ef-cb-entity-placeholder',
	    connectWith: '.connected-sortable',
	    update: function (event, ui) {
		// update section entity data
		var sectionForm = jQuery(ui.item).closest('.ef-cb-section');
		var poisField = jQuery(sectionForm).find('[name=' + sectionForm.attr('id') + '_pois]');
		var poisFieldValue = [];

		jQuery(sectionForm).find('.group .entities').each(function (i, el) {
		    var poisArr = [];
		    jQuery(el).find('[data-id]').each(function (i, el) {
			poisArr.push(jQuery(el).attr('data-id'));
		    });
		    poisFieldValue.push(poisArr);
		});
		poisField.val(poisFieldValue.join('##')).trigger('change');
	    }
	});
    });

    contentWrapper.on('click', '.ef-cb-section .add-video', function (e) {
	e.preventDefault();
	sender = this;
	video_url = jQuery(this).siblings('.video-url');
	if (video_url.val().length > 0) {
	    jQuery.ajax(ajaxurl, {
		data: {
		    action: 'get_video_thumbnail',
		    url: video_url.val()
		},
		dataType: 'json',
		type: 'POST',
		error: function (jqXHR, textStatus, errorThrown) {
		    alert(errorThrown);
		},
		success: function (data, textStatus, jqXHR) {
		    jQuery(sender).closest('.ef-cb-section').find('.entities').append('<div class="ef-cb-entity media" data-id="' + video_url.val() + '"><a href="#"><i class="remove fa fa-remove"></i></a><img src="' + data + '" alt="" height="70" /></div>');
		    video_url.val('');
		    sectionForm = jQuery(sender).closest('.ef-cb-section');
		    entitiesContainer = sectionForm.find('.entities');
		    entities = entitiesContainer.find('[data-id]');
		    if (entities.size() > 0) {
			entitiesArray = [];
			entitiesIDs = [];
			jQuery(entities).each(function (i, el) {
			    entityID = jQuery(el).attr('data-id');
			    entitiesArray[entityID] = {
				type: jQuery(el).attr('data-type'),
				title: jQuery(el).attr('data-title'),
				order: i
			    };
			});
		    } else {
			entitiesArray = false;
		    }
		    updateSectionData(sectionForm.attr('id'), false, entitiesArray);
		}
	    });
	}
    });

    contentWrapper.on('click', '.ef-cb-section .entity-media .remove', function (e) {
	e.preventDefault();
	sectionForm = jQuery(this).closest('.ef-cb-section');
	entitiesContainer = sectionForm.find('.entities');
	entities = entitiesContainer.find('[data-id]');
	if (entities.size() > 0) {
	    entitiesArray = [];
	    entitiesIDs = [];
	    jQuery(entities).each(function (i, el) {
		entityID = jQuery(el).attr('data-id');
		entitiesArray[entityID] = {
		    type: jQuery(el).attr('data-type'),
		    title: jQuery(el).attr('data-title'),
		    order: i
		};
	    });
	} else {
	    entitiesArray = false;
	}
	updateSectionData(sectionForm.attr('id'), false, entitiesArray);
	jQuery(this).closest('.entity-media').remove();
	return false;
    });

    // remove section entity
    contentWrapper.on('click', '.ef-cb-entity .remove', function (e) {
	e.preventDefault();
	removeBuilderSectionEntity(jQuery(this).closest('.ef-cb-section').find('.entities'), jQuery(this).closest('.ef-cb-entity').attr('data-id'));
    });

    // fill a template
    templatesWrapper.on('click', '.ef-cb-template', function (e) {
	e.preventDefault();
	addBuilderTemplate(jQuery(this).attr('data-id'));
    });

    contentWrapper.on('change', '.ef-cb-section-form-element-container :input', function (e) {
	e.preventDefault();
	sectionForm = jQuery(this).closest('[data-section-id]');
	input = jQuery(this);
	val = '';
	name = '';
	updateStyleData(input);
	if (input.attr('name') !== undefined) {
	    name = input.attr('name').substring(input.attr('name').indexOf('_') + 1);
	    val = input.val();
	}
	updateSectionSingleData(sectionForm.attr('data-section-client-id'), name, val);
    });

    // specific rule for map title groups
    contentWrapper.on('change', '.group .group-title-container .group-title', function (e) {
	e.preventDefault();
	var sectionForm = jQuery(this).closest('.ef-cb-section');
	var groups = [];

	jQuery(sectionForm).find('.group-title').each(function (i, el) {
	    groups.push(jQuery(el).val());
	});
	updateSectionSingleData(sectionForm.attr('id'), 'groups', groups.join('##'));
    });

    builderWrapper.on('click', '.save-all', function (e) {
	e.preventDefault();
	//refreshBuilderContent();
	jQuery('#publish').trigger('click');
    });

    jQuery('#publish, #save-post').on('click', function (e) {
	refreshBuilderContent();
    });

    jQuery('#post-preview').on('click', function (e) {
	refreshBuilderContent();
    });

    templatesSelectorButton.on('click', function (e) {
	e.preventDefault();
	sectionsWrapper.hide();
	if (templatesWrapper.is(':visible')) {
	    templatesWrapper.slideUp('slow');
	} else {
	    templatesWrapper.slideDown('slow');
	}
    });

    sectionsSelectorButton.on('click', function (e) {
	e.preventDefault();
	templatesWrapper.hide();
	if (sectionsWrapper.is(':visible')) {
	    sectionsWrapper.slideUp('slow');
	} else {
	    sectionsWrapper.slideDown('slow');
	}
    });

    backtoTopButton.on('click', function (e) {
	e.preventDefault();
	jQuery('html,body').animate({
	    scrollTop: 0
	}, 700);
    });

    builderWrapper.find('.custom-css').on('click', function (e) {
	customCssDialog = jQuery('<div><textarea class="custom-css-text"></textarea></div>').dialog({
	    dialogClass: 'ef-cb-dialog custom-css',
	    modal: true,
	    height: 300,
	    width: 400,
	    buttons: {
		OK: function () {
		    builderWrapper.find('[name=ef-cb-custom-css]').val(customCssDialog.find('.custom-css-text').val());
		    customCssDialog.dialog('close');
		},
		Cancel: function () {
		    customCssDialog.dialog('close');
		}
	    },
	    open: function (event, ui) {
		jQuery(this).find('.custom-css-text').val(builderWrapper.find('[name=ef-cb-custom-css]').val());
	    }
	});
    });

    hideEditorButton.on('click', function (e) {
	if (jQuery(this).attr('data-editor-hidden') == 0) {
	    jQuery('#postdivrich').slideUp('slow');
	    jQuery(this).attr('data-editor-hidden', 1);
	    jQuery(this).val(ef_strings.hide_editor);
	} else {
	    jQuery('#postdivrich').slideDown('slow');
	    jQuery(this).attr('data-editor-hidden', 0);
	    jQuery(this).val(ef_strings.show_editor);
	}
    });

    contentWrapper.on('click', '.ef-cb-section-form-element-facebook', function (e) {
	e.preventDefault();
	var el = jQuery(this);
	jQuery.ajax(ajaxurl, {
	    data: {
		action: 'ef-cb-get-facebook-info',
	    },
	    async: true,
	    dataType: 'json',
	    type: 'POST',
	    error: function (jqXHR, textStatus, errorThrown) {
		alert(errorThrown);
	    },
	    success: function (data, textStatus, jqXHR) {
		var section = jQuery(el).closest('.ef-cb-section');
		if (data) {
		    if (data['name']) {
			jQuery('[id$=_title]', section).val(data['name']).trigger('change');
		    }
		    if (data['place'] && data['place']['name']) {
			jQuery('[id$=_location]', section).val(data['place']['name']).trigger('change');
		    }
		    if (data['start_time']) {
			var start_time = new Date(data['start_time']);
			var start_time_str = ('0' + start_time.getMonth()) + '/' + ('0' + start_time.getDate()).slice(-2) + '/' + start_time.getFullYear() + ' ' + ('0' + start_time.getHours()).slice(-2) + ':' + ('0' + start_time.getMinutes()).slice(-2);
			jQuery('[id$=_datetext]', section).val(start_time_str).trigger('change');
			jQuery('[id$=_date]', section).val(start_time_str).trigger('change');
		    }
		}
	    }
	});
	return false;
    });

    contentWrapper.on('click', '.ef-cb-section-form-element-eventbrite', function (e) {
	e.preventDefault();
	var el = jQuery(this);
	jQuery.ajax(ajaxurl, {
	    data: {
		action: 'ef-cb-get-eventbrite-info',
	    },
	    async: true,
	    dataType: 'json',
	    type: 'POST',
	    error: function (jqXHR, textStatus, errorThrown) {
		alert(errorThrown);
	    },
	    success: function (data, textStatus, jqXHR) {
		var section = jQuery(el).closest('.ef-cb-section');
		if (data) {
		    if (data['name']) {
			jQuery('[id$=_title]', section).val(data['name']['text']).trigger('change');
		    }
		    if (data['venue']) {
			jQuery('[id$=_location]', section).val(data['venue']['name']).trigger('change');
		    }
		    if (data['start']) {
			var start_time = new Date(data['start']['local']);
			var start_time_str = ('0' + start_time.getMonth()) + '/' + ('0' + start_time.getDate()).slice(-2) + '/' + start_time.getFullYear() + ' ' + ('0' + start_time.getHours()).slice(-2) + ':' + ('0' + start_time.getMinutes()).slice(-2);
			jQuery('[id$=_datetext]', section).val(start_time_str).trigger('change');
			jQuery('[id$=_date]', section).val(start_time_str).trigger('change');
		    }
		}
	    }
	});
	return false;
    });
});

function updateStyleData(input, val) {
    var option = input.data('option');
    if (typeof (option) !== 'undefined') {
	var html_id = input.closest('.section_styles').data('id');
	var property = input.data('property');
	if (!val) {
	    val = input.val();
	}
	efCb.styles[html_id][option][property] = val;
    }
}

function updateSectionData(sectionClientID, sectionOptions, sectionChildren) {
    if (!efCb.data[sectionClientID]) {
	efCb.data[sectionClientID] = [];
	if (!efCb.data[sectionClientID]['options']) {
	    efCb.data[sectionClientID]['options'] = [];
	    var d = new Date();
	    var i = getRandomInt(0, 199);
	    var id = sectionClientID + '-' + d.getTime() + i;
	    efCb.data[sectionClientID]['options']['id'] = id;
	}
    }
    if (sectionOptions) {
	efCb.data[sectionClientID]['options'] = sectionOptions;
    }
    if (sectionChildren) {
	efCb.data[sectionClientID]['entities'] = sectionChildren;
    }
}

function updateSectionSingleData(sectionClientID, sectionOptionName, sectionOptionValue) {
    if (!efCb.data[sectionClientID]) {
	efCb.data[sectionClientID] = [];
    }
    if (!efCb.data[sectionClientID]['options']) {
	efCb.data[sectionClientID]['options'] = [];
    }
    efCb.data[sectionClientID]['options'][sectionOptionName] = sectionOptionValue; //encodeURIComponent(sectionOptionValue);
}

function removeSectionData(sectionClientID) {
    if (efCb.data[sectionClientID]) {
	delete(efCb.data[sectionClientID]);
    }
}

function getSectionOptionStructure(sectionID, optionID) {
    if (efCb.sections[sectionID] && efCb.sections[sectionID].options) {
	for (var key in efCb.sections[sectionID].options) {
	    if (efCb.sections[sectionID].options[key].ID === optionID) {
		return efCb.sections[sectionID].options[key];
	    }
	}
    }
    return '';
}

function getSectionOptionValue(sectionClientID, optionID) {
    if (efCb.data[sectionClientID] && efCb.data[sectionClientID].options && efCb.data[sectionClientID].options[optionID]) {
	return efCb.data[sectionClientID].options[optionID];
    }

    return '';
}

function buildSections(sections) {
    for (var id in sections) {
	sectionsWrapper.append(sections[id].shortTemplate);
    }
}

function buildTemplates(templates) {
    for (var id in templates.list) {
	templatesWrapper.append(sprintf(templates.template, id, id));
    }
}

function handle_styles_input(styles, option, values) {
    var html = '<div><a href="#" class="ef_open_styles button">' + styles.name + '</a>' +
	    '<div class="ef_styles_drop">';
    jQuery.each(styles.properties, function (ii, vv) {
	html += '<div class="ef_input_styles">';
	html += '<label class="description">' + vv.name + '</label>';
	html += '<div class="element">';
	var identify = ' data-option="' + option + '" data-property="' + vv.property + '" ';
	var value = '';
	if (values) {
	    if (typeof (values[option]) == 'undefined') {
		values[option] = {};
		value = '';
	    } else {
		if (typeof (values[option][vv.property]) == 'undefined') {
		    values[option][vv.property] = '';
		}
		value = values[option][vv.property];
	    }
	}
	if (vv.type == 'color') {
	    html += '<input type="text" class="ef_fe_colorpicker" ' + identify + '  value="' + value + '" />';
	}
	if (vv.type == 'text') {
	    html += '<input type="text" ' + identify + ' value="' + value + '" />';
	}
	if (vv.type == 'select') {
	    html += '<select ' + identify + '>';
	    jQuery.each(vv.options, function (iii, vvv) {
		var sel = '';
		if (value == iii) {
		    sel = 'selected="selected"';
		}
		html += '<option value="' + iii + '" ' + sel + '>' + vvv + '</option>';
	    });
	    html += '</select>';
	}
	html += '</div>';
	html += '</div>';
    });
    html += '<div class="clear"></div></div>';
    html += '</div><hr />';
    return html;
}

function showSectionOptionsForm(sectionID, sectionClientID) {
    section = efCb.sections[sectionID];
    optionForm = jQuery('#' + sectionClientID + ' .options');
    html = '<div data-section-id="' + sectionID + '" data-section-client-id="' + sectionClientID + '" data-type="options">';
    for (var key in section.options) {
	value = getSectionOptionValue(sectionClientID, section.options[key]['ID']);
	html += '<div class="ef-cb-section-form-element-container ' + section.options[key]['type'] + '">';
	html += '   <div class="description">' + section.options[key]['name'] + '</div>';
	html += '   <div class="element">';
	switch (section.options[key].type) {
	    case 'text':
		html += '<input id="' + sectionClientID + '_' + section.options[key]['ID'] + '" name="' + sectionClientID + '_' + section.options[key]['ID'] + '" type="text" value="' + value + '" class="ef-cb-section-form-element-text" />'; //unescape(decodeURIComponent(
		break;
	    case 'select':
	    case 'font':
		html += '<select id="' + sectionClientID + '_' + section.options[key]['ID'] + '" name="' + sectionClientID + '_' + section.options[key]['ID'] + '" class="ef-cb-section-form-element-select">';
		if (section.options[key].values && Object.keys(section.options[key].values).length > 0) {
		    for (var optionKey in section.options[key].values) {
			html += sprintf('<option value="%s"%s>%s</option>', optionKey, optionKey == value ? ' selected="selected"' : '', section.options[key].values[optionKey]);
		    }
		}
		html += '</select>';
		break;
	    case 'textarea':
		html += '<textarea id="' + sectionClientID + '_' + section.options[key]['ID'] + '" name="' + sectionClientID + '_' + section.options[key]['ID'] + '" type="text" class="ef-cb-section-form-element-textarea">' + value + '</textarea>';
		break;
	    case 'wysiwyg':
		html += '<div id="wp-content-media-buttons" class="wp-media-buttons"><a href="#" class="button insert-media add_media" data-editor="' + sectionClientID + '_' + section.options[key]['ID'] + '" title="Add Media"><span class="wp-media-buttons-icon"></span> Add Media</a></div><textarea id="' + sectionClientID + '_' + section.options[key]['ID'] + '" name="' + sectionClientID + '_' + section.options[key]['ID'] + '" type="text" class="ef-cb-section-form-element-wysiwyg">' + value + '</textarea>';
		break;
	    case 'checkbox':
		html += '<input id="' + sectionClientID + '_' + section.options[key]['ID'] + '" name="' + sectionClientID + '_' + section.options[key]['ID'] + '" type="checkbox" value="' + value + '" class="ef-cb-section-form-element-checkbox" />';
		break;
	    case 'color':
		html += '<input id="' + sectionClientID + '_' + section.options[key]['ID'] + '" name="' + sectionClientID + '_' + section.options[key]['ID'] + '" type="text" value="' + value + '" class="ef-cb-section-form-element-color" />';
		break;
	    case 'image':
		html += '<input type="button" value="Add" class="add-picture" />';
		html += '<input type="button" value="Remove" class="remove-picture" />';
		html += '<br/><img src="' + value + '" alt="" class="ef-cb-section-form-element-image" />';
		html += '<input id="' + sectionClientID + '_' + section.options[key]['ID'] + '" name="' + sectionClientID + '_' + section.options[key]['ID'] + '" type="hidden" value="' + value + '" />';
		break;
	    case 'datetime':
		html += '<input id="' + sectionClientID + '_' + section.options[key]['ID'] + '" name="' + sectionClientID + '_' + section.options[key]['ID'] + '" type="text" value="' + value + '" class="ef-cb-section-form-element-datetime" />';
		html += '<input id="' + sectionClientID + '_' + section.options[key]['ID'] + '_datetime" type="hidden" />';
		break;
	    case 'hidden':
		html += '<input id="' + sectionClientID + '_' + section.options[key]['ID'] + '" name="' + sectionClientID + '_' + section.options[key]['ID'] + '" type="hidden" value="' + value + '" class="ef-cb-section-form-element-hidden" />';
		break;
	    case 'import':
		html += '<div class="import_buttons">\
                            <input id="' + sectionClientID + '_' + section.options[key]['ID'] + '" name="' + sectionClientID + '_' + section.options[key]['ID'] + '" type="image" src="' + ef_strings.assets_url + '/images/import-facebook.png" value="Import from Facebook" class="ef-cb-section-form-element-import ef-cb-section-form-element-facebook" width="160" />\
                            <input id="' + sectionClientID + '_' + section.options[key]['ID'] + '" name="' + sectionClientID + '_' + section.options[key]['ID'] + '" type="image" src="' + ef_strings.assets_url + '/images/import-eventbrite.png" value="Import from Eventbrite" class="ef-cb-section-form-element-import ef-cb-section-form-element-eventbrite" width="160" />\
                         </div>';
		break;
	}
	html += '      <span class="info">' + section.options[key]['desc'] + '</span>';
	html += '   </div>';
	html += '</div>';
    }
    if (typeof (section.styles) !== 'undefined') {
	var html_id = efCb.data[sectionClientID]['options']['id'];
	var current_styles = saved_styles[html_id];
	html += '<div class="section_styles ef-cb-section-form-element-container" data-id="' + html_id + '">' +
		'<h3>Edit styles</h3>';
	for (var stylekey in section.styles) {
	    html += handle_styles_input(section.styles[stylekey], stylekey, efCb.styles[html_id]);
	}
	html += '</div>';
    }
    html += '</div>';
    if (optionForm.is(':visible')) {
	optionForm.slideUp('slow', function () {
	    optionForm.removeClass('opened').addClass('closed');
	    optionForm.find('.ef-cb-section-form-element-container').remove();
	});
    } else {
	optionForm.find('.ef-cb-section-form-element-container').remove();
	optionForm.removeClass('closed').addClass('opened');
	//optionForm.html(html);
	optionForm.append(html);
	optionForm.slideDown('slow');
    }

    /*jQuery('.ef-cb-section-form-element-color').each(function (i, el) {
     jQuery(el).wpColorPicker();
     });*/

    jQuery('.ef_fe_colorpicker').each(function (i, el) {
	jQuery(el).wpColorPicker({
	    change: function (event, ui) {
		var input = jQuery(this);
		var val = input.wpColorPicker('color');
		updateStyleData(input, val);
	    },
	    clear: function (event, ui) {
		var input = jQuery(this).prev('.ef_fe_colorpicker');
		input.attr('value', '');
		updateStyleData(input, '');
	    }
	});
    });
    jQuery('.ef-cb-section-form-element-datetime').each(function (i, el) {
	jQuery(el).datetimepicker({
	    changeMonth: true,
	    changeYear: true,
	    altField: '#' + jQuery(this).next().attr('id'),
	    altFieldTimeOnly: false,
	    altFormat: 'yy-mm-dd',
	    altTimeFormat: 'HH:mm'
	});
    });

    jQuery('.ef-cb-section-form-element-color').each(function (i, el) {
	jQuery(el).wpColorPicker({
	    change: function (event, ui) {
		sectionForm = jQuery(this).closest('[data-section-id]');
		name = jQuery(this).attr('name').substring(jQuery(this).attr('name').indexOf('_') + 1);
		val = jQuery(this).wpColorPicker('color');
		updateSectionSingleData(sectionForm.attr('data-section-client-id'), name, val);
	    },
	    clear: function () {
		sectionForm = jQuery(this).closest('[data-section-id]');
		//input = sectionForm.find('.ef-cb-section-form-element-color');
		input = sectionForm.find('.ef_fe_colorpicker');
		name = input.attr('name').substring(input.attr('name').indexOf('_') + 1);
		updateSectionSingleData(sectionForm.attr('data-section-client-id'), name, '');
	    }
	});
    });

    jQuery('.ef-cb-section-form-element-wysiwyg').each(function (i, el) {
	if (tinyMCE) {
	    var initParameters = {
		menubar: false,
		body_class: "samplepage embedded-editor",
		plugins: 'code link textcolor',
		toolbar: "bold italic underline strikethrough forecolor link alignleft aligncenter alignright alignjustify formatselect cut copy paste bullist numlist outdent indent blockquote undo redo removeformat subscript superscript columns buttons code",
		content_css: [styleSheetDirectoryUri + '/assets/css/samplepage.css'],
		extended_valid_elements: 'script[language|type|src]',
		relative_urls: false,
		remove_script_host: false,
		convert_urls: true,
		remove_linebreaks: false,
		remove_redundant_brs: false,
		setup: function (editor) {
		    editor.on('change', function (e) {
			sectionForm = jQuery('#' + editor.id).closest('[data-section-id]');
			name = editor.id.substring(editor.id.indexOf('_') + 1);
			val = editor.getContent();
			updateSectionSingleData(sectionForm.attr('data-section-client-id'), name, val);
		    });

		    if (jQuery('#' + editor.id).closest('[data-section-id]').attr('data-section-id') === 'samplepage') {
			editor.addButton('columns', {
			    type: 'listbox',
			    text: ef_strings.columns,
			    icon: false,
			    style: 'width:110px;',
			    onselect: function (e) {
				editor.insertContent(this.value());
			    },
			    values: [
				{text: ef_strings.add_columns, value: ''},
				{text: ef_strings.columns_2, value: '<div class="content row clearfix"><div class="col col-md-6"><h4>Heading 4</h4><p>Rapidisque his pinus pondere? Forma ignea caelumque sponte rapidisque possedit vultus. Coeptis cum cornua aestu ita solidumque. Volucres porrexerat rectumque in litem. Iuga congestaque tegi deerat liquidas nulli. Pluviaque secant modo onerosior congeriem dispositam.</p></div><div class="col col-md-6"><h4>Heading 4</h4><p>Rapidisque his pinus pondere? Forma ignea caelumque sponte rapidisque possedit vultus. Coeptis cum cornua aestu ita solidumque. Volucres porrexerat rectumque in litem. Iuga congestaque tegi deerat liquidas nulli. Pluviaque secant modo onerosior congeriem dispositam.</p></div></div>'},
				{text: ef_strings.columns_3, value: '<div class="content row clearfix"><div class="col col-md-4"><h4>Heading 4</h4><p>Rapidisque his pinus pondere? Forma ignea caelumque sponte rapidisque possedit vultus. Coeptis cum cornua aestu ita solidumque. Volucres porrexerat rectumque in litem. Iuga congestaque tegi deerat liquidas nulli. Pluviaque secant modo onerosior congeriem dispositam.</p></div><div class="col col-md-4"><h4>Heading 4</h4><p>Rapidisque his pinus pondere? Forma ignea caelumque sponte rapidisque possedit vultus. Coeptis cum cornua aestu ita solidumque. Volucres porrexerat rectumque in litem. Iuga congestaque tegi deerat liquidas nulli. Pluviaque secant modo onerosior congeriem dispositam.</p></div><div class="col col-md-4"><h4>Heading 4</h4><p>Rapidisque his pinus pondere? Forma ignea caelumque sponte rapidisque possedit vultus. Coeptis cum cornua aestu ita solidumque. Volucres porrexerat rectumque in litem. Iuga congestaque tegi deerat liquidas nulli. Pluviaque secant modo onerosior congeriem dispositam.</p></div></div>'},
				{text: ef_strings.columns_4, value: '<div class="content row clearfix"><div class="col col-md-3"><h4>Heading 4</h4><p>Rapidisque his pinus pondere? Forma ignea caelumque sponte rapidisque possedit vultus. Coeptis cum cornua aestu ita solidumque. Volucres porrexerat rectumque in litem. Iuga congestaque tegi deerat liquidas nulli. Pluviaque secant modo onerosior congeriem dispositam.</p></div><div class="col col-md-3"><h4>Heading 4</h4><p>Rapidisque his pinus pondere? Forma ignea caelumque sponte rapidisque possedit vultus. Coeptis cum cornua aestu ita solidumque. Volucres porrexerat rectumque in litem. Iuga congestaque tegi deerat liquidas nulli. Pluviaque secant modo onerosior congeriem dispositam.</p></div><div class="col col-md-3"><h4>Heading 4</h4><p>Rapidisque his pinus pondere? Forma ignea caelumque sponte rapidisque possedit vultus. Coeptis cum cornua aestu ita solidumque. Volucres porrexerat rectumque in litem. Iuga congestaque tegi deerat liquidas nulli. Pluviaque secant modo onerosior congeriem dispositam.</p></div><div class="col col-md-3"><h4>Heading 4</h4><p>Rapidisque his pinus pondere? Forma ignea caelumque sponte rapidisque possedit vultus. Coeptis cum cornua aestu ita solidumque. Volucres porrexerat rectumque in litem. Iuga congestaque tegi deerat liquidas nulli. Pluviaque secant modo onerosior congeriem dispositam.</p></div></div>'}
			    ],
			    onPostRender: function () {
				// Select the second item by default
				this.value('');
			    }
			});

			editor.addButton('buttons', {
			    type: 'listbox',
			    text: ef_strings.buttons,
			    icon: false,
			    style: 'width:95px;',
			    onselect: function (e) {
				editor.insertContent(this.value());
			    },
			    values: [
				{text: ef_strings.regular_button, value: '<a class="btn bnt_auto" href="#">' + ef_strings.regular_button + '</a>'},
				{text: ef_strings.large_button, value: '<a class="btn btn_1 bnt_auto" href="#">' + ef_strings.large_button + '</a>'},
				{text: ef_strings.dark_button, value: '<a class="btn btn_2 bnt_auto" href="#">' + ef_strings.dark_button + '</a>'},
				{text: ef_strings.transparent_button, value: '<a class="btn btn_3 bnt_auto" href="#">' + ef_strings.transparent_button + '</a>'},
				{text: ef_strings.transparent_button2, value: '<a class="btn btn_4 bnt_auto" href="#">' + ef_strings.transparent_button2 + '</a>'}
			    ],
			    onPostRender: function () {
				// Select the second item by default
				this.value('');
			    }
			});
		    }
		}
	    };
	    new tinyMCE.Editor(jQuery(el).attr('id'), initParameters, tinyMCE.EditorManager).render();
	}
    });

    attachAdditionals();

    jQuery('.ef-cb-section-form-element-container.image .add-picture').on('click', function (e) {
	e.preventDefault();
	sender = this;
	file_frame = wp.media.frames.file_frame = wp.media({
	    multiple: false
	});
	file_frame.on('select', function () {
	    var attachment = file_frame.state().get('selection').first().toJSON();
	    jQuery(sender).siblings('input[type=hidden]').first().val(attachment.url).trigger('change');
	    jQuery(sender).siblings('img').first().attr('src', attachment.url);
	});
	file_frame.open();
    });

    jQuery('.ef-cb-section-form-element-container.image .remove-picture').on('click', function (e) {
	e.preventDefault();
	jQuery(this).siblings('input[type=hidden]').first().val('').trigger('change');
	jQuery(this).siblings('img').first().attr('src', '');
    });

    jQuery('.ef_open_styles').on('click', function (e) {
	e.preventDefault();
	jQuery('.ef_styles_drop').removeClass('open');
	jQuery(this).parent().find('.ef_styles_drop').toggleClass('open');
    });
}

function refreshBuilderContent() {
    content = '';
    contentWrapper.find('.ef-cb-section').each(function (i, el) {
	sectionClientID = jQuery(el).attr('id');
	sectionID = jQuery(el).attr('data-id');
	sectionData = efCb.data[sectionClientID];
	if (typeof (sectionData.options) == 'undefined') {
	    sectionData.options = {'id': " "};
	}
	if (sectionData.options['id'] == " ") {
	    var d = new Date();
	    sectionData.options['id'] = efCb.sections[sectionID].clientID + '-' + d.getTime() + i;
	}
	completeShortcode = efCb.sections[sectionID].shortcode;
	shortcodeContent = '';
	if (sectionData.options && Object.keys(sectionData.options).length > 0) {
	    for (var optionID in sectionData.options) {
		optionData = getSectionOptionStructure(sectionID, optionID);
		if (optionID == 'id') {
		    console.log(sectionData.options[optionID]);
		}
		if (optionData['nested'] === false || optionID == 'id') {
		    completeShortcode = completeShortcode.replace(optionID + '=" "', optionID + '="' + sectionData.options[optionID] + '"');
		} else {
		    completeShortcode = completeShortcode.replace(sprintf('[%s][/%s]', optionID, optionID), sprintf('[%s]%s[/%s]', optionID, sectionData.options[optionID], optionID));
		}
	    }
	}
	if (sectionData.entities && Object.keys(sectionData.entities).length > 0) {
	    entitiesList = '';
	    orderedEntities = Object.keys(sectionData.entities).sort(function (a, b) {
		return parseInt(sectionData.entities[a]['order']) - parseInt(sectionData.entities[b]['order']);
	    });
	    for (var key in orderedEntities) {
		entitiesList += orderedEntities[key] + ',';
	    }
	    entitiesList = entitiesList.slice(0, -1);
	    completeShortcode = completeShortcode.replace('entities=""', 'entities="' + entitiesList + '"');
	}
	if (shortcodeContent.length > 0) {
	    completeShortcode = completeShortcode.replace('][/', ']' + shortcodeContent + '[/');
	}
	content += completeShortcode;
    });
    if (isTinyMceActive()) {
	var contentEditor = window.tinyMCE.get(contentField.attr('id'));
	if (contentEditor) {
	    contentEditor.setContent(content);
	} else {
	    contentField.val(content);
	}
    } else {
	contentField.val(content);
    }
    styles_textarea.val(JSON.stringify(efCb.styles));
}

function createBuilderElements() {
    /*if (isTinyMceActive()) {
     content = window.tinyMCE.get(contentField.attr('id')).getContent();
     } else {
     content = contentField.val();
     }*/
    content = contentField.val();
    contentWrapper.empty();

    var re = /\[efcb-section-(.*?) .*?\]/g;
    var match;
    var parsingIndex = 0;

    while ((match = re.exec(content)) != null) {
	sectionID = match[1];
	shortCodeName = efCb.sections[sectionID].clientID;
	shortcode = wp.shortcode.next(shortCodeName, content, parsingIndex);
	if (shortcode !== undefined) {
	    options = [];
	    entities = [];
	    // parse attributes
	    for (var attribute in shortcode.shortcode.attrs.named) {
		//if (sectionID === 'map' && attribute === 'pois') {
		//    entities = getEntities(shortcode.shortcode.attrs.named.pois.replace('##', '').split(','), efCb['sections'][sectionID]['entityType']);
		//    options[attribute] = shortcode.shortcode.attrs.named[attribute];
		//
		//} else
		if (attribute === 'entities') {
		    switch (sectionID) {
			case 'media':
			case 'social':
			    entityType = sectionID;
			    break;
			default:
			    entityType = efCb['sections'][sectionID]['entityType'];
		    }
		    entities = getEntities(shortcode.shortcode.attrs.named.entities.split(','), entityType);//efCb['sections'][sectionID]['entityType']
		} else {
		    options[attribute] = shortcode.shortcode.attrs.named[attribute];
		}
	    }
	    // parse content for nested attributes
	    if (shortcode.content.length > 0) {
		// cycle section nested attributes
		for (var key in efCb.sections[sectionID].options) {
		    if (efCb.sections[sectionID].options[key].nested === true) {
			// search nested attributes in shortcode content
			attributeName = efCb.sections[sectionID].options[key].ID;
			attributeShortCode = wp.shortcode.next(attributeName, shortcode.content);
			if (attributeShortCode !== undefined) {
			    options[attributeName] = attributeShortCode.shortcode.content;
			}
		    }
		}
	    }

	    // load saved styles
	    if (typeof (options.id) !== 'undefined') {
		if (typeof (efCb.styles) == 'undefined') {
		    efCb.styles = {};
		}
		efCb.styles[options.id] = saved_styles[options.id];
	    }
	    addBuilderSection(sectionID, options, entities, false);

	    parsingIndex = shortcode.index + 1;
	}
    }
}

function isTinyMceActive() {
    var isActive = (typeof tinyMCE !== "undefined") && tinyMCE.get('content') && !tinyMCE.get('content').isHidden();
    return isActive;
}

function addBuilderSection(sectionID, options, entities, updateBuilderContent) {
    /* get section structure data */
    longTemplate = efCb.sections[sectionID].longTemplate;

    /* build section template, filling with entities if available */
    longTemplate = jQuery(longTemplate);
    //longTemplate.disableSelection();
    sectionClientID = longTemplate.uniqueId().attr('id');
    // if no entities are available in the section structure remove all containers and controls for them in the section template
    // with specific rule for map component
    if (efCb.sections[sectionID].hasEntities === true) {
	// add entities if available
	if (entities && Object.keys(entities).length > 0) {
	    orderedEntities = [];
	    // order entities by order parameter
	    orderedEntitiesKeys = Object.keys(entities).sort(function (a, b) {
		return parseInt(entities[a]['order']) - parseInt(entities[b]['order']);
	    });
	    for (var key in orderedEntitiesKeys) {
		orderedEntities[orderedEntitiesKeys[key]] = entities[orderedEntitiesKeys[key]];
	    }
	    addBuilderSectionEntities(sectionID, longTemplate.find('.entities'), orderedEntities, false);
	}
    }

    /* attach section template events */
    longTemplate.find('.entities, .search-entities .container').sortable({
	connectWith: '.connected-sortable',
	placeholder: 'ef-cb-entity-placeholder',
	update: function (event, ui) {
	    // update section entity data
	    sectionForm = jQuery(ui.item).closest('.ef-cb-section');
	    entitiesContainer = sectionForm.find('.entities');
	    entities = entitiesContainer.find('[data-id]');
	    if (entities.size() > 0) {
		entitiesArray = [];
		entitiesIDs = [];
		jQuery(entities).each(function (i, el) {
		    entityID = jQuery(el).attr('data-id');
		    entitiesArray[entityID] = {
			type: jQuery(el).attr('data-type'),
			title: jQuery(el).attr('data-title'),
			order: i
		    };
		});
	    } else {
		entitiesArray = false;
	    }
	    updateSectionData(sectionForm.attr('id'), false, entitiesArray);
	}
    });

    /* add section to sections container */
    contentWrapper.append(longTemplate);

    /* template customization */
    if (efCb.sections[sectionID].hasEntities === false && !efCb.sections[sectionID].isMediaSelector) {
	longTemplate.find('.add, .entities, .info').remove();
    }

    /* specific rule for map section */
    //if (sectionID === 'map') {
    //    if (options && Object.keys(options).length > 0) {
    //        if (options['groups'] && options['groups'].length > 0) {
    //            var groups = options['groups'].split('##');
    //            if (groups && groups.length > 1) {
    //                var button = jQuery(longTemplate).find('.add-poi-group');
    //                var i;
    //                for (i = 0; i < groups.length - 1; i++) {
    //                    button.trigger('click');
    //                }
    //            }
    //            jQuery(longTemplate).find('.group-title').each(function (i, el) {
    //                jQuery(el).val(groups[i]);
    //            });
    //        }
    //
    //        var poisArray = [];
    //        if (options['pois'] && options['pois'].length > 0) {
    //            var poisGroups = options['pois'].split('##');
    //            if (poisGroups && poisGroups.length > 0) {
    //                for (var key in poisGroups) {
    //                    poisArray.push(poisGroups[key].split(','));
    //                }
    //                //addBuilderSectionEntities(sectionID, longTemplate.find('.entities'), orderedEntities, false);
    //            }
    //        }
    //        if (poisArray.length > 0) {
    //            jQuery(longTemplate).find('.group .entities').each(function (i, el) {
    //                var orderedEntities = [];
    //                if (poisArray[i] && poisArray[i].length > 0) {
    //                    for (var key in poisArray[i]) {
    //                        orderedEntities[poisArray[i][key]] = entities[poisArray[i][key]];
    //                    }
    //                }
    //                addBuilderSectionEntities(sectionID, jQuery(el), orderedEntities, false);
    //            });
    //        }
    //    }
    //    // put entities in the right groups
    //    //console.log(entities);
    //}

    /* update section data */
    updateSectionData(longTemplate.attr('id'), options, entities);
    initStyles(sectionID, longTemplate.attr('id'));

    return sectionClientID;
}

function initStyles(sectionid, dataid) {
    if (typeof (efCb.styles) == 'undefined') {
	efCb.styles = {};
    }
    var id = efCb.data[dataid].options.id;
    if (efCb.styles[id]) {
	return;
    }
    efCb.styles[id] = {};
    jQuery.each(efCb.sections[sectionid].styles, function (i, v) {
	efCb.styles[id][i] = {};
	jQuery.each(v.properties, function (ii, vv) {
	    efCb.styles[id][i][vv.property] = '';
	});
	var selector = '';
	if (i == 'section') {
	    selector = '#' + id;
	} else {
	    selector = '#' + id + ' ' + v.type;
	}
	efCb.styles[id][i]['selector'] = selector;
    });
}

function addBuilderSectionEntities(sectionID, entitiesContainer, entities, refreshBuilderData) {
    // build ordered array from associative array
    var orderedEntities = [];
    for (var entityID in entities) {
	orderedEntities.push(entityID);
    }
    orderedEntities.sort(function (a, b) {
	return entities[a].order - entities[b].order;
    });
    // ------------------------------------------

    for (var entityID in orderedEntities) { //entities
	entityID = orderedEntities[entityID];
	entityTemplate = efCb.relationship['sections'][sectionID]['template'];
	checkEntity = entitiesContainer.find('[data-id="' + entityID + '"]');
	// if entity is not present
	if (checkEntity.size() === 0) {
	    // add entity
	    switch (sectionID) {
		case 'conference':
		case 'media':
		    entityTemplate = '<div class="ef-cb-entity media" data-id="' + entityID + '"><a href="#"><i class="remove fa fa-remove"></i></a><img src="' + entities[entityID]['thumbnail'] + '" alt="" height="70" /></div>';
		    break;
		case 'instagram-wrap':
		    entityTemplate = '<div class="ef-cb-entity media" data-id="' + entityID + '"><a href="#"><i class="remove fa fa-remove"></i></a><img src="' + entities[entityID]['thumbnail'] + '" alt="" height="70" /></div>';
		    break;
		case 'social':
		    entityTemplate = sprintf(entityTemplate, entities[entityID]['type'], entityID, entities[entityID]['type'], entities[entityID]['title'], sprintf('<i class="fa fa-%s"></i><span>%s</span>', entities[entityID]['thumbnail'], entities[entityID]['title']));
		    break;
		default:
		    entityTemplate = sprintf(entityTemplate, entities[entityID]['type'], entityID, entities[entityID]['type'], entities[entityID]['title'], entities[entityID]['title']);
	    }
	    entitiesContainer.append(entityTemplate);
	    // update section entity data
	    entitiesInserted = entitiesContainer.find('[data-id]');
	    if (entitiesInserted.size() > 0) {
		entitiesArray = [];
		jQuery(entitiesInserted).each(function (i, el) {
		    entityID = jQuery(el).attr('data-id');
		    entitiesArray[entityID] = {
			type: entities[entityID]['type'],
			title: entities[entityID]['title'],
			order: i
		    };
		});
	    } else {
		entitiesArray = false;
	    }
	}
    }
    if (refreshBuilderData) {
	updateSectionData(sectionClientID, false, entitiesArray);
    }
}

function getEntities(entitiesIDs, entityType) {
    ret = [];
    jQuery.ajax(ajaxurl, {
	data: {
	    action: 'ef-cb-get-entities',
	    ids: entitiesIDs.join(','),
	    type: entityType
	},
	async: false,
	dataType: 'json',
	type: 'POST',
	error: function (jqXHR, textStatus, errorThrown) {
	    alert(errorThrown);
	},
	success: function (data, textStatus, jqXHR) {
	    i = 0;
	    for (var key in data) {
		ret[key] = {
		    type: data[key].type,
		    title: data[key].title,
		    order: data[key].order//i++
		};
		if (data[key].thumbnail) {
		    ret[key].thumbnail = data[key].thumbnail;
		}
	    }
	}
    });
    return ret;
}

function removeBuilderSection(sectionClientID) {
    if (confirm(ef_strings.remove_section)) {
	removeSectionData(sectionClientID);
	jQuery('#' + sectionClientID).remove();
    }
}

function removeBuilderSectionEntity(entitiesContainer, entityID) {
    sectionForm = jQuery(entitiesContainer).closest('.ef-cb-section');
    jQuery(entitiesContainer).find('[data-id="' + entityID + '"]').remove();
    // update section entity data
    entities = entitiesContainer.find('[data-id]');
    entitiesArray = [];
    if (entities.size() > 0) {
	jQuery(entities).each(function (i, el) {
	    entityID = jQuery(el).attr('data-id');
	    entitiesArray[entityID] = {
		type: jQuery(el).attr('data-type'),
		title: jQuery(el).attr('data-title'),
		order: i
	    };
	});
    }
    updateSectionData(sectionForm.attr('id'), false, entitiesArray);
}

function addBuilderTemplate(templateID) {
    if (confirm(ef_strings.use_template)) {
	contentWrapper.empty();
	if (efCb.templates.list && efCb.templates.list[templateID]) {
	    for (var key in efCb.templates.list[templateID]) {
		addBuilderSection(efCb.templates.list[templateID][key], false, false, true);
	    }
	}
    }
}

function serializeChildren(el) {
    ret = [];
    jQuery(el).find(':input').each(function (i, el) {
	el = jQuery(el);
	if (el.attr('name') !== undefined) {
	    elTinyMCE = tinyMCE.get(el.attr('id'));
	    if (elTinyMCE) {
		val = elTinyMCE.getContent();
	    } else {
		val = el.val();
	    }
	    ret[el.attr('name').substring(el.attr('name').indexOf('_') + 1)] = val;
	}
    });
    return ret;
}

function fixSelectorOnScroll(element) {
    if (element.length == 0) {
	return false;
    }
    var win = jQuery(window);
    var divTop = element.offset().top;
    var width = jQuery('#wpcontent').width();
    var left = jQuery('#adminmenu').width();
    win.scroll(function () {
	var isFixed = element.hasClass('fixed');
	var winTop = win.scrollTop();
	if ((winTop > divTop) && !isFixed && contentWrapper.find('.ef-cb-section').size() > 6) {
	    element.addClass('fixed').css('left', left).css('width', width);
	    sectionsWrapper.hide();
	    templatesWrapper.hide();
	} else if ((winTop <= divTop)) {
	    element.removeClass('fixed').attr('style', '');
	    sectionsWrapper.show();
	    templatesWrapper.show();
	}
    });
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

function attachAdditionals() {
    if (ef_strings && ef_strings.eventbrite_eventid) {
	jQuery('.ef-cb-section[data-id="registration"] .ef-cb-section-form-element-container.wysiwyg textarea:eq(1)', contentWrapper).each(function (i, el) {
	    var embedCodeTinyMCE = tinyMCE.get(jQuery(el).attr('id'));
	    embedCodeTinyMCE.addButton('ebembedcode', {
		text: 'Import Eventbrite embed code',
		icon: false,
		onclick: function () {
		    embedCodeTinyMCE.insertContent('<div style="width:100%; text-align:left;" ><iframe  src="//eventbrite.com/tickets-external?eid=' + ef_strings.eventbrite_eventid + '&ref=etckt" frameborder="0" height="306" width="100%" vspace="0" hspace="0" marginheight="5" marginwidth="5" scrolling="auto" allowtransparency="true"></iframe><div style="font-family:Helvetica, Arial; font-size:10px; padding:5px 0 5px; margin:2px; width:100%; text-align:left;" ><a class="powered-by-eb" style="color: #dddddd; text-decoration: none;" target="_blank" href="http://www.eventbrite.com/r/etckt">Powered by Eventbrite</a></div></div>');
		}
	    });
	    var button = embedCodeTinyMCE.buttons['ebembedcode'];
	    var bg = embedCodeTinyMCE.theme.panel.find('toolbar buttongroup')[0];
	    bg._lastRepaintRect = bg._layoutRect;
	    bg.append(button);
	});
    }
}