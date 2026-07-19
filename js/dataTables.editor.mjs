/*! Editor 3.0.0-dev for DataTables
 * Copyright (c) SpryMedia Ltd - https://datatables.net/license/plus
 */

import DataTable, { util, Dom } from 'datatables.net';

class DropDown {
    constructor(host, options) {
        this.s = {
            dt: null,
            searchTerm: '',
            shown: false,
            showTo: null
        };
        this.dom = {
            attachTo: null,
            below: null,
            host: null,
            dropdown: null,
            header: null,
            list: null,
            placeholder: null,
            processing: null,
            search: null,
            table: null,
            title: null
        };
        this.c = util.object.assign({}, DropDown.defaults, options);
        // DOM setup
        this.dom.host = Dom.s(host);
        this.dom.attachTo = Dom.s(host);
        this.dom.dropdown = Dom
            .c('div')
            .classAdd('dte-dropdown')
            .append([
            Dom.c('div').classAdd('dte-dropdown-header'),
            Dom
                .c('div')
                .classAdd('dte-dropdown-list')
                .append(Dom.c('table')),
            Dom.c('div').classAdd('dte-dropdown-placeholder')
        ]);
        this.dom.table = this.dom.dropdown.find('table');
        this.dom.header = this.dom.dropdown.find('div.dte-dropdown-header');
        this.dom.list = this.dom.dropdown.find('div.dte-dropdown-list');
        this.dom.title = Dom.c('div').classAdd('dte-dropdown-title');
        this.dom.processing = Dom
            .c('div')
            .classAdd('dte-dropdown-processing')
            .append(Dom.c('span'));
        this.dom.search = Dom
            .c('input')
            .classAdd('dte-dropdown-search')
            .attr('autocomplete', 'off');
        this.dom.placeholder = this.dom.dropdown
            .find('div.dte-dropdown-placeholder')
            .html(this.c.i18n.placeholder);
        if (this.c.i18n.title) {
            this.dom.title.appendTo(this.dom.header).html(this.c.i18n.title);
        }
        if (this.c.search) {
            let search = e => {
                this.filter(this.dom.search.val());
            };
            this.dom.processing.appendTo(this.dom.header);
            this.dom.search
                .css('display', 'block')
                .appendTo(this.dom.header)
                .attr('placeholder', this.c.i18n.inputPlaceholder)
                .on('keydown', e => {
                if (e.which === 40) {
                    setTimeout(() => {
                        this.focus();
                    }, 50);
                }
            })
                .on('input', this.c.ajax ? util.debounce(search) : search);
        }
        // We need to modify the layout default to null all entries, keeping in
        // mind that the default might have been modified by the dev using DT,
        // so it needs to be dynamic.
        let emptyLayout = util.object.assignDeep({}, DataTable.defaults.layout);
        util.object.each(emptyLayout, function (key, val) {
            emptyLayout[key] = null;
        });
        let renderer = this._renderer();
        let dt = new DataTable(this.dom.table.get(0), {
            columns: [
                {
                    data: 'label',
                    render: (data, type, row) => renderer(row, row.value)
                }
            ],
            language: {
                emptyTable: this.c.i18n.noResults,
                zeroRecords: this.c.i18n.noResults
            },
            layout: emptyLayout,
            paging: false,
            select: {
                keys: true,
                keysWrap: true
            },
            order: this.c.order === false ? [] : [0, this.c.order]
        }); // Due to `select`
        this.s.dt = dt;
        // On selecting an item, let the host, then immediately hide
        // and deselect
        dt.on('select', (e, dt, type, indexes) => {
            let selected = dt.row({ selected: true });
            if (this.c.select) {
                this.c.select(selected.data().value);
            }
            this.hide();
            selected.deselect();
        });
        if (this.c.options) {
            this.options(this.c.options);
        }
    }
    attachTo(el) {
        this.dom.attachTo = Dom.s(el);
    }
    asyncLabels(source, cb) {
        let values = source.map(item => item.value);
        let ajaxData = util.object.assign({}, this.c.ajaxData, {
            values: values
        });
        this.processing(true);
        // Resolve any functions
        Object.keys(ajaxData).forEach(key => {
            if (typeof ajaxData[key] === 'function') {
                ajaxData[key] = ajaxData[key]();
            }
        });
        let options = {
            url: '',
            type: 'POST',
            dataType: 'json',
            data: ajaxData
        };
        if (typeof this.c.ajax === 'string') {
            options.url = this.c.ajax;
        }
        else {
            DataTable.util.object.assignDeep(options, this.c.ajax);
        }
        DataTable.ajax(Object.assign(options, {
            success: json => {
                this.options(json.data);
                for (let i = 0; i < source.length; i++) {
                    let label = this.label(source[i].value);
                    cb(source[i], label);
                }
                this.processing(false);
            }
        }));
    }
    blur(input) {
        // We can't use blur to hide, as we want to keep the dropdown open
        // while the user selects from it. But if focus is moved outside of
        // the dropdown the picker, then we auto hide.
        this.s.showTo = setTimeout(() => {
            let name = document.activeElement.tagName.toLowerCase();
            if (document.activeElement === input) {
                return;
            }
            if (this.dom.host.find(document.activeElement).count()) {
                return;
            }
            if (['input', 'select', 'button'].includes(name)) {
                this.hide();
            }
        }, 10);
        return this;
    }
    destroy() {
        this.hide();
        this.s.dt.destroy();
        Dom.s(document).off('click.dte-dropdown');
    }
    filter(val) {
        this.s.searchTerm = val;
        if (this.dom.search.val() !== val) {
            this.dom.search.val(val);
        }
        if (this.c.ajax) {
            if (val) {
                this.processing(true);
                let options = {
                    url: '',
                    type: 'POST',
                    dataType: 'json',
                    data: util.object.assign({}, this.c.ajaxData, {
                        search: val
                    })
                };
                if (typeof this.c.ajax === 'string') {
                    options.url = this.c.ajax;
                }
                else {
                    DataTable.util.object.assignDeep(options, this.c.ajax);
                }
                DataTable.ajax(Object.assign(options, {
                    success: json => {
                        this.s.dt.clear().rows.add(json.data).draw();
                        this._listView();
                        this.processing(false);
                    }
                }));
            }
            else {
                // Ajax with no search term is an empty result set
                this.s.dt.clear().draw();
                this._listView();
            }
        }
        else {
            this.s.dt.search(val).draw();
        }
        return this;
    }
    /**
     * Get the label for a specific value (not async - if unknown in the current
     * data set, will return `null`)
     *
     * @param val Value to lookup
     * @returns Label if found, null if not found
     */
    label(val) {
        let option = this.options().find(o => o.value === val);
        let renderer = this._renderer();
        return option ? renderer(option, val) : null;
    }
    focus() {
        this.s.dt.row(':first-child').focus();
        return this;
    }
    hide() {
        let namespace = 'dte-dropdown';
        this.s.shown = false;
        this.dom.dropdown.detach();
        Dom.s(document).off('keyup.dte-dropdown');
        // Remove scroll listeners
        Dom.w.off('scroll.' + namespace + ' resize.' + namespace);
        Dom.s('div.dt-scroll-body').off('scroll.' + namespace);
        var offsetParent = this.dom.host.get(0).offsetParent;
        if (offsetParent !== document.body) {
            Dom.s(offsetParent).off('scroll.' + namespace);
        }
        return this;
    }
    host(el) {
        this.dom.host = Dom.s(el);
        this._position();
        return this;
    }
    options(options, append = false) {
        let dt = this.s.dt;
        if (options === undefined) {
            return dt.rows().data().toArray();
        }
        if (append !== true) {
            dt.clear();
        }
        options.forEach(o => {
            if (typeof o === 'string') {
                dt.row.add({
                    label: o,
                    value: o
                });
            }
            else {
                dt.row.add(o);
            }
        });
        dt.draw();
        return this;
    }
    owns(node) {
        return Dom.s(node).closest(this.dom.dropdown.get(0)).count() > 0;
    }
    processing(state) {
        this.dom.processing.classToggle('processing', state);
        return this;
    }
    show(below) {
        let that = this;
        let namespace = 'dte-dropdown';
        this.s.shown = true;
        this.dom.below = below ? Dom.s(below) : null;
        this.dom.dropdown.appendTo(this.dom.attachTo);
        this.s.dt.columns.adjust();
        this._listView();
        this._position();
        // Need to reposition on scroll
        Dom.w.on('scroll.' + namespace + ' resize.' + namespace, function () {
            that._position();
        });
        Dom.s('div.dt-scroll-body').on('scroll.' + namespace, function () {
            that._position();
        });
        var offsetParent = this.dom.host.get(0).offsetParent;
        if (offsetParent !== document.body) {
            Dom.s(offsetParent).on('scroll.' + namespace, function () {
                that._position();
            });
        }
        clearTimeout(this.s.showTo);
        // Hide if clicking outside of the dropdown - but in a different click
        // event from the one that was used to trigger the show (if it was)
        setTimeout(function () {
            Dom.s(document).on('click.' + namespace, function (e) {
                let target = e.target;
                // Ignore clicks in the host element, and in the dropdown
                if (target !== that.dom.host.get(0) &&
                    that.dom.host.find(target).count() === 0 &&
                    that.dom.dropdown.find(target).count() === 0) {
                    that.hide();
                }
            });
        }, 10);
        if (this.c.search) {
            this.dom.search.focus();
        }
        // Close the dropdown on esc key
        Dom.s(document).on('keyup.dte-dropdown', e => {
            if (e.which === 27) {
                // esc
                e.preventDefault();
                e.stopImmediatePropagation();
                this.hide();
            }
        });
        return this;
    }
    _listView() {
        if (this.c.ajax) {
            // If Ajax searching, then an empty search term means that there should
            // be no list to display, so we show the information div saying the
            // user needs to start typing
            if (this.s.searchTerm) {
                this.dom.placeholder.css('display', 'none');
                this.dom.list.css('display', 'block');
            }
            else {
                this.dom.placeholder.css('display', 'block');
                this.dom.list.css('display', 'none');
            }
        }
        else {
            // But for non-Ajax, then all options already loaded should be shown
            this.dom.placeholder.css('display', 'none');
            this.dom.list.css('display', 'block');
        }
    }
    _position() {
        if (!this.s.shown) {
            return;
        }
        let appendToOffset = this.dom.attachTo.offset();
        let hostOffset = this.dom.host.offset();
        let dropdown = this.dom.dropdown;
        let inputHeight = this.dom.below
            ? this.dom.below.height('outer') + this.dom.below.position().top
            : this.dom.host.height('outer');
        if (this.dom.attachTo.get(0) !== document.body) {
            inputHeight -= appendToOffset.top;
        }
        dropdown.css({
            top: hostOffset.top + inputHeight + 'px',
            left: hostOffset.left - appendToOffset.left + 'px',
            width: this.dom.host.width('outer') + 'px'
        });
    }
    _renderer() {
        let renderer = this.c.renderer;
        if (!renderer) {
            renderer = this.c.escapeHtml
                ? data => util.escapeHtml(data.label)
                : data => data.label;
        }
        return renderer;
    }
}
DropDown.defaults = {
    ajax: null,
    ajaxData: {},
    escapeHtml: true,
    i18n: {
        inputPlaceholder: '',
        noResults: '',
        title: '',
        placeholder: ''
    },
    options: null,
    order: 'asc',
    renderer: null,
    search: false,
    select: null
};
DropDown.classes = {};

function safeDomId(id, prefix = '') {
    return typeof id === 'string'
        ? prefix + id.replace(/\./g, '-')
        : prefix + id;
}
function safeQueryId(id, prefix = '#') {
    return typeof id === 'string'
        ? prefix + id.replace(/(:|\.|\[|\]|,)/g, '\\$1')
        : prefix + id;
}
/**
 * Get an array of all child nodes of an element, optionally removing them from
 * the dom.
 *
 * @param this
 * @param el
 * @param detach
 * @private
 */
function childNodes(el, detach = false) {
    let nodes = [];
    el.each(e => {
        nodes.push.apply(nodes, Array.prototype.slice.call(e.childNodes));
    });
    if (detach) {
        Dom.s(nodes).detach();
    }
    return nodes;
}
function dataGet(src) {
    return DataTable.util.get(src);
}
function dataSet(src) {
    return DataTable.util.set(src);
}
function pluck(a, prop) {
    if (Array.isArray(a)) {
        return util.array.pluck(a, prop);
    }
    let out = [];
    util.object.each(a, function (idx, elIn) {
        out.push(elIn[prop]);
    });
    return out;
}
/**
 * Compare parameters for difference - diving into arrays and objects if
 * needed, allowing the object reference to be different, but the contents to
 * match.
 *
 * Please note that LOOSE type checking is used
 */
function deepCompare(o1, o2) {
    if (typeof o1 !== 'object' ||
        typeof o2 !== 'object' ||
        o1 === null ||
        o2 === null) {
        return o1 == o2;
    }
    let o1Props = Object.keys(o1);
    let o2Props = Object.keys(o2);
    if (o1Props.length !== o2Props.length) {
        return false;
    }
    for (let i = 0, ien = o1Props.length; i < ien; i++) {
        let propName = o1Props[i];
        if (typeof o1[propName] === 'object') {
            if (!deepCompare(o1[propName], o2[propName])) {
                return false;
            }
        }
        else if (o1[propName] != o2[propName]) {
            return false;
        }
    }
    return true;
}
/**
 * Extend objects - very similar to $.extend, but deep copy objects and
 * shallow copy arrays. Allows arrays returned from the server to be
 * left as is.
 *
 * @param out Target object
 * @param extender Object to extend
 * @returns Refreshed object
 */
function extendDeepObjShallowArr(out, extender) {
    var val;
    for (var prop in extender) {
        if (Object.prototype.hasOwnProperty.call(extender, prop)) {
            val = extender[prop];
            if (util.is.plainObject(val)) {
                if (!util.is.plainObject(out[prop])) {
                    out[prop] = {};
                }
                extendDeepObjShallowArr(out[prop], val);
            }
            else if (Array.isArray(val)) {
                out[prop] = val.slice();
            }
            else {
                out[prop] = val;
            }
        }
    }
    return out;
}
/**
 * Slide an element down to reveal it. This involves animating margin, padding
 * and height.
 *
 * @param el Element(s) to slide
 * @param cb Callback function
 */
function slideDown(el, cb, correction = 0) {
    // Get the existing padding / margin so we can transition to that value
    let paddingBottom = el.css('paddingBottom');
    let paddingTop = el.css('paddingTop');
    let marginTop = el.css('marginTop');
    let marginBottom = el.css('marginBottom');
    // Now zero its height out so it has no vertical height
    el.css({
        overflow: 'hidden',
        height: '0',
        paddingTop: '0',
        paddingBottom: '0',
        marginTop: '0',
        marginBottom: '0'
    });
    // It is in the DOM though, so we can measure the content height. The
    // correction is for the error and message fields. I don't understand why
    // scrollHeight is higher than the height of the element when no height is
    // applied, but it is.
    let height = el.get(0).scrollHeight -
        parseInt(paddingBottom) -
        parseInt(paddingTop) -
        correction;
    // And then transition to it
    el.transition({
        height: height + 'px',
        paddingTop: paddingTop,
        paddingBottom: paddingBottom,
        marginTop: marginTop,
        marginBottom: marginBottom
    }, null, null, () => {
        slideClear(el);
        cb();
    });
}
/**
 * Slide an element up to hide. This involves animating margin, padding
 * and height.
 *
 * @param el Element(s) to slide
 * @param cb Callback function
 */
function slideUp(el, cb) {
    // Get the current height so we can set it as a fixed value that can be
    // transitioned
    let height = el.height();
    // Fix it in place and then flatten
    el.css({
        overflow: 'hidden',
        height: height + 'px'
    }).transition({
        height: '0',
        paddingTop: '0',
        paddingBottom: '0',
        marginTop: '0',
        marginBottom: '0'
    }, null, null, () => {
        slideClear(el);
        cb();
    });
}
/**
 * Once a slide is done we clear the element's direct styles so CSS can rule
 *
 * @param el
 */
function slideClear(el) {
    el.css({
        overflow: '',
        height: '',
        paddingTop: '',
        paddingBottom: '',
        marginTop: '',
        marginBottom: ''
    });
}

/**
 * Common error message emitter. This method is not (yet) publicly documented on
 * the Editor site. It might be in future.
 *
 * @param  {string} msg Error message
 * @param  {int}    tn  Tech note link
 */
function error$1(msg, tn, thro = true) {
    let display = tn
        ? msg +
            ' For more information, please refer to https://datatables.net/tn/' +
            tn
        : msg;
    if (thro) {
        throw display;
    }
    else {
        console.warn(display);
    }
}
/**
 * Obtain label / value pairs of data from a data source, be it an array or
 * object, for use in an input that requires label / value pairs such as
 * `select`, `radio` and `checkbox` inputs.
 *
 * A callback function is triggered for each label / value pair found, so the
 * caller can add it to the input as required.
 *
 * @static
 * @param {object|array} An object or array of data to iterate over getting the
 * label / value pairs.
 * @param {object} props When an array of objects is passed in as the data
 * source by default the label will be read from the `label` property and
 * the value from the `value` property of the object. This option can alter
 * that behaviour.
 * @param {function} fn Callback function. Takes three parameters: the label,
 * the value and the iterator index.
 */
function pairs(data, props, fn) {
    let i;
    let ien;
    let dataPoint;
    // Define default properties to read the data from if using an object.
    // The passed in `props` object and override.
    props = util.object.assign({
        label: 'label',
        value: 'value'
    }, props);
    if (Array.isArray(data)) {
        // As an array, we iterate each item which can be an object or value
        for (i = 0, ien = data.length; i < ien; i++) {
            dataPoint = data[i];
            if (util.is.plainObject(dataPoint)) {
                fn(dataPoint[props.value] === undefined
                    ? dataPoint[props.label]
                    : dataPoint[props.value], dataPoint[props.label], i, dataPoint.attr // optional - can be undefined
                );
            }
            else {
                fn(dataPoint, dataPoint, i);
            }
        }
    }
    else {
        // As an object the key is the label and the value is the value
        i = 0;
        util.object.each(data, function (key, val) {
            fn(val, key, i);
            i++;
        });
    }
}
/**
 * Field specific upload method. This can be used to upload a file to the Editor
 * libraries. This method is not (yet) publicly documented on the Editor site.
 * It might be in future.
 *
 * @static
 * @param {Editor} editor The Editor instance operating on
 * @param {object} conf Field configuration object
 * @param {Files} filesIn The file(s) to upload
 * @param {function} progressCallback Upload progress callback
 * @param {function} completeCallback Callback function for once the file has
 * been uploaded
 */
function upload$1(editor, conf, filesIn, progressCallback, completeCallback) {
    let reader = new FileReader();
    let counter = 0;
    let ids = [];
    let generalError = conf.errors && conf.errors._
        ? conf.errors._
        : 'A server error occurred while uploading the file';
    let i18nPrefix = conf._many ? 'field.uploadMany.' : 'field.upload.';
    // Clear any existing errors, as the new upload might not be in error
    editor.error(conf.name, '');
    if (typeof conf.ajax === 'function') {
        conf.ajax(filesIn, function (idsIn) {
            completeCallback.call(editor, idsIn);
        });
        return;
    }
    progressCallback.call(editor, conf, editor.i18n(conf.fileReadText, i18nPrefix + 'uploading'));
    reader.onload = function (e) {
        let data = new FormData();
        let ajax;
        data.append('action', 'upload');
        data.append('uploadField', conf.name);
        data.append('upload', filesIn[counter]);
        if (conf.ajaxData) {
            conf.ajaxData(data, filesIn[counter], counter);
        }
        if (conf.ajax) {
            ajax = conf.ajax;
        }
        else if (util.is.plainObject(editor.s.ajax)) {
            ajax = editor.s.ajax.upload ? editor.s.ajax.upload : editor.s.ajax;
        }
        else if (typeof editor.s.ajax === 'string') {
            ajax = editor.s.ajax;
        }
        if (!ajax) {
            throw new Error('No Ajax option specified for upload plug-in');
        }
        if (typeof ajax === 'string') {
            ajax = { url: ajax };
        }
        // Handle the case when the ajax data is given as a function
        if (typeof ajax.data === 'function') {
            let d = {};
            let ret = ajax.data(d);
            // Allow the return to be used, or the object passed in
            if (ret !== undefined && typeof ret !== 'string') {
                d = ret;
            }
            util.object.each(d, function (key, value) {
                data.append(key, value);
            });
        }
        else if (util.is.plainObject(ajax.data)) {
            throw new Error('Upload feature cannot use `ajax.data` with an object. Please use it as a function instead.');
        }
        // Dev cancellable event
        editor._event('preUpload', [conf.name, filesIn[counter], data], function (preRet) {
            // Upload was cancelled
            if (preRet === false) {
                // If there are other files still to read, spin through them
                if (counter < filesIn.length - 1) {
                    counter++;
                    reader.readAsDataURL(filesIn[counter]);
                }
                else {
                    completeCallback.call(editor, ids);
                }
                return;
            }
            // Use preSubmit to stop form submission during an upload, since the
            // value won't be known until that point.
            let submit = false;
            editor.on('preSubmit.DTE_Upload', function () {
                submit = true;
                return false;
            });
            // Replace "macro" values in the URL string
            editor._ajaxReplacements(ajax, editor.mode() === 'create' ? null : editor.ids().join(','), 'upload', data);
            DataTable.ajax(util.object.assign({}, ajax, {
                contentType: false,
                data,
                dataType: 'json',
                error(xhr) {
                    let errors = conf.errors;
                    editor.off('preSubmit.DTE_Upload');
                    editor.error(conf.name, errors && errors[xhr.status]
                        ? errors[xhr.status]
                        : generalError);
                    editor._event('uploadXhrError', [conf.name, xhr]);
                    progressCallback.call(editor, conf);
                },
                processData: false,
                success(json) {
                    editor.off('preSubmit.DTE_Upload');
                    editor._event('uploadXhrSuccess', [
                        conf.name,
                        json
                    ]);
                    if (json.fieldErrors && json.fieldErrors.length) {
                        let errors = json.fieldErrors;
                        for (let i = 0, ien = errors.length; i < ien; i++) {
                            editor.error(errors[i].name, errors[i].status);
                        }
                        completeCallback.call(editor, ids, true);
                    }
                    else if (json.error) {
                        editor.error(json.error);
                        completeCallback.call(editor, ids, true);
                    }
                    else if (!json.upload || !json.upload.id) {
                        editor.error(conf.name, generalError);
                        completeCallback.call(editor, ids, true);
                    }
                    else {
                        if (json.files) {
                            // Loop over the tables that are defined
                            util.object.each(json.files, function (table, filesIn) {
                                if (!files$1[table]) {
                                    files$1[table] = {};
                                }
                                util.object.assign(files$1[table], filesIn);
                            });
                        }
                        ids.push(json.upload.id);
                        if (counter < filesIn.length - 1) {
                            counter++;
                            reader.readAsDataURL(filesIn[counter]);
                        }
                        else {
                            completeCallback.call(editor, ids);
                            if (submit) {
                                editor.submit();
                            }
                        }
                    }
                    progressCallback.call(editor, conf);
                },
                type: 'post',
                xhr() {
                    let xhr = new XMLHttpRequest();
                    if (xhr.upload) {
                        xhr.upload.onprogress = function (e) {
                            if (e.lengthComputable) {
                                let percent = ((e.loaded / e.total) *
                                    100).toFixed(0) + '%';
                                progressCallback.call(editor, conf, filesIn.length === 1
                                    ? percent
                                    : counter +
                                        ':' +
                                        filesIn.length +
                                        ' ' +
                                        percent);
                            }
                        };
                        xhr.upload.onloadend = function () {
                            progressCallback.call(editor, conf, editor.i18n(conf.processingText, i18nPrefix + 'processing'));
                        };
                    }
                    return xhr;
                }
            }));
        });
    };
    // Convert to a plain array
    filesIn = Array.from(filesIn);
    // Truncate the selected files if needed
    if (conf._limitLeft !== undefined) {
        filesIn.splice(conf._limitLeft, filesIn.length);
    }
    reader.readAsDataURL(filesIn[0]);
}
/**
 * CommonJS factory function pass through. Matches DataTables.
 * @param {*} root Window
 * @param {*} jq jQuery - redundant
 * @returns {boolean} Indicator
 */
function factory(root, jq) {
    var is = false;
    // Test if the first parameter is a window object
    if (root && root.document) {
        window = root;
        document = root.document;
    }
    return is;
}
const files$1 = {};

const fieldType = {
    create: () => { },
    disable: () => { },
    enable: () => { },
    get: () => { },
    set: () => { }
};

// Upload private helper method
function buttonText(conf, textIn) {
    let i18nPrefix = conf._many ? 'field.uploadMany.' : 'field.upload.';
    if (textIn === null || textIn === undefined) {
        textIn = this.i18n(conf.uploadText, i18nPrefix + 'choose');
    }
    conf._input.find('div.upload button').html(textIn);
}
function commonUpload(upload, editor, conf, dropCallback, multiple = false) {
    let btnClass = editor.classes.form.buttonInternal;
    let container = Dom.c('div').classAdd('editor_upload').html('<div class="eu_table">' +
        '<div class="row">' +
        '<div class="cell upload limitHide">' +
        '<button class="' +
        btnClass +
        '"></button>' +
        '<input type="file" ' +
        (multiple ? 'multiple' : '') +
        '></input>' +
        '</div>' +
        '<div class="cell clearValue">' +
        '<button class="' +
        btnClass +
        '"></button>' +
        '</div>' +
        '</div>' +
        '<div class="row second">' +
        '<div class="cell limitHide">' +
        '<div class="drop"><span></span></div>' +
        '</div>' +
        '<div class="cell">' +
        '<div class="rendered"></div>' +
        '</div>' +
        '</div>' +
        '</div>');
    let i18nPrefix = conf._many ? 'field.uploadMany.' : 'field.upload.';
    conf._input = container;
    conf._enabled = true;
    if (conf.id) {
        container.find('input[type=file]').attr('id', safeDomId(conf.id));
    }
    if (conf.attr) {
        container.find('input[type=file]').attr(conf.attr);
    }
    buttonText.call(editor, conf);
    if (window.FileReader && conf.dragDrop !== false) {
        container
            .find('div.drop span')
            .text(editor.i18n(conf.dragDropText, i18nPrefix + 'dragDrop'));
        let dragDrop = container.find('div.drop');
        dragDrop
            .on('drop', function (e) {
            if (conf._enabled) {
                editor.field(conf.name).processing(true);
                upload$1(editor, conf, e.originalEvent.dataTransfer.files, buttonText, function (ids, error) {
                    if (!error) {
                        dropCallback.call(editor, ids);
                    }
                    editor.field(conf.name).processing(false);
                });
                dragDrop.classRemove('over');
            }
            return false;
        })
            .on('dragleave dragexit', function (e) {
            if (conf._enabled) {
                dragDrop.classRemove('over');
            }
            return false;
        })
            .on('dragover', function (e) {
            if (conf._enabled) {
                dragDrop.classAdd('over');
            }
            return false;
        });
        // When an Editor is open with a file upload input there is a
        // reasonable chance that the user will miss the drop point when
        // dragging and dropping. Rather than loading the file in the browser,
        // we want nothing to happen, otherwise the form will be lost.
        editor
            .on('open', function () {
            Dom.s('body').on('dragover.DTE_Upload drop.DTE_Upload', function (e) {
                return false;
            });
        })
            .on('close', function () {
            Dom.s('body').off('dragover.DTE_Upload drop.DTE_Upload');
        });
    }
    else {
        container.classAdd('noDrop');
        container.append(container.find('div.rendered'));
    }
    container.find('div.clearValue button').on('click', function (e) {
        e.preventDefault();
        if (conf._enabled) {
            upload.set.call(editor, conf, '');
        }
    });
    container.find('input[type=file]').on('input', function () {
        editor.field(conf.name).processing(true);
        upload$1(editor, conf, this.files, buttonText, function (ids, error) {
            if (!error) {
                dropCallback.call(editor, ids);
            }
            editor.field(conf.name).processing(false);
            container.find('input[type=file]').get(0).value = '';
        });
    });
    return container;
}
// Typically a change event caused by the end user will be added to a queue that
// the browser will handle when no other script is running. However, using
// `$().trigger()` will cause it to happen immediately, so in order to simulate
// the standard browser behaviour we use setTimeout. This also means that
// `dependent()` and other change event listeners will trigger when the field
// values have all been set, rather than as they are being set - 31594
function triggerChange(input) {
    setTimeout(function () {
        input.trigger('change', { editor: true, editorSet: true }); // editorSet legacy
    }, 0);
}
// A number of the fields in this file use the same get, set, enable and disable
// methods (specifically the text based controls), so in order to reduce the code
// size, we just define them once here in our own local base model for the field
// types.
let baseFieldType = util.object.assignDeep({}, fieldType, {
    canReturnSubmit(conf, node) {
        return true;
    },
    disable(conf) {
        conf._input.prop('disabled', true);
    },
    enable(conf) {
        conf._input.prop('disabled', false);
    },
    get(conf) {
        return conf._input.val();
    },
    set(conf, val) {
        conf._input.val(val);
        triggerChange(conf._input);
    }
});

const autocomplete = util.object.assignDeep({}, baseFieldType, {
    create(conf) {
        conf._input = Dom.c('input').attr(util.object.assign({
            id: safeDomId(conf.id),
            type: 'text',
            autocomplete: 'off'
        }, conf.attr || {}));
        if (conf.escapeLabelHtml === undefined) {
            conf.escapeLabelHtml = true;
        }
        // Dynamic options can get got from the Editor Ajax url, or from a
        // specified location
        let ajax = conf.ajax === true
            ? typeof this.s.ajax === 'string'
                ? this.s.ajax
                : this.s.ajax.url
            : conf.ajax;
        let i18n = conf.i18n || {};
        conf._dropdown = new DropDown(conf._input, {
            ajax: ajax,
            ajaxData: util.object.assign({}, conf.ajaxData, {
                [this.s.actionName]: 'search',
                field: conf.name
            }),
            escapeHtml: conf.escapeLabelHtml,
            i18n: {
                noResults: this.i18n(i18n.noResults, 'field.autocomplete.noResults'),
                title: i18n.title,
                placeholder: this.i18n(i18n.placeholder, 'field.autocomplete.placeholder')
            },
            order: conf.optionsOrder,
            options: conf.options || [],
            renderer: conf.display,
            search: false,
            select: (val) => {
                // Prevent return key from the dropdown submitting the form.
                // This happens because of the event ordering
                conf._selected = true;
                setTimeout(() => (conf._selected = false), 200);
                conf._input.val(val).focus();
            }
        });
        // When model editing, it needs to be attached to the model to allow for focus capture,
        // otherwise the dropdown is attached to the body (inline and bubble).
        this.on('open', (e, mode, action) => {
            conf._dropdown.attachTo(mode === 'main' && !autocomplete.dropDownBody
                ? this.s.displayController.node()
                : 'body');
        });
        let search = function () {
            conf._dropdown.filter(conf._input.val()).show();
        };
        conf._input
            .on('blur', function () {
            conf._dropdown.blur(this);
        })
            .on('keydown', function (e) {
            // Down arrow - move focus to the dropdown
            if (e.keyCode === 40) {
                conf._dropdown.focus();
                return false;
            }
        })
            .on('focus', search)
            .on('input', conf.ajax
            ? DataTable.util.debounce(search)
            : search);
        this.on('close', () => conf._dropdown.hide());
        return conf._input.get(0);
    },
    update(conf, options, append) {
        // Only update options if not Ajax. No point in doing it for the Ajax
        // case. Ideally the backend shouldn't send options when not needed.
        if (!conf.ajax) {
            conf._dropdown.options(options, append);
        }
    },
    destroy(conf) {
        conf._input.off();
        conf._dropdown.destroy();
    },
    canReturnSubmit(conf) {
        // Can submit when focus is in the input, but not when in the dropdown
        return document.activeElement === conf._input.get(0) && !conf._selected ? true : false;
    },
    owns(conf, node) {
        return conf._dropdown.owns(node);
    }
});

const checkbox = util.object.assignDeep({}, baseFieldType, {
    // Locally "private" function that can be reused for the create and update methods
    _addOptions(conf, opts, append = false) {
        let jqInput = conf._input;
        let offset = 0;
        if (!append) {
            jqInput.empty();
        }
        else {
            offset = jqInput.find('input').count();
        }
        if (opts) {
            pairs(opts, conf.optionsPair, function (val, label, i, attr) {
                jqInput.append('<div>' +
                    '<input id="' +
                    safeDomId(conf.id) +
                    '_' +
                    (i + offset) +
                    '" type="checkbox" />' +
                    '<label for="' +
                    safeDomId(conf.id) +
                    '_' +
                    (i + offset) +
                    '">' +
                    label +
                    '</label>' +
                    '</div>');
                jqInput.find('input').last().attr('value', val).get(0)._editor_val = val;
                if (attr) {
                    jqInput.find('input').last().attr(attr);
                }
            });
        }
    },
    create(conf) {
        conf._input = Dom.c('div');
        checkbox._addOptions(conf, conf.options || conf.ipOpts);
        return conf._input.get(0);
    },
    disable(conf) {
        conf._input.find('input').prop('disabled', true);
    },
    enable(conf) {
        conf._input.find('input').prop('disabled', false);
    },
    get(conf) {
        let out = [];
        let selected = conf._input.find('input:checked');
        if (selected.count()) {
            selected.each(function () {
                out.push(this._editor_val);
            });
        }
        else if (conf.unselectedValue !== undefined) {
            out.push(conf.unselectedValue);
        }
        return conf.separator === undefined || conf.separator === null
            ? out
            : out.join(conf.separator);
    },
    set(conf, val) {
        let jqInputs = conf._input.find('input');
        if (!Array.isArray(val) && typeof val === 'string') {
            val = val.split(conf.separator || '|');
        }
        else if (!Array.isArray(val)) {
            val = [val];
        }
        let i;
        let len = val.length;
        let found;
        jqInputs.each(function () {
            found = false;
            for (i = 0; i < len; i++) {
                if (this._editor_val == val[i]) {
                    found = true;
                    break;
                }
            }
            this.checked = found;
        });
        triggerChange(jqInputs);
    },
    update(conf, options, append) {
        // Get the current value
        let currVal = checkbox.get(conf);
        checkbox._addOptions(conf, options, append);
        checkbox.set(conf, currVal);
    }
});

const datatable = util.object.assignDeep({}, baseFieldType, {
    _addOptions(conf, options, append = false) {
        let dt = conf.dt;
        if (!append) {
            dt.clear();
        }
        dt.rows.add(options).draw();
    },
    _jumpToFirst(conf, editor) {
        let dt = conf.dt;
        // Find which page in the table the first selected row is
        let idx = dt.row({ order: 'applied', selected: true }).index();
        let page = 0;
        if (typeof idx === 'number') {
            let pageLen = dt.page.info().length;
            let pos = dt
                .rows({ order: 'applied' })
                .indexes()
                .indexOf(idx);
            page = pageLen > 0 ? Math.floor(pos / pageLen) : 0;
        }
        dt.page(page).draw(false);
        // If scrolling is enabled, scroll down to first selected
        let container = Dom.s(dt.table().container()).find('div.dt-scroll-body');
        let scrollTo = function () {
            let node = dt.row({ order: 'applied', selected: true }).node();
            if (node) {
                let height = container.height();
                let top = Dom.s(node).position().top;
                if (top > height - 10) {
                    container.scrollTop(top);
                }
            }
        };
        if (container.count()) {
            // Check that the form has actually been displayed. If not need
            // to wait for Editor's open event
            if (container.isAttached()) {
                scrollTo();
            }
            else {
                editor.one('open', function () {
                    scrollTo();
                });
            }
        }
    },
    create(conf) {
        conf.optionsPair = util.object.assign({
            label: 'label',
            value: 'value'
        }, conf.optionsPair);
        let table = Dom.c('table');
        let container = Dom.c('div').append(table);
        let side = Dom.c('div').classAdd('DTE_Field_Type_datatable_info');
        if (conf.footer) {
            Dom.c('tfoot')
                .append(Array.isArray(conf.footer)
                ? Dom.c('tr').append(conf.footer.map(str => Dom.c('th').html(str)))
                : conf.footer)
                .appendTo(table);
        }
        let hasButtons = conf.config && conf.config.buttons && conf.config.buttons.length;
        table
            .classAdd(datatable.tableClass)
            .width('100%')
            .on('init.dt', function (e, settings) {
            if (settings.table !== table.get(0)) {
                return;
            }
            let api = new DataTable.Api(settings);
            let containerNode = Dom.s(api.table(undefined).container());
            // Select init
            DataTable.select.init(api);
            // Append side button controls
            side.append(containerNode.find('div.dt-search'))
                .append(containerNode.find('div.dt-buttons'))
                .append(containerNode.find('div.dt-info'));
            containerNode.find('div.dt-layout-cell:empty').remove();
            containerNode.find('div.dt-layout-row:empty').remove();
        });
        let dt = new DataTable(table.get(0), util.object.assign({
            buttons: [],
            columns: [
                {
                    data: conf.optionsPair.label,
                    title: 'Label'
                }
            ],
            deferRender: true,
            language: {
                paginate: {
                    next: '>',
                    previous: '<'
                },
                search: '',
                searchPlaceholder: 'Search'
            },
            layout: {
                top: hasButtons
                    ? ['search', 'buttons', 'info']
                    : ['search', 'info'],
                bottom: ['paging'],
                bottomStart: null,
                bottomEnd: null,
                topStart: null,
                topEnd: null
            },
            lengthChange: false,
            select: {
                style: conf.multiple ? 'os' : 'single'
            }
        }, conf.config));
        this.on('open', function () {
            if (dt.search()) {
                dt.search('').draw();
            }
            dt.columns.adjust();
        });
        // Change event for when the user does a select - `set` will do its own
        // triggering of the change for the api
        dt.on('user-select', function () {
            triggerChange(Dom.s(conf.dt.table().container()));
        });
        if (conf.editor) {
            conf.editor.table(dt);
            conf.editor.on('submitComplete', (e, json, data, action) => {
                if (action === 'create') {
                    // Automatically select the new data
                    for (let dp of json.data) {
                        dt.rows((idx, d) => d === dp).select();
                    }
                }
                else if (action === 'edit' || action === 'remove') {
                    this._dataSource('refresh');
                }
                datatable._jumpToFirst(conf, this);
            });
        }
        conf.dt = dt;
        datatable._addOptions(conf, conf.options || []);
        return {
            input: container,
            side
        };
    },
    disable(conf) {
        conf.dt.select.style('api');
        conf.dt
            .buttons()
            .container()
            .css('display', 'none');
    },
    dt(conf) {
        return conf.dt;
    },
    enable(conf) {
        conf.dt.select.style(conf.multiple ? 'os' : 'single');
        conf.dt
            .buttons()
            .container()
            .css('display', 'block');
    },
    get(conf) {
        let rows = conf.dt
            .rows({ selected: true })
            .data()
            .pluck(conf.optionsPair.value)
            .toArray();
        return conf.separator || !conf.multiple ? rows.join(conf.separator || ',') : rows;
    },
    set(conf, val, localUpdate) {
        // Convert to an array of values - works for both single and multiple
        if (conf.multiple && conf.separator && !Array.isArray(val)) {
            val = typeof val === 'string' ? val.split(conf.separator) : [];
        }
        else if (!Array.isArray(val)) {
            val = [val];
        }
        // if ( ! localUpdate ) {
        // 	conf._lastSet = val;
        // }
        let valueFn = dataGet(conf.optionsPair.value);
        conf.dt.rows({ selected: true }).deselect();
        conf.dt.rows((idx, data, node) => val.indexOf(valueFn(data)) !== -1).select();
        // Jump to the first page with a selected row (if there are any)
        datatable._jumpToFirst(conf, this);
        triggerChange(Dom.s(conf.dt.table().container()));
    },
    tableClass: '',
    update(conf, options, append) {
        datatable._addOptions(conf, options, append);
        // Attempt to set the last selected value (set by the API or the end
        // user, they get equal priority)
        let lastSet = conf._lastSet;
        if (lastSet !== undefined) {
            datatable.set(conf, lastSet, true);
        }
    }
});

var datetime = util.object.assignDeep({}, baseFieldType, {
    create(conf) {
        conf._div = Dom.c('div');
        conf._input = Dom.c('input')
            .attr(util.object.assign({
            id: safeDomId(conf.id),
            type: 'text'
        }, conf.attr))
            .appendTo(conf._div);
        if (!DataTable.DateTime) {
            error$1('DateTime library is required', 15);
        }
        // Legacy support for 2.0- parameters
        if (conf.momentLocale && !conf.opts.locale) {
            conf.opts.locale = conf.momentLocale;
        }
        if (conf.momentStrict && !conf.opts.strict) {
            conf.opts.strict = conf.momentStrict;
        }
        conf._picker = new DataTable.DateTime(conf._input, util.object.assign({
            format: conf.displayFormat || conf.format, // can be undefined
            i18n: this.s.i18n.datetime
        }, conf.opts));
        conf._closeFn = function () {
            conf._picker.hide();
        };
        if (conf.keyInput === false) {
            conf._input.on('keydown', function (e) {
                e.preventDefault();
            });
        }
        this.on('close', conf._closeFn);
        return conf._div.get(0);
    },
    destroy(conf) {
        this.off('close', conf._closeFn);
        conf._input.off('keydown');
        conf._picker.destroy();
    },
    errorMessage(conf, msg) {
        conf._picker.errorMsg(msg);
    },
    get(conf) {
        return conf.wireFormat && conf._input.val()
            ? conf._picker.valFormat(conf.wireFormat)
            : conf._input.val();
    },
    maxDate(conf, max) {
        conf._picker.max(max);
    },
    minDate(conf, min) {
        conf._picker.min(min);
    },
    // default disable and enable options are okay
    owns(conf, node) {
        return conf._picker.owns(node);
    },
    set(conf, val) {
        // If there is a wire format, convert it to the display format
        // Note that special values (e.g. `--now` and empty) do not get formatted
        if (typeof val === 'string' && val && val.indexOf('--') !== 0 && conf.wireFormat) {
            conf._picker.valFormat(conf.wireFormat, val);
        }
        else {
            conf._picker.val(val);
        }
        triggerChange(conf._input);
    },
    inst(conf) {
        return conf._picker;
    }
});

var hidden = {
    create(conf) {
        conf._input = Dom.c('input');
        conf._val = conf.value;
        return null;
    },
    get(conf) {
        return conf._val;
    },
    set(conf, val) {
        let oldVal = conf._val;
        conf._val = val;
        conf._input.val(val);
        if (oldVal !== val) {
            triggerChange(conf._input);
        }
    }
};

var password = util.object.assignDeep({}, baseFieldType, {
    create(conf) {
        conf._input = Dom.c('input').attr(util.object.assign({
            id: safeDomId(conf.id),
            type: 'password'
        }, conf.attr || {}));
        return conf._input.get(0);
    }
});

var readonly = util.object.assignDeep({}, baseFieldType, {
    create(conf) {
        conf._input = Dom.c('input').attr(util.object.assign({
            id: safeDomId(conf.id),
            readonly: 'readonly',
            type: 'text'
        }, conf.attr || {}));
        return conf._input.get(0);
    }
});

const select = util.object.assignDeep({}, baseFieldType, {
    // Locally "private" function that can be reused for the create and update methods
    _addOptions(conf, opts, append = false) {
        let elOpts = conf._input.get(0).options;
        let countOffset = 0;
        if (!append) {
            elOpts.length = 0;
            if (conf.placeholder !== undefined) {
                let placeholderValue = conf.placeholderValue !== undefined ? conf.placeholderValue : '';
                countOffset += 1;
                elOpts[0] = new Option(conf.placeholder, placeholderValue);
                let disabled = conf.placeholderDisabled !== undefined ? conf.placeholderDisabled : true;
                elOpts[0].hidden = disabled; // can't be hidden if not disabled!
                elOpts[0].disabled = disabled;
                elOpts[0]._editor_val = placeholderValue;
            }
        }
        else {
            countOffset = elOpts.length;
        }
        if (opts) {
            pairs(opts, conf.optionsPair, function (val, label, i, attr) {
                let option = new Option(label, val);
                option._editor_val = val;
                if (attr) {
                    Dom.s(option).attr(attr);
                }
                elOpts[i + countOffset] = option;
            });
        }
    },
    create(conf) {
        conf._input = Dom.c('select')
            .attr(util.object.assign({
            id: safeDomId(conf.id)
        }, conf.attr || {}))
            .on('change.dte', function (e, d) {
            // On change, get the user selected value and store it as the
            // last set, so `update` can reflect it. This way `_lastSet`
            // always gives the intended value, be it set via the API or by
            // the end user.
            if (!d || !d.editor) {
                conf._lastSet = select.get(conf);
            }
        });
        if (conf.multiple) {
            conf._input.attr('multiple', 'multiple');
        }
        select._addOptions(conf, conf.options || conf.ipOpts);
        return conf._input.get(0);
    },
    destroy(conf) {
        conf._input.off('change.dte');
    },
    get(conf) {
        let val = conf._input
            .find('option:checked')
            .mapTo(opt => {
            return opt._editor_val;
        });
        if (conf.multiple) {
            return conf.separator ? val.join(conf.separator) : val;
        }
        return val.length ? val[0] : null;
    },
    set(conf, val, localUpdate) {
        if (!localUpdate) {
            conf._lastSet = val;
        }
        // Can't just use `$().val()` because it won't work with strong types
        if (conf.multiple && conf.separator && !Array.isArray(val)) {
            val = typeof val === 'string' ? val.split(conf.separator) : [];
        }
        else if (!Array.isArray(val)) {
            val = [val];
        }
        let i;
        let len = val.length;
        let found;
        let allFound = false;
        let options = conf._input.find('option');
        conf._input.find('option').each(function () {
            found = false;
            for (i = 0; i < len; i++) {
                // Weak typing
                if (this._editor_val == val[i]) {
                    found = true;
                    allFound = true;
                    break;
                }
            }
            this.selected = found;
        });
        // If there is a placeholder, we might need to select it if nothing else
        // was selected. It doesn't make sense to select when multi is enabled
        if (conf.placeholder && !allFound && !conf.multiple && options.count()) {
            options.get(0).selected = true;
        }
        triggerChange(conf._input);
        return allFound;
    },
    update(conf, options, append) {
        select._addOptions(conf, options, append);
        // Attempt to set the last selected value (set by the API or the end
        // user, they get equal priority)
        let lastSet = conf._lastSet;
        if (lastSet !== undefined) {
            select.set(conf, lastSet, true);
        }
    }
});

const radio = util.object.assignDeep({}, baseFieldType, {
    // Locally "private" function that can be reused for the create and update methods
    _addOptions(conf, opts, append = false) {
        let jqInput = conf._input;
        let offset = 0;
        if (!append) {
            jqInput.empty();
        }
        else {
            offset = jqInput.find('input').count();
        }
        if (opts) {
            pairs(opts, conf.optionsPair, function (val, label, i, attr) {
                jqInput.append('<div>' +
                    '<input id="' +
                    safeDomId(conf.id) +
                    '_' +
                    (i + offset) +
                    '" type="radio" name="' +
                    conf.name +
                    '" />' +
                    '<label for="' +
                    safeDomId(conf.id) +
                    '_' +
                    (i + offset) +
                    '">' +
                    label +
                    '</label>' +
                    '</div>');
                jqInput.find('input').last().attr('value', val).get(0)._editor_val = val;
                if (attr) {
                    jqInput.find('input').last().attr(attr);
                }
            });
        }
    },
    create(conf) {
        conf._input = Dom.c('div');
        radio._addOptions(conf, conf.options || conf.ipOpts);
        // this is ugly, but IE6/7 has a problem with radio elements that are created
        // and checked before being added to the DOM! Basically it doesn't check them. As
        // such we use the _preChecked property to set cache the checked button and then
        // check it again when the display is shown. This has no effect on other browsers
        // other than to cook a few clock cycles.
        this.on('open', function () {
            conf._input.find('input').each(function () {
                if (this._preChecked) {
                    this.checked = true;
                }
            });
        });
        return conf._input.get(0);
    },
    disable(conf) {
        conf._input.find('input').prop('disabled', true);
    },
    enable(conf) {
        conf._input.find('input').prop('disabled', false);
    },
    get(conf) {
        let el = conf._input.find('input:checked');
        if (el.count()) {
            return el.get(0)._editor_val;
        }
        return conf.unselectedValue !== undefined ? conf.unselectedValue : undefined;
    },
    set(conf, val) {
        conf._input.find('input').each(function () {
            this._preChecked = false;
            if (this._editor_val == val) {
                this.checked = true;
                this._preChecked = true;
            }
            else {
                // In a detached DOM tree, there is no relationship between the
                // input elements, so we need to uncheck any element that does
                // not match the value
                this.checked = false;
                this._preChecked = false;
            }
        });
        triggerChange(conf._input.find('input:checked'));
    },
    update(conf, options, append) {
        let currVal = radio.get(conf);
        radio._addOptions(conf, options, append);
        // Select the current value if it exists in the new data set, otherwise
        // select the first radio input so there is always a value selected
        let inputs = conf._input.find('input');
        radio.set(conf, inputs.filter('[value="' + currVal + '"]').count() ? currVal : inputs.eq(0).attr('value'));
    }
});

const tags = {
    canReturnSubmit(conf) {
        return false;
    },
    create(conf) {
        var _a;
        // Defaults
        if (conf.multiple === undefined) {
            conf.multiple = true;
        }
        if (conf.multiple === false) {
            conf.limit = 1;
        }
        if (conf.unique === undefined) {
            conf.unique = true;
        }
        if (conf.escapeLabelHtml === undefined) {
            conf.escapeLabelHtml = true;
        }
        let i18n = conf.i18n || {};
        // DOM elements
        conf._display = Dom.c('div');
        conf._labels = Dom.c('div')
            .classAdd('dte-tags')
            .attr('id', safeDomId(conf.id))
            .appendTo(conf._display);
        conf._add = Dom.c('button')
            .classAdd('dte-tag-add')
            .html(this.i18n(i18n.addButton, 'field.tags.addButton'))
            .appendTo(conf._display);
        conf._removeIcon = this.i18n((_a = conf.i18n) === null || _a === void 0 ? void 0 : _a.removeIcon, 'field.tags.removeIcon');
        // Dynamic options can get got from the Editor Ajax url, or from a
        // specified location
        let ajax = conf.ajax === true
            ? typeof this.s.ajax === 'string'
                ? this.s.ajax
                : this.s.ajax.url
            : conf.ajax;
        conf._enabled = true;
        conf._dropdown = new DropDown(conf._display, {
            ajax: ajax,
            ajaxData: util.object.assign({}, conf.ajaxData, {
                [this.s.actionName]: 'search',
                field: conf.name
            }),
            escapeHtml: conf.escapeLabelHtml,
            order: conf.optionsOrder,
            options: conf.options || [],
            renderer: conf.display,
            search: true,
            select: (val) => {
                let idx;
                let list = tags.get(conf, true).slice();
                // Adding a new value to the array
                if (conf._changeVal === null) {
                    idx = list.indexOf(val);
                    // Only add if unique, or uniqueness is not required
                    if (idx === -1 || conf.unique === false) {
                        list.push(val);
                        tags.set(conf, list);
                        tagFocus(conf._display, list.length - 1);
                    }
                }
                else {
                    idx = list.indexOf(conf._changeVal);
                    // Changing an existing value
                    if (idx !== -1) {
                        if (conf.unique === false) {
                            // Not bothered about uniqueness
                            list.splice(idx, 1, val);
                            tags.set(conf, list);
                            tagFocus(conf._display, idx);
                        }
                        else {
                            // Need to check if the value is unique, discounting the current one
                            // that we are going to replace.
                            list.splice(idx, 1);
                            let cnt = list.filter((o) => o === val).length;
                            if (cnt === 0) {
                                list.splice(idx, 0, val);
                                tags.set(conf, list);
                                tagFocus(conf._display, idx);
                            }
                        }
                    }
                }
            },
            i18n: {
                inputPlaceholder: this.i18n(i18n.inputPlaceholder, 'field.tags.inputPlaceholder'),
                noResults: this.i18n(i18n.noResults, 'field.tags.noResults'),
                title: i18n.title,
                placeholder: this.i18n(i18n.placeholder, 'field.tags.placeholder')
            }
        });
        // When model editing, it needs to be attached to the model to allow for focus capture,
        // otherwise the dropdown is attached to the body (inline and bubble).
        this.on('open', (e, mode, action) => {
            conf._dropdown.attachTo(mode === 'main' && !tags.dropDownBody
                ? this.s.displayController.node()
                : 'body');
        });
        // Click handler on clear
        conf._labels.on('click', 'div.dte-tag-clear', function () {
            if (!conf._enabled) {
                return;
            }
            let data = Dom.s(this.parentNode).data('value');
            let list = tags.get(conf, true).slice();
            let idx = list.indexOf(data);
            if (idx !== -1) {
                list.splice(idx, 1);
            }
            tags.set(conf, list);
            // Need a small delay otherwise this will activate the button if triggered by return key
            setTimeout(() => conf._add.focus(), 50);
        });
        // Click handler on value - change that tag
        conf._labels.on('click', 'div.dte-tag-label', function () {
            if (!conf._enabled) {
                return;
            }
            let data = Dom.s(this.parentNode).data('value');
            conf._dropdown.show(this);
            conf._changeVal = data;
        });
        // Click on a "+ Add" tag - removed if the limit is reached
        conf._add.on('click', function () {
            if (!conf._enabled) {
                return;
            }
            conf._changeVal = null;
            conf._dropdown.filter('').show(this);
        });
        // Return key press - trigger action on focused item
        conf._display.on('keydown', function (e) {
            if (e.keyCode === 13) {
                Dom.s(e.target).trigger('click');
            }
        });
        this.on('close', () => conf._dropdown.hide());
        return conf._display.get(0);
    },
    destroy(conf) {
        conf._display.empty().off();
        conf._dropdown.destroy();
    },
    disable(conf) {
        conf._enabled = false;
        conf._display.classAdd('dte-tags-disabled');
    },
    enable(conf) {
        conf._enabled = true;
        conf._display.classRemove('dte-tags-disabled');
    },
    get(conf, arrayValue = false) {
        let val = conf._val;
        // Internal only
        if (arrayValue) {
            return val;
        }
        if (conf.multiple === false) {
            return val.length ? val[0] : null;
        }
        return conf.separator ? val.join(conf.separator) : val;
    },
    input(conf) {
        return conf._labels;
    },
    set(conf, val) {
        // The field default is an empty string, which isn't very useful when we are using an
        // array as the value. So treat empty string as an empty value.
        if (val === '' || val === null) {
            val = [];
        }
        if (conf.multiple && !Array.isArray(val) && conf.separator) {
            val = typeof val === 'string' ? val.split(conf.separator) : [];
        }
        // Internally in this field type, the value is an array
        if (!Array.isArray(val)) {
            val = [val];
        }
        conf._val = val;
        conf._add.css('display', !conf.limit || val.length < conf.limit ? 'inline-block' : 'none');
        conf._labels.empty();
        let asyncQueue = [];
        // Update the display for the items
        for (let i = 0; i < val.length; i++) {
            // Find the label from the value
            let optionLabel = conf._dropdown.label(val[i]);
            let displayLabel;
            let labelEl = Dom.c('div');
            if (optionLabel === null && val[i] !== null) {
                // Need to Ajax load this option
                displayLabel = '<div class="dte-tag-loading"></div>';
                asyncQueue.push({
                    value: val[i],
                    el: labelEl
                });
            }
            else {
                displayLabel = optionLabel;
            }
            Dom.c('div')
                .classAdd('dte-tag')
                .data('value', val[i])
                .append(labelEl
                .classAdd('dte-tag-label')
                .attr('tabindex', 0)
                .html(displayLabel))
                .append(Dom.c('div')
                .classAdd('dte-tag-clear')
                .attr('tabindex', 0)
                .html(conf._removeIcon))
                .appendTo(conf._labels);
        }
        // If any of the labels were not found, then we need an Ajax request to get them
        if (asyncQueue.length) {
            conf._dropdown.asyncLabels(asyncQueue, (item, label) => {
                item.el.html(label);
            });
        }
        triggerChange(conf._labels);
    },
    update(conf, options, append) {
        // Only update options if not Ajax. No point in doing it for the Ajax
        // case. Ideally the backend shouldn't send options when not needed.
        if (!conf.ajax) {
            conf._dropdown.options(options, append);
        }
    },
    owns(conf, node) {
        // The element has been removed from the DOM - probably a click to
        // remove X box, so it is "owned" by this control
        if (Dom.s(node).closest('body').count() === 0) {
            return true;
        }
        // Is an element in the display field
        if (conf._display.find(node).count() !== 0) {
            return true;
        }
        // Is a dropdown element
        if (conf._dropdown.owns(node)) {
            return true;
        }
        return false;
    }
};
function tagFocus(container, idx) {
    container
        .find('div.dte-tag-label')
        .eq(idx)
        .focus();
}

var text = util.object.assignDeep({}, baseFieldType, {
    create(conf) {
        conf._input = Dom.c('input').attr(util.object.assign({
            id: safeDomId(conf.id),
            type: 'text'
        }, conf.attr || {}));
        return conf._input.get(0);
    }
});

var textarea = util.object.assignDeep({}, baseFieldType, {
    canReturnSubmit(conf, node) {
        return false;
    },
    create(conf) {
        conf._input = Dom.c('textarea').attr(util.object.assign({
            id: safeDomId(conf.id)
        }, conf.attr || {}));
        return conf._input.get(0);
    }
});

const upload = util.object.assignDeep({}, baseFieldType, {
    canReturnSubmit(conf, node) {
        return false;
    },
    create(conf) {
        conf._many = false;
        let editor = this;
        let container = commonUpload(upload, editor, conf, function (val) {
            upload.set.call(editor, conf, val[0]);
            editor._event('postUpload', [conf.name, val[0]]);
        });
        return container;
    },
    disable(conf) {
        conf._input.find('input').prop('disabled', true);
        conf._enabled = false;
    },
    enable(conf) {
        conf._input.find('input').prop('disabled', false);
        conf._enabled = true;
    },
    get(conf) {
        return conf._val;
    },
    set(conf, val) {
        conf._val = val;
        conf._input.val('');
        let container = conf._input;
        if (conf.display) {
            let rendered = container.find('div.rendered');
            if (conf._val) {
                rendered.html(conf.display(conf._val));
            }
            else {
                rendered
                    .empty()
                    .append('<span>' + this.i18n(conf.noFileText, 'field.upload.noFile') + '</span>');
            }
        }
        let button = container.find('div.clearValue button');
        let clearText = this.i18n(conf.clearText, 'field.upload.clear');
        if (val && clearText) {
            button.html(clearText);
            container.classRemove('noClear');
        }
        else {
            container.classAdd('noClear');
        }
        conf._input.find('input').trigger('upload.editor', false, [conf._val]);
    }
});

const uploadMany = util.object.assignDeep({}, baseFieldType, {
    _showHide(conf) {
        if (!conf.limit) {
            return;
        }
        conf._container
            .find('div.limitHide')
            .css('display', conf._val.length >= conf.limit ? 'none' : 'block');
        // Used by the Editor.upload static function to truncate if too many
        // files are selected for upload
        conf._limitLeft = conf.limit - conf._val.length;
    },
    canReturnSubmit(conf, node) {
        return false;
    },
    create(conf) {
        conf._many = true;
        let editor = this;
        let container = commonUpload(uploadMany, editor, conf, function (val) {
            conf._val = conf._val.concat(val);
            uploadMany.set.call(editor, conf, conf._val);
            editor._event('postUpload', [conf.name, conf._val]);
        }, true);
        container.classAdd('multi').on('click', 'button.remove', function (e) {
            e.stopPropagation();
            if (conf._enabled) {
                let idx = Dom.s(this).data('idx');
                conf._val.splice(idx, 1);
                uploadMany.set.call(editor, conf, conf._val);
            }
        });
        conf._container = container;
        return container;
    },
    disable(conf) {
        conf._input.find('input').prop('disabled', true);
        conf._enabled = false;
    },
    enable(conf) {
        conf._input.find('input').prop('disabled', false);
        conf._enabled = true;
    },
    get(conf) {
        return conf._val;
    },
    set(conf, val) {
        // Default value for fields is an empty string, whereas we want []
        if (!val) {
            val = [];
        }
        if (!Array.isArray(val)) {
            throw new Error('Upload collections must have an array as a value');
        }
        conf._val = val;
        conf._input.val('');
        let that = this;
        let container = conf._input;
        if (conf.display) {
            let rendered = container.find('div.rendered').empty();
            if (val.length) {
                let list = Dom.c('ul').appendTo(rendered);
                val.forEach(function (file, i) {
                    let display = conf.display(file, i);
                    if (display !== null) {
                        list.append('<li>' +
                            display +
                            ' <button class="' +
                            that.classes.form.button +
                            ' remove" data-idx="' +
                            i +
                            '">&times;</button>' +
                            '</li>');
                    }
                });
            }
            else {
                rendered.append('<span>' + this.i18n(conf.noFileText, 'field.uploadMany.noFiles') + '</span>');
            }
        }
        uploadMany._showHide(conf);
        conf._input.find('input').trigger('upload.editor', false, [conf._val]);
    }
});

var fieldTypes = {
    autocomplete,
    checkbox,
    datatable,
    datetime,
    hidden,
    password,
    radio,
    tags,
    readonly,
    select,
    text,
    textarea,
    upload,
    uploadMany
};

const formOptions = {
    buttons: true,
    drawType: false,
    focus: 0,
    message: true,
    nest: false,
    onBackground: 'blur',
    onBlur: 'close',
    onComplete: 'close',
    onEsc: 'close',
    onFieldError: 'focus',
    onReturn: 'submit',
    refresh: false,
    scope: 'row',
    submit: 'all',
    submitHtml: '▶',
    submitTrigger: null,
    title: true
};

var defaults$1 = {
    actionName: 'action',
    ajax: null,
    dataSrc: null,
    display: 'lightbox',
    domTable: null,
    events: {},
    fields: [],
    formOptions: {
        bubble: util.object.assign({}, formOptions, {
            buttons: '_basic',
            message: false,
            submit: 'changed',
            title: false
        }),
        inline: util.object.assign({}, formOptions, {
            buttons: false,
            submit: 'changed'
        }),
        main: util.object.assign({}, formOptions)
    },
    i18n: {
        close: 'Close',
        create: {
            button: 'New',
            submit: 'Create',
            title: 'Create new entry'
        },
        datetime: {
            amPm: ['am', 'pm'],
            hours: 'Hour',
            minutes: 'Minute',
            months: [
                'January',
                'February',
                'March',
                'April',
                'May',
                'June',
                'July',
                'August',
                'September',
                'October',
                'November',
                'December'
            ],
            next: 'Next',
            previous: 'Previous',
            seconds: 'Second',
            unknown: '-',
            weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        },
        edit: {
            button: 'Edit',
            submit: 'Update',
            title: 'Edit entry'
        },
        error: {
            system: 'A system error has occurred (<a target="_blank" href="//datatables.net/tn/12">More information</a>).'
        },
        field: {
            autocomplete: {
                noResults: 'No results found',
                placeholder: 'Type to search'
            },
            errorText: 'This value is invalid.',
            tags: {
                addButton: '+ Add',
                inputPlaceholder: '',
                noResults: 'No results found',
                placeholder: 'Type to search',
                removeIcon: '&times;'
            },
            upload: {
                choose: 'Choose file...',
                clear: '',
                dragDrop: 'Drag and drop a file here to upload',
                noFile: 'No file',
                processing: 'Processing',
                uploading: 'Uploading file'
            },
            uploadMany: {
                choose: 'Choose file...',
                dragDrop: 'Drag and drop a file here to upload',
                noFiles: 'No files',
                processing: 'Processing',
                uploading: 'Uploading file'
            }
        },
        multi: {
            info: 'The selected items contain different values for this input. To edit and set all items for this input to the same value, click or tap here, otherwise they will retain their individual values.',
            noMulti: 'This input can be edited individually, but not part of a group.',
            restore: 'Undo changes',
            title: 'Multiple values'
        },
        remove: {
            button: 'Delete',
            confirm: {
                1: 'Are you sure you wish to delete 1 row?',
                _: 'Are you sure you wish to delete %d rows?'
            },
            submit: 'Delete',
            title: 'Delete',
        }
    },
    idSrc: 'DT_RowId',
    table: null,
    template: null,
    on: {}
};

const defaults = {
    className: '',
    compare: null,
    data: '',
    def: '',
    entityDecode: true,
    errorText: defaults$1.i18n.field.errorText,
    fieldInfo: '',
    getFormatter: null,
    id: '',
    label: '',
    labelInfo: '',
    message: '',
    multiEditable: true,
    name: null,
    nullDefault: false,
    setFormatter: null,
    submit: true,
    type: 'text'
};

class Field {
    constructor(options, classes, host) {
        let that = this;
        let multiI18n = host.internalI18n().multi;
        let opts = util.object.assignDeep({}, Field.defaults, options);
        if (!fieldTypes[opts.type]) {
            throw new Error('Error adding field - unknown field type ' + opts.type);
        }
        this.s = {
            classes,
            hiding: false,
            host,
            multiIds: [],
            multiValue: false,
            multiValues: {},
            name: opts.name,
            opts,
            processing: false,
            type: fieldTypes[opts.type],
        };
        // No id, so assign one to have the label reference work
        if (!opts.id) {
            opts.id = ('DTE_Field_' + opts.name).replace(/ /g, '_');
        }
        // If no `data` option is given, then we use the name from the field as the
        // data prop to read data for the field from DataTables
        if (opts.data === '') {
            opts.data = opts.name;
        }
        // Get and set functions in the data object for the record
        this.valFromData = function (d) {
            // wrapper to automatically pass `editor` as the type
            return dataGet(opts.data)(d, 'editor');
        };
        this.valToData = dataSet(opts.data); // set val to data
        this.dom = {
            container: Dom.c('div')
                .classAdd([
                classes.wrapper,
                classes.typePrefix + opts.type,
                classes.namePrefix + opts.name,
                opts.className
            ]),
            fieldError: Dom.c('div').classAdd(classes['msg-error']),
            fieldInfo: Dom.c('div').classAdd(classes['msg-info']).html(opts.fieldInfo),
            fieldMessage: Dom.c('div').classAdd(classes['msg-message']).html(opts.message),
            inputContainer: Dom.c('div').classAdd(classes.input),
            inputControl: Dom.c('div').classAdd(classes.inputControl),
            label: Dom
                .c('label')
                .classAdd(classes.label)
                .attr('for', safeDomId(opts.id, '#'))
                .html(opts.label),
            labelInfo: Dom
                .c('div')
                .classAdd(classes['msg-label'])
                .html(opts.labelInfo),
            multi: Dom.c('div').classAdd(classes.multiValue),
            multiInfo: Dom.c('span').classAdd(classes.multiInfo).html(multiI18n.info),
            multiTitle: Dom.c('span').html(multiI18n.title),
            multiReturn: Dom.c('div').classAdd(classes.multiRestore).html(multiI18n.restore),
            processing: Dom.c('div').classAdd(classes.processing).append(Dom.c('span'))
        };
        // Build the HTML structure
        this.dom.container.append([
            this.dom.label.append(this.dom.labelInfo),
            this.dom.inputContainer.append([
                this.dom.inputControl,
                this.dom.multi.append([
                    this.dom.multiTitle,
                    this.dom.multiInfo
                ]),
                this.dom.multiReturn,
                this.dom.fieldError,
                this.dom.fieldMessage,
                this.dom.fieldInfo,
            ]),
            this.dom.processing
        ]);
        let input = this._typeFn('create', opts);
        if (input && input.side) {
            this.dom.label.append(input.side);
            input = input.input;
        }
        if (input !== null) {
            this.dom.inputControl.prepend(input);
        }
        else {
            // Hidden field, so nothing to have a link to
            that.dom.container.css('display', 'none');
            that.dom.container.find('label').attrRemove('for');
        }
        // On click - set a common value for the field
        this.dom.multi.on('click', function () {
            if (that.s.opts.multiEditable && !that.dom.container.classHas(classes.disabled) && opts.type !== 'readonly') {
                that.val('');
                that.focus();
            }
        });
        this.dom.multiReturn.on('click', function () {
            that.multiRestore();
        });
        // If focusing on a field which is sliding closed, need to move on to the next
        // as there is no point in focusing on a hidden field
        this.input().on('focus', () => {
            if (this.s.hiding) {
                let fields = host.fields();
                let ourIdx = fields.indexOf(this.s.name);
                let next = fields[ourIdx + 1];
                if (next) {
                    host.field(next).focus();
                }
            }
        });
        // Field type extension methods - add a method to the field for the public
        // methods that each field type defines beyond the default ones that already
        // exist as part of this instance
        util.object.each(this.s.type, function (name, fn) {
            if (typeof fn === 'function' && that[name] === undefined) {
                that[name] = function () {
                    let args = Array.prototype.slice.call(arguments);
                    args.unshift(name);
                    let ret = that._typeFn.apply(that, args);
                    // Return the given value if there is one, or the field instance
                    // for chaining if there is no value
                    return ret === undefined ?
                        that :
                        ret;
                };
            }
        });
    }
    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     * Public
     */
    def(set) {
        let opts = this.s.opts;
        if (set === undefined) {
            // Backwards compat
            let def = opts['default'] !== undefined ?
                opts['default'] :
                opts.def;
            return typeof def === 'function' ?
                def() :
                def;
        }
        opts.def = set;
        return this;
    }
    disable() {
        this.dom.container.classAdd(this.s.classes.disabled);
        this._typeFn('disable');
        return this;
    }
    displayed() {
        let container = this.dom.container;
        return container.closest('body').count() && container.css('display') !== 'none' ?
            true :
            false;
    }
    enable(toggle = true) {
        if (toggle === false) {
            return this.disable();
        }
        this.dom.container.classRemove(this.s.classes.disabled);
        this._typeFn('enable');
        return this;
    }
    enabled() {
        return this.dom.container.classHas(this.s.classes.disabled) === false;
    }
    error(msg, fn) {
        let classes = this.s.classes;
        // Add or remove the error class
        if (msg) {
            if (msg === true) {
                msg = this.s.opts.errorText;
            }
            this.dom.container.classAdd(classes.error);
            this.input().classAdd(classes.inputError);
        }
        else {
            this.dom.container.classRemove([classes.error, 'dte-validated']);
            this.input().classRemove(classes.inputError);
        }
        this._typeFn('errorMessage', msg);
        return this._msg(this.dom.fieldError, msg, fn);
    }
    fieldInfo(msg) {
        return this._msg(this.dom.fieldInfo, msg);
    }
    isMultiValue() {
        return this.s.multiValue && this.s.multiIds.length !== 1;
    }
    inError() {
        return this.dom.container.classHas(this.s.classes.error);
    }
    input() {
        return this.s.type.input ?
            this._typeFn('input') :
            this.dom.container.find('input, select, textarea');
    }
    focus() {
        if (this.s.type.focus) {
            this._typeFn('focus');
        }
        else {
            this.input().focus();
        }
        return this;
    }
    get() {
        // When multi-value a single get is undefined
        if (this.isMultiValue()) {
            return undefined;
        }
        return this._format(this._typeFn('get'), this.s.opts.getFormatter);
    }
    hide(animate) {
        let el = this.dom.container;
        let opacity = parseFloat(Dom.s(this.s.host.displayNode()).css('opacity'));
        if (animate === undefined) {
            animate = true;
        }
        if (this.s.host.display() && opacity > 0.5 && animate) {
            this.s.hiding = true;
            slideUp(el, () => {
                this.s.hiding = false;
                el.css('display', 'none');
            });
        }
        else {
            el.css('display', 'none');
        }
        return this;
    }
    label(str) {
        let label = this.dom.label;
        let labelInfo = this.dom.labelInfo.detach();
        if (str === undefined) {
            return label.html();
        }
        label.html(str);
        label.append(labelInfo);
        return this;
    }
    labelInfo(msg) {
        return this._msg(this.dom.labelInfo, msg);
    }
    message(msg, fn) {
        return this._msg(this.dom.fieldMessage, msg, fn);
    }
    // There is no `multiVal()` as its arguments could be ambiguous
    // id is an idSrc value _only_
    multiGet(id) {
        let value;
        let multiValues = this.s.multiValues;
        let multiIds = this.s.multiIds;
        let isMultiValue = this.isMultiValue();
        if (id === undefined) {
            let fieldVal = this.val();
            // Get an object with the values for each item being edited
            value = {};
            for (let multiId of multiIds) {
                value[multiId] = isMultiValue ?
                    this._format(multiValues[multiId], this.s.opts.getFormatter) :
                    fieldVal;
            }
        }
        else if (isMultiValue) {
            // Individual value
            value = this._format(multiValues[id], this.s.opts.getFormatter);
        }
        else {
            // Common value
            value = this.val();
        }
        return value;
    }
    multiRestore() {
        this.s.multiValue = true;
        this._multiValueCheck();
    }
    multiSet(id, val, recalc = true) {
        let that = this;
        let multiValues = this.s.multiValues;
        let multiIds = this.s.multiIds;
        if (val === undefined) {
            val = id;
            id = undefined;
        }
        // Set
        let set = function (idSrc, valIn) {
            // Get an individual item's value - add the id to the edit ids if
            // it isn't already in the set.
            if (!multiIds.includes(idSrc)) {
                multiIds.push(idSrc);
            }
            multiValues[idSrc] = that._format(valIn, that.s.opts.setFormatter);
        };
        if (util.is.plainObject(val) && id === undefined) {
            // idSrc / value pairs passed in
            util.object.each(val, function (idSrc, innerVal) {
                set(idSrc, innerVal);
            });
        }
        else if (id === undefined) {
            // Set same value for all existing ids
            multiIds.forEach(idSrc => {
                set(idSrc, val);
            });
        }
        else {
            // Setting an individual property
            set(id, val);
        }
        this.s.multiValue = true;
        if (recalc) {
            this._multiValueCheck();
        }
        return this;
    }
    name() {
        return this.s.opts.name;
    }
    node() {
        return this.dom.container.get(0);
    }
    nullDefault() {
        return this.s.opts.nullDefault;
    }
    processing(set) {
        if (set === undefined) {
            return this.s.processing;
        }
        this.dom.processing.css('display', set ? 'block' : 'none');
        this.s.processing = set;
        this.s.host.internalEvent('processing-field', [set]);
        return this;
    }
    // multiCheck is not publicly documented
    set(val, multiCheck = true) {
        let decodeFn = function (d) {
            return typeof d !== 'string' ?
                d :
                d
                    .replace(/&gt;/g, '>')
                    .replace(/&lt;/g, '<')
                    .replace(/&amp;/g, '&')
                    .replace(/&quot;/g, '"')
                    .replace(/&#163;/g, '£')
                    .replace(/&#0?39;/g, '\'')
                    .replace(/&#0?10;/g, '\n');
        };
        this.s.multiValue = false;
        let decode = this.s.opts.entityDecode;
        if (decode === undefined || decode === true) {
            if (Array.isArray(val)) {
                for (let i = 0, ien = val.length; i < ien; i++) {
                    val[i] = decodeFn(val[i]);
                }
            }
            else {
                val = decodeFn(val);
            }
        }
        // If triggered from multi check we don't want to do formatting or multi checking again
        if (multiCheck === true) {
            val = this._format(val, this.s.opts.setFormatter);
            this._typeFn('set', val);
            this._multiValueCheck();
        }
        else {
            this._typeFn('set', val);
        }
        return this;
    }
    show(animate = true, toggle = true) {
        if (toggle === false) {
            return this.hide(animate);
        }
        let el = this.dom.container;
        let opacity = parseFloat(Dom.s(this.s.host.displayNode()).css('opacity'));
        if (this.s.host.display() && opacity > 0.5 && animate) {
            el.css('display', '');
            slideDown(el, () => { });
        }
        else {
            el.css('display', ''); // empty to restore css default (flex or block)
        }
        return this;
    }
    submittable(flag = null) {
        if (flag === undefined || flag === null) {
            return this.s.opts.submit;
        }
        this.s.opts.submit = flag;
        return this;
    }
    type() {
        return this.s.opts.type;
    }
    update(options, append = false) {
        if (this.s.type.update) {
            this._typeFn('update', options, append);
        }
        return this;
    }
    val(val) {
        return val === undefined ?
            this.get() :
            this.set(val);
    }
    /**
     * Validate the field using HTML5 validation (client-side only - server-side
     * validation flagging happens in the Ajax response).
     *
     * @param clearOnValid If true, the error message will be cleared if valid
     * @returns `false` if invalid.
     */
    validate(clearOnValid = false) {
        this.dom.container.classAdd('dte-validated');
        if (this.enabled() && this.dom.container.find(':invalid').count()) {
            this.error(true);
            return false;
        }
        // Don't want this to happen on a regular submit - error messages are
        // cleared when the server-side process returns
        if (clearOnValid) {
            this.error('');
        }
        return true;
    }
    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     * Internal - Called from Editor only and are not publicly documented -
     * these APIs can change!
     */
    compare(value, original) {
        let compare = this.s.opts.compare || deepCompare;
        return compare(value, original);
    }
    dataSrc() {
        return this.s.opts.data;
    }
    destroy() {
        // remove element
        this.dom.container.remove();
        // field's own destroy method if there is one
        this._typeFn('destroy');
        return this;
    }
    multiEditable() {
        return this.s.opts.multiEditable;
    }
    multiIds() {
        return this.s.multiIds;
    }
    multiInfoShown(show) {
        this.dom.multiInfo.css({ display: show ? 'block' : 'none' });
    }
    multiReset() {
        this.s.multiIds = [];
        this.s.multiValues = {};
    }
    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     * Internal
     */
    _msg(el, msg, fn) {
        if (msg === undefined) {
            return el.html();
        }
        if (typeof msg === 'function') {
            let editor = this.s.host;
            msg = msg(editor, new DataTable.Api(editor.internalSettings().table));
        }
        if (el.parent().isVisible()) {
            if (msg) {
                if (el.isVisible()) {
                    el.html(msg);
                }
                else {
                    el.html(msg).css('display', 'block');
                    slideDown(el, fn || (() => { }), 2);
                }
            }
            else {
                slideUp(el, fn || (() => {
                    el.html(msg).css('display', 'none');
                }));
            }
        }
        else {
            // Not visible, so immediately set, or blank out the element
            el
                .html(msg || '')
                .css('display', msg ? 'block' : 'none');
            if (fn) {
                fn();
            }
        }
        return this;
    }
    _multiValueCheck() {
        let last;
        let ids = this.s.multiIds;
        let values = this.s.multiValues;
        let isMultiValue = this.s.multiValue;
        let isMultiEditable = this.s.opts.multiEditable;
        let val;
        let different = false;
        if (ids) {
            for (let i = 0; i < ids.length; i++) {
                val = values[ids[i]];
                if (i > 0 && !deepCompare(val, last)) {
                    different = true;
                    break;
                }
                last = val;
            }
        }
        if ((different && isMultiValue) || (!isMultiEditable && this.isMultiValue())) {
            // Different values or same values, but not multiple editable
            this.dom.inputControl.css({ display: 'none' });
            this.dom.multi.css({ display: 'block' });
            // Trigger a change event to activate any dependent listeners
            Dom.s(this.node()).trigger('change');
        }
        else {
            // All the same value
            this.dom.inputControl.css({ display: 'block' });
            this.dom.multi.css({ display: 'none' });
            if (isMultiValue && !different) {
                this.set(last, false);
            }
        }
        this.dom.multiReturn.css({
            display: ids && ids.length > 1 && different && !isMultiValue ?
                'block' :
                'none'
        });
        // Update information label
        let i18n = this.s.host.internalI18n().multi;
        this.dom.multiTitle.html(i18n.title); // Update to allow for async i18n loading
        this.dom.multiInfo.html(isMultiEditable ? i18n.info : i18n.noMulti);
        this.dom.multi.classToggle(this.s.classes.multiNoEdit, !isMultiEditable);
        this.s.host.internalMultiInfo();
        return true;
    }
    _typeFn(name, ...args) {
        // Insert the options as the first parameter - all field type methods
        // take the field's configuration object as the first parameter
        args.unshift(this.s.opts);
        let fn = this.s.type[name];
        if (fn) {
            return fn.apply(this.s.host, args);
        }
    }
    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     * Private
     */
    _errorNode() {
        return this.dom.fieldError;
    }
    _format(val, formatter) {
        if (formatter) {
            if (Array.isArray(formatter)) {
                let args = formatter.slice();
                let name = args.shift();
                formatter = Field.formatters[name].apply(this, args);
            }
            return formatter.call(this.s.host, val, this);
        }
        return val;
    }
}
Field.defaults = defaults;
Field.formatters = {};

/**
 * Add a new field to the from. This is the method that is called automatically when
 * fields are given in the initialisation objects as `Editor.defaults.fields`.
 *
 * @param this Editor instance
 * @param cfg The object that describes the field (the full
 *   object is described by `Editor.model.field`. Note that multiple
 *   fields can be given by passing in an array of field definitions.
 * @param after Existing field to insert the new field after. This
 *   can be `undefined` (insert at end), `null` (insert at start) or `string`
 *   the field name to insert after.
 * @param reorder INTERNAL for array adding performance only
 * @returns Editor instance
 */
function add(cfg, after, reorder = true) {
    // Allow multiple fields to be added at the same time
    if (Array.isArray(cfg)) {
        // Do it in reverse to allow fields to appear in the same order given, otherwise,
        // the would appear in reverse if given an `after`
        if (after !== undefined) {
            cfg.reverse();
        }
        for (let cfgDp of cfg) {
            this.add(cfgDp, after, false);
        }
        this._displayReorder(this.order());
        return this;
    }
    let name = cfg.name;
    if (name === undefined) {
        throw new Error('Error adding field. The field requires a `name` option');
    }
    if (this.s.fields[name]) {
        throw new Error('Error adding field \'' + name + '\'. A field already exists with this name');
    }
    // Allow the data source to add / modify the field properties
    // Dev: would this be better as an event `preAddField`? And have the
    // data sources init only once, but can listen for such events? More
    // complexity, but probably more flexible...
    this._dataSource('initField', cfg);
    let editorField = new Field(cfg, this.classes.field, this);
    this.s.fields[name] = editorField;
    if (after === undefined) {
        this.s.order.push(name);
    }
    else if (after === null) {
        this.s.order.unshift(name);
    }
    else {
        let idx = this.s.order.indexOf(after);
        this.s.order.splice(idx + 1, 0, name);
    }
    // If in an editing mode, we need to set the field up for the data
    if (this.s.mode) {
        let editFields = this.s.editFields;
        editorField.multiReset();
        util.object.each(editFields, function (idSrc, editIn) {
            let value;
            if (editIn.data) {
                value = editorField.valFromData(editIn.data);
            }
            editorField.multiSet(idSrc, value !== undefined ?
                value :
                editorField.def());
        });
    }
    if (reorder !== false) {
        this._displayReorder(this.order());
    }
    return this;
}
function ajax(newAjax) {
    if (newAjax) {
        this.s.ajax = newAjax;
        return this;
    }
    return this.s.ajax;
}
/**
 * Perform background activation tasks.
 *
 * This is NOT publicly documented on the Editor web-site, but rather can be
 * used by display controller plug-ins to perform the required task on
 * background activation.
 *
 * @param this Editor instance
 * @returns Editor instance
 */
function background() {
    let onBackground = this.s.editOpts.onBackground;
    if (typeof onBackground === 'function') {
        onBackground(this);
    }
    else if (onBackground === 'blur') {
        this.blur();
    }
    else if (onBackground === 'close') {
        this.close();
    }
    else if (onBackground === 'submit') {
        this.submit();
    }
    return this;
}
/**
 * Blur the currently displayed editor.
 *
 * A blur is different from a `close()` in that it might cause either a close or
 * the form to be submitted. A typical example of a blur would be clicking on
 * the background of the bubble or main editing forms - i.e. it might be a
 * close, or it might submit depending upon the configuration, while a click on
 * the close box is a very definite close.
 *
 * @returns Editor instance
 */
function blur() {
    this._blur();
    return this;
}
function bubble(cells, fieldNames, showIn = true, opts) {
    let that = this;
    // Some other field in inline edit mode?
    if (this._tidy(function () {
        that.bubble(cells, fieldNames, opts);
    })) {
        return this;
    }
    // Argument shifting
    if (util.is.plainObject(fieldNames)) {
        opts = fieldNames;
        fieldNames = undefined;
        showIn = true;
    }
    else if (typeof fieldNames === 'boolean') {
        showIn = fieldNames;
        fieldNames = undefined;
        opts = undefined;
    }
    if (util.is.plainObject(showIn)) {
        opts = showIn;
        showIn = true;
    }
    if (showIn === undefined) {
        showIn = true;
    }
    opts = util.object.assign({}, this.s.formOptions.bubble, opts);
    let editFields = () => this._dataSource('individual', cells, fieldNames);
    this._editRefresh(cells, editFields, 'bubble', opts, () => {
        let namespace = '.dte' + this.s.unique + this._formOptions(opts);
        let ret = this._preopen('bubble');
        if (!ret) {
            return this;
        }
        // Keep the bubble in position on resize
        Dom.w.on('resize.' + namespace + ' scroll.' + namespace, () => {
            this.bubblePosition();
        });
        // Store the nodes this are being used so the bubble can be positioned
        let nodes = [];
        this.s.bubbleNodes = nodes.concat(...pluck(editFields(), 'attach'));
        // Create container display
        let classes = this.classes.bubble;
        let backgroundNode = Dom.c('div').classAdd(classes.bg).append(Dom.c('div'));
        let container = Dom
            .c('div')
            .classAdd(classes.wrapper)
            .append(Dom
            .c('div')
            .classAdd(classes.liner)
            .append(Dom
            .c('div')
            .classAdd(classes.table)
            .append(Dom
            .c('div')
            .classAdd(classes.close)
            .attr('title', this.i18n(null, 'close')))
            .append(Dom
            .c('div')
            .classAdd('DTE_Processing_Indicator')
            .append(Dom.c('span')))))
            .append(Dom.c('div').classAdd(classes.pointer));
        if (showIn) {
            // Sanity check - can't insert into multiple places!
            if (opts.insertPoint && Dom.s(opts.insertPoint).count() > 1) {
                throw new Error('Bubble insert selector ambagious - would match multiple elements');
            }
            container.appendTo(opts.insertPoint || 'body');
            backgroundNode.appendTo('body');
        }
        let liner = container.children().eq(0);
        let tableNode = liner.children();
        let closeNode = tableNode.children();
        liner.append(this.dom.formError);
        tableNode.prepend(this.dom.form);
        if (opts.message) {
            liner.prepend(this.dom.formInfo);
        }
        if (opts.title) {
            liner.prepend(this.dom.header);
        }
        if (opts.buttons) {
            tableNode.append(this.dom.buttons);
        }
        // Need to use a small anon function here as the animate callback is the scope
        // of the element being animated and TS won't allow access to the private methods
        let finish = () => {
            this._clearDynamicInfo();
            this._event('closed', ['bubble']);
        };
        let pair = new Dom().add(container).add(backgroundNode);
        this._closeReg(submitComplete => {
            pair.transition({ opacity: '0' }, null, null, function () {
                pair.detach();
                Dom.w.off('resize.' + namespace + ' scroll.' + namespace);
                finish();
            });
        });
        // Close event handlers
        backgroundNode.on('click', () => {
            this.blur();
        });
        closeNode.on('click', () => {
            this._close();
        });
        this.bubblePosition();
        this._postopen('bubble', false);
        let opened = () => {
            this._focus(this.s.includeFields, opts.focus);
            this._event('opened', ['bubble', this.s.action]);
        };
        pair.css('opacity', '0').transition({ opacity: '1' }, null, null, () => {
            opened();
        });
        // Called again after being attached to the document
        setTimeout(() => {
            if (this.s) {
                this.bubblePosition();
            }
        }, 10);
    });
    return this;
}
function bubbleLocation(location) {
    if (!location) {
        return this.s.bubbleLocation;
    }
    this.s.bubbleLocation = location;
    this.bubblePosition();
    return this;
}
/**
 * Reposition the editing bubble (`bubble()`) when it is visible. This can be
 * used to update the bubble position if other elements on the page change
 * position. Editor will automatically call this method on window resize.
 *
 * @returns Editor instance
 */
function bubblePosition() {
    let wrapper = Dom.s('div.DTE_Bubble');
    let liner = Dom.s('div.DTE_Bubble_Liner');
    let nodes = this.s.bubbleNodes;
    // Average the node positions to insert the container
    let position = { bottom: 0, left: 0, right: 0, top: 0 };
    nodes.forEach(nodeIn => {
        let pos = Dom.s(nodeIn).offset();
        position.top += pos.top;
        position.left += pos.left;
        position.right += pos.left + nodeIn.offsetWidth;
        position.bottom += pos.top + nodeIn.offsetHeight;
    });
    // Take the average
    position.top /= nodes.length;
    position.left /= nodes.length;
    position.right /= nodes.length;
    position.bottom /= nodes.length;
    let top = position.top;
    let left = (position.left + position.right) / 2;
    let width = liner.width('outer');
    let height = liner.height('outer');
    let docWidth = Dom.w.width();
    let viewportTop = Dom.w.scrollTop();
    let padding = 15;
    let location = this.s.bubbleLocation;
    let initial = location !== 'auto'
        ? location
        : this.s.bubbleBottom
            ? 'bottom'
            : 'top';
    // Show above or below depending on bubbleBottom
    wrapper
        .css({
        left: left + 'px',
        top: (initial === 'bottom' ? position.bottom : top) + 'px'
    })
        .classToggle('below', initial === 'bottom');
    let curPosition = wrapper.position();
    // Correct for overflow below the fold
    if (location === 'auto') {
        if (liner.count() &&
            curPosition.top + height > viewportTop + window.innerHeight &&
            curPosition.top - height > 0) {
            wrapper
                .css('top', top + 'px')
                .classRemove('below');
            this.s.bubbleBottom = false;
        }
        else if (liner.count() && curPosition.top - height < viewportTop) {
            // Correct for overflow from the top of the document by positioning below
            // the field if needed
            wrapper
                .css('top', position.bottom + 'px')
                .classAdd('below');
            this.s.bubbleBottom = true;
        }
    }
    // Horizontal positioning of the liner
    let linerLeft = 0;
    if (left + width / 2 < docWidth - padding) {
        // If it fits into the document, positioned half way, do that
        linerLeft = -(width / 2);
    }
    else {
        // It spans past the document, need to move to the left
        linerLeft = -(width - (docWidth - left - padding));
    }
    // Correct to the left - don't allow overflow to the left of the document
    // Note the `+`, linerLeft is negative!
    if (left + linerLeft < padding) {
        linerLeft = -left + padding;
    }
    liner.css('left', linerLeft + 'px');
    return this;
}
/**
 * Setup the buttons that will be shown in the footer of the form - calling this
 * method will replace any buttons which are currently shown in the form.
 *
 * @param this Editor instance
 * @param buttonsIn A single button definition to add to the form or
 *   an array of objects with the button definitions to add more than one button.
 *   The options for the button definitions are fully defined by the
 * @returns Editor instance
 */
function buttons$1(buttonsIn) {
    if (buttonsIn === '_basic') {
        // Special string to create a basic button - undocumented
        buttonsIn = [{
                action() {
                    this.submit();
                },
                text: this.i18n(null, this.s.action + '.submit'),
                className: this.classes.form.buttonSubmit
            }];
    }
    else if (!Array.isArray(buttonsIn)) {
        // Allow a single button to be passed in as an object with an array
        buttonsIn = [buttonsIn];
    }
    Dom.s(this.dom.buttons).empty();
    buttonsIn.forEach((btn, i) => {
        if (typeof btn === 'string') {
            btn = {
                action() {
                    this.submit();
                },
                text: btn,
                className: this.classes.form.buttonSubmit
            };
        }
        let text = btn.text || btn.label; // legacy support
        let action = btn.action || btn.fn; // legacy support
        let attr = btn.attr || {};
        Dom.c('button')
            .classAdd(this.classes.form.button + (btn.className ? ' ' + btn.className : ''))
            .html(typeof text === 'function' ?
            text(this) :
            text || '')
            .attr('tabindex', btn.tabIndex !== undefined ? btn.tabIndex : 0)
            .attr(attr)
            .on('keyup', (e) => {
            if (e.which === 13 && action) {
                action.call(this);
            }
        })
            .on('keypress', (e) => {
            // Stop the browser activating the click event - if we don't
            // have this and the Ajax return is fast, the keyup in
            // `_formOptions()` might trigger another submit
            if (e.which === 13) {
                e.preventDefault();
            }
        })
            .on('click', (e) => {
            e.preventDefault();
            if (action) {
                action.call(this, e);
            }
        })
            .appendTo(this.dom.buttons);
    });
    return this;
}
/**
 * Remove fields from the form.
 *
 * @param this Editor instance
 * @param fieldName Field to remove
 * @returns Editor instance
 */
function clear(fieldName) {
    let that = this;
    let sFields = this.s.fields;
    if (typeof fieldName === 'string') {
        // Remove an individual form element
        that.field(fieldName).destroy();
        delete sFields[fieldName];
        let orderIdx = this.s.order.indexOf(fieldName);
        this.s.order.splice(orderIdx, 1);
        let includeIdx = this.s.includeFields.indexOf(fieldName);
        if (includeIdx !== -1) {
            this.s.includeFields.splice(includeIdx, 1);
        }
    }
    else {
        this._fieldNames(fieldName).forEach(name => {
            that.clear(name);
        });
    }
    return this;
}
/**
 * Close the form display.
 *
 * @param this Editor instance
 * @returns Editor instance
 */
function close() {
    this._close(false);
    return this;
}
function create(arg1, arg2, arg3, arg4) {
    let that = this;
    let sFields = this.s.fields;
    let count = 1;
    // Some other field in inline edit mode?
    if (this._tidy(function () {
        that.create(arg1, arg2, arg3, arg4);
    })) {
        return this;
    }
    // Multi-row creation support (only supported by the 1.3+ style of calling
    // this method, so a max of three arguments
    if (typeof arg1 === 'number') {
        count = arg1;
        arg1 = arg2;
        arg2 = arg3;
    }
    // Set up the edit fields for submission
    this.s.editFields = {};
    for (let i = 0; i < count; i++) {
        this.s.editFields[i] = {
            fields: this.s.fields
        };
    }
    let argOpts = this._crudArgs(arg1, arg2, arg3, arg4);
    this.s.mode = 'main';
    this.s.action = 'create';
    this.s.modifier = null;
    this.dom.form.style.display = 'block';
    this._actionClass();
    // Allow all fields to be displayed for the create form
    this._displayReorder(this.fields());
    // Set the default for the fields
    util.object.each(sFields, function (name, fieldIn) {
        let def = fieldIn.def();
        fieldIn.multiReset();
        // Set a value marker for each multi, so the field
        // knows what the id's are (ints in this case)
        for (let i = 0; i < count; i++) {
            fieldIn.multiSet(i, def, false);
        }
        fieldIn.set(def);
    });
    this._event('initCreate', null, () => {
        this._assembleMain();
        this._formOptions(argOpts.opts);
        argOpts.maybeOpen();
    });
    return this;
}
/**
 * Remove dependent links from a field
 *
 * @param this Editor instance
 * @param parent The name of the field to remove the existing dependencies
 * @returns Editor instance
 */
function undependent(parent) {
    if (Array.isArray(parent)) {
        for (let i = 0, ien = parent.length; i < ien; i++) {
            this.undependent(parent[i]);
        }
        return this;
    }
    Dom.s(this.field(parent).node()).off('.edep');
    return this;
}
/**
 * Create a dependent link between two or more fields. This method is used to
 * listen for a change in a field's value which will trigger updating of the
 * form. This update can consist of updating an options list, changing values
 * or making fields hidden / visible.
 *
 * @param this Editor instance
 * @param parent Field(s) to attach a dependency to
 * @param url Action to perform on data change
 * @param optsIn Configuration options
 * @returns Editor instance
 */
function dependent(parent, url, optsIn) {
    if (Array.isArray(parent)) {
        for (let i = 0, ien = parent.length; i < ien; i++) {
            this.dependent(parent[i], url, optsIn);
        }
        return this;
    }
    let that = this;
    let parentField = this.field(parent);
    let ajaxOpts = {
        url: '',
        dataType: 'json',
        type: 'POST'
    };
    let opts = util.object.assign({}, {
        data: null,
        event: 'change',
        postUpdate: null,
        preUpdate: null
    }, optsIn);
    let update = function (json) {
        if (opts.preUpdate) {
            opts.preUpdate(json);
        }
        // Field specific
        util.object.each({
            errors: 'error',
            labels: 'label',
            messages: 'message',
            options: 'update',
            values: 'val'
        }, function (jsonProp, fieldFn) {
            if (json[jsonProp]) {
                util.object.each(json[jsonProp], function (fieldIn, valIn) {
                    that.field(fieldIn)[fieldFn](valIn);
                });
            }
        });
        // Form level
        ['hide', 'show', 'enable', 'disable'].forEach(key => {
            if (json[key]) {
                that[key](json[key], json.animate);
            }
        });
        if (opts.postUpdate) {
            opts.postUpdate(json);
        }
        parentField.processing(false);
    };
    // Use a delegate handler to account for field elements which are added and
    // removed after `dependent` has been called
    Dom.s(parentField.node()).on(opts.event + '.edep', e => {
        // Make sure that it was one of the field's elements that triggered the ev
        if (Dom.s(parentField.node()).find(e.target).count() === 0 && parentField.node() !== e.target) {
            return;
        }
        parentField.processing(true);
        let data = {};
        data.rows = this.s.editFields ?
            pluck(this.s.editFields, 'data') :
            null;
        data.row = data.rows ?
            data.rows[0] :
            null;
        data.values = this.val();
        if (opts.data) {
            let ret = opts.data(data);
            if (ret) {
                data = ret;
            }
        }
        if (typeof url === 'function') {
            let o = url.call(this, parentField.val(), data, update, e);
            if (o) {
                if (typeof o === 'object' && typeof o.then === 'function') {
                    o.then(function (resolved) {
                        if (resolved) {
                            update(resolved);
                        }
                    });
                }
                else {
                    update(o);
                }
            }
        }
        else {
            if (util.is.plainObject(url)) {
                util.object.assign(ajaxOpts, url);
            }
            else {
                ajaxOpts.url = url;
            }
            DataTable.ajax(util.object.assign(ajaxOpts, {
                data,
                success: update
            }));
        }
    });
    return this;
}
/**
 * Destroy the Editor instance, cleaning up fields, display and event handlers
 */
function destroy() {
    if (this.s.displayed) {
        this.close();
    }
    this.clear();
    // Stick the template back into the document so it can be reused
    if (this.s.template) {
        Dom.s('body').append(this.s.template);
    }
    let controller = this.s.displayController;
    if (controller.destroy) {
        controller.destroy(this);
    }
    // Remove all custom events that were added
    this.s.events.length = 0;
    Dom.s(document).off('.dte' + this.s.unique);
    Dom.w.off('.dte' + this.s.unique);
    // Allow an external storage of Editor instances to know that we are "going away"
    Dom.s(document).trigger('destroyEditor', true, [this]);
    this.dom = null;
    this.s = null;
}
/**
 * Disable one or more field inputs, disallowing subsequent user interaction with the
 * fields until they are re-enabled.
 *
 * @param this Editor instance
 * @param name Field(s) to disable. Disables all if not given.
 * @returns Editor instance
 */
function disable(name) {
    let that = this;
    this._fieldNames(name).forEach(n => {
        that.field(n).disable();
    });
    return this;
}
function display(showIn) {
    if (showIn === undefined) {
        return this.s.displayed;
    }
    return this[showIn ? 'open' : 'close']();
}
/**
 * Get a list of the fields that are currently shown in the Editor form.
 *
 * @param this Editor instance
 * @returns Array of field names
 */
function displayed$2() {
    return util.object
        .map(this.s.fields, function (name, fieldIn) {
        return fieldIn.displayed() ? name : null;
    })
        .filter(f => !!f);
}
/**
 * Get display controller node
 *
 * @returns Display controller host element
 */
function displayNode() {
    return this.s.displayController.node(this);
}
function edit(items, arg1, arg2, arg3, arg4) {
    let that = this;
    // Some other field in inline edit mode?
    if (this._tidy(function () {
        that.edit(items, arg1, arg2, arg3, arg4);
    })) {
        return this;
    }
    let argOpts = this._crudArgs(arg1, arg2, arg3, arg4);
    this._editRefresh(items, () => this._dataSource('fields', items), 'main', argOpts.opts, () => {
        this._assembleMain();
        this._formOptions(argOpts.opts);
        argOpts.maybeOpen();
    });
    return this;
}
/**
 * Enable one or more field inputs, restoring user interaction with the fields.
 *
 * @param this Editor instance
 * @param name Field(s) to enable. If not given, all fields in the form are enabled
 * @returns Editor instance
 */
function enable(name) {
    let that = this;
    this._fieldNames(name).forEach(n => {
        that.field(n).enable();
    });
    return this;
}
function error(name, msg) {
    let wrapper = Dom.s(this.dom.wrapper);
    if (msg === undefined) {
        // Global error
        this._message(this.dom.formError, name, true, function () {
            wrapper.classToggle('inFormError', name !== undefined && name !== '');
        });
        if (name && !Dom.s(this.dom.formError).isVisible()) {
            // Don't have a global error element visible, so flash it up as an alert
            alert(name.replace(/<br>/g, '\n'));
        }
        // Store the error message so `inError` can check if there is an
        // error or not without considering animation
        this.s.globalError = name;
    }
    else {
        // Field error
        this.field(name).error(msg);
    }
    return this;
}
/**
 * Get a field object, configured for a named field, which can then be
 * manipulated through its API.
 *
 * @param this Editor instance
 * @param name Field to get
 * @returns Field instance
 */
function field(name) {
    let sFields = this.s.fields;
    if (!sFields[name]) {
        throw new Error('Unknown field name - ' + name);
    }
    return sFields[name];
}
/**
 * Get a list of the fields that are used by the Editor instance.
 *
 * @param this Editor instance
 * @returns Editor instance
 */
function fields() {
    return util.object.map(this.s.fields, n => n);
}
/**
 * Get data object for a file from a table and id
 *
 * @param name Table name
 * @param id Primary key identifier
 * @returns File information
 */
function file(name, id) {
    let tableFromFile = this.files(name); // can throw. `this` will be Editor or
    let fileFromTable = tableFromFile[id]; //  DataTables.Api context. Both work.
    if (!fileFromTable) {
        throw new Error('Unknown file id ' + id + ' in table ' + name);
    }
    return tableFromFile[id];
}
function files(name) {
    if (!name) {
        return files$1;
    }
    let editorTable = files$1[name];
    if (!editorTable) {
        throw new Error('Unknown file table name: ' + name);
    }
    return editorTable;
}
function get(name) {
    if (!name) {
        name = this.fields();
    }
    if (Array.isArray(name)) {
        let out = {};
        name.forEach(n => {
            out[n] = this.field(n).get();
        });
        return out;
    }
    return this.field(name).get();
}
/**
 * Hide one or more fields from the form display.
 *
 * @param this Editor instance
 * @param names Fields to hide. Will hide all if not given
 * @param animate Animate (default true)
 * @returns Editor instance
 */
function hide$2(names, animate) {
    let that = this;
    this._fieldNames(names).forEach(n => {
        that.field(n).hide(animate);
    });
    return this;
}
/**
 * Look up a translation string from Editor's i18n strings
 *
 * @param this Editor instance
 * @param user User defined string from a configuration variable. This will be used
 *   if it is not null / undefined.
 * @param token Token name to get
 * @param def Default string if no token
 * @returns Looked up translation string
 */
function i18n(user, token, def) {
    if (user !== null && user !== undefined) {
        return user;
    }
    var resolved = DataTable.util.get(token)(this.s.i18n);
    if (resolved === undefined) {
        resolved = def;
    }
    return resolved || '';
}
/**
 * Get the ids of the rows being edited
 *
 * @param includeHash Include a prefixed `#`, useful if to be used as a selector
 */
function ids(includeHash = false) {
    return util.object.map(this.s.editFields, idSrc => {
        return includeHash === true ?
            '#' + idSrc :
            idSrc;
    });
}
/**
 * Determine if there is an error state in the form, either the form's global
 * error message, or one or more fields.
 *
 * @param this Editor instance
 * @param inNames Fields to check. All checked if not given
 * @returns true if in error, false otherwise
 */
function inError(inNames) {
    // Is there a global error?
    if (this.s.globalError) {
        return true;
    }
    // Field specific
    let names = this._fieldNames(inNames);
    for (let i = 0, ien = names.length; i < ien; i++) {
        if (this.field(names[i]).inError()) {
            return true;
        }
    }
    return false;
}
function inline(cell, fieldName, opts) {
    let that = this;
    // Argument shifting
    if (util.is.plainObject(fieldName)) {
        opts = fieldName;
        fieldName = undefined;
    }
    opts = util.object.assign({}, this.s.formOptions.inline, opts);
    let editFieldsFn = () => this._dataSource('individual', cell, fieldName);
    let editFields = editFieldsFn();
    let keys = Object.keys(editFields);
    // Only a single row
    if (keys.length > 1) {
        throw new Error('Cannot edit more than one row inline at a time');
    }
    let editRow = editFields[keys[0]];
    // Remap so easier to use
    let hosts = [];
    for (let row of editRow.attach) {
        hosts.push(row);
    }
    // Already in edit mode for this cell?
    if (Dom.s(hosts).find('div.DTE_Field').count()) {
        return this;
    }
    // Some other field in inline edit mode?
    if (this._tidy(function () {
        that.inline(cell, fieldName, opts);
    })) {
        return this;
    }
    // Start a full row edit, but don't display - we will be showing the field
    this._editRefresh(cell, editFieldsFn, 'inline', opts, () => {
        this._inline(editFields, opts);
    });
    return this;
}
/**
 * Inline creation of data.
 *
 * @param this Editor instance
 * @param insertPoint Where to insert the create row
 * @param opts Form options
 * @returns Editor instance
 */
function inlineCreate(insertPoint, opts) {
    // Argument juggling - allow no insert point, just options
    if (util.is.plainObject(insertPoint)) {
        opts = insertPoint;
        insertPoint = null;
    }
    if (this._tidy(() => {
        this.inlineCreate(insertPoint, opts);
    })) {
        return this;
    }
    // Set the default for the fields
    util.object.each(this.s.fields, function (name, fieldIn) {
        fieldIn.multiReset();
        fieldIn.multiSet(0, fieldIn.def());
    });
    this.s.mode = 'main';
    this.s.action = 'create';
    this.s.modifier = null;
    this.s.editFields = this._dataSource('fakeRow', insertPoint);
    opts = util.object.assign({}, this.s.formOptions.inline, opts);
    this._actionClass();
    this._inline(this.s.editFields, opts, () => {
        // When the form is closed (cancelled or submitted) we need to remove the
        // fake row
        this._dataSource('fakeRowEnd');
    });
    this._event('initCreate', null);
    return this;
}
function message(name, msg) {
    if (msg === undefined) {
        // Global message
        this._message(this.dom.formInfo, name);
    }
    else {
        // Field message
        this.field(name).message(msg);
    }
    return this;
}
function mode(modeIn) {
    if (!modeIn) {
        return this.s.action;
    }
    if (!this.s.action) {
        throw new Error('Not currently in an editing mode');
    }
    else if (this.s.action === 'create' && modeIn !== 'create') {
        throw new Error('Changing from create mode is not supported');
    }
    this.s.action = modeIn;
    return this;
}
/**
 * Get the modifier that was used to trigger the edit or delete action.
 *
 * @returns The identifier that was used for the editing / remove method
 * called.
 */
function modifier() {
    return this.s.modifier;
}
/**
 * Get the values for one or more fields (multi-row editing aware).
 *
 * @param this Editor instance
 * @param fieldNames Fields to get values for, or all fields if not given
 * @returns Editor instance
 */
function multiGet(fieldNames) {
    if (fieldNames === undefined) {
        fieldNames = this.fields();
    }
    if (Array.isArray(fieldNames)) {
        let out = {};
        fieldNames.map(name => {
            out[name] = this.field(name).multiGet();
        });
        return out;
    }
    // String
    return this.field(fieldNames).multiGet();
}
function multiSet(fieldNames, valIn) {
    let that = this;
    if (util.is.plainObject(fieldNames) && valIn === undefined) {
        util.object.each(fieldNames, function (name, value) {
            that.field(name).multiSet(value);
        });
    }
    else {
        this.field(fieldNames).multiSet(valIn);
    }
    return this;
}
function node(name) {
    if (!name) {
        name = this.order();
    }
    return Array.isArray(name) ?
        name.map(n => this.field(n).node()) :
        this.field(name).node();
}
/**
 * Remove a bound event listener to the editor instance.
 *
 * @param this Editor instance
 * @param name Event name to remove
 * @param fn Handler to remove, or all if not specified
 * @returns Editor instance
 */
function off(name, fn) {
    let wrapped = this._eventFunc(fn); // Could be undefined, which is fine
    this.dom.event.off(this._eventName(name), wrapped);
    return this;
}
/**
 * Listen for an event which is fired off by Editor when it performs certain
 * actions.
 *
 * @param this Editor instance
 * @param name Event to listen for
 * @param fn Event handler to apply
 * @returns Editor instance
 */
function on(name, fn) {
    let wrapped = this._eventFunc(fn);
    this.dom.event.on(this._eventName(name), wrapped);
    return this;
}
/**
 * Listen for a single event event which is fired off by Editor when it performs
 * certain actions
 *
 * @param this Editor instance
 * @param name Event to listen for
 * @param fn Event handler to apply
 * @returns Editor instance
 */
function one(name, fn) {
    let wrapped = this._eventFunc(fn);
    this.dom.event.one(this._eventName(name), wrapped);
    return this;
}
/**
 * Display the main form editor to the end user in the web-browser.
 *
 * @param this Editor instance
 * @returns Editor instance
 */
function open() {
    DataTable.plus('2026-07-19', 'editor');
    // Insert the display elements in order
    this._displayReorder();
    // Define how to do a close
    this._closeReg(() => {
        this._nestedClose(() => {
            this._clearDynamicInfo();
            this._event('closed', ['main']);
        });
    });
    // Run the standard open with common events
    let ret = this._preopen('main');
    if (!ret) {
        return this;
    }
    this._nestedOpen(() => {
        this._focus(this.s.order.map((name) => this.s.fields[name]), this.s.editOpts.focus);
        this._event('opened', ['main', this.s.action]);
    }, this.s.editOpts.nest);
    this._postopen('main', false);
    return this;
}
function order(setIn /* , ... */) {
    if (!setIn) {
        return this.s.order;
    }
    // Allow new layout to be passed in as arguments
    if (arguments.length && !Array.isArray(setIn)) {
        setIn = Array.prototype.slice.call(arguments);
    }
    // Sanity check - array must exactly match the fields we have available
    if (this.s.order.slice().sort().join('-') !== setIn.slice().sort().join('-')) {
        throw new Error('All fields, and no additional fields, must be provided for ordering.');
    }
    // Copy the new array into the order (so the reference is maintained)
    util.object.assign(this.s.order, setIn);
    this._displayReorder();
    return this;
}
/**
 * Reload data in the target data source
 *
 * @param this Editor instance
 * @param ids Row ids to reload data for
 * @param cb Callback when done
 */
function refresh(ids, cb) {
    let actionWas = this.s.action;
    this.s.action = 'read';
    this._ajax({
        [this.s.actionName]: 'read',
        ids: ids
    }, (json) => {
        // Reload the data in the data source
        this._dataSource('reload', ids, json.data);
        this.s.action = actionWas;
        cb();
    }, () => {
        // On error, continue with the action (edit)
        cb();
    });
}
function remove(items, arg1, arg2, arg3, arg4) {
    let that = this;
    // Some other field in inline edit mode?
    if (this._tidy(function () {
        that.remove(items, arg1, arg2, arg3, arg4);
    })) {
        return this;
    }
    if (!items && !this.s.table) {
        items = 'keyless';
    }
    // Allow a single row node to be passed in to remove, Can't use Array.isArray
    // as we also allow array like objects to be passed in (API, jQuery)
    if (items.length === undefined) {
        items = [items];
    }
    let argOpts = this._crudArgs(arg1, arg2, arg3, arg4);
    let dataSource = () => this._dataSource('fields', items);
    let editFields = dataSource();
    let keys = Object.keys(editFields);
    // If enabled, refresh the data before performing the delete action
    if ((argOpts.opts.refresh && keys.length) || this._dataSource('mustReload')) {
        this.refresh(keys, () => {
            // Get the updated data
            this._remove(items, argOpts, dataSource());
        });
    }
    else {
        this._remove(items, argOpts, editFields);
    }
    return this;
}
function set(setIn, valIn) {
    let that = this;
    if (!util.is.plainObject(setIn)) {
        let o = {};
        o[setIn] = valIn;
        setIn = o;
    }
    util.object.each(setIn, function (n, v) {
        that.field(n).set(v);
    });
    return this;
}
/**
 * Show fields in the display that were previously hidden.
 *
 * @param this Editor instance
 * @param names Field(s) to show. All if not given.
 * @param animate Animate the visual change or not
 * @returns Editor instance
 */
function show$2(names, animate) {
    let that = this;
    this._fieldNames(names).forEach(n => {
        that.field(n).show(animate);
    });
    return this;
}
/**
 * Submit a form for processing.
 *
 * @param this Editor instance
 * @param successCallback Function executed when submit is completed
 * @param errorCallback Function executed on error
 * @param formatdata Data formatting function
 * @param hideIn Disable default close action by passing in false
 * @returns Editor instance
 */
function submit(successCallback, errorCallback, formatdata, hideIn) {
    if (this.s.processing || !this.s.action) {
        return this;
    }
    this._processing(true);
    // Blur the current focus if it is a form input element - this allows any
    // actions on change event (e.g. dependent) to happen
    let active = document.activeElement;
    if (Dom.s(active).closest('div.DTE_Field').count() !== 0) {
        active.blur();
    }
    this._event('initSubmit', [this.s.action], result => {
        if (result === false) {
            this._processing(false);
            return;
        }
        this._submit(successCallback, errorCallback, formatdata, hideIn);
    });
    return this;
}
function table(setIn) {
    if (setIn === undefined) {
        return this.s.table;
    }
    this.s.table = setIn;
    return this;
}
function template(setIn) {
    if (setIn === undefined) {
        return this.s.template;
    }
    this.s.template = setIn === null ?
        null :
        Dom.s(setIn);
    return this;
}
function title(titleIn) {
    if (titleIn === undefined) {
        return this.s.title;
    }
    if (typeof titleIn === 'function') {
        titleIn = titleIn(this, new DataTable.Api(this.s.table));
    }
    this.s.title = titleIn;
    this._drawTitle();
    return this;
}
function val(fieldIn, value) {
    if (value !== undefined || util.is.plainObject(fieldIn)) {
        return this.set(fieldIn, value);
    }
    return this.get(fieldIn); // field can be undefined to get all
}

/* -  -  -  -  -  -  -  -  -  -
 * Ajax data interface
 */
// This data store is a temporary one that will force Editor to use `reload` and
// then store the data in an object that is only relevant for the life of the
// edit. When Editor asks for the data, it can then reply with the
// synchronously.
// The create / edit, etc functions don't actually do anything. There is no
// local data store for them to update - the Ajax call to the server did the
// update and if the dev wants to update the client-side based on the edit, the
// event handlers such as such edit and postEdit are available.
// Can't be used with inline or bubble editing as there might not be a node for
// a data point.
function getStore(editor) {
    if (!editor._dataStoreAjax) {
        editor._dataStoreAjax = {};
    }
    return editor._dataStoreAjax;
}
function clearStore(editor) {
    editor._dataStoreAjax = {};
    return editor._dataStoreAjax;
}
const dataSource$2 = {
    commit(action, identifier, data, store) {
        // No op
    },
    create(fields, data) {
        // No op
    },
    edit(identifier, fields, data, store) {
        // No op
    },
    // get idSrc, fields to edit, data and node for each item
    fields(identifier) {
        let out = {};
        let ids = Array.isArray(identifier)
            ? identifier
            : [identifier];
        let store = getStore(this);
        for (let i = 0; i < ids.length; i++) {
            let id = ids[i];
            let data = store[id];
            out[id] = {
                data,
                fields: this.s.fields,
                idSrc: id,
                node: null,
                type: 'row'
            };
        }
        return out;
    },
    id(data) {
        let idFn = dataGet(this.s.idSrc);
        return idFn(data);
    },
    individual(identifier, fieldNames) {
        let out = {};
        return out;
    },
    mustReload() {
        // Indicate that a reload is always required at the start of an edit,
        // regardless of what the form options `refresh` option is.
        return true;
    },
    prep(action, identifier, submit, json, store) {
        // No op
    },
    refresh() {
        // No op
    },
    reload(ids, data) {
        // The store is transient - its lifetime is a single action, so for each
        // reload we just clear it out.
        let store = clearStore(this);
        let idFn = dataGet(this.s.idSrc);
        for (var i = 0; i < data.length; i++) {
            let id = idFn(data[i]);
            store[id] = data[i];
        }
    },
    remove(identifier, fields, store) {
        // No op
    }
};

/* -  -  -  -  -  -  -  -  -  -
 * DataTables editor interface
 */
let _dtIsSsp = function (dt, editor) {
    // If the draw type is `none`, then we still need to use the DT API to
    // update the display with the new data
    return dt.settings()[0].features.serverSide &&
        editor.s.editOpts.drawType !== 'none';
};
let _dtApi = function (table) {
    return table instanceof DataTable.Api
        ? table
        : new DataTable.Api(table);
};
// Highlight a row using CSS transitions. The timeouts need to match the
// transition duration from the CSS
let _dtHighlight = function (node) {
    if (!node) {
        return;
    }
    node = Dom.s(node);
    setTimeout(() => {
        node.classAdd('dte-highlight');
        setTimeout(() => {
            node.removeClass('dte-highlight');
        }, 1000);
    }, 20);
};
let _dtRowSelector = function (out, dt, identifier, fields, idFn) {
    dt.rows(identifier).indexes().each(function (idx) {
        let row = dt.row(idx);
        let data = row.data();
        let idSrc = idFn(data);
        if (idSrc === undefined) {
            error$1('Unable to find row identifier', 14);
        }
        out[idSrc] = {
            data,
            fields,
            idSrc,
            node: row.node(),
            type: 'row'
        };
    });
};
let _dtFieldsFromIdx = function (dt, fields, idx, ignoreUnknown) {
    let col = dt.settings()[0].columns[idx];
    let dataSrc = col.editField !== undefined ?
        col.editField :
        col.data;
    let resolvedFields = {};
    let run = function (field, dataSrcIn) {
        if (field.name() === dataSrcIn) {
            resolvedFields[field.name()] = field;
        }
    };
    util.object.each(fields, function (name, fieldInst) {
        if (Array.isArray(dataSrc)) {
            for (let data of dataSrc) {
                run(fieldInst, data);
            }
        }
        else {
            run(fieldInst, dataSrc);
        }
    });
    if (Object.keys(resolvedFields).length === 0 && !ignoreUnknown) {
        error$1('Unable to automatically determine field from source. Please specify the field name.', 11);
    }
    return resolvedFields;
};
let _dtCellSelector = function (out, dt, identifier, allFields, idFn, forceFields = null) {
    let cells = dt.cells(identifier);
    cells.indexes().each(function (idx) {
        let cell = dt.cell(idx);
        let row = dt.row(idx.row);
        let data = row.data();
        let idSrc = idFn(data);
        let fields = forceFields || _dtFieldsFromIdx(dt, allFields, idx.column, cells.count() > 1);
        let isNode = (typeof identifier === 'object' && identifier.nodeName) || util.is.jquery(identifier) || util.is.dom(identifier);
        let prevDisplayFields;
        let prevAttach;
        let prevAttachFields;
        // Only add if a field was found to edit
        if (Object.keys(fields).length) {
            // The row selector will create a new `out` object for the identifier, and the
            // cell selector might be called multiple times for a row, so we need to save
            // our specific items
            if (out[idSrc]) {
                prevAttach = out[idSrc].attach;
                prevAttachFields = out[idSrc].attachFields;
                prevDisplayFields = out[idSrc].displayFields;
            }
            // Use the row selector to get the row information
            _dtRowSelector(out, dt, idx.row, allFields, idFn);
            out[idSrc].attachFields = prevAttachFields || [];
            out[idSrc].attachFields.push(Object.keys(fields));
            out[idSrc].attach = prevAttach || [];
            out[idSrc].attach.push(isNode ?
                Dom.s(identifier).get(0) :
                cell.fixedNode ? // If its under a fixed column, get the floating node
                    cell.fixedNode() :
                    cell.node());
            out[idSrc].displayFields = prevDisplayFields || {};
            util.object.assign(out[idSrc].displayFields, fields);
        }
    });
};
let _dtColumnSelector = function (out, dt, identifier, fields, idFn) {
    dt.cells(null, identifier).indexes().each(function (idx) {
        _dtCellSelector(out, dt, idx, fields, idFn);
    });
};
const dataSource$1 = {
    commit(action, identifier, data, store) {
        // Updates complete - redraw
        let that = this;
        let dt = _dtApi(this.s.table);
        let ssp = dt.settings()[0].features.serverSide;
        let ids = store.rowIds;
        // On edit, if there are any rows left in the `store.rowIds`, then they
        // were not returned by the server and should be removed (they might not
        // meet filtering requirements any more for example)
        if (!_dtIsSsp(dt, this) && action === 'edit' && store.rowIds.length) {
            let row;
            let compare = function (id) {
                return function (rowIdx, rowData, rowNode) {
                    return id == dataSource$1.id.call(that, rowData);
                };
            };
            for (let i = 0, ien = ids.length; i < ien; i++) {
                // Find the row to edit - attempt to do an id look up first for speed
                try {
                    row = dt.row(safeQueryId(ids[i]));
                }
                catch (e) {
                    row = dt;
                }
                // If not found, then we need to do it the slow way
                if (!row.any()) {
                    row = dt.row(compare(ids[i]));
                }
                if (row.any() && !ssp) {
                    row.remove();
                }
            }
        }
        let drawType = this.s.editOpts.drawType;
        if (drawType !== 'none') {
            let dtAny = dt;
            // Queue up actions for after the draw
            dt
                .one('draw', function () {
                // SSP highlighting has to go after the draw, but this can't be
                // merged with client-side processing highlight as we want that
                // to work even when there isn't a draw happening.
                if (ssp && ids && ids.length) {
                    for (let i = 0, ien = ids.length; i < ien; i++) {
                        let row = dt.row(safeQueryId(ids[i]));
                        if (row.any()) {
                            _dtHighlight(row.node());
                        }
                    }
                }
                // Responsive needs to take account of new data column widths
                if (dtAny.responsive) {
                    dtAny.responsive.recalc();
                }
                // Rebuild searchpanes
                if (typeof dtAny.searchPanes === 'function' && !ssp) {
                    dtAny.searchPanes.rebuildPane(undefined, true);
                }
                // Rebuild searchbuilder
                if (dtAny.searchBuilder !== undefined && typeof dtAny.searchBuilder.rebuild === 'function' && !ssp) {
                    dtAny.searchBuilder.rebuild(dtAny.searchBuilder.getDetails());
                }
            })
                .draw(drawType);
        }
    },
    create(fields, data) {
        let dt = _dtApi(this.s.table);
        if (!_dtIsSsp(dt, this)) {
            let row = dt.row.add(data);
            // Wait for the draw on complete, otherwise the node won't exist!
            dt.one('draw', function () {
                _dtHighlight(row.node());
            });
        }
    },
    edit(identifier, fields, data, store) {
        let that = this;
        let dt = _dtApi(this.s.table);
        // No point in doing anything when server-side processing - the commit
        // will redraw the table
        if (!_dtIsSsp(dt, this) || this.s.editOpts.drawType === 'none') {
            // The identifier can select one or more rows, but the data will
            // refer to just a single row. We need to determine which row from
            // the set is the one to operator on.
            let rowId = dataSource$1.id.call(this, data);
            let row;
            // Find the row to edit - attempt to do an id look up first for speed
            try {
                row = dt.row(safeQueryId(rowId));
            }
            catch (e) {
                row = dt;
            }
            // If not found, then we need to do it the slow way
            if (!row.any()) {
                row = dt.row(function (rowIdx, rowData, rowNode) {
                    return rowId == dataSource$1.id.call(that, rowData);
                });
            }
            if (row.any()) {
                // Merge data to allow for a sub-set to be returned
                let toSave = {};
                if (Array.isArray(row.data())) {
                    toSave = [];
                }
                toSave = extendDeepObjShallowArr(toSave, row.data());
                toSave = extendDeepObjShallowArr(toSave, data);
                row.data(toSave);
                // Remove the item from the list of indexes now that is has been
                // updated
                let idx = store.rowIds.indexOf(rowId);
                store.rowIds.splice(idx, 1);
            }
            else {
                // If not found, then its a new row (change in pkey possibly)
                row = dt.row.add(data);
            }
            _dtHighlight(row.node());
        }
    },
    fakeRow(insertPoint) {
        let dt = _dtApi(this.s.table);
        let tr = Dom.c('tr').classAdd('dte-inlineAdd');
        let attachFields = [];
        let attach = [];
        let displayFields = {};
        let tbody = dt.table(undefined).body();
        for (let i = 0, ien = dt.columns(':visible').count(); i < ien; i++) {
            let visIdx = dt.column(i + ':visible').index();
            let td = Dom.c('td').appendTo(tr);
            let fields = _dtFieldsFromIdx(dt, this.s.fields, visIdx, true);
            let settings = dt.settings()[0];
            let className = settings.columns[visIdx].className;
            if (className) {
                td.classAdd(className);
            }
            if (Object.keys(fields).length) {
                attachFields.push(Object.keys(fields));
                attach.push(td.get(0));
                util.object.assign(displayFields, fields);
            }
        }
        let append = () => {
            // Remove the data empty message
            if (dt.page.info().recordsDisplay === 0) {
                Dom.s(tbody).empty();
            }
            if (insertPoint === 'start' || insertPoint === null || insertPoint === undefined) {
                tr.prependTo(tbody);
            }
            else if (insertPoint === 'end') {
                tr.appendTo(tbody);
            }
            else {
                tr.insertAfter(dt.row(insertPoint).node());
            }
        };
        this.__dtFakeRow = tr;
        // Insert into the table
        append();
        dt.on('draw.dte-createInline', () => {
            append();
        });
        return {
            0: {
                attach,
                attachFields,
                displayFields,
                fields: this.s.fields,
                type: 'row'
            }
        };
    },
    fakeRowEnd() {
        let dt = _dtApi(this.s.table);
        dt.off('draw.dte-createInline');
        this.__dtFakeRow.remove();
        this.__dtFakeRow = null;
        // Restore data empty row
        if (dt.page.info().recordsDisplay === 0) {
            dt.draw(false);
        }
    },
    // get idSrc, fields to edit, data and node for each item
    fields(identifier) {
        let idFn = dataGet(this.s.idSrc);
        let dt = _dtApi(this.s.table);
        let fields = this.s.fields;
        let out = {};
        if (util.is.plainObject(identifier) &&
            (identifier.rows !== undefined || identifier.columns !== undefined || identifier.cells !== undefined)) {
            // Multi-item type selector
            if (identifier.rows !== undefined) {
                _dtRowSelector(out, dt, identifier.rows, fields, idFn);
            }
            if (identifier.columns !== undefined) {
                _dtColumnSelector(out, dt, identifier.columns, fields, idFn);
            }
            if (identifier.cells !== undefined) {
                _dtCellSelector(out, dt, identifier.cells, fields, idFn);
            }
        }
        else {
            // Just a rows selector
            _dtRowSelector(out, dt, identifier, fields, idFn);
        }
        return out;
    },
    id(data) {
        let idFn = dataGet(this.s.idSrc);
        return idFn(data);
    },
    individual(identifier, fieldNames) {
        let idFn = dataGet(this.s.idSrc);
        let dt = _dtApi(this.s.table);
        let fields = this.s.fields;
        let out = {};
        let forceFields;
        if (fieldNames) {
            if (!Array.isArray(fieldNames)) {
                fieldNames = [fieldNames];
            }
            forceFields = {};
            fieldNames.forEach(name => {
                forceFields[name] = fields[name];
            });
        }
        _dtCellSelector(out, dt, identifier, fields, idFn, forceFields);
        return out;
    },
    mustReload() {
        return false;
    },
    prep(action, identifier, submit, json, store) {
        // Get the id of the rows created / edited
        if (action === 'create') {
            store.rowIds = json.data.map(row => dataSource$1.id.call(this, row));
        }
        if (action === 'edit') {
            let cancelled = json.cancelled || [];
            store.rowIds = util.object.map(submit.data, function (key, val) {
                return Object.keys(submit.data[key]).length !== 0 && // was submitted
                    !cancelled.includes(key) ? // was not cancelled on the server-side
                    key :
                    undefined;
            });
        }
        else if (action === 'remove') {
            store.cancelled = json.cancelled || [];
        }
    },
    refresh() {
        // Reload a table's data - used when nested data is changed
        let dt = _dtApi(this.s.table);
        if (dt.ajax.url()) {
            dt.ajax.reload(null, false);
        }
        else {
            dt.rows().invalidate();
        }
    },
    reload(ids, data) {
        // Update data for specific rows
        let dt = _dtApi(this.s.table);
        for (var i = 0; i < data.length; i++) {
            let id = dataSource$1.id.call(this, data[i]);
            dt.row('#' + id).data(data[i]);
            // Remove the id for which we have new data from the array
            let idx = ids.indexOf(id);
            if (idx !== -1) {
                ids.splice(idx, 1);
            }
        }
        // If there are rows which are left in `ids` then they weren't updated, and are presumed
        // to have been deleted, and thus should be removed.
        if (ids.length) {
            dt.rows(ids.map((id) => '#' + id)).remove();
        }
    },
    remove(identifier, fields, store) {
        // No confirmation from the server
        let that = this;
        let dt = _dtApi(this.s.table);
        let cancelled = store.cancelled;
        if (cancelled.length === 0) {
            // No rows were cancelled on the server-side, remove them all
            dt.rows(identifier).remove();
        }
        else {
            // One or more rows were cancelled, so we need to identify them
            // and not remove those rows
            let indexes = [];
            dt.rows(identifier).every(function () {
                let id = dataSource$1.id.call(that, this.data());
                if (!cancelled.includes(id)) {
                    // Don't use `remove` here - it messes up the indexes
                    indexes.push(this.index());
                }
            });
            dt.rows(indexes).remove();
        }
    }
};

/* -  -  -  -  -  -  -  -
 * HTML editor interface
 */
function _htmlId(identifier) {
    if (identifier === 'keyless') {
        return Dom.s(document);
    }
    let specific = Dom.s('[data-editor-id="' + identifier + '"]');
    if (specific.count() === 0) {
        specific = typeof identifier === 'string' ?
            Dom.s(safeQueryId(identifier)) :
            Dom.s(identifier);
    }
    if (specific.count() === 0) {
        throw new Error('Could not find an element with `data-editor-id` or `id` of: ' + identifier);
    }
    return specific;
}
function _htmlEl(identifier, name) {
    let context = _htmlId(identifier);
    return context.find('[data-editor-field="' + name + '"]');
}
function _htmlEls(identifier, names) {
    let out = new Dom();
    for (let i = 0, ien = names.length; i < ien; i++) {
        out = out.add(_htmlEl(identifier, names[i]));
    }
    return out;
}
function _htmlGet(identifier, dataSrc) {
    let el = _htmlEl(identifier, dataSrc);
    return el.filter('[data-editor-value]').count() ?
        el.attr('data-editor-value') :
        el.html();
}
function _htmlSet(identifier, fields, data) {
    util.object.each(fields, function (name, field) {
        let val = field.valFromData(data);
        if (val !== undefined) {
            let el = _htmlEl(identifier, field.dataSrc());
            if (el.filter('[data-editor-value]').count()) {
                el.attr('data-editor-value', val);
            }
            else {
                el.each(function () {
                    // This is very frustrating, but in IE if you just write directly
                    // to innerHTML, and elements that are overwritten are GC'ed,
                    // even if there is a reference to them elsewhere
                    while (this.childNodes.length) {
                        this.removeChild(this.firstChild);
                    }
                })
                    .html(val);
            }
        }
    });
}
const dataSource = {
    create(fields, data) {
        // If there is an element with the id that has been created, then use it
        // to assign the values
        if (data) {
            let id = dataSource.id.call(this, data);
            try {
                if (_htmlId(id).count()) {
                    _htmlSet(id, fields, data);
                }
            }
            catch (e) {
                // noop - use `postCreate` to add items to the DOM
            }
        }
    },
    edit(identifier, fields, data) {
        // Get the ids from the returned data or `keyless` if not found
        let id = dataSource.id.call(this, data) || 'keyless';
        _htmlSet(id, fields, data);
    },
    // get idSrc, fields to edit, data and node for each item
    fields(identifier) {
        let out = {};
        // Allow multi-point editing
        if (Array.isArray(identifier)) {
            for (let i = 0, ien = identifier.length; i < ien; i++) {
                let res = dataSource.fields.call(this, identifier[i]);
                out[identifier[i]] = res[identifier[i]];
            }
            return out;
        }
        // else
        let data = {};
        let fields = this.s.fields;
        if (!identifier) {
            identifier = 'keyless';
        }
        util.object.each(fields, function (name, field) {
            let val = _htmlGet(identifier, field.dataSrc());
            // If no HTML element is present, jQuery returns null. We want undefined
            field.valToData(data, val === null ? undefined : val);
        });
        out[identifier] = {
            data,
            fields,
            idSrc: identifier,
            node: document,
            type: 'row'
        };
        return out;
    },
    id(data) {
        let idFn = dataGet(this.s.idSrc);
        return idFn(data);
    },
    individual(identifier, fieldNames) {
        let attachEl;
        // Auto detection of the field name and id
        if (util.is.jquery(identifier) || util.is.dom(identifier) || identifier.nodeName) {
            attachEl = identifier;
            if (!fieldNames) {
                fieldNames = [Dom.s(identifier).attr('data-editor-field')];
            }
            let curr = Dom.s(identifier).data('editor-id');
            identifier = curr
                ? curr
                : Dom.s(identifier).closest('[data-editor-id]').data('editor-id');
        }
        // no id given and none found
        if (!identifier) {
            identifier = 'keyless';
        }
        // no field name - cannot continue
        if (fieldNames && !Array.isArray(fieldNames)) {
            fieldNames = [fieldNames];
        }
        if (!fieldNames || fieldNames.length === 0) {
            throw new Error('Cannot automatically determine field name from data source');
        }
        let out = dataSource.fields.call(this, identifier);
        let fields = this.s.fields;
        let forceFields = {};
        fieldNames.forEach(function (name) {
            forceFields[name] = fields[name];
        });
        util.object.each(out, function (id, set) {
            set.type = 'cell';
            set.attachFields = [fieldNames];
            set.attach = attachEl ?
                Dom.s(attachEl).get() :
                _htmlEls(identifier, fieldNames).get();
            set.fields = fields;
            set.displayFields = forceFields;
        });
        return out;
    },
    initField(cfg) {
        // This is before the field has been initialised so can't use it API
        let label = Dom.s('[data-editor-label="' + (cfg.data || cfg.name) + '"]');
        if (!cfg.label && label.count()) {
            cfg.label = label.html();
        }
    },
    mustReload() {
        return false;
    },
    remove(identifier, fields) {
        // If there is an element with an ID property matching the identifier,
        // remove it
        if (identifier !== 'keyless') {
            _htmlId(identifier).remove();
        }
    }
};

const dataSources = {
    ajax: dataSource$2,
    dataTable: dataSource$1,
    html: dataSource
};

let _inlineCounter = 0;
/**
 * Set the class on the form to relate to the action that is being performed.
 * This allows styling to be applied to the form to reflect the state that
 * it is in.
 *
 * @private
 */
function _actionClass() {
    let classesActions = this.classes.actions;
    let action = this.s.action;
    let wrapper = Dom.s(this.dom.wrapper);
    wrapper.classRemove([
        classesActions.create,
        classesActions.edit,
        classesActions.remove
    ].join(' '));
    if (action === 'create') {
        wrapper.classAdd(classesActions.create);
    }
    else if (action === 'edit') {
        wrapper.classAdd(classesActions.edit);
    }
    else if (action === 'remove') {
        wrapper.classAdd(classesActions.remove);
    }
}
/**
 * Create an Ajax request in the same style as DataTables 1.10, with full
 * backwards compatibility for Editor 1.2.
 *
 * @param  {object} data Data to submit
 * @param  {function} success Success callback
 * @param  {function} error Error callback
 * @private
 */
function _ajax(data, success, error) {
    let action = this.s.action;
    let thrown;
    let opts = {
        url: '', // set below
        complete: [
            function (xhr, text) {
                // Use `complete` rather than `success` so that all status codes are
                // caught and can return valid JSON (useful when working with REST
                // services).
                let json = null;
                if (xhr.status === 204 || xhr.responseText === 'null') {
                    json = {};
                }
                else {
                    try {
                        json = JSON.parse(xhr.responseText);
                    }
                    catch (e) {
                        // noop
                    }
                }
                if (util.is.plainObject(json) || Array.isArray(json)) {
                    success(json, xhr.status >= 400, xhr);
                }
                else {
                    error(xhr, text, thrown);
                }
            }
        ],
        data: null,
        dataType: 'json',
        error: [
            (xhr, text, err) => {
                thrown = err;
            }
        ],
        success: [],
        type: 'POST'
    };
    let a;
    let ajaxSrc = this.s.ajax;
    let id = action === 'edit' || action === 'remove'
        ? pluck(this.s.editFields, 'idSrc').join(',')
        : null;
    // Get the correct object for rest style
    if (util.is.plainObject(ajaxSrc) && ajaxSrc[action]) {
        ajaxSrc = ajaxSrc[action];
    }
    if (typeof ajaxSrc === 'function') {
        // As a function, execute it, passing in the required parameters
        ajaxSrc.call(this, null, null, data, success, error);
        return;
    }
    else if (typeof ajaxSrc === 'string') {
        // As a string it gives the URL. For backwards compatibility it can also
        // give the method.
        if (ajaxSrc.indexOf(' ') !== -1) {
            a = ajaxSrc.split(' ');
            opts.type = a[0];
            opts.url = a[1];
        }
        else {
            opts.url = ajaxSrc;
        }
    }
    else {
        // As an object, we extend the Editor defaults - with the exception of
        // the error and complete functions which get added in so the user can
        // specify their own in addition to ours
        let optsCopy = util.object.assign({}, ajaxSrc || {});
        if (optsCopy.complete) {
            opts.complete.unshift(optsCopy.complete);
            delete optsCopy.complete;
        }
        if (optsCopy.error) {
            opts.error.unshift(optsCopy.error);
            delete optsCopy.error;
        }
        opts = util.object.assign({}, opts, optsCopy);
    }
    this._ajaxReplacements(opts, id, action, data);
    // Data processing option like in DataTables
    if (opts.data) {
        let isFn = typeof opts.data === 'function';
        let newData = isFn
            ? opts.data(data) // fn can manipulate data or return an object
            : opts.data; // object or array to merge
        // If the function returned something, use that alone
        data =
            isFn && newData
                ? newData
                : util.object.assignDeep(data, newData);
    }
    opts.data = data;
    // Finally, make the ajax call
    DataTable.ajax(opts);
}
/**
 * Perform replacements on the Ajax URL
 *
 * @param this Editor instance
 * @param opts Ajax options
 * @param id Row id
 * @param action Ajax action
 * @param data Ajax data
 */
function _ajaxReplacements(opts, id, action, data) {
    // URL macros
    if (opts.replacements) {
        util.object.each(opts.replacements, function (key, repl) {
            if (repl) {
                opts.url = opts.url.replace('{' + key + '}', repl.call(this, key, id, action, data));
            }
        });
    }
    // Only do the replacement if there is a value and `id` wasn't replaced
    // above
    if (id && (!opts.replacements || opts.replacements.id === undefined)) {
        opts.url = opts.url.replace(/_id_/, id).replace(/{id}/, id);
    }
}
/**
 * Create the DOM structure from the source elements for the main form.
 * This is required since the elements can be moved around for other form types
 * (bubble).
 *
 * @private
 */
function _assembleMain() {
    let parts = this.dom;
    Dom.s(parts.wrapper)
        .prepend(parts.header)
        .append(parts.processing)
        .append(parts.body)
        .append(parts.footer);
    Dom.s(parts.footer).append(parts.formError).append(parts.buttons);
    Dom.s(parts.bodyContent).append(parts.formInfo).append(parts.form);
}
/**
 * Blur the editing window. A blur is different from a close in that it might
 * cause either a close or the form to be submitted. A typical example of a
 * blur would be clicking on the background of the bubble or main editing forms
 * - i.e. it might be a close, or it might submit depending upon the
 * configuration, while a click on the close box is a very definite close.
 *
 * @private
 */
function _blur() {
    let opts = this.s.editOpts;
    let onBlur = opts.onBlur;
    if (this._event('preBlur') === false) {
        return;
    }
    if (typeof onBlur === 'function') {
        onBlur(this);
    }
    else if (onBlur === 'submit') {
        this.submit();
    }
    else if (onBlur === 'close') {
        this._close();
    }
}
/**
 * Clear all of the information that might have been dynamically set while
 * the form was visible - specifically errors and dynamic messages
 *
 * @private
 */
function _clearDynamicInfo(errorsOnly = false) {
    // Can be triggered due to a destroy if the editor is open
    if (!this.s) {
        return;
    }
    let errorClass = this.classes.field.error;
    let fields = this.s.fields;
    Dom.s(this.dom.wrapper)
        .find('div.' + errorClass)
        .classRemove(errorClass);
    Dom.s(this.dom.wrapper).classRemove('dte-submitted');
    util.object.each(fields, function (name, field) {
        field.error('');
        if (!errorsOnly) {
            field.message('');
        }
    });
    this.error('');
    if (!errorsOnly) {
        this.message('');
    }
    this.s.setFocus = null;
    this.s.bubbleBottom = false; // reset to default for next
}
/**
 * Close an editing display, firing callbacks and events as needed
 *
 * @param  {function} submitComplete Function to call after the preClose event
 * @param  {string} mode Editing mode that is just finished
 * @private
 */
function _close(submitComplete, mode) {
    let closed;
    // Allow preClose event to cancel the opening of the display
    if (this._event('preClose') === false) {
        return;
    }
    if (this.s.closeCb) {
        closed = this.s.closeCb(submitComplete, mode);
        this.s.closeCb = null;
    }
    if (this.s.closeIcb) {
        this.s.closeIcb();
        this.s.closeIcb = null;
    }
    // Remove focus control
    Dom.s('body').off('focus.editor-focus');
    this.s.displayed = false;
    this._event('close');
    if (closed) {
        // Note that `bubble` will call this itself due to the animation
        this._event('closed', [closed]);
    }
}
/**
 * Register a function to be called when the editing display is closed. This is
 * used by function that create the editing display to tidy up the display on
 * close - for example removing event handlers to prevent memory leaks.
 *
 * @param  {function} fn Function to call on close
 * @private
 */
function _closeReg(fn) {
    this.s.closeCb = fn;
}
/**
 * Argument shifting for the create(), edit() and remove() methods. In Editor
 * 1.3 the preferred form of calling those three methods is with just two
 * parameters (one in the case of create() - the id and the show flag), while in
 * previous versions four / three parameters could be passed in, including the
 * buttons and title options. In 1.3 the chaining API is preferred, but we want
 * to support the old form as well, so this function is provided to perform
 * that argument shifting, common to all three.
 *
 * @private
 */
function _crudArgs(arg1, arg2, arg3, arg4) {
    let that = this;
    let title;
    let buttons;
    let show;
    let opts;
    if (util.is.plainObject(arg1)) {
        // Form options passed in as the first option
        opts = arg1;
    }
    else if (typeof arg1 === 'boolean') {
        // Show / hide passed in as the first option - form options second
        show = arg1;
        opts = arg2; // can be undefined
    }
    else {
        // Old style arguments
        title = arg1; // can be undefined
        buttons = arg2; // can be undefined
        show = arg3; // can be undefined
        opts = arg4; // can be undefined
    }
    // If all undefined, then fall into here
    if (show === undefined) {
        show = true;
    }
    if (title) {
        that.title(title);
    }
    if (buttons) {
        that.buttons(buttons);
    }
    return {
        maybeOpen() {
            if (show) {
                that.open();
            }
        },
        opts: util.object.assign({}, this.s.formOptions.main, opts)
    };
}
/**
 * Execute the data source abstraction layer functions. This is simply a case
 * of executing the function with the Editor scope, passing in the remaining
 * parameters.
 *
 * @param name Function name to execute
 * @private
 */
function _dataSource(name, ...args) {
    let dataSource = this.s.dataSource;
    if (dataSource === null) {
        if (this.c.dataSrc) {
            dataSource = this.c.dataSrc;
        }
        else if (this.s.table) {
            dataSource = 'table';
        }
        else {
            dataSource = 'html';
        }
    }
    let pluginName = dataSource === 'table' ? 'dataTable' : dataSource;
    let fn = dataSources[pluginName][name];
    if (fn) {
        return fn.apply(this, args);
    }
}
/**
 * Insert the fields into the DOM, in the correct order
 *
 * @private
 */
function _displayReorder(includeFields) {
    let formContent = Dom.s(this.dom.formContent);
    let fields = this.s.fields;
    let order = this.s.order;
    let template = this.s.template;
    let mode = this.s.mode || 'main';
    if (includeFields) {
        this.s.includeFields = includeFields;
    }
    else {
        includeFields = this.s.includeFields;
    }
    // Empty before adding in the required fields
    formContent.children().detach();
    order.forEach(name => {
        if (this._weakInArray(name, includeFields) !== -1) {
            if (template && mode === 'main') {
                // Tag based templates - insert after the custom element
                let tag = template.find('editor-field[name="' + name + '"]');
                if (tag.count()) {
                    Dom.s(fields[name].node()).insertAfter(tag);
                }
                // Attribute based templates - insert into the host element
                let attr = template.find('[data-editor-template="' + name + '"]');
                if (attr.count()) {
                    Dom.s(fields[name].node()).appendTo(attr);
                }
            }
            else {
                formContent.append(fields[name].node());
            }
        }
    });
    if (template && template.count() && mode === 'main') {
        template.appendTo(formContent);
    }
    this._event('displayOrder', [this.s.displayed, this.s.action, formContent]);
}
/**
 * Display the title in the form header, taking into account nested editing
 */
function _drawTitle() {
    let header = Dom.s(this.dom.header).children('div.' + this.classes.header.content);
    let titleClass = this.classes.header.title;
    let levels = this.s.displayController._show;
    let titles = [];
    if (levels && levels.length) {
        for (let i = 0; i < levels.length; i++) {
            titles.push('<span class="DTE_Title">' + levels[i].dte.title() + '</span>');
        }
    }
    else {
        titles.push('<span class="DTE_Title">' + this.title() + '</span>');
    }
    let html = titles.join('<span class="DTE_Title_Level"></span>');
    if (titleClass.tag)
        header
            .empty()
            .append(Dom.c(titleClass.tag).classAdd(titleClass.class).html(html));
    else {
        header.html(html);
    }
}
/**
 * Generic editing handler. This can be called by the three editing modes (main,
 * bubble and inline) to configure Editor for a row edit, and fire the required
 * events to ensure that the editing interfaces all provide a common API.
 *
 * @param {*} rows Identifier for the item(s) to be edited
 * @param {string} type Editing type - for the initEdit event
 * @private
 */
function _edit(items, editFields, type, formOptions, setupDone) {
    let fields = this.s.fields;
    let usedFields = [];
    let includeInOrder;
    let editData = {};
    DataTable.plus('2026-07-19', 'editor');
    this.s.editFields = editFields;
    this.s.editData = editData;
    this.s.modifier = items;
    this.s.action = 'edit';
    this.dom.form.style.display = 'block';
    this.s.mode = type;
    this._actionClass();
    // Setup the field values for editing
    util.object.each(fields, function (name, field) {
        field.multiReset();
        includeInOrder = false;
        editData[name] = {};
        util.object.each(editFields, function (idSrc, edit) {
            if (edit.fields[name]) {
                let val = field.valFromData(edit.data);
                let nullDefault = field.nullDefault();
                // Save the set data values so we can decided in submit if data has changed
                // Note that `null` is stored as an empty string since fields do not currently
                // have the ability to store a null value - when they are read back (in the
                // submit) they would be an empty string. When null handling is added to
                // fields, this will need to be removed.
                editData[name][idSrc] =
                    val === null ? '' : Array.isArray(val) ? val.slice() : val;
                // If scoped to edit the whole row, then set all of the fields
                if (!formOptions || formOptions.scope === 'row') {
                    field.multiSet(idSrc, val === undefined || (nullDefault && val === null)
                        ? field.def()
                        : val, false);
                    if (!edit.displayFields || edit.displayFields[name]) {
                        includeInOrder = true;
                    }
                }
                else {
                    // Limit editing to only those fields selected if any are selected
                    if (!edit.displayFields || edit.displayFields[name]) {
                        field.multiSet(idSrc, val === undefined || (nullDefault && val === null)
                            ? field.def()
                            : val, false);
                        includeInOrder = true;
                    }
                }
            }
        });
        // Loop finished - can do a multi-value check for display of the field now
        field._multiValueCheck();
        // If the field is used, then add it to the fields to be shown
        if (field.multiIds().length !== 0 && includeInOrder) {
            usedFields.push(name);
        }
    });
    // Remove the fields that are not required from the display
    let currOrder = this.order().slice();
    for (let i = currOrder.length - 1; i >= 0; i--) {
        // Use `toString()` to convert numbers to strings, since usedFields
        // contains strings (object property names)
        if (!usedFields.includes(currOrder[i].toString())) {
            currOrder.splice(i, 1);
        }
    }
    this._displayReorder(currOrder);
    // Events
    this._event('initEdit', [
        pluck(editFields, 'node')[0],
        pluck(editFields, 'data')[0],
        items,
        type
    ], () => {
        this._event('initMultiEdit', // undocumented and to be removed in v2
        [editFields, items, type], function () {
            setupDone();
        });
    });
}
/**
 * Triggering editing, checking to see if a refresh of the data is needed or not
 */
function _editRefresh(items, dataSource, type, formOptions, setupDone) {
    let editFields = dataSource();
    let keys = Object.keys(editFields);
    if ((formOptions.refresh && keys.length) ||
        this._dataSource('mustReload')) {
        this.refresh(keys, () => {
            // Get the updated data
            editFields = dataSource();
            let rowIds = Object.keys(editFields);
            if (!rowIds.length && editFields[rowIds[0]].data === undefined) {
                error$1('Could not find source data. Possibly it has been deleted.', 0);
            }
            else {
                this._edit(items, editFields, type, formOptions, setupDone);
            }
        });
    }
    else {
        this._edit(items, editFields, type, formOptions, setupDone);
    }
}
/**
 * Fire callback functions and trigger events.
 *
 * @param trigger Name(s) of the jQuery custom event to trigger
 * @param args Array of arguments to pass to the triggered event
 * @param promiseComplete If the event handler returns a promise, this is the
 *   function to execute when the complete is complete.
 * @return {*} Return from the event
 * @private
 */
function _event(trigger, args = [], promiseComplete) {
    // Allow an array to be passed in for the trigger to fire multiple events
    if (Array.isArray(trigger)) {
        for (let i = 0, ien = trigger.length; i < ien; i++) {
            this._event(trigger[i], args);
        }
    }
    else {
        // It is possible that an event could trigger after destroy (`close`)
        if (!this.dom) {
            return;
        }
        let events = this.dom.event.trigger(trigger, false, args, null, true);
        let defaultPrevented = events.map(e => e.defaultPrevented);
        // Automatically trigger a cancelled event if a `pre` event handler
        // was cancelled by the callback
        if (trigger.indexOf('pre') === 0 && defaultPrevented.includes(true)) {
            this.dom.event.trigger(trigger + 'Cancelled', false, args);
        }
        // Allow for a promise to be returned and execute a callback
        if (promiseComplete && events.length) {
            let result = events[0].result;
            if (result && typeof result === 'object' && result.then) {
                // A promise was returned
                result.then(promiseComplete);
            }
            else {
                // If there wasn't a promise returned, then execute immediately
                promiseComplete(result);
            }
        }
        return !defaultPrevented.includes(true);
    }
}
/**
 * 'Modernise' event names, from the old style `on[A-Z]` names to camelCase.
 * This is done to provide backwards compatibility with Editor 1.2- event names.
 * The names themselves were updated for consistency with DataTables.
 *
 * @param {string} Event name to modernise
 * @return {string} String with new event name structure
 * @private
 */
function _eventName(input) {
    let name;
    let names = input.split(' ');
    for (let i = 0, ien = names.length; i < ien; i++) {
        name = names[i];
        // Strip the 'on' part and lowercase the first character
        let onStyle = name.match(/^on([A-Z])/);
        if (onStyle) {
            name = onStyle[1].toLowerCase() + name.substring(3);
        }
        names[i] = name;
    }
    return names.join(' ');
}
/**
 * Wrap and store event handler functions. This allows the event handler to be
 * executed with the Editor instance as the scope. DataTable's event methods are
 * used with a "dummy" div to provide the event mechanism.
 *
 * The store is simply an array with the original and the wrapped event. This
 * does mean that even when an event is removed, there can still be a reference
 * to it here - it just won't be triggered. It will be cleared out on destroy.
 *
 * @param this Editor
 * @param fn Event handler
 * @param remove If the event handler should be removed from the store (i.e. for
 *   `off`).
 * @returns Wrapped event handler that can be given to the event methods.
 */
function _eventFunc(fn) {
    let that = this;
    if (!fn) {
        return undefined;
    }
    let matched = this.s.events.find(v => v.original === fn);
    if (!matched) {
        matched = {
            original: fn,
            wrapped: function () {
                return fn.apply(that, arguments);
            }
        };
        this.s.events.push(matched);
    }
    return matched.wrapped;
}
/**
 * Find a field from a DOM node. All children are searched.
 *
 * @param  {node} node DOM node to search for
 * @return {Field}     Field instance
 */
function _fieldFromNode(node) {
    let foundField = null;
    util.object.each(this.s.fields, function (name, field) {
        if (Dom.s(field.node()).find(node).count()) {
            foundField = field;
        }
    });
    return foundField;
}
/**
 * Convert a field name input parameter to an array of field names.
 *
 * Many of the API methods provide the ability to pass `undefined` a string or
 * array of strings to identify fields. This method harmonises that.
 *
 * @param  {array|string} [fieldNames] Field names to get
 * @return {array}                     Field names
 * @private
 */
function _fieldNames(fieldNames) {
    if (fieldNames === undefined) {
        return this.fields();
    }
    else if (!Array.isArray(fieldNames)) {
        return [fieldNames];
    }
    return fieldNames;
}
/**
 * Focus on a field. Providing the logic to allow complex focus expressions
 *
 * @param {array} fields Array of Field instances or field names for the fields
 * that are shown
 * @param {null|string|integer} focus Field identifier to focus on
 * @private
 */
function _focus(fieldsIn, focus) {
    // Can't focus on a field when in remove mode (they aren't shown).
    if (this.s.action === 'remove') {
        return;
    }
    let field;
    let fields = fieldsIn.map(fieldOrName => typeof fieldOrName === 'string'
        ? this.s.fields[fieldOrName]
        : fieldOrName);
    if (typeof focus === 'number') {
        field = fields[focus];
    }
    else if (focus) {
        if (focus.indexOf('jq:') === 0) {
            field = Dom.s('div.DTE ' + focus.replace(/^jq:/, ''));
        }
        else {
            field = this.s.fields[focus];
        }
    }
    else {
        document.activeElement.blur();
    }
    this.s.setFocus = field;
    if (field) {
        field.focus();
    }
}
/**
 * Form options - common function so all editing methods can provide the same
 * basic options, DRY.
 *
 * @param {object} opts Editing options. See model.formOptions
 * @private
 */
function _formOptions(opts) {
    let that = this;
    let inlineCount = _inlineCounter++;
    let namespace = '.dteInline' + inlineCount;
    // Backwards compatibility with 1.4
    // if ( opts.closeOnComplete !== undefined ) {
    // 	opts.onComplete = opts.closeOnComplete ? 'close' : 'none';
    // }
    // if ( opts.submitOnBlur !== undefined ) {
    // 	opts.onBlur = opts.submitOnBlur ? 'submit' : 'close';
    // }
    // if ( opts.submitOnReturn !== undefined ) {
    // 	opts.onReturn = opts.submitOnReturn ? 'submit' : 'none';
    // }
    // if ( opts.blurOnBackground !== undefined ) {
    // 	opts.onBackground = opts.blurOnBackground ? 'blur' : 'none';
    // }
    this.s.editOpts = opts;
    // When submitting by Ajax we don't want to close a form that has been
    // opened during the ajax request, so we keep a count of the form opening
    this.s.editCount = inlineCount;
    if (typeof opts.title === 'string' || typeof opts.title === 'function') {
        this.title(opts.title);
        opts.title = true;
    }
    if (typeof opts.message === 'string' ||
        typeof opts.message === 'function') {
        this.message(opts.message);
        opts.message = true;
    }
    if (typeof opts.buttons !== 'boolean') {
        this.buttons(opts.buttons);
        opts.buttons = true;
    }
    // Prevent submit by a host `<form>`
    Dom.s(document).on('keydown' + namespace, e => {
        if (e.which === 13 && this.s.displayed) {
            // return
            let el = Dom.s(document.activeElement);
            if (el) {
                let field = this._fieldFromNode(el);
                if (field &&
                    typeof field.canReturnSubmit === 'function' &&
                    field.canReturnSubmit(el)) {
                    e.preventDefault();
                }
            }
        }
    });
    Dom.s(document).on('keyup' + namespace, e => {
        let el = Dom.s(document.activeElement);
        if (e.which === 13 && this.s.displayed) {
            // return
            let field = this._fieldFromNode(el);
            // Allow the field plug-in to say if we can submit or not
            if (field &&
                typeof field.canReturnSubmit === 'function' &&
                field.canReturnSubmit(el)) {
                if (opts.onReturn === 'submit') {
                    e.preventDefault();
                    this.submit();
                }
                else if (typeof opts.onReturn === 'function') {
                    e.preventDefault();
                    opts.onReturn(this, e);
                }
            }
        }
        else if (e.which === 27) {
            // esc
            // Do nothing if DateTime or Dropdown are showing - they will close themselves
            if (Dom.s('div.dt-datetime, div.dte-dropdown').count() ||
                e.defaultPrevented) {
                return;
            }
            e.preventDefault();
            if (typeof opts.onEsc === 'function') {
                opts.onEsc(that, e);
            }
            else if (opts.onEsc === 'blur') {
                that.blur();
            }
            else if (opts.onEsc === 'close') {
                that.close();
            }
            else if (opts.onEsc === 'submit') {
                that.submit();
            }
        }
        else if (el.closest('.DTE_Form_Buttons').count()) {
            let buttons = el.closest('.DTE_Form_Buttons').find('button');
            let currentIdx = buttons.get().indexOf(el.get(0));
            if (e.which === 37 && currentIdx > 0) {
                // left
                buttons.eq(currentIdx - 1).focus();
            }
            else if (e.which === 39 && currentIdx < buttons.count() - 1) {
                // right
                buttons.eq(currentIdx + 1).focus();
            }
        }
    });
    this.s.closeIcb = function () {
        Dom.s(document).off('keydown' + namespace);
        Dom.s(document).off('keyup' + namespace);
    };
    return namespace;
}
/**
 * Inline editing insertion of fields
 */
function _inline(editFields, opts, closeCb = null) {
    let closed = false;
    let classes = this.classes.inline;
    let keys = Object.keys(editFields);
    let editRow = editFields[keys[0]];
    let lastAttachPoint;
    let elements = [];
    for (let i = 0; i < editRow.attach.length; i++) {
        let name = editRow.attachFields[i][0];
        elements.push({
            field: this.s.fields[name],
            name,
            node: Dom.s(editRow.attach[i])
        });
    }
    let namespace = this._formOptions(opts);
    let ret = this._preopen('inline');
    if (!ret) {
        return this;
    }
    for (let el of elements) {
        let node = el.node;
        el.children = childNodes(node, true);
        // Note the width setting shouldn't be required, but Edge increases the column's
        // width if a % width is used (even 1%). This is the workaround
        let style = navigator.userAgent.indexOf('Edge/') !== -1
            ? 'style="width:' + node.width() + 'px"'
            : '';
        node.append('<div class="' +
            classes.wrapper +
            '">' +
            '<div class="' +
            classes.liner +
            '" ' +
            style +
            '>' +
            '<div class="DTE_Processing_Indicator"><span></span></div>' +
            '</div>' +
            '<div class="' +
            classes.buttons +
            '"></div>' +
            '</div>');
        node.find('div.' + classes.liner.replace(/ /g, '.'))
            .append(el.field.node())
            .append(this.dom.formError);
        // Need the last insert point to allow for number submitTrigger
        let insertParent = Dom.s(el.field.node()).closest('tr');
        if (insertParent.count()) {
            lastAttachPoint = insertParent;
        }
        if (opts.buttons) {
            // Use prepend for the CSS, so we can float the buttons right
            node.find('div.' + classes.buttons.replace(/ /g, '.')).append(this.dom.buttons);
        }
    }
    // If there is a submit trigger target, we need to modify the document to allow submission
    let submitClose = this._inputTrigger('submit', opts, lastAttachPoint);
    let cancelClose = this._inputTrigger('cancel', opts, lastAttachPoint);
    this._closeReg((submitComplete, action) => {
        // Mark that this specific inline edit has closed
        closed = true;
        Dom.s(document).off('click' + namespace);
        // If there was no submit, we need to put the DOM back as it was. If
        // there was a submit, the write of the new value will set the DOM to
        // how it should be. Note also, check if it was an edit action, if not
        // a create will create new row so we tidy this one up
        if (!submitComplete || action !== 'edit') {
            elements.forEach(el => {
                childNodes(el.node, true);
                el.node.append(el.children);
            });
        }
        submitClose();
        cancelClose();
        // Clear error messages "offline"
        this._clearDynamicInfo();
        if (closeCb) {
            closeCb();
        }
        return 'inline'; // trigger `closed`
    });
    // Submit and blur actions
    setTimeout(() => {
        // If already closed, possibly due to some other aspect of the event
        // that triggered the inline call, don't add the event listener - it
        // isn't needed (and is dangerous)
        if (closed) {
            return;
        }
        // Chrome uses the target as the element where the mouse up happens,
        // but we want the target being where the mouse down is, to allow for
        // text selection in an input - so listen on mousedown as well.
        let target;
        Dom.s(document)
            .on('mousedown' + namespace, e => {
            target = e.target;
        })
            .on('keydown' + namespace, e => {
            target = e.target;
        })
            .on('click' + namespace, e => {
            // Was the click inside or owned by one of the editing nodes? If
            // not, then come out of editing mode.
            let isIn = false;
            for (let el of elements) {
                if (el.field._typeFn('owns', target) ||
                    el.node.get(0) === target ||
                    Dom.s(target).closest(el.node.get(0)).count()) {
                    isIn = true;
                }
            }
            if (!isIn) {
                this.blur();
            }
        });
    }, 0);
    this._focus(util.array.pluck(elements, 'field'), opts.focus);
    this._postopen('inline', true);
}
/**
 * Add a triggering action for inline editing, with a return function that
 * will tidy up the events.
 *
 * @param  type Action
 * @param  opts Form options object
 * @param  insertPoint Insert point in the DOM
 * @private
 */
function _inputTrigger(type, opts, insertPoint) {
    let trigger = opts[type + 'Trigger'];
    let html = opts[type + 'Html'];
    let event = 'click.dte-' + type;
    let tr = Dom.s(insertPoint).closest('tr');
    if (trigger === undefined) {
        return () => { };
    }
    // Allow the input to be a column index, including a negative to count from
    // right
    if (typeof trigger === 'number') {
        let kids = tr.children();
        trigger =
            trigger < 0 ? kids.get(kids.count() + trigger) : kids.get(trigger);
    }
    let node = Dom.s(tr).find(trigger);
    let children = childNodes(node, true);
    // Event handler to submit the form and do nothing else
    let triggerEl = node
        .on(event, e => {
        e.stopImmediatePropagation();
        if (type === 'cancel') {
            this.close();
        }
        else {
            this.submit();
        }
    })
        .append(html);
    return () => {
        triggerEl.off(event).empty().append(children);
    };
}
/**
 * Update the field options from a JSON data source
 *
 * @param  {object} json JSON object from the server
 * @private
 */
function _optionsUpdate(json) {
    let that = this;
    if (json && json.options) {
        util.object.each(this.s.fields, function (name, field) {
            if (json.options[name] !== undefined) {
                let fieldInst = that.field(name);
                // If an Ajax option is defined for the DataTable field type,
                // then it is getting its options independently and we should
                // ignore the options from our own Ajax.
                if (fieldInst.dt && fieldInst.dt().ajax.url()) {
                    return;
                }
                if (fieldInst && fieldInst.update) {
                    fieldInst.update(json.options[name]);
                }
            }
        });
    }
}
/**
 * Show a message in the form. This can be used for error messages or dynamic
 * messages (information display) as the structure for each is basically the
 * same. This method will take into account if the form is visible or not - if
 * so then the message is shown with an effect for the end user, otherwise
 * it is just set immediately.
 *
 * @param {element} el The field display node to use
 * @param {string|function} msg The message to show
 * @private
 */
function _message(elIn, msg, title, fn) {
    if (title === undefined) {
        title = false;
    }
    if (!fn) {
        fn = function () { };
    }
    if (typeof msg === 'function') {
        msg = msg(this, new DataTable.Api(this.s.table));
    }
    let el = Dom.s(elIn);
    if (!msg) {
        if (this.s.displayed) {
            // Clear the message with visual effect since the form is visible
            el.css({
                display: 'block',
                opacity: '1'
            }).transition({
                opacity: '0'
            }, null, null, () => {
                el.html('').css('display', 'none');
                fn();
            });
        }
        else {
            // Clear the message without visual effect
            el.html('').css('display', 'none');
            fn();
        }
        if (title) {
            el.attrRemove('title');
        }
    }
    else {
        fn();
        if (this.s.displayed) {
            // Show the message with visual effect
            el.html(msg)
                .css({
                display: 'block',
                opacity: '0'
            })
                .transition({
                opacity: '1'
            });
        }
        else {
            // Show the message without visual effect
            el.html(msg).css('display', 'block');
        }
        if (title) {
            el.attr('title', msg);
        }
    }
}
/**
 * Update the multi-value information display to not show redundant information
 *
 * @private
 */
function _multiInfo() {
    let fields = this.s.fields;
    let include = this.s.includeFields;
    let show = true;
    let state;
    if (!include) {
        return;
    }
    for (let i = 0, ien = include.length; i < ien; i++) {
        let field = fields[include[i]];
        let multiEditable = field.multiEditable();
        if (field.isMultiValue() && multiEditable && show) {
            // Multi-row editable. Only show first message
            state = true;
            show = false;
        }
        else if (field.isMultiValue() && !multiEditable) {
            // Not multi-row editable. Always show message
            state = true;
        }
        else {
            state = false;
        }
        fields[include[i]].multiInfoShown(state);
    }
}
/**
 * Close the current form, which can result in the display controller
 * hiding its display, or showing a form from a level up if nesting
 */
function _nestedClose(cb) {
    let disCtrl = this.s.displayController;
    let show = disCtrl._show;
    if (!show || !show.length) {
        // Nothing shown just now
        if (cb) {
            cb();
        }
    }
    else if (show.length > 1) {
        // Got nested forms - remove current and go one layer up
        show.pop();
        // Get the one to show
        let last = show[show.length - 1];
        if (cb) {
            cb();
        }
        this.s.displayController.open(last.dte, last.append, last.callback);
    }
    else {
        this.s.displayController.close(this, cb);
        show.length = 0;
    }
}
/**
 * Display a form, adding it to the display stack for nesting
 */
function _nestedOpen(cb, nest) {
    let disCtrl = this.s.displayController;
    // This needs to be per display controller, but the controller
    // itself doesn't know anything about the nesting, so we add a
    // "hidden" property to it, used here, but not by the controller
    // itself.
    if (!disCtrl._show) {
        disCtrl._show = [];
    }
    if (!nest) {
        disCtrl._show.length = 0;
    }
    disCtrl._show.push({
        append: this.dom.wrapper,
        callback: cb,
        dte: this
    });
    this.s.displayController.open(this, this.dom.wrapper, cb);
    this._drawTitle();
}
/**
 * Common display editing form method called by all editing methods after the
 * form has been configured and displayed. This is to ensure all fire the same
 * events.
 *
 * @param  {string} type Editing type
 * @param  {boolean} immediate indicate if the open is immediate (in which case
 * `opened` is also triggered).
 * @return {boolean} `true`
 * @private
 */
function _postopen(type, immediate) {
    let focusCapture = this.s.displayController.captureFocus;
    if (focusCapture === undefined) {
        focusCapture = true;
    }
    Dom.s(this.dom.form)
        .off('submit.editor-internal')
        .on('submit.editor-internal', function (e) {
        e.preventDefault();
    });
    // Focus capture - when the Editor form is shown we capture the browser's
    // focus action. Without doing this is would result in the user being able
    // to control items under the Editor display - triggering actions that
    // shouldn't be possible while the editing is shown.
    if (focusCapture && (type === 'main' || type === 'bubble')) {
        Dom.s('body').on('focus.editor-focus', () => {
            if (Dom.s(document.activeElement).closest('.DTE').count() === 0 &&
                Dom.s(document.activeElement).closest('.DTED').count() === 0) {
                if (this.s.setFocus) {
                    this.s.setFocus.focus();
                }
            }
        });
    }
    this._multiInfo();
    this._event('open', [type, this.s.action]);
    if (immediate) {
        this._event('opened', [type, this.s.action]);
    }
    return true;
}
/**
 * Common display editing form method called by all editing methods before the
 * form has been configured and displayed. This is to ensure all fire the same
 * events.
 *
 * @param  {string} Editing type
 * @return {boolean} `false` if the open is cancelled by the preOpen event,
 * otherwise `true`
 * @private
 */
function _preopen(type) {
    // Allow preOpen event to cancel the opening of the display
    if (this._event('preOpen', [type, this.s.action]) === false) {
        // Tidy- this would normally be done on close, but we never get that far
        this._clearDynamicInfo();
        this._event('cancelOpen', [type, this.s.action]);
        // inline and bubble methods cannot be opened using `open()`, they
        // have to be called again, so we need to clean up the event
        // listener added by _formOptions
        if ((this.s.mode === 'inline' || this.s.mode === 'bubble') &&
            this.s.closeIcb) {
            this.s.closeIcb();
        }
        this.s.closeIcb = null;
        return false;
    }
    this._clearDynamicInfo(true);
    this.s.displayed = type;
    return true;
}
/**
 * Set the form into processing mode or take it out of processing mode. In
 * processing mode a processing indicator is shown and user interaction with the
 * form buttons is blocked
 *
 * @param {boolean} processing true if to go into processing mode and false if
 * to come out of processing mode
 * @private
 */
function _processing(processing) {
    let procClass = this.classes.processing.active;
    Dom.s(this.dom.wrapper).find('div.DTE').classToggle(procClass, processing);
    this.s.processing = processing;
    this._event('processing', [processing]);
}
/**
 * Check if any of the fields are processing for the submit to carry on. It
 * can recurse.
 *
 * @private
 */
function _noProcessing(args) {
    let processing = false;
    util.object.each(this.s.fields, function (name, field) {
        if (field.processing()) {
            processing = true;
        }
    });
    if (processing) {
        this.one('processing-field', function () {
            // Are any other fields in a processing state? - Might need to wait again
            if (this._noProcessing(args) === true) {
                this._submit(...args);
            }
        });
    }
    return !processing;
}
/**
 *
 * @param this Editor instance
 * @param items Items to be removed
 * @param argOpts Options from editing API arguments
 * @param editFields Edit fields object
 */
function _remove(items, argOpts, editFields) {
    this.s.action = 'remove';
    this.s.modifier = items;
    this.s.editFields = editFields;
    this.dom.form.style.display = 'none';
    this._actionClass();
    this._event('initRemove', [
        pluck(editFields, 'node'),
        pluck(editFields, 'data'),
        items
    ], () => {
        this._assembleMain();
        this._formOptions(argOpts.opts);
        argOpts.maybeOpen();
        let opts = this.s.editOpts;
        if (opts.focus !== null) {
            // Break the event chain, so keyboard activation of a remove
            // action doesn't immediately submit
            setTimeout(() => {
                // Allow for having been destroy in that short interval!
                if (this.dom) {
                    Dom.s(this.dom.buttons)
                        .find('button')
                        .eq(opts.focus)
                        .focus();
                }
            }, 100);
        }
    });
}
/**
 * Submit a form to the server for processing. This is the private method that is used
 * by the 'submit' API method, which should always be called in preference to calling
 * this method directly.
 *
 * @param {function} [successCallback] Callback function that is executed once the
 * form has been successfully submitted to the server and no errors occurred.
 * @param {function} [errorCallback] Callback function that is executed if the
 * server reports an error due to the submission (this includes a JSON formatting
 * error should the error return invalid JSON).
 * @param {function} [formatdata] Callback function that is passed in the data
 * that will be submitted to the server, allowing pre-formatting of the data,
 * removal of data or adding of extra fields.
 * @param {boolean} [hide=true] When the form is successfully submitted, by default
 * the form display will be hidden - this option allows that to be overridden.
 * @private
 */
function _submit(successCallback, errorCallback, formatdata, hide) {
    let changed = false;
    let allData = {};
    let changedData = {};
    let setBuilder = dataSet;
    let fields = this.s.fields;
    let editCount = this.s.editCount;
    let editFields = this.s.editFields;
    let editData = this.s.editData;
    let opts = this.s.editOpts;
    let changedSubmit = opts.submit;
    let submitParamsLocal;
    DataTable.plus('2026-07-19', 'editor');
    // First - are any of the fields currently "processing"? If so, then we
    // want to let them complete before submitting
    if (this._noProcessing(arguments) === false) {
        error$1('Field is still processing', 16, false);
        return;
    }
    // After initSubmit to allow `mode()` to be used as a setter
    let action = this.s.action;
    let submitParams = {
        data: {}
    };
    submitParams[this.s.actionName] = action;
    // Gather the data that is to be submitted
    if (action === 'create' || action === 'edit') {
        util.object.each(editFields, function (idSrc, edit) {
            let allRowData = {};
            let changedRowData = {};
            util.object.each(fields, function (name, field) {
                if (edit.fields[name] && field.submittable()) {
                    let multiGet = field.multiGet();
                    let builder = setBuilder(name);
                    // If it wasn't an edit field, we still need to get the original
                    // data, so we can submit it if `all` or `allIfChanged`
                    if (multiGet[idSrc] === undefined && edit.data) {
                        let originalVal = field.valFromData(edit.data);
                        builder(allRowData, originalVal);
                        return;
                    }
                    let value = multiGet[idSrc];
                    let manyBuilder = Array.isArray(value) &&
                        typeof name === 'string' &&
                        name.indexOf('[]') !== -1
                        ? setBuilder(name.replace(/\[.*$/, '') + '-many-count')
                        : null;
                    builder(allRowData, value);
                    // We need to tell the server-side if an array submission
                    // actually has no elements so it knows if the array was
                    // being submitted or not (since otherwise it doesn't know
                    // if the array was empty, or just not being submitted)
                    if (manyBuilder) {
                        manyBuilder(allRowData, value.length);
                    }
                    // Build a changed object for if that is the selected data
                    // type
                    if (action === 'edit' &&
                        (!editData[name] ||
                            !field.compare(value, editData[name][idSrc]))) {
                        builder(changedRowData, value);
                        changed = true;
                        if (manyBuilder) {
                            manyBuilder(changedRowData, value.length);
                        }
                    }
                }
            });
            if (Object.keys(allRowData).length) {
                allData[idSrc] = allRowData;
            }
            if (Object.keys(changedRowData).length) {
                changedData[idSrc] = changedRowData;
            }
        });
        // Decide what data to submit to the server for edit (create is all, always)
        if (action === 'create' ||
            changedSubmit === 'all' ||
            (changedSubmit === 'allIfChanged' && changed)) {
            submitParams.data = allData;
        }
        else if (changedSubmit === 'changed' && changed) {
            submitParams.data = changedData;
        }
        else {
            // Nothing to submit
            this.s.action = null;
            if (opts.onComplete === 'close' && (hide === undefined || hide)) {
                this._close(false);
            }
            else if (typeof opts.onComplete === 'function') {
                opts.onComplete(this);
            }
            if (successCallback) {
                successCallback.call(this);
            }
            this._processing(false);
            this._event('submitComplete');
            return;
        }
    }
    else if (action === 'remove') {
        util.object.each(editFields, function (idSrc, edit) {
            submitParams.data[idSrc] = edit.data;
        });
    }
    // Local copy of the submit parameters, needed for the data lib prep since
    // the preSubmit can modify the format and we need to know what the format is
    submitParamsLocal = util.object.assignDeep({}, submitParams);
    // Allow the data to be submitted to the server to be preprocessed by callback
    // and event functions
    if (formatdata) {
        formatdata(submitParams);
    }
    // Client-side validation
    if (!this._validate()) {
        this._processing(false);
        return;
    }
    this._event('preSubmit', [submitParams, action], result => {
        if (result === false) {
            this._processing(false);
        }
        else {
            // Submit to the server (or whatever method is defined in the settings)
            let submitWire = this.s.ajax ? this._ajax : this._submitTable;
            submitWire.call(this, submitParams, (json, notGood, xhr) => {
                this._submitSuccess(json, notGood, submitParams, submitParamsLocal, this.s.action, editCount, hide, successCallback, errorCallback, xhr);
            }, (xhr, err, thrown) => {
                this._submitError(xhr, err, thrown, errorCallback, submitParams, this.s.action);
            });
        }
    });
}
/**
 * Save submitted data without an Ajax request. This will write to a local
 * table only - not saving it permanently, but rather using the DataTable itself
 * as a data store.
 *
 * @param  {object} data Data to submit
 * @param  {function} success Success callback
 * @param  {function} error Error callback
 * @param  {object} submitParams Submitted data
 * @private
 */
function _submitTable(data, success, error) {
    let action = data.action;
    let out = { data: [] };
    let idGet = dataGet(this.s.idSrc);
    let idSet = dataSet(this.s.idSrc);
    // Nothing required for remove - create and edit get a copy of the data
    if (action !== 'remove') {
        let originalData = this.s.mode === 'main'
            ? this._dataSource('fields', this.modifier())
            : this._dataSource('individual', this.modifier());
        util.object.each(data.data, function (key, vals) {
            let toSave;
            let extender = extendDeepObjShallowArr;
            // Get the original row's data, so we can modify it with new values.
            // This allows Editor to not need to submit all fields
            if (action === 'edit') {
                let rowData = originalData[key].data;
                toSave = extender({}, rowData);
                toSave = extender(toSave, vals);
            }
            else {
                toSave = extender({}, vals);
            }
            // If create and there isn't an id for the new row, create
            // one. An id could be creased by `preSubmit`
            let overrideId = idGet(toSave);
            if (action === 'create' && overrideId === undefined) {
                idSet(toSave, +new Date() + key.toString());
            }
            else {
                idSet(toSave, overrideId);
            }
            out.data.push(toSave);
        });
    }
    success(out);
}
/**
 * Submit success callback function
 *
 * @param  {object} json                Payload
 * @param  {bool} notGood               True if the returned status code was
 * >=400 (i.e. processing failed). This is called `notGood` rather than
 * `success` since the request was successfully processed, just not written to
 * the db. It is also inverted from "good" to make it optional when overriding
 * the `ajax` function.
 * @param  {object} submitParams        Submitted data
 * @param  {object} submitParamsLocal   Unmodified copy of submitted data
 * (before it could be modified by the user)
 * @param  {string} action              CRUD action being taken
 * @param  {int} editCount              Protection against async errors
 * @param  {bool} hide                  Hide the form flag
 * @param  {function} successCallback   Success callback
 * @param  {function} errorCallback     Error callback
 * @private
 */
function _submitSuccess(json, notGood, submitParams, submitParamsLocal, action, editCount, hide, successCallback, errorCallback, xhr) {
    let that = this;
    let setData;
    let fields = this.s.fields;
    let opts = this.s.editOpts;
    let modifier = this.s.modifier;
    this._event('postSubmit', [json, submitParams, action, xhr]);
    if (!json.error) {
        json.error = '';
    }
    if (!json.fieldErrors) {
        json.fieldErrors = [];
    }
    if (notGood || json.error || json.fieldErrors.length) {
        // Global form error
        let globalError = [];
        let fieldsInError = [];
        if (json.error) {
            globalError.push(json.error);
        }
        // Field specific errors
        json.fieldErrors.forEach((err, i) => {
            let field = fields[err.name];
            if (!field) {
                throw new Error('Unknown field: ' + err.name);
            }
            else if (field.displayed()) {
                field.error(err.status || 'Error');
                if (i === 0) {
                    if (opts.onFieldError === 'focus') {
                        // Scroll the display to the first error and focus
                        Dom.s(this.dom.bodyContent).scrollTop(Dom.s(field.node()).position().top);
                        field.focus();
                    }
                    else if (typeof opts.onFieldError === 'function') {
                        opts.onFieldError(this, err);
                    }
                }
            }
            else {
                // If the field isn't visible, we need to make it display as a
                // global error. This _shouldn't_ happen - it means there is
                // invalid data if it does
                globalError.push(field.name() + ': ' + (err.status || 'Error'));
            }
            fieldsInError.push(field.name());
        });
        // Set global error. Note this will clear it if there are no global
        // errors
        this.error(globalError.join('<br>'));
        // Any fields which aren't in error need to have the error state cleared
        // in case they were previously in error
        util.object.each(this.s.fields, (name, field) => {
            if (!fieldsInError.includes(name)) {
                field.error('');
            }
        });
        this._event('submitUnsuccessful', [json]);
        if (errorCallback) {
            errorCallback.call(that, json);
        }
    }
    else {
        // No errors, so can clear the validation information
        this.error('');
        util.object.each(this.s.fields, (name, field) => field.error(''));
        // Create a data store that the data source can use, which is
        // unique to this action
        let store = {};
        if (json.data && (action === 'create' || action === 'edit')) {
            this._dataSource('prep', action, modifier, submitParamsLocal, json, store);
            for (let data of json.data) {
                setData = data;
                let id = this._dataSource('id', data);
                this._event('setData', [json, data, action]); // legacy
                if (action === 'create') {
                    // New row was created to add it to the DT
                    this._event('preCreate', [json, data, id]);
                    this._dataSource('create', fields, data, store);
                    this._event(['create', 'postCreate'], [json, data, id]);
                }
                else if (action === 'edit') {
                    // Row was updated, so tell the DT
                    this._event('preEdit', [json, data, id]);
                    this._dataSource('edit', modifier, fields, data, store);
                    this._event(['edit', 'postEdit'], [json, data, id]);
                }
            }
            this._dataSource('commit', action, modifier, json.data, store);
        }
        else if (action === 'remove') {
            this._dataSource('prep', action, modifier, submitParamsLocal, json, store);
            // Remove the rows given and then redraw the table
            this._event('preRemove', [json, this.ids()]);
            this._dataSource('remove', modifier, fields, store);
            this._event(['remove', 'postRemove'], [json, this.ids()]);
            this._dataSource('commit', action, modifier, json.data, store);
        }
        this._optionsUpdate(json);
        // Submission complete
        if (editCount === this.s.editCount) {
            let sAction = this.s.action;
            // Allow the form to remain open and editable
            if (opts.onComplete !== 'continue' && hide !== false) {
                // Must do before close, in case close starts a new edit
                this.s.action = null;
                if (opts.onComplete === 'close' &&
                    (hide === undefined || hide)) {
                    // If no data returned, then treat as not complete
                    this._close(json.data ? true : false, sAction);
                }
                else if (typeof opts.onComplete === 'function') {
                    opts.onComplete(this);
                }
            }
        }
        // All done - fire off the callbacks and events
        if (successCallback) {
            successCallback.call(that, json);
        }
        this._event('submitSuccess', [json, setData, action]);
    }
    this._processing(false);
    this._event('submitComplete', [json, setData, action]);
}
/**
 * Submit error callback function
 *
 * @private
 */
function _submitError(xhr, err, thrown, errorCallback, submitParams, action) {
    this._event('postSubmit', [null, submitParams, action, xhr]);
    this.error(this.i18n(null, 'error.system'));
    this._processing(false);
    if (errorCallback) {
        errorCallback.call(this, xhr, err, thrown);
    }
    this._event(['submitError', 'submitComplete'], [xhr, err, thrown, submitParams]);
}
/**
 * Check to see if the form needs to be tidied before a new action can be performed.
 * This includes if the from is currently processing an old action and if it
 * is inline editing.
 *
 * @param {function} fn Callback function
 * @returns {boolean} `true` if was in inline mode, `false` otherwise
 * @private
 */
function _tidy(fn) {
    let dt = this.s.table ? new DataTable.Api(this.s.table) : null;
    let ssp = false;
    if (dt) {
        ssp = dt.settings()[0].features.serverSide;
    }
    if (this.s.processing) {
        // If currently processing, wait until the action is complete
        this.one('submitComplete', () => {
            // If server-side processing is being used in DataTables, first
            // check that we are still processing (might not be if nothing was
            // submitted) and then wait for the draw to finished
            if (ssp && this.s.processing) {
                dt.one('draw', fn);
            }
            else {
                setTimeout(function () {
                    fn();
                }, 10);
            }
        });
        return true;
    }
    else if (this.display() === 'inline' || this.display() === 'bubble') {
        // If there is an inline edit box, it needs to be tidied
        this.one('close', () => {
            // On close if processing then we need to wait for the submit to
            // complete before running the callback as onBlur was set to
            // submit
            if (!this.s.processing) {
                // IE needs a small timeout, otherwise it may not focus on a
                // field if one already has focus
                setTimeout(() => {
                    // Check this Editor wasn't destroyed
                    if (this.s) {
                        fn();
                    }
                }, 10);
            }
            else {
                // Need to wait for the submit to finish
                this.one('submitComplete', (e, json) => {
                    // If SSP then need to wait for the draw
                    if (ssp && json) {
                        dt.one('draw', fn);
                    }
                    else {
                        setTimeout(() => {
                            if (this.s) {
                                fn();
                            }
                        }, 10);
                    }
                });
            }
        }).blur();
        return true;
    }
    return false;
}
/**
 * Scan over each field and check if it is valid.
 *
 * @param this Editor
 * @returns false if any field is invalid
 */
function _validate() {
    let isValid = true;
    let valid = [];
    let errors = [];
    util.object.each(this.s.fields, function (name, field) {
        if (field.validate() === false) {
            isValid = false;
            errors.push(name);
        }
        else {
            valid.push(name);
        }
    });
    // If there is a field which is in error, we need to clear the error status
    // of any fields which are not in error, otherwise they wouldn't be cleared
    // since the post submit clear won't run (`return false` below cancels the
    // submit)
    if (errors.length) {
        valid.forEach(name => {
            this.s.fields[name].error('');
        });
    }
    return isValid;
}
/**
 * Same as indexOf but with weak type checking
 *
 * @param {any} name Value to look for in the array
 * @param {array} arr Array to scan through
 * @returns {number} -1 if not found, index otherwise
 */
function _weakInArray(name, arr) {
    for (let i = 0, ien = arr.length; i < ien; i++) {
        if (name == arr[i]) {
            return i;
        }
    }
    return -1;
}

let displayed$1 = false;
const domEls$1 = {
    background: Dom
        .c('div')
        .classAdd('DTED_Envelope_Background')
        .css('opacity', '0')
        .append(Dom.c('div')),
    close: Dom.c('div').classAdd('DTED_Envelope_Close'),
    content: Dom.c('div'), // Will be replaced with the actual content
    wrapper: Dom
        .c('div')
        .classAdd('DTED DTED_Envelope_Wrapper')
        .css('opacity', '0')
        .append(Dom.c('div').classAdd('DTED_Envelope_Shadow'))
        .append(Dom.c('div').classAdd('DTED_Envelope_Container'))
};
function findAttachRow(editor, attach) {
    let dt = new DataTable.Api(editor.s.table);
    // Figure out where we want to put the form display
    if (attach === 'head') {
        return dt.table(undefined).header(); // typing error in DT type file
    }
    else if (editor.s.action === 'create') {
        return dt.table(undefined).header();
    }
    else {
        return dt.row(editor.s.modifier).node();
    }
}
function heightCalc$1(dte) {
    // Set the max-height for the form content
    let header = domEls$1.wrapper.find('div.DTE_Header').height('outer');
    let footer = domEls$1.wrapper.find('div.DTE_Footer').height('outer');
    let maxHeight = Dom.w.height() - envelope.conf.windowPadding * 2 - header - footer;
    domEls$1.wrapper
        .find('div.DTE_Body_Content')
        .css('maxHeight', maxHeight + 'px');
    return Dom.s(dte.dom.wrapper).height('outer');
}
function hide$1(dte, callback) {
    if (!callback) {
        callback = function () { };
    }
    if (displayed$1) {
        // Slide up and then fade out and remove the display elements
        domEls$1.content.transition({
            top: -(domEls$1.content.height() + 50) + 'px'
        }, null, null, function () {
            let dis = Dom.s([
                domEls$1.wrapper.get(0),
                domEls$1.background.get(0)
            ]);
            dis.transition({ opacity: '0' }, null, null, function () {
                dis.detach();
                callback();
            });
        });
        displayed$1 = false;
    }
}
function init$1() {
    domEls$1.content = domEls$1.wrapper.find('div.DTED_Envelope_Container');
}
function show$1(dte, callback) {
    Dom.s('body')
        .append(domEls$1.background.css({ opacity: '0' }))
        .append(domEls$1.wrapper.css({ opacity: '0' }));
    // Adjust size for the content
    domEls$1.content.css('height', 'auto');
    if (!displayed$1) {
        let height = heightCalc$1(dte);
        let targetRow = findAttachRow(dte, envelope.conf.attach);
        let width = targetRow.offsetWidth;
        // Prep the display
        domEls$1.wrapper.css({
            width: width + 'px',
            marginLeft: -(width / 2) + 'px',
            top: Dom.s(targetRow).offset().top + targetRow.offsetHeight + 'px'
        });
        domEls$1.content.css('top', -1 * height - 20 + 'px');
        // Fade in the background and then lower the content
        domEls$1.background.transition({ opacity: '1' });
        domEls$1.wrapper.transition({ opacity: '1' }, null, null, () => {
            domEls$1.content.transition({ top: '0' });
        });
    }
    // Event handlers
    domEls$1.close
        .attr('title', dte.i18n(null, 'close'))
        .off('click.DTED_Envelope')
        .on('click.DTED_Envelope', function (e) {
        dte.close();
    });
    domEls$1.background
        .off('click.DTED_Envelope')
        .on('click.DTED_Envelope', function (e) {
        dte.background();
    });
    domEls$1.wrapper
        .find('div.DTED_Lightbox_Content_Wrapper')
        .off('click.DTED_Envelope')
        .on('click.DTED_Envelope', function (e) {
        if (Dom.s(e.target).classHas('DTED_Envelope_Content_Wrapper')) {
            dte.background();
        }
    });
    Dom.w.off('resize.DTED_Envelope');
    Dom.w.on('resize.DTED_Envelope', function () {
        heightCalc$1(dte);
    });
    displayed$1 = true;
}
const envelope = {
    close(dte, callback) {
        hide$1(dte, callback);
    },
    conf: {
        attach: 'row',
        windowPadding: 50
    },
    destroy(dte) {
        hide$1();
    },
    init(dte) {
        init$1();
        return envelope;
    },
    node(dte) {
        return domEls$1.wrapper.get(0);
    },
    open(dte, append, callback) {
        domEls$1.content.children().detach();
        domEls$1.content.append(append);
        domEls$1.content.append(domEls$1.close);
        show$1(dte);
    }
};

function isMobile() {
    return typeof window.orientation !== 'undefined' && window.outerWidth <= 576
        ? true
        : false;
}
let displayed = false;
let ready = false;
let scrollTop = 0;
const domEls = {
    background: Dom
        .c('div')
        .classAdd('DTED_Lightbox_Background')
        .append(Dom.c('div')),
    close: Dom.c('div').classAdd('DTED_Lightbox_Close'),
    content: null,
    wrapper: Dom
        .c('div')
        .classAdd('DTED_Lightbox_Wrapper')
        .append(Dom
        .c('div')
        .classAdd('DTED_Lightbox_Container')
        .append(Dom
        .c('div')
        .classAdd('DTED_Lightbox_Content_Wrapper')
        .append(Dom.c('div').classAdd('DTED_Lightbox_Content'))))
};
function heightCalc() {
    let headerFooter = domEls.wrapper.find('div.DTE_Header').height('outer') +
        domEls.wrapper.find('div.DTE_Footer').height('outer');
    if (isMobile()) {
        domEls.wrapper
            .find('div.DTE_Body_Content')
            .css('maxHeight', 'calc(100vh - ' + headerFooter + 'px)');
    }
    else {
        // Set the max-height for the form content
        let maxHeight = Dom.w.height() - self.conf.windowPadding * 2 - headerFooter;
        domEls.wrapper
            .find('div.DTE_Body_Content')
            .css('maxHeight', maxHeight + 'px');
    }
}
function hide(dte, callback) {
    if (!callback) {
        callback = function () { };
    }
    // Restore scroll state
    Dom.s('body').scrollTop(scrollTop);
    domEls.wrapper.transition({ opacity: '0', top: self.conf.offsetAni }, null, null, () => {
        domEls.wrapper.detach();
        callback();
    });
    domEls.background.transition({ opacity: '0' }, null, null, () => {
        domEls.background.detach();
    });
    displayed = false;
    Dom.w.off('resize.DTED_Lightbox');
}
function init() {
    if (ready) {
        return;
    }
    domEls.content = domEls.wrapper.find('div.DTED_Lightbox_Content');
    domEls.wrapper.css('opacity', '0');
    domEls.background.css('opacity', '0');
    ready = true;
}
function show(dte, callback) {
    // Mobiles have very poor position fixed abilities, so we need to know
    // when using mobile A media query isn't good enough
    if (isMobile()) {
        Dom.s('body').classAdd('DTED_Lightbox_Mobile');
    }
    Dom.s('body').append(domEls.background).append(domEls.wrapper);
    heightCalc();
    if (!displayed) {
        displayed = true;
        domEls.content.css('height', 'auto');
        domEls.wrapper.css({
            top: -self.conf.offsetAni + 'px'
        });
        domEls.wrapper.transition({
            opacity: '1',
            top: '0'
        }, null, null, callback);
        domEls.background.transition({ opacity: '1' });
        Dom.w.on('resize.DTED_Lightbox', function () {
            heightCalc();
        });
        scrollTop = Dom.s('body').scrollTop();
    }
    // Event handlers - assign on show, premoving previous bindings
    domEls.close
        .attr('title', dte.i18n(null, 'close'))
        .off('click.DTED_Lightbox')
        .on('click.DTED_Lightbox', function (e) {
        dte.close();
    });
    domEls.background
        .off('click.DTED_Lightbox')
        .on('click.DTED_Lightbox', function (e) {
        e.stopImmediatePropagation();
        dte.background();
    });
    domEls.wrapper
        .find('div.DTED_Lightbox_Content_Wrapper')
        .off('click.DTED_Lightbox')
        .on('click.DTED_Lightbox', function (e) {
        if (Dom.s(e.target).classHas('DTED_Lightbox_Content_Wrapper')) {
            e.stopImmediatePropagation();
            dte.background();
        }
    });
}
const self = {
    close(dte, callback) {
        hide(dte, callback);
    },
    conf: {
        offsetAni: 25,
        windowPadding: 25
    },
    destroy(dte) {
        if (displayed) {
            hide();
        }
    },
    init(dte) {
        init();
        return self;
    },
    node(dte) {
        return domEls.wrapper.get(0);
    },
    open(dte, append, callback) {
        let content = domEls.content;
        content.children().detach();
        content.append(append).append(domEls.close);
        show(dte, callback);
    }
};

function staticDisplay (elm) {
    let name = 'static' + Math.random();
    let emptyInfo;
    let el = Dom.s(elm).classAdd('DTED_Static');
    Editor.display[name] = util.object.assign({}, Editor.models.displayController, {
        // Create the HTML mark-up needed the display controller
        init: function (editor) {
            emptyInfo = el.children();
            return Editor.display[name];
        },
        // Show the form
        open: function (editor, form, callback) {
            el.children().detach();
            el.append(form);
            if (callback) {
                callback();
            }
        },
        // Hide the form
        close: function (editor, callback) {
            el.children().detach();
            el.append(emptyInfo);
            if (callback) {
                callback();
            }
        },
        node: function () {
            return el.get(0);
        }
    });
    return name;
}

/**
 * Class names that are used by Editor for its various display components.
 * A copy of this object is taken when an Editor instance is initialised, thus
 * allowing different classes to be used in different instances if required.
 * Class name changes can be useful for easy integration with CSS frameworks,
 * for example Twitter Bootstrap.
 *
 * @namespace
 */
var classNames = {
    /**
     * Action classes - these are added to the Editor base element ("wrapper")
     * and allows styling based on the type of form view that is being employed.
     *
     * @namespace
     */
    actions: {
        /**
         * Editor is in 'create' state
         */
        create: 'DTE_Action_Create',
        /**
         * Editor is in 'edit' state
         */
        edit: 'DTE_Action_Edit',
        /**
         * Editor is in 'remove' state
         */
        remove: 'DTE_Action_Remove'
    },
    /**
     * Display body classes
     *
     * @namespace
     */
    body: {
        /**
         * Liner for the body content
         */
        content: 'DTE_Body_Content',
        /**
         * Container for the body elements
         */
        wrapper: 'DTE_Body'
    },
    /**
     * Bubble editing classes - these are used to display the bubble editor
     *
     * @namespace
     */
    bubble: {
        /**
         * Fixed background
         */
        bg: 'DTE_Bubble_Background',
        /**
         * Close button
         */
        close: 'DTE_Bubble_Close',
        /**
         * Bubble content liner
         */
        liner: 'DTE_Bubble_Liner',
        /**
         * Pointer shown which node is being edited
         */
        pointer: 'DTE_Bubble_Triangle',
        /**
         * Bubble table display wrapper, so the buttons and form can be shown
         * as table cells (via css)
         */
        table: 'DTE_Bubble_Table',
        /**
         * Bubble container element
         */
        wrapper: 'DTE DTE_Bubble'
    },
    /**
     * Field classes
     *
     * @namespace
     */
    field: {
        /**
         * Field is disabled
         */
        'disabled': 'disabled',
        /**
         * Field error state (added to the field.wrapper element when in error state
         */
        'error': 'DTE_Field_StateError',
        /**
         * Field input container
         */
        'input': 'DTE_Field_Input',
        /**
         * Input elements wrapper
         */
        'inputControl': 'DTE_Field_InputControl',
        /**
         * Error class for the `input` element (whatever it might be)
         */
        'inputError': '',
        /**
         * Field label
         */
        'label': 'DTE_Label',
        /**
         * Error information text
         */
        'msg-error': 'DTE_Field_Error',
        /**
         * General information text
         */
        'msg-info': 'DTE_Field_Info',
        /**
         * Label information text
         */
        'msg-label': 'DTE_Label_Info',
        /**
         * Live messaging (API) information text
         */
        'msg-message': 'DTE_Field_Message',
        /**
         * Multi-value information descriptive text
         */
        'multiInfo': 'multi-info',
        /**
         * Multi-value not editable (field.multiEditable)
         */
        'multiNoEdit': 'multi-noEdit',
        /**
         * Multi-value information display
         */
        'multiRestore': 'multi-restore',
        /**
         * Multi-value information display wrapper
         */
        'multiValue': 'multi-value',
        /**
         * Class prefix for the field name - field name is added to the end allowing
         * styling based on field name.
         */
        'namePrefix': 'DTE_Field_Name_',
        /**
         * Field's processing element
         */
        'processing': 'DTE_Processing_Indicator',
        /**
         * Class prefix for the field type - field type is added to the end allowing
         * styling based on field type.
         */
        'typePrefix': 'DTE_Field_Type_',
        /**
         * Container for each field
         */
        'wrapper': 'DTE_Field'
    },
    /**
     * Display footer classes
     *
     * @namespace
     */
    footer: {
        /**
         * Liner for the footer content
         */
        content: 'DTE_Footer_Content',
        /**
         * Container for the footer elements
         */
        wrapper: 'DTE_Footer'
    },
    /**
     * Form classes
     *
     * @namespace
     */
    form: {
        /**
         * Button
         */
        button: 'btn',
        /* Class used when a string is used for a button's definition */
        buttonSubmit: 'btn',
        /**
         * Button inside the form
         */
        buttonInternal: 'btn',
        /**
         * Buttons container
         */
        buttons: 'DTE_Form_Buttons',
        /**
         * Liner for the form content
         */
        content: 'DTE_Form_Content',
        /**
         * Global error imformation
         */
        error: 'DTE_Form_Error',
        /**
         * Global form information
         */
        info: 'DTE_Form_Info',
        /**
         * Applied to the <form> tag
         */
        tag: '',
        /**
         * Container for the form elements
         */
        wrapper: 'DTE_Form'
    },
    /**
     * Display header classes
     *
     * @namespace
     */
    header: {
        /**
         * Liner for the header content
         */
        content: 'DTE_Header_Content',
        /**
         * Title tag
         */
        title: {
            tag: null,
            class: ''
        },
        /**
         * Container for the header elements
         */
        wrapper: 'DTE_Header'
    },
    /**
     * Inline editing classes - these are used to display the inline editor
     *
     * @namespace
     */
    inline: {
        buttons: 'DTE_Inline_Buttons',
        liner: 'DTE_Inline_Field',
        wrapper: 'DTE DTE_Inline',
    },
    /**
     * Processing classes
     *
     * @namespace
     */
    processing: {
        /**
         * Added to the base element ("wrapper") when the form is "processing"
         */
        active: 'processing',
        /**
         * Processing indicator element
         */
        indicator: 'DTE_Processing_Indicator'
    },
    /**
     * Applied to the base DIV element that contains all other Editor elements
     */
    wrapper: 'DTE'
};

const button = {
    action: null,
    className: null,
    tabIndex: 0,
    text: null,
};

const displayController = {
    close: () => { },
    init: () => { },
    node: () => { },
    open: () => { }
};

const settings = {
    action: null,
    actionName: 'action',
    ajax: null,
    bubbleNodes: [],
    bubbleBottom: false,
    bubbleLocation: 'auto',
    closeCb: null,
    closeIcb: null,
    dataSource: null,
    displayController: null,
    displayed: false,
    editCount: 0,
    editData: {},
    editFields: {},
    editOpts: {},
    events: [],
    fields: {},
    formOptions: {
        bubble: Object.assign({}, formOptions),
        inline: Object.assign({}, formOptions),
        main: Object.assign({}, formOptions),
    },
    globalError: '',
    i18n: {}, // Gets filled in by the extend in the constructor
    id: -1,
    idSrc: null,
    includeFields: [],
    mode: null,
    modifier: null,
    opts: null,
    order: [],
    processing: false,
    setFocus: null,
    table: null,
    template: null,
    title: null,
    unique: 0
};

/*
 * DataTables API integration. Provides the ability to control basic Editor
 * aspects from the DataTables API. Full control does of course require use of
 * the Editor API though.
 */
let apiRegister = DataTable.Api.register;
function _getInst(api) {
    let ctx = api.context[0];
    return ctx.init.editor || ctx._editor;
}
// Set sensible defaults for the editing options
function _setBasic(inst, opts, type, plural) {
    if (!opts) {
        opts = {};
    }
    if (opts.buttons === undefined) {
        opts.buttons = '_basic';
    }
    if (opts.title === undefined) {
        opts.title = inst.i18n(null, type + '.title');
    }
    if (opts.message === undefined) {
        if (type === 'remove') {
            let confirm = inst.i18n(null, type + '.confirm');
            opts.message = plural !== 1 ? confirm._.replace(/%d/, plural) : confirm['1'];
        }
        else {
            opts.message = '';
        }
    }
    return opts;
}
apiRegister('editor()', function () {
    return _getInst(this);
});
// Row editing
apiRegister('row.create()', function (opts) {
    // main
    let inst = _getInst(this);
    inst.create(_setBasic(inst, opts, 'create'));
    return this;
});
apiRegister('row().edit()', function (opts) {
    // main
    let inst = _getInst(this);
    inst.edit(this[0][0], _setBasic(inst, opts, 'edit'));
    return this;
});
apiRegister('rows().edit()', function (opts) {
    // main
    let inst = _getInst(this);
    inst.edit(this[0], _setBasic(inst, opts, 'edit'));
    return this;
});
apiRegister('row().delete()', function (opts) {
    // main
    let inst = _getInst(this);
    inst.remove(this[0][0], _setBasic(inst, opts, 'remove', 1));
    return this;
});
apiRegister('rows().delete()', function (opts) {
    // main
    let inst = _getInst(this);
    inst.remove(this[0], _setBasic(inst, opts, 'remove', this[0].length));
    return this;
});
apiRegister('cell().edit()', function (type, opts) {
    // inline or bubble
    if (!type) {
        type = 'inline';
    }
    else if (util.is.plainObject(type)) {
        opts = type;
        type = 'inline';
    }
    _getInst(this)[type](this[0][0], opts);
    return this;
});
apiRegister('cells().edit()', function (opts) {
    // bubble only at the moment
    _getInst(this).bubble(this[0], opts);
    return this;
});
apiRegister('file()', file);
apiRegister('files()', files);

const buttons = DataTable.ext.buttons;
/*
 * Add helpful buttons to make life easier
 *
 * Note that the values that require a string to make any sense (the button text
 * for example) are set by Editor when Editor is initialised through the i18n
 * options.
 */
buttons.create = {
    action(e, dt, node, config) {
        let that = this;
        let editor = config.editor;
        this.processing(true);
        editor
            .one('preOpen', function () {
            that.processing(false);
        })
            .create(util.object.assign({
            buttons: config.formButtons,
            message: editor.i18n(config.formMessage, 'create.message'),
            nest: true,
            title: editor.i18n(config.formTitle, 'create.title')
        }, config.formOptions));
    },
    className: 'buttons-create',
    editor: null,
    formButtons: {
        action(e) {
            this.submit();
        },
        text(editor) {
            return editor.i18n(null, 'create.submit');
        }
    },
    formMessage: null,
    formOptions: {},
    formTitle: null,
    text(dt, node, config) {
        return dt.i18n('buttons.create', config.editor.i18n(null, 'create.button'));
    },
};
buttons.createInline = {
    action(e, dt, node, config) {
        config.editor.inlineCreate(config.position, config.formOptions);
    },
    className: 'buttons-create',
    editor: null,
    formButtons: {
        action(e) {
            this.submit();
        },
        text(editor) {
            return editor.i18n(null, 'create.submit');
        }
    },
    formOptions: {},
    position: 'start',
    text(dt, node, config) {
        return dt.i18n('buttons.create', config.editor.i18n(null, 'create.button'));
    },
};
buttons.edit = {
    action(e, dt, node, config) {
        let that = this;
        let editor = config.editor;
        let rows = dt.rows({ selected: true }).indexes();
        let columns = dt.columns({ selected: true }).indexes();
        let cells = dt.cells({ selected: true }).indexes();
        let items = columns.length || cells.length ?
            {
                cells,
                columns,
                rows
            } :
            rows;
        this.processing(true);
        editor
            .one('preOpen', function () {
            that.processing(false);
        })
            .edit(items, util.object.assign({
            buttons: config.formButtons,
            message: editor.i18n(config.formMessage, 'edit.message'),
            nest: true,
            refresh: config.refresh,
            title: editor.i18n(config.formTitle, 'edit.title')
        }, config.formOptions));
    },
    className: 'buttons-edit',
    editor: null,
    extend: 'selected',
    formButtons: {
        action(e) {
            this.submit();
        },
        text(editor) {
            return editor.i18n(null, 'edit.submit');
        },
    },
    formMessage: null,
    formOptions: {},
    formTitle: null,
    text(dt, node, config) {
        return dt.i18n('buttons.edit', config.editor.i18n(null, 'edit.button'));
    },
    refresh: false
};
buttons.remove = {
    action(e, dt, node, config) {
        let that = this;
        let editor = config.editor;
        this.processing(true);
        editor
            .one('preOpen', function () {
            that.processing(false);
        })
            .remove(dt.rows({ selected: true }).indexes(), util.object.assign({
            buttons: config.formButtons,
            message: config.formMessage,
            nest: true,
            refresh: config.refresh,
            title: editor.i18n(config.formTitle, 'remove.title')
        }, config.formOptions));
    },
    className: 'buttons-remove',
    editor: null,
    extend: 'selected',
    formButtons: {
        action(e) {
            this.submit();
        },
        text(editor) {
            return editor.i18n(null, 'remove.submit');
        },
    },
    formMessage(editor, dt) {
        let rows = dt.rows({ selected: true }).indexes();
        let i18n = editor.i18n(null, 'remove');
        let question = typeof i18n.confirm === 'string' ?
            i18n.confirm :
            i18n.confirm[rows.length] ?
                i18n.confirm[rows.length] : i18n.confirm._;
        return question.replace(/%d/g, rows.length);
    },
    formOptions: {},
    formTitle: null,
    limitTo: ['rows'],
    text(dt, node, config) {
        return dt.i18n('buttons.remove', config.editor.i18n(null, 'remove.button'));
    },
    refresh: false
};
// Reuse the standard edit and remove buttons for their singular equivalent,
// but set it to extend the single selected button only
buttons.editSingle = util.object.assign({}, buttons.edit);
buttons.editSingle.extend = 'selectedSingle';
buttons.removeSingle = util.object.assign({}, buttons.remove);
buttons.removeSingle.extend = 'selectedSingle';

if (!DataTable || !DataTable.versionCheck || !DataTable.versionCheck('3')) {
    throw new Error('Editor requires DataTables 3 or newer');
}
class Editor {
    /**
     * Create a new instance of DataTables Editor.
     *
     * @param init Editor configuration object
     * @returns Editor instance
     */
    constructor(init) {
        this.add = add;
        this.ajax = ajax;
        this.background = background;
        this.blur = blur;
        this.bubble = bubble;
        this.bubbleLocation = bubbleLocation;
        this.bubblePosition = bubblePosition;
        this.buttons = buttons$1;
        this.clear = clear;
        this.close = close;
        this.create = create;
        this.undependent = undependent;
        this.dependent = dependent;
        this.destroy = destroy;
        this.disable = disable;
        this.display = display;
        this.displayed = displayed$2;
        this.displayNode = displayNode;
        this.edit = edit;
        this.enable = enable;
        this.error = error;
        this.field = field;
        this.fields = fields;
        this.file = file;
        this.files = files;
        this.get = get;
        this.hide = hide$2;
        this.i18n = i18n;
        this.ids = ids;
        this.inError = inError;
        this.inline = inline;
        this.inlineCreate = inlineCreate;
        this.message = message;
        this.mode = mode;
        this.modifier = modifier;
        this.multiGet = multiGet;
        this.multiSet = multiSet;
        this.node = node;
        this.off = off;
        this.on = on;
        this.one = one;
        this.open = open;
        this.order = order;
        this.refresh = refresh;
        this.remove = remove;
        this.set = set;
        this.show = show$2;
        this.submit = submit;
        this.table = table;
        this.template = template;
        this.title = title;
        this.val = val;
        this._actionClass = _actionClass;
        this._ajax = _ajax;
        this._ajaxReplacements = _ajaxReplacements;
        this._assembleMain = _assembleMain;
        this._blur = _blur;
        this._clearDynamicInfo = _clearDynamicInfo;
        this._close = _close;
        this._closeReg = _closeReg;
        this._crudArgs = _crudArgs;
        this._dataSource = _dataSource;
        this._displayReorder = _displayReorder;
        this._drawTitle = _drawTitle;
        this._edit = _edit;
        this._editRefresh = _editRefresh;
        this._event = _event;
        this._eventName = _eventName;
        this._eventFunc = _eventFunc;
        this._fieldFromNode = _fieldFromNode;
        this._fieldNames = _fieldNames;
        this._focus = _focus;
        this._formOptions = _formOptions;
        this._inline = _inline;
        this._inputTrigger = _inputTrigger;
        this._optionsUpdate = _optionsUpdate;
        this._message = _message;
        this._multiInfo = _multiInfo;
        this._nestedClose = _nestedClose;
        this._nestedOpen = _nestedOpen;
        this._postopen = _postopen;
        this._preopen = _preopen;
        this._processing = _processing;
        this._noProcessing = _noProcessing;
        this._remove = _remove;
        this._submit = _submit;
        this._submitTable = _submitTable;
        this._submitSuccess = _submitSuccess;
        this._submitError = _submitError;
        this._tidy = _tidy;
        this._validate = _validate;
        this._weakInArray = _weakInArray;
        if (!(this instanceof Editor)) {
            alert("DataTables Editor must be initialised as a 'new' instance");
        }
        // Allow data source specific defaults
        let dataSrcSpecific = {};
        if (init && init.dataSrc === 'ajax') {
            dataSrcSpecific = {
                formOptions: {
                    main: {
                        onComplete: 'continue'
                    }
                }
            };
        }
        init = util.object.assignDeep({}, Editor.defaults, dataSrcSpecific, init);
        this.c = init;
        this.s = util.object.assignDeep({}, Editor.models.settings, {
            actionName: init.actionName,
            ajax: init.ajax,
            events: [],
            formOptions: init.formOptions,
            i18n: init.i18n,
            idSrc: init.idSrc,
            table: init.domTable || init.table,
            template: null
        });
        this.classes = util.object.assignDeep({}, Editor.classes);
        // Template import
        if (init.template) {
            let template = Dom.s(init.template);
            this.s.template =
                template[0].nodeName.toLowerCase() === 'template'
                    ? Dom.s(document.importNode(template[0].content, true)).children()
                    : template.detach();
        }
        // Increment the unique counter for the next instance
        Editor.models.settings.unique++;
        let that = this;
        let classes = this.classes;
        this.dom = {
            body: Dom.c('div').classAdd(classes.body.wrapper).get(0),
            bodyContent: Dom.c('div').classAdd(classes.body.content).get(0),
            buttons: Dom.c('div').classAdd(classes.form.buttons).get(0),
            event: Dom.c('div'),
            footer: Dom.c('div')
                .classAdd(classes.footer.wrapper)
                .append(Dom.c('div').classAdd(classes.footer.content))
                .get(0),
            form: Dom.c('form').classAdd(classes.form.tag).get(0),
            formContent: Dom.c('div').classAdd(classes.form.content).get(0),
            formError: Dom.c('div').classAdd(classes.form.error).get(0),
            formInfo: Dom.c('div').classAdd(classes.form.info).get(0),
            header: Dom.c('div')
                .classAdd(classes.header.wrapper)
                .append(Dom.c('div').classAdd(classes.header.content))
                .get(0),
            processing: Dom.c('div')
                .classAdd(classes.processing.indicator)
                .append(Dom.c('span'))
                .get(0),
            wrapper: Dom.c('div').classAdd(classes.wrapper).get(0)
        };
        this.dom.form.append(this.dom.formContent);
        this.dom.wrapper.append(this.dom.processing, this.dom.body, this.dom.footer);
        this.dom.body.append(this.dom.bodyContent);
        // Bind callback methods
        util.object.each(init.on, function (evt, fn) {
            that.on(evt, fn);
        });
        // Add any fields which are given on initialisation
        if (init.fields) {
            this.add(init.fields);
        }
        Dom.s(document)
            .on('init.dt.dte' + this.s.unique, (e, settings, json) => {
            // Resolve this reference in the event handlers so the
            // table() API method can be used to change it and the
            // change still be operated on here.
            let table = this.s.table;
            if (table) {
                let dtApi = new DataTable.Api(table);
                if (settings.table === dtApi.table().node()) {
                    // Attempt to attach to a DataTable automatically when
                    // the table is initialised
                    settings._editor = this;
                }
            }
        })
            .on('i18n.dt.dte' + this.s.unique, (e, settings) => {
            let table = this.s.table;
            if (table) {
                let dtApi = new DataTable.Api(table);
                if (settings.table === dtApi.table().node()) {
                    // Use loaded language options
                    if (settings.language.editor) {
                        util.object.assignDeep(this.s.i18n, settings.language.editor);
                    }
                }
            }
        })
            .on('xhr.dt.dte' + this.s.unique, (e, settings, json) => {
            let table = this.s.table;
            if (table) {
                let dtApi = new DataTable.Api(table);
                if (settings.table === dtApi.table().node()) {
                    // Automatically update fields which have a field name
                    // defined in the returned json - saves an
                    // `initComplete` for the user
                    this._optionsUpdate(json);
                }
            }
        });
        // If there isn't a display controller of the name given, assume that
        // it is a static display controller with a selector for the target.
        if (!Editor.display[init.display]) {
            init.display = Editor.display.static(init.display);
        }
        // Prep the display controller
        this.s.displayController = Editor.display[init.display].init(this);
        this._event('initComplete', []);
        Dom.s(document).trigger('initEditor', true, [this]);
    }
    // Expose internal methods and options for the Field class to use
    // These are not publicly documented.
    /** @internal */
    internalEvent(name, args) {
        this._event(name, args);
    }
    /** @internal */
    internalI18n() {
        return this.s.i18n;
    }
    /** @internal */
    internalMultiInfo() {
        return this._multiInfo();
    }
    /** @internal */
    internalSettings() {
        return this.s;
    }
}
Editor.fieldTypes = fieldTypes;
Editor.files = files$1;
Editor.version = '3.0.0-dev';
Editor.classes = classNames;
Editor.Field = Field;
Editor.DateTime = null;
Editor.error = error$1;
Editor.pairs = pairs;
Editor.factory = factory;
Editor.upload = upload$1;
Editor.defaults = defaults$1;
Editor.models = {
    button: button,
    displayController: displayController,
    fieldType: fieldType,
    formOptions: formOptions,
    settings: settings
};
Editor.dataSources = dataSources;
Editor.display = {
    envelope,
    lightbox: self,
    static: staticDisplay
};
Editor.safeId = safeDomId;
DataTable.Editor = Editor;
// Legacy
if (DataTable.DateTime) {
    Editor.DateTime = DataTable.DateTime;
}
// If there are field types available on DataTables we copy them in (after the
// built in ones to allow overrides) and then expose the field types object.
if (DataTable.ext.editorFields) {
    util.object.assign(Editor.fieldTypes, DataTable.ext.editorFields);
}
DataTable.ext.editorFields = Editor.fieldTypes;
// Global listener for file information updates via DataTables' Ajax JSON
Dom.s(document).on('xhr.dt', function (e, ctx, json) {
    if (e.namespace !== 'dt') {
        return;
    }
    if (json && json.files) {
        util.object.each(json.files, function (name, filesIn) {
            if (!Editor.files[name]) {
                Editor.files[name] = {};
            }
            util.object.assign(Editor.files[name], filesIn);
        });
    }
});


DataTable.Editor = Editor;
// Legacy
if (DataTable.DateTime) {
    Editor.DateTime = DataTable.DateTime;
}
// If there are field types available on DataTables we copy them in (after the
// built in ones to allow overrides) and then expose the field types object.
if (DataTable.ext.editorFields) {
    DataTable.util.object.assign(Editor.fieldTypes, DataTable.ext.editorFields);
}
DataTable.ext.editorFields = Editor.fieldTypes;


export default DataTable.Editor;

