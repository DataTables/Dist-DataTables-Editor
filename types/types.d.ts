import { Dom, AjaxOptions, Options, Api } from 'datatables.net';

type IFormatter = (this: Editor, val: any, field: Field, def?: any) => any;
/**
 * Initialisation options that can be given to Editor.Field at initialisation
 * time.
 */
interface IDefaults {
    /**
     * Class name to assign to the field's container element (in addition to the other
     * classes that Editor assigns by default).
     */
    className: string;
    /**
     * Define a custom comparison function for the field's data.
     */
    compare: null | ((submitted: any, original: any) => boolean);
    /**
     * The data property (`mData` in DataTables terminology) that is used to
     * read from and write to the table. If not given then it will take the same
     * value as the `name` that is given in the field object. Note that `data`
     * can be given as null, which will result in Editor not using a DataTables
     * row property for the value of the field for either getting or setting
     * data.
     *
     * In previous versions of Editor (1.2-) this was called `dataProp`. The old
     * name can still be used for backwards compatibility, but the new form is
     * preferred.
     */
    data: string;
    /**
     * The default value for the field. Used when creating new rows (editing will
     * use the currently set value). If given as a function the function will be
     * executed and the returned value used as the default
     *
     * In Editor 1.2 and earlier this field was called `default` - however
     * `default` is a reserved word in Javascript, so it couldn't be used
     * unquoted. `default` will still work with Editor 1.3, but the new property
     * name of `def` is preferred.
     */
    def: string;
    /**
     * Control the decoding of HTML entities in input elements.
     */
    entityDecode: boolean;
    /**
     * Error message text to show if the field is in the error state.
     */
    errorText: string;
    /**
     * Helpful information text about the field that is shown below the input control.
     */
    fieldInfo: string;
    /**
     * Apply a transform (a format) to the value read from a field.
     */
    getFormatter: IFormatter;
    /**
     * The ID of the field. This is used by the `label` HTML tag as the "for" attribute
     * improved accessibility. Although this using this parameter is not mandatory,
     * it is a good idea to assign the ID to the DOM element that is the input for the
     * field (if this is applicable).
     */
    id: string;
    /**
     * The label to display for the field input (i.e. the name that is visually
     * assigned to the field).
     */
    label: string;
    /**
     * Helpful information text about the field that is shown below the field label.
     */
    labelInfo: string;
    /**
     * Information message for the field - expected to be dynamic
     */
    message: string;
    /**
     * Allow a field to be editable when multiple rows are selected
     */
    multiEditable: boolean;
    /**
     * The name for the field that is submitted to the server. This is the only
     * mandatory parameter in the field description object.
     */
    name: string;
    /**
     * If `null` values should be replaced with the default value on edit
     */
    nullDefault: boolean;
    /**
     * Apply a transform (format) to a value when it is set into the field
     */
    setFormatter: IFormatter;
    /**
     * Indicate if the field's value can be submitted
     */
    submit: boolean;
    /**
     * The input control that is presented to the end user. The options available
     * are defined by `Editor.fieldTypes` and any extensions made
     * to that object.
     */
    type: string;
}
interface IOptions extends Partial<IDefaults> {
}

declare class Field {
    static defaults: IDefaults;
    static formatters: {
        [name: string]: IFormatter;
    };
    valFromData: (a: any) => any;
    valToData: any;
    private s;
    private dom;
    constructor(options: IOptions, classes: any, host: Editor);
    def(set?: any): any;
    disable(): this;
    displayed(): boolean;
    enable(toggle?: boolean): this;
    enabled(): boolean;
    error(msg: string | boolean, fn?: any): any;
    fieldInfo(msg: any): any;
    isMultiValue(): boolean;
    inError(): boolean;
    input(): any;
    focus(): this;
    get(): any;
    hide(animate: any): this;
    label(str: any): string | this;
    labelInfo(msg: any): any;
    message(msg: any, fn?: any): any;
    multiGet(id?: any): any;
    multiRestore(): void;
    multiSet(id: any, val?: any, recalc?: boolean): this;
    name(): string;
    node(): HTMLElement;
    nullDefault(): boolean;
    processing(): boolean;
    processing(set: boolean): this;
    set(val: any, multiCheck?: boolean): this;
    show(animate?: boolean, toggle?: boolean): this;
    submittable(flag?: any): boolean | this;
    type(): string;
    update(options: any, append?: boolean): this;
    val(val?: any): any;
    /**
     * Validate the field using HTML5 validation (client-side only - server-side
     * validation flagging happens in the Ajax response).
     *
     * @param clearOnValid If true, the error message will be cleared if valid
     * @returns `false` if invalid.
     */
    validate(clearOnValid?: boolean): boolean;
    compare(value: any, original: any): boolean;
    dataSrc(): string;
    destroy(): this;
    multiEditable(): boolean;
    multiIds(): string[];
    multiInfoShown(show: any): void;
    multiReset(): void;
    _msg(el: any, msg?: any, fn?: any): any;
    _multiValueCheck(): boolean;
    _typeFn(name: any, ...args: any[]): any;
    private _errorNode;
    private _format;
}

interface IFieldType {
    canReturnSubmit?: (conf: IOptions) => boolean;
    create: (conf: IOptions) => Dom | void;
    destroy?: (conf: IOptions) => void;
    disable?: (conf: IOptions) => void;
    enable?: (conf: IOptions) => void;
    get: (conf: IOptions, fieldSpecific?: any) => any;
    input?: (conf: IOptions) => any;
    set: (conf: IOptions, val: any) => void;
    update?: (conf: IOptions, options: any, append?: boolean) => void;
    owns?: (conf: IOptions, node: Node) => boolean;
}

interface IAutoCompleteOptions extends IOptions {
    /** Create an AutoComplete field */
    type: 'autocomplete';
    /** Ajax address from which options should be loaded */
    ajax?: AjaxOptions | true | string;
    /** Provide extra data parameter to send as part of the Ajax request */
    ajaxData?: {
        [key: string]: string | number | (() => string | number);
    };
    /** Set HTML attributes on the input element. */
    attr?: {
        [key: string]: string | number;
    };
    /** Function used to customise the display of each label.  */
    display?: (data: any, value: any) => string;
    /** Indicate if HTML entities in the text shown in the label should be escaped or not. */
    escapeLabelHtml?: boolean;
    /** Language options for the autocomplete field */
    i18n?: {
        /** This text is shown when a filter is applied and no options are found to match */
        noResults?: string;
        /** The placeholder is shown when there are is no search term and no options have been loaded. */
        placeholder?: string;
        /** Dropdown title */
        title?: string;
    };
    /** List of options to show in the radio values */
    options?: any[];
    /** Ordering to apply to the list */
    optionsOrder?: 'asc' | 'desc' | false;
}

interface ICheckboxOptions extends IOptions {
    /** Create a checkbox field */
    type: 'checkbox';
    /** List of options to show in the checkboxes */
    options?: any[] | {
        [key: string]: any;
    };
    /** The property names to read from objects in the `options` array */
    optionsPair?: {
        label: string;
        value: string;
    };
    /** Split the value on the given string if the string contains multiple values */
    separator?: string | null;
    /** Value to give when no checkboxes are selected. */
    unselectedValue?: string | number;
}

interface IDataTableOptions extends IOptions {
    /** Create a datatable field */
    type: 'datatable';
    /** A DataTables configuration object that can be used to customise the DataTable shown in the Editor modal */
    config?: Options;
    /** The Editor instance that should be used for the nested table, if it is to be editable. */
    editor?: Editor;
    /** This option makes it possible to specify a footer for the table that is displayed by this control. */
    footer?: string[] | string;
    /** Indicate if the end user should be able to select multiple options from the select list. */
    multiple?: boolean;
    /** The values and labels to be used in the table. */
    options?: any[];
    /** The property names to read from objects in the `options` array */
    optionsPair?: {
        label: string;
        value: string;
    };
    /** Split the value on the given string if the string contains multiple values. Used with `multiple`. */
    separator?: string | null;
}

interface IDatetimeOptions extends IOptions {
    /** Create a datetime field */
    type: 'datetime';
    /** Set HTML attributes on the input element. */
    attr?: {
        [name: string]: any;
    };
    /** The format of the date string that will be shown to the end user in the input element. */
    displayFormat?: string;
    /** An alias for the `displayFormat` option */
    format?: string;
    /** Allow (default), or disallow, the end user to type into the date / time input element. */
    keyInput?: boolean;
    /** Set locale for moment */
    momentLocale?: boolean;
    /** Set strict flag for moment */
    momentStrict?: boolean;
    /** Options for the date time picker. Please see the DateTime options reference */
    opts?: any;
    /** The format of the date string loaded from the server for the field's value and also for sending to the server on form submission. */
    wireFormat?: string;
}

interface IHiddenOptions extends IOptions {
    /** Create a hidden field */
    type: 'hidden';
    /** Set HTML attributes on the input element. */
    attr?: {
        [name: string]: any;
    };
    /** @ignore */
    value?: any;
}

interface IPasswordOptions extends IOptions {
    /** Create a password field */
    type: 'password';
    /** Set HTML attributes on the input element. */
    attr?: {
        [name: string]: any;
    };
}

interface IReadonlyOptions extends IOptions {
    /** Create a readonly field */
    type: 'readonly';
    /** Set HTML attributes on the hidden input element. */
    attr?: {
        [name: string]: any;
    };
}

interface ISelectOptions extends IOptions {
    /** Create a select field */
    type: 'select';
    /** Set HTML attributes on the input element. */
    attr?: {
        [name: string]: any;
    };
    /** Indicate if the end user should be able to select multiple options from the select list. */
    multiple?: boolean;
    /** @ignore Legacy alias of `options` */
    ipOpts?: any[] | {
        [key: string]: any;
    };
    /** List of options to show in the radio values */
    options?: any[] | {
        [key: string]: any;
    };
    /** The property names to read from objects in the `options` array */
    optionsPair?: {
        label: string;
        value: string;
    };
    /** Show a pseudo value when there is no option selected */
    placeholder?: any;
    /** Allow (or not) the end user to select the placeholder option */
    placeholderDisabled?: boolean;
    /** Assign a value to the placeholder value if it is allowed to be selected */
    placeholderValue?: string;
    /** Split the value on the given string if the string contains multiple values. Used with `multiple`. */
    separator?: string | null;
    /** Value to give when no radio boxes are selected. */
    unselectedValue?: string | number;
}

interface IRadioOptions extends IOptions {
    /** Create a radio field */
    type: 'radio';
    /** List of options to show in the radio values */
    options?: any[] | {
        [key: string]: any;
    };
    /** @ignore Legacy alias for `options` */
    ipOpts?: any[] | {
        [key: string]: any;
    };
    /** The property names to read from objects in the `options` array */
    optionsPair?: {
        label: string;
        value: string;
    };
    /** Value to give when no radio boxes are selected. */
    unselectedValue?: string | number;
}

interface ITagsOptions extends IOptions {
    /** Create a tags field */
    type: 'tags';
    /** Ajax address from which options should be loaded */
    ajax?: AjaxOptions | true | null | string;
    /** Provide extra data parameter to send as part of the Ajax request */
    ajaxData?: {
        [key: string]: string | number | (() => string | number);
    };
    /** Function used to customise the display of each label.  */
    display?: (data: any, value: any) => string;
    /** Indicate if HTML entities in the text shown in the label should be escaped or not. */
    escapeLabelHtml?: boolean;
    /** Language options for the tags field */
    i18n?: {
        addButton?: string;
        /** The text shown as the placeholder in the input search box */
        inputPlaceholder?: string;
        /** This text is shown when a filter is applied and no options are found to match. */
        noResults?: string;
        /** Text / icon to display for the remove tag button. Can be HTML. */
        removeIcon?: string;
        /** Text shown at the top of the dropdown */
        title?: string;
        /** The placeholder is shown when there are is no search term and no options have been loaded */
        placeholder?: string;
    };
    /** This option is used to set the max number of options that can be selected for the field. */
    limit?: null | number;
    /** Sets if the field should allow multiple values (an array), or just a single one (a scalar). */
    multiple?: boolean;
    /** List of options to show in the radio values */
    options?: any[];
    /** Ordering to apply to the list */
    optionsOrder?: 'asc' | 'desc' | false;
    /** Split the value on the given string if the string contains multiple values */
    separator?: string;
    /** If enabled then the user may not select the same option multiple times */
    unique?: boolean;
}

interface ITextOptions extends IOptions {
    /** Create a plain text input field */
    type: 'text';
    /** Set HTML attributes on the input element. */
    attr?: {
        [name: string]: any;
    };
}

interface ITextareaOptions extends IOptions {
    /** Create a textarea field */
    type: 'textarea';
    /** Set HTML attributes on the input element. */
    attr?: {
        [name: string]: any;
    };
}

interface ISharedUploadOptions extends IOptions {
    ajax?: string | AjaxOptions | ((files: any, fn: (ids: any[]) => void) => void);
    ajaxData?: (data: any, files: any, counter: number) => void;
    attr?: {
        [key: string]: string | number;
    };
    clearText?: string;
    display?: (val: any, counter?: number) => string;
    dragDrop?: boolean;
    dragDropText?: string;
    errors?: {
        [key: string]: string;
    };
    fileReadText?: string;
    noFileText?: string;
    processingText?: string;
}
/** Internal properties used on the configuration object for the field */
interface ISharedUploadConf extends ISharedUploadOptions {
    _input?: Dom;
    _enabled?: boolean;
    _limitLeft?: number;
    _val?: any;
    _many?: boolean;
}

interface IUploadOptions extends ISharedUploadConf {
    /** Create a upload field for a single files */
    type: 'upload';
}

interface IUploadManyOptions extends ISharedUploadConf {
    /** Create a upload field for multiple files */
    type: 'uploadMany';
    limit?: number;
}

type FieldConf = IAutoCompleteOptions | ICheckboxOptions | IDataTableOptions | IDatetimeOptions | IHiddenOptions | IPasswordOptions | IRadioOptions | IReadonlyOptions | ISelectOptions | ITagsOptions | ITextOptions | ITextareaOptions | IUploadOptions | IUploadManyOptions | IOptions;

interface IFormOptions {
    /** Buttons to be displayed in the form footer (e.g. submit button) */
    buttons: any;
    /** DataTables draw type when updating the table */
    drawType: 'full-reset' | 'full-hold' | 'page' | 'none' | false | true;
    /** Which element to focus on when the form is shown */
    focus: null | number | string;
    /** Form message */
    message: string | boolean;
    /** Tell the display controller to nest down */
    nest: boolean;
    /** Action to take when a background element is activated */
    onBackground: 'blur' | 'close' | 'none' | 'submit' | ((editor: Editor) => void);
    /** Action to take when the form is blurred */
    onBlur: 'submit' | 'close' | 'none' | ((editor: Editor) => void);
    /** Action to occur after Ajax update */
    onComplete: 'close' | 'none' | ((editor: Editor) => void);
    /** What action to perform when pressing escape key */
    onEsc: 'blur' | 'close' | 'none' | 'submit' | ((editor: Editor, e: Event) => void);
    /** What to do with a JSON returned error for a field */
    onFieldError: 'focus' | 'none' | ((editor: Editor) => void);
    /** Action to take on return key when the form is focused */
    onReturn: 'submit' | 'none' | ((editor: Editor, e: Event) => void);
    /** Reload the data for the target rows */
    refresh: boolean;
    /** What data should be loaded into the form */
    scope: 'row' | 'cell';
    /** What values should be submitted to the server */
    submit: 'all' | 'changed' | 'allIfChanged';
    /** HTML to insert for submit button (inline editing) */
    submitHtml: string;
    /** Position to insert a submit button (inline editing) */
    submitTrigger: null | HTMLElement | JQuery | number;
    /** Form title */
    title: string | boolean;
}

interface IEditorOptions {
    /**
     * Parameter name to use to submit data to the server.
     */
    actionName: string;
    /**
     * Control how the Ajax call to update data on the server.
     *
     * This option matches the `dt-init ajax` option in that is can be provided
     * in one of three different ways:
     *
     * * string - As a string, the value given is used as the url to target
     * the Ajax request to, using the default Editor Ajax options. Note that
     * for backwards compatibility you can use the form "METHOD URL" - for
     * example: `"PUT api/users"`, although it is recommended you use the
     * object form described below.
     * * object - As an object, the `ajax` property has two forms:
     * * Used to extend and override the default Ajax options that Editor
     * uses. This can be very useful for adding extra data for example, or
     * changing the HTTP request type.
     * * With `create`, `edit` and `remove` properties, Editor will use the
     * option for the action that it is taking, which can be useful for
     * REST style interfaces. The value of each property can be a string,
     * object or function, using exactly the same options as the main `ajax`
     * option. All three options must be defined if this form is to be used.
     * * function - As a function this gives complete control over the method
     * used to update the server (if indeed a server is being used!). For
     * example, you could use a different data store such as localStorage,
     * Firebase or route the data through a web-socket.
     */
    ajax: string | any;
    dataSrc: 'table' | 'ajax' | 'html';
    /**
     * The display controller for the form. The form itself is just a collection
     * of DOM elements which require a display container. This display
     * controller allows the visual appearance of the form to be significantly
     * altered without major alterations to the Editor code. There are three
     * display controllers built into Editor: *lightbox*, *envelope* and
     * *static*. The value of this property will be used to access the display
     * controller defined in `Editor.display` for the given name.
     */
    display: string;
    /** @deprecated Use `table` */
    domTable: string;
    /**
     * Events / callbacks - event handlers can be assigned as an individual
     * function during initialisation using the parameters in this object. The
     * names, and the parameters passed to each callback match their event
     * equivalent in the Editor object.
     */
    on: {
        [name: string]: Function;
    };
    /**
     * Fields to initialise the form with.
     */
    fields: FieldConf[];
    /**
     * Form configuration options
     */
    formOptions: {
        bubble: IFormOptions;
        inline: IFormOptions;
        main: IFormOptions;
    };
    /**
     * Internationalisation options for Editor. All client-side strings that the
     * end user can see in the interface presented by Editor can be modified here.
     *
     * You may also wish to refer to the <a href="http://datatables.net/usage/i18n">
     * DataTables internationalisation options</a> to provide a fully language
     * customised table interface.
     */
    i18n: {
        /**
         * Close button title text
         */
        close: string;
        /**
         * Strings used when working with the Editor 'create' action (creating new
         * records).
         */
        create: {
            /**
             * Buttons button text
             */
            button: string;
            /**
             * Submit button text
             */
            submit: string;
            /**
             * Display container title (when showing the editor display)
             */
            title: string;
        };
        datetime: {
            amPm: [string, string];
            hours: string;
            minutes: string;
            months: [
                string,
                string,
                string,
                string,
                string,
                string,
                string,
                string,
                string,
                string,
                string,
                string
            ];
            next: string;
            previous: string;
            seconds: string;
            unknown: string;
            weekdays: [string, string, string, string, string, string, string];
        };
        /**
         * Strings used when working with the Editor 'edit' action (editing existing
         * records).
         */
        edit: {
            /**
             * Buttons button text
             */
            button: string;
            /**
             * Submit button text
             */
            submit: string;
            /**
             * Display container title (when showing the editor display)
             */
            title: string;
        };
        /**
         * Strings used for error conditions.
         */
        error: {
            /**
             * Generic server error message
             */
            system: string;
        };
        /**
         * Strings used by the various field types
         */
        field: {
            autocomplete: {
                noResults: string;
                placeholder: string;
            };
            errorText: string;
            tags: {
                addButton: string;
                inputPlaceholder: string;
                noResults: string;
                placeholder: string;
                removeIcon: string;
            };
            upload: {
                choose: string;
                clear: string;
                dragDrop: string;
                noFile: string;
                processing: string;
                uploading: string;
            };
            uploadMany: {
                choose: string;
                dragDrop: string;
                noFiles: string;
                processing: string;
                uploading: string;
            };
        };
        /**
         * Strings used for multi-value editing
         */
        multi: {
            /**
             * Shown below the multi title text, although only the first
             * instance of this text is shown in the form to reduce redundancy
             */
            info: string;
            /**
             * Disabled for multi-row editing
             */
            noMulti: string;
            /**
             * Shown below the field input when group editing a value to allow
             * the user to return to the original multiple values
             */
            restore: string;
            /**
             * Shown in place of the field value when a field has multiple values
             */
            title: string;
        };
        /**
         * Strings used when working with the Editor 'delete' action (deleting
         * existing records).
         */
        remove: {
            /**
             * Buttons button text
             */
            button: string;
            /**
             * Deletion confirmation message.
             *
             * As Editor has the ability to delete either a single or multiple rows
             * at a time, this option can be given as either a string (which will be
             * used regardless of how many records are selected) or as an object
             * where the property "_" will be used (with %d substituted for the number
             * of records to be deleted) as the delete message, unless there is a
             * key with the number of records to be deleted. This allows Editor
             * to consider the different pluralisation characteristics of different
             * languages.
             *
             */
            confirm: {
                _: string;
                [num: number]: string;
            };
            /**
             * Submit button text
             */
            submit: string;
            /**
             * Display container title (when showing the editor display)
             */
            title: string;
        };
    };
    /**
     * JSON property from which to read / write the row's ID property (i.e. its
     * unique column index that identifies the row to the database). By default
     * Editor will use the `DT_RowId` property from the data source object.
     */
    idSrc: string;
    /**
     * jQuery selector that can be used to identify the table you wish to apply
     * this editor instance to.
     *
     * In previous versions of Editor (1.2 and earlier), this parameter was
     * called `table`. The name has been altered in 1.3+ to simplify the
     * initialisation. This is a backwards compatible change - if you pass in
     * a `table` option it will be used.
     */
    table: string | HTMLElement | JQuery | Api;
    /**
     * A jQuery selector or reference to the element that should be used as the form
     * template. Only a single element should be selected, so it is most common to
     * use an ID selector here.
     */
    template: string | HTMLElement | JQuery;
}
declare const _default$1: IEditorOptions;

type IMode = null | 'bubble' | 'inline' | 'main';
type IDisplay = false | 'bubble' | 'inline' | 'main';
type IBubbleLocation = 'auto' | 'top' | 'bottom';
type IDataSource = 'ajax' | 'html' | 'table';
type Fields = {
    [k: string]: Field;
};
interface EventFunction extends Function {
    _ev?: string;
}
/**
 * Settings object for Editor - this provides the state for each instance of
 * Editor and can be accessed through the instance's `s` property. Note that the
 * settings object is considered to be "private" and thus is liable to change
 * between versions. As such if you do read any of the setting parameters,
 * please keep this in mind when upgrading!
 */
interface ISettings {
    /**
     * The current form action - 'create', 'edit' or 'remove'. If no current action then
     * it is set to null.
     */
    action: null | 'create' | 'read' | 'edit' | 'remove';
    /** Name of the parameter used to indicate what action Editor is performing */
    actionName: string;
    ajax: string | AjaxOptions | Function;
    bubbleNodes: HTMLElement[];
    bubbleBottom: boolean;
    bubbleLocation: IBubbleLocation;
    closeCb: null | ((complete: Function, mode: IMode) => void);
    closeIcb: null | (() => void);
    dataSource: null | IDataSource;
    /**
     * The display controller object for the Form.
     * This is directly set by the initialisation parameter / default of the same name.
     */
    displayController: any;
    /**
     * Flag to indicate if the form is currently displayed or not and what type of display
     */
    displayed: IDisplay;
    editCount: number;
    editData: {
        [field: string]: {
            [id: string]: any;
        };
    };
    editFields: {
        [idSrc: string]: {
            attach?: HTMLElement[];
            data?: any;
            fields: {
                [name: string]: Field;
            };
            idSrc?: string;
            node?: HTMLElement;
            type?: 'row' | 'cell';
        };
    };
    editOpts: any;
    events: Array<{
        original: Function;
        wrapped: EventFunction;
    }>;
    /**
     * The form fields - see {@link Editor.models.field} for details of the
     * objects held in this array.
     */
    fields: Fields;
    formOptions: {
        bubble: IFormOptions;
        inline: IFormOptions;
        main: IFormOptions;
    };
    /** Global error message */
    globalError: string;
    /** I18n strings */
    i18n: typeof _default$1['i18n'];
    /**
     * The ID of the row being edited (set to -1 on create and remove actions)
     */
    id: number;
    /**
     * JSON property from which to read / write the row's ID property.
     */
    idSrc: string | number;
    includeFields: string[];
    /**
     * Form editing mode
     */
    mode: IMode;
    /**
     * Developer provided identifier for the elements to be edited (i.e. at
     * `dt-type DataTable.RowSelector` to select rows to edit or delete.
     */
    modifier: any;
    opts: any;
    /**
     * Field order - order that the fields will appear in on the form. Array of strings,
     * the names of the fields.
     */
    order: string[];
    /**
     * Flag to indicate if the form is current in a processing state (true) or not (false)
     */
    processing: boolean;
    setFocus: Field | Dom;
    /**
     * Selector for the DataTable
     */
    table: string | HTMLElement | Dom;
    template: Dom;
    /** Instance's current form title */
    title: string | null;
    /**
     * Unique instance counter to be able to remove events
     */
    unique: number;
}
declare const settings: ISettings;

interface IDisplayController {
    [others: string]: any;
    /** Hide the form (remove it form the visual display in the document) */
    close: (editor: Editor, fn: Function) => void;
    /** Initialisation method, called by Editor when itself, initialises. */
    init: (editor: Editor) => void;
    /** Get the container node */
    node: (editor: Editor) => HTMLElement | void;
    /** Display the form (add it to the visual display in the document) */
    open: (editor: Editor, append: HTMLElement, fn: Function) => void;
}

interface IButton {
    /** Callback for when the button is activated */
    action: () => {};
    /** Class names to give the button */
    className: string;
    /** Set the tab index attribute for the button */
    tabIndex: number;
    /** Text to show in the button */
    text: string;
}

type RowIdx = number;
type RowSelector<T = any> = RowIdx | string | Node | JQuery | ((idx: RowIdx, data: T, node: Node | HTMLElement | null) => boolean) | RowSelector<T>[];
type CellIdx = {
    row: number;
    column: number;
};
type CellSelector = CellIdx | string | Node | JQuery | ((idx: CellIdx, data: any, node: Node | HTMLElement | null) => boolean) | CellSelector[];
interface Button {
    /**
     * Callback function which the button is activated.
     */
    action: Function;
    /**
     * Attributes to add to the button
     */
    attr?: {
        [key: string]: any;
    };
    /**
     * The CSS class(es) to apply to the button to allow styling
     */
    className?: string;
    /**
     * Button tab index
     */
    tabIndex?: number;
    /**
     * The text to put into the button.
     */
    text: string;
}
interface DependentSend {
    /** Data read from the DataTable row */
    rows: any[];
    /** Current form values */
    values: any[];
}
interface DependentResult {
    /** Fields to disable */
    disable?: string[];
    /** Fields to enable */
    enable?: string[];
    /** Field error messages */
    errors?: {
        [field: string]: string;
    };
    /** Fields to hide */
    hide?: string[];
    /** Field labels */
    labels?: {
        [field: string]: string;
    };
    /** Field info messages */
    messages?: {
        [field: string]: string;
    };
    /** Field options (e.g. select, radio) */
    options?: {
        [field: string]: any;
    };
    /** Fields to show */
    show?: string[];
    /** Field values */
    values?: {
        [field: string]: any;
    };
}
interface DependentOptions {
    /** Event to listen for - `change` by default */
    event: string;
    /** Callback function that is executed immediately prior to executing the data fetch method */
    data: (d: any) => void;
    /** Function that can be used to transform the dependant result data */
    preUpdate: (d: DependentResult) => void;
    /** Form update complete */
    postUpdate: (d: DependentResult) => void;
}
interface DependentComplete {
    (result: DependentResult): void;
}
interface DependentCallback {
    (val: any, data: DependentSend, callback: DependentComplete, e: Event): DependentResult | Promise<DependentResult>;
}
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
declare function add(this: Editor, cfg: FieldConf | FieldConf[], after?: string, reorder?: boolean): Editor;
/**
 * Get the Ajax configuration for the Editor instance
 *
 * @return {object} Ajax configuration
 */
declare function ajax(this: Editor): object;
/**
 * Set the Ajax configuration for the Editor instance
 *
 * @return {Editor} Editor instance
 */
declare function ajax(this: Editor, newAjax: any): Editor;
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
declare function background(this: Editor): Editor;
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
declare function blur(this: Editor): Editor;
/**
 * Trigger bubble editing
 *
 * @param this Editor instance
 * @param cells Cell(s) to bubble edit on
 * @param opts Form options
 * @returns Editor instance
 */
declare function bubble(this: Editor, cells: RowSelector, opts?: IFormOptions): Editor;
/**
 * Trigger bubble editing
 *
 * @param this Editor instance
 * @param cells Cell(s) to bubble edit on
 * @param showIn Immediately show the bubble editing form (default) or not
 * @param opts Form options
 * @returns Editor instance
 */
declare function bubble(this: Editor, cells: RowSelector, showIn?: boolean, opts?: IFormOptions): Editor;
/**
 * Trigger bubble editing
 *
 * @param this Editor instance
 * @param cells Cell(s) to bubble edit on
 * @param fieldNames Field name(s) to edit on for the selected cells
 * @param showIn Immediately show the bubble editing form (default) or not
 * @param opts Form options
 * @returns Editor instance
 */
declare function bubble(this: Editor, cells: RowSelector, fieldNames?: string | string[], showIn?: boolean, opts?: IFormOptions): Editor;
/**
 * Set where the bubble should appear in relation to the field
 */
declare function bubbleLocation(this: Editor): IBubbleLocation;
declare function bubbleLocation(this: Editor, location: IBubbleLocation): Editor;
/**
 * Reposition the editing bubble (`bubble()`) when it is visible. This can be
 * used to update the bubble position if other elements on the page change
 * position. Editor will automatically call this method on window resize.
 *
 * @returns Editor instance
 */
declare function bubblePosition(this: Editor): Editor;
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
declare function buttons(this: Editor, buttonsIn: string | Array<string | Button>): Editor;
/**
 * Remove fields from the form.
 *
 * @param this Editor instance
 * @param fieldName Field to remove
 * @returns Editor instance
 */
declare function clear(this: Editor, fieldName?: string | string[]): Editor;
/**
 * Close the form display.
 *
 * @param this Editor instance
 * @returns Editor instance
 */
declare function close(this: Editor): Editor;
/**
 * Create a new record - show the form that allows the user to enter information
 * for a new row and then subsequently submit that data.
 *
 * @param this Editor instance
 * @param options Form options
 * @returns Editor instance
 */
declare function create(this: Editor, options?: IFormOptions): Editor;
/**
 * Create a new record - show the form that allows the user to enter information
 * for a new row and then subsequently submit that data.
 *
 * @param this Editor instance
 * @param show Show the create form
 * @param options Form options
 * @returns Editor instance
 */
declare function create(this: Editor, show?: boolean, options?: IFormOptions): Editor;
/**
 * Create a new record - show the form that allows the user to enter information
 * for a new row and then subsequently submit that data.
 *
 * @param this Editor instance
 * @param count Number of rows to create
 * @param show Show the create form
 * @param options Form options
 * @returns Editor instance
 */
declare function create(this: Editor, count?: number, show?: boolean, options?: IFormOptions): Editor;
/**
 * Create a new record - show the form that allows the user to enter information
 * for a new row and then subsequently submit that data.
 *
 * @param this Editor instance
 * @param title Form title
 * @param buttons Form buttons
 * @param show Show the create form
 * @returns Editor instance
 * @deprecated The overload is legacy from v1.0. The others should be used in preference.
 */
declare function create(this: Editor, title?: string, buttons?: string | Button | Button[], show?: boolean, options?: IFormOptions): Editor;
/**
 * Remove dependent links from a field
 *
 * @param this Editor instance
 * @param parent The name of the field to remove the existing dependencies
 * @returns Editor instance
 */
declare function undependent(this: Editor, parent: string | string[]): Editor;
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
declare function dependent(this: Editor, parent: string | string[], url: string | DependentCallback | AjaxOptions, optsIn?: DependentOptions): Editor;
/**
 * Destroy the Editor instance, cleaning up fields, display and event handlers
 */
declare function destroy(this: Editor): void;
/**
 * Disable one or more field inputs, disallowing subsequent user interaction with the
 * fields until they are re-enabled.
 *
 * @param this Editor instance
 * @param name Field(s) to disable. Disables all if not given.
 * @returns Editor instance
 */
declare function disable(this: Editor, name?: string | string[]): Editor;
/**
 * Get the current display state of the Editor form
 *
 * @returns Editor instance
 */
declare function display(): IDisplay;
/**
 * Display, or remove the main editing form from the display
 *
 * @param show 	Indicator to tell the method to show (true) or close (false)
 *   the editing display.
 * @returns Editor instance
 */
declare function display(showIn: boolean): Editor;
/**
 * Get a list of the fields that are currently shown in the Editor form.
 *
 * @param this Editor instance
 * @returns Array of field names
 */
declare function displayed(this: Editor): string[];
/**
 * Get display controller node
 *
 * @returns Display controller host element
 */
declare function displayNode(this: Editor): Node;
/**
 * Edit an item using the main editing display
 *
 * @param this Editor instance
 * @param items The items to edit
 * @param options Form options
 * @returns Editor instance
 */
declare function edit(this: Editor, items: RowSelector | CellSelector | Node | HTMLElement | JQuery, options?: IFormOptions): Editor;
/**
 * Edit an item using the main editing display
 *
 * @param this Editor instance
 * @param items The items to edit
 * @param show Immediately show the form or not
 * @param options Form options
 * @returns Editor instance
 */
declare function edit(this: Editor, items: RowSelector | CellSelector | Node | HTMLElement | JQuery, show?: boolean, options?: IFormOptions): Editor;
/**
 *
 * @param this Editor instance
 * @param items Items to edit
 * @param title Form title
 * @param buttons Form buttons
 * @param show Immediate form display control
 * @returns Editor instance
 * @deprecated Use edit() with form options instead
 */
declare function edit(this: Editor, items: RowSelector | CellSelector | Node | HTMLElement | HTMLElement | JQuery | number | string, title?: string, buttons?: string | Button | Button[], show?: boolean, formOptions?: IFormOptions): Editor;
/**
 * Enable one or more field inputs, restoring user interaction with the fields.
 *
 * @param this Editor instance
 * @param name Field(s) to enable. If not given, all fields in the form are enabled
 * @returns Editor instance
 */
declare function enable(this: Editor, name?: string | string[]): Editor;
/**
 * Set the form's global error message
 *
 * @param this Editor instance
 * @param msg Error message to set. Use an empty string to clear
 * @returns Editor instance
 */
declare function error$1(this: Editor, msg?: string): Editor;
/**
 * Set an error message for a specific field
 *
 * @param this Editor instance
 * @param name Field name to set the error message for
 * @param msg Error message. Use an empty string to clear.
 * @returns Editor instance
 */
declare function error$1(this: Editor, name?: string, msg?: string): Editor;
/**
 * Get a field object, configured for a named field, which can then be
 * manipulated through its API.
 *
 * @param this Editor instance
 * @param name Field to get
 * @returns Field instance
 */
declare function field(this: Editor, name: any): Field;
/**
 * Get a list of the fields that are used by the Editor instance.
 *
 * @param this Editor instance
 * @returns Editor instance
 */
declare function fields(this: Editor): Array<string | number>;
/**
 * Get data object for a file from a table and id
 *
 * @param name Table name
 * @param id Primary key identifier
 * @returns File information
 */
declare function file<T = any>(name: string, id: string | number): T;
/**
 * Get data for registered files
 *
 * @returns File information
 */
declare function files<T = any>(): {
    [key: string]: {
        [key: string]: T;
    };
};
/**
 * Get data objects for available files
 *
 * @param name Table name
 * @returns File information
 */
declare function files<T = any>(name: string): {
    [key: string]: T;
};
/**
 * Get the value of a field
 *
 * @param {string|array} [name] The field name (from the `name` parameter given
 * when originally setting up the field) to disable. If not given, then an
 * object of fields is returned, with the value of each field from the
 * instance represented in the array (the object properties are the field
 * names). Also an array of field names can be given to get a collection of
 * data from the form.
 * @returns {*|object} Value from the named field
 *
 * @example
 * // Client-side validation - check that a field has been given a value
 * // before submitting the form
 * editor.create( 'Add new user', {
 *  "label": "Submit",
 *  "fn": function () {
 *    if ( this.get('username') === '' ) {
 *      this.error( 'username', 'A user name is required' );
 *      return;
 *    }
 *    this.submit();
 *  }
 * } );
 */
/**
 * Get the value of a field in the form
 * @param name Field name
 * @returns Value
 */
declare function get<T = any>(this: Editor, name: string): T;
/**
 * Get the value for all or some fields in the form
 * @param this Editor instance
 * @param names Field names to get. Will use all if not given
 * @returns Values for the fields, keyed by field name
 */
declare function get(this: Editor, names?: string[]): {
    [key: string]: any;
};
/**
 * Hide one or more fields from the form display.
 *
 * @param this Editor instance
 * @param names Fields to hide. Will hide all if not given
 * @param animate Animate (default true)
 * @returns Editor instance
 */
declare function hide(this: Editor, names?: any, animate?: any): Editor;
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
declare function i18n(this: Editor, user: string | null, token: string, def?: string): string;
/**
 * Get the ids of the rows being edited
 *
 * @param includeHash Include a prefixed `#`, useful if to be used as a selector
 */
declare function ids(this: Editor, includeHash?: boolean): Array<string | number>;
/**
 * Determine if there is an error state in the form, either the form's global
 * error message, or one or more fields.
 *
 * @param this Editor instance
 * @param inNames Fields to check. All checked if not given
 * @returns true if in error, false otherwise
 */
declare function inError(this: Editor, inNames?: any): boolean;
/**
 * Activate inline editing.
 *
 * @param this Editor instance
 * @param cell Cell(s) to edit
 * @param opts Form options
 * @returns Editor instance
 */
declare function inline(this: Editor, cell: string | Node | HTMLElement | RowSelector | CellSelector | Api<any>, opts?: IFormOptions): Editor;
/**
 * Activate inline editing.
 *
 * @param this Editor instance
 * @param cell Cell(s) to edit
 * @param fieldName Field name to edit
 * @param opts Form options
 * @returns Editor instance
 */
declare function inline(this: Editor, cell: string | Node | HTMLElement | RowSelector | CellSelector | Api<any>, fieldName?: any, opts?: IFormOptions): Editor;
/**
 * Inline creation of data.
 *
 * @param this Editor instance
 * @param insertPoint Where to insert the create row
 * @param opts Form options
 * @returns Editor instance
 */
declare function inlineCreate(this: Editor, insertPoint: null | 'start' | 'end' | HTMLElement | string | JQuery | number, opts: IFormOptions): Editor;
/**
 * Clear a global information message
 *
 * @param this Editor instance
 */
declare function message(this: Editor): Editor;
/**
 * Get a global information message
 *
 * @param this Editor instance
 * @param msg Message to set
 * @returns Editor instance
 */
declare function message(this: Editor, msg?: string | Function): Editor;
/**
 * Set the information message for a field.
 *
 * @param this Editor instance
 * @param name Field name
 * @param msg Information message - use null to clear an existing message
 * @returns Editor instance
 */
declare function message(this: Editor, name: any, msg?: string | Function): Editor;
/**
 * Get Editor's current mode of operation
 *
 * @param this Editor instance
 * @returns Current mode or null if not active
 */
declare function mode(this: Editor): IMode | null;
/**
 * Set Editor's mode of operation
 *
 * @param this Editor instance
 * @param modeIn
 * @returns Editor instance
 */
declare function mode(this: Editor, modeIn: IMode): Editor;
/**
 * Get the modifier that was used to trigger the edit or delete action.
 *
 * @returns The identifier that was used for the editing / remove method
 * called.
 */
declare function modifier(this: Editor): any;
/**
 * Get the values for one or more fields (multi-row editing aware).
 *
 * @param this Editor instance
 * @param fieldNames Fields to get values for, or all fields if not given
 * @returns Editor instance
 */
declare function multiGet(this: Editor, fieldNames?: Array<string | number>): any;
/**
 * Set the values for one or more fields (multi-row editing aware).
 *
 * @param this Editor instance
 * @param valIn Values to set
 */
declare function multiSet(this: Editor, valIn: any): Editor;
/**
 * Set the values for one or more fields (multi-row editing aware).
 *
 * @param this Editor instance
 * @param fieldNames The field(s) to get the multi-row editing values of.
 * @param valIn Values to set
 * @returns Editor instance
 */
declare function multiSet(this: Editor, fieldNames: any, valIn: any): Editor;
/**
 * Get the node for a field
 *
 * @param this Editor instance
 * @param name Field name
 */
declare function node(this: Editor, name: string): HTMLElement;
/**
 * Get the nodes for multiple fields
 *
 * @param this Editor instance
 * @param name Fields names to filter to, or all if not given
 * @returns Field notes
 */
declare function node(this: Editor, name?: string[]): HTMLElement[];
/**
 * Remove a bound event listener to the editor instance.
 *
 * @param this Editor instance
 * @param name Event name to remove
 * @param fn Handler to remove, or all if not specified
 * @returns Editor instance
 */
declare function off(this: Editor, name: string, fn?: Function): Editor;
/**
 * Listen for an event which is fired off by Editor when it performs certain
 * actions.
 *
 * @param this Editor instance
 * @param name Event to listen for
 * @param fn Event handler to apply
 * @returns Editor instance
 */
declare function on(this: Editor, name: string, fn: Function): Editor;
/**
 * Listen for a single event event which is fired off by Editor when it performs
 * certain actions
 *
 * @param this Editor instance
 * @param name Event to listen for
 * @param fn Event handler to apply
 * @returns Editor instance
 */
declare function one(this: Editor, name: string, fn: Function): Editor;
/**
 * Display the main form editor to the end user in the web-browser.
 *
 * @param this Editor instance
 * @returns Editor instance
 */
declare function open(this: Editor): Editor;
/**
 * Get the ordering of fields as displayed in the field
 *
 * @param this Editor instance
 * @returns Field names in order
 */
declare function order(this: Editor): string[];
/**
 * Set the ordering of fields as displayed in the field
 *
 * @param this Editor instance
 * @param setIn Array of field names in their new order
 * @returns Editor instance
 */
declare function order(this: Editor, setIn: string[]): Editor;
/**
 * Set the ordering of fields as displayed in the field
 *
 * @param this Editor instance
 * @param setIn Fields names in new order
 * @returns Editor instance
 */
declare function order(this: Editor, ...setIn: string[]): Editor;
/**
 * Reload data in the target data source
 *
 * @param this Editor instance
 * @param ids Row ids to reload data for
 * @param cb Callback when done
 */
declare function refresh(this: Editor, ids: string[], cb: Function): void;
/**
 * Delete rows from a table
 *
 * @param this Editor instance
 * @param items Rows to be deleted
 * @param options Form options
 * @returns Editor instance
 */
declare function remove(this: Editor, items: RowSelector | Node | HTMLElement | string | Api<any>, options?: IFormOptions): Editor;
/**
 * Delete rows from a table
 *
 * @param this Editor instance
 * @param items Rows to be deleted
 * @param show Control the form's immediate display
 * @param options Form options
 * @returns Editor instance
 */
declare function remove(this: Editor, items: RowSelector | Node | HTMLElement | string | Api<any>, show?: boolean, options?: IFormOptions): Editor;
/**
 * Delete rows from a table
 *
 * @param this Editor instance
 * @param items Rows to be deleted
 * @param title Form title
 * @param buttons Form buttons
 * @param show Show the form
 * @param options Form options
 * @returns Editor instance
 * @deprecated Use the form options overload
 */
declare function remove(this: Editor, items: RowSelector | Node | HTMLElement | string | Api<any>, title?: string, buttons?: string | Button | Button[], show?: boolean, options?: IFormOptions): Editor;
/**
 * Set the value of a field
 *
 * @param this Editor instance
 * @param field Field name
 * @param value Value
 * @returns Editor instance
 */
declare function set(this: Editor, field: string, value: any): Editor;
/**
 * Set the value of multiple fields
 *
 * @param this Editor instance
 * @param values Field values, keyed by field names to set
 * @returns Editor instance
 */
declare function set(this: Editor, values: {
    [key: string]: any;
}): Editor;
/**
 * Show fields in the display that were previously hidden.
 *
 * @param this Editor instance
 * @param names Field(s) to show. All if not given.
 * @param animate Animate the visual change or not
 * @returns Editor instance
 */
declare function show(this: Editor, names?: string | string[], animate?: boolean): Editor;
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
declare function submit(this: Editor, successCallback?: () => void, errorCallback?: () => void, formatdata?: (data: any) => void, hideIn?: boolean): Editor;
/**
 * Get the DataTable assoc. with this Editor instance
 *
 * @param this Editor instance
 * @returns DataTable configured for this instance
 */
declare function table(this: Editor): ISettings['table'];
/**
 * Set the DataTable assoc. with this Editor instance
 *
 * @param this Editor instance
 * @param setIn DataTable to set
 * @returns Editor instance
 */
declare function table(this: Editor, setIn: ISettings['table'] | Api): Editor;
/**
 * Get the template element to use for the main form
 *
 * @param this Editor instance
 * @returns Template element. Null if none set
 */
declare function template(this: Editor): Dom | null;
/**
 * Set the template element to use for the main form
 *
 * @param this Editor instance
 * @param setIn Element to use for the form template
 * @returns Editor instance
 */
declare function template(this: Editor, setIn: string | Dom | HTMLElement | null): Editor;
/**
 * Get the form title
 *
 * @param this Editor instance
 * @returns Form title
 */
declare function title(this: Editor): string;
/**
 * Set the form title
 *
 * @param this Editor instance
 * @param titleIn Title to set
 * @returns Editor instance
 */
declare function title(this: Editor, titleIn: string | ((e: Editor, dt: Api<any>) => string)): Editor;
/**
 * Get or set the value of a specific field, or get the value of all fields in
 * the form.
 *
 * @param {string|array} [names] The field name(s) to get or set the value of.
 * If not given, then the value of all fields will be obtained.
 * @param {*} [value] Value to set
 * @return {Editor|object|*} Editor instance, for chaining if used as a setter,
 * an object containing the values of the requested fields if used as a
 * getter with multiple fields requested, or the value of the requested field
 * if a single field is requested.
 */
/**
 * Get field values
 *
 * @param this Editor instance
 * @param fieldIn Fields to get value of. If not given, get values of all fields
 */
declare function val(this: Editor, fieldIn?: string | string[]): any;
/**
 * Set field values
 *
 * @param this Editor instance
 * @param values Values from which to set fields
 * @returns Editor instance
 */
declare function val(this: Editor, values: {
    [key: string]: any;
}): Editor;
/**
 * Set field values, filtered to list of fields
 *
 * @param this Editor instance
 * @param fieldIn Field names (filterd value)
 * @param values Values from which to set fields
 * @returns Editor instance
 */
declare function val(this: Editor, fieldIn: string, values: {
    [key: string]: any;
}): Editor;

/**
 * Common error message emitter. This method is not (yet) publicly documented on
 * the Editor site. It might be in future.
 *
 * @param  {string} msg Error message
 * @param  {int}    tn  Tech note link
 */
declare function error(msg: string, tn: number, thro?: boolean): void;
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
declare function pairs(data: any, props: any, fn: any): void;
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
declare function upload(editor: any, conf: ISharedUploadConf, filesIn: any, progressCallback: any, completeCallback: any): void;
/**
 * CommonJS factory function pass through. Matches DataTables.
 * @param {*} root Window
 * @param {*} jq jQuery - redundant
 * @returns {boolean} Indicator
 */
declare function factory(root: any, jq: any): boolean;

interface IReplacements {
    [name: string]: false | ((this: Editor, name: string, id: string, action: string, data: any) => string);
}
interface IEditorAjax extends AjaxOptions {
    data: (d: Record<string, any>) => Record<string, any>;
    replacements?: IReplacements;
}
/**
 * Set the class on the form to relate to the action that is being performed.
 * This allows styling to be applied to the form to reflect the state that
 * it is in.
 *
 * @private
 */
declare function _actionClass(this: Editor): void;
/**
 * Create an Ajax request in the same style as DataTables 1.10, with full
 * backwards compatibility for Editor 1.2.
 *
 * @param  {object} data Data to submit
 * @param  {function} success Success callback
 * @param  {function} error Error callback
 * @private
 */
declare function _ajax(this: Editor, data: any, success: any, error: any): void;
/**
 * Perform replacements on the Ajax URL
 *
 * @param this Editor instance
 * @param opts Ajax options
 * @param id Row id
 * @param action Ajax action
 * @param data Ajax data
 */
declare function _ajaxReplacements(this: Editor, opts: IEditorAjax, id: string, action: string, data: any): void;
/**
 * Create the DOM structure from the source elements for the main form.
 * This is required since the elements can be moved around for other form types
 * (bubble).
 *
 * @private
 */
declare function _assembleMain(this: Editor): void;
/**
 * Blur the editing window. A blur is different from a close in that it might
 * cause either a close or the form to be submitted. A typical example of a
 * blur would be clicking on the background of the bubble or main editing forms
 * - i.e. it might be a close, or it might submit depending upon the
 * configuration, while a click on the close box is a very definite close.
 *
 * @private
 */
declare function _blur(this: Editor): void;
/**
 * Clear all of the information that might have been dynamically set while
 * the form was visible - specifically errors and dynamic messages
 *
 * @private
 */
declare function _clearDynamicInfo(this: Editor, errorsOnly?: boolean): void;
/**
 * Close an editing display, firing callbacks and events as needed
 *
 * @param  {function} submitComplete Function to call after the preClose event
 * @param  {string} mode Editing mode that is just finished
 * @private
 */
declare function _close(this: Editor, submitComplete?: any, mode?: any): void;
/**
 * Register a function to be called when the editing display is closed. This is
 * used by function that create the editing display to tidy up the display on
 * close - for example removing event handlers to prevent memory leaks.
 *
 * @param  {function} fn Function to call on close
 * @private
 */
declare function _closeReg(this: Editor, fn: any): void;
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
declare function _crudArgs(this: Editor, arg1: any, arg2: any, arg3: any, arg4: any): {
    maybeOpen(): void;
    opts: IFormOptions;
};
/**
 * Execute the data source abstraction layer functions. This is simply a case
 * of executing the function with the Editor scope, passing in the remaining
 * parameters.
 *
 * @param name Function name to execute
 * @private
 */
declare function _dataSource(this: Editor, name: string, ...args: any[]): any;
/**
 * Insert the fields into the DOM, in the correct order
 *
 * @private
 */
declare function _displayReorder(this: Editor, includeFields?: any): void;
/**
 * Display the title in the form header, taking into account nested editing
 */
declare function _drawTitle(): void;
/**
 * Generic editing handler. This can be called by the three editing modes (main,
 * bubble and inline) to configure Editor for a row edit, and fire the required
 * events to ensure that the editing interfaces all provide a common API.
 *
 * @param {*} rows Identifier for the item(s) to be edited
 * @param {string} type Editing type - for the initEdit event
 * @private
 */
declare function _edit(this: Editor, items: any, editFields: any, type: any, formOptions: any, setupDone: any): void;
/**
 * Triggering editing, checking to see if a refresh of the data is needed or not
 */
declare function _editRefresh(this: Editor, items: any, dataSource: Function, type: string, formOptions: any, setupDone: any): void;
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
declare function _event(this: Editor, trigger: string | string[], args?: any[], promiseComplete?: any): boolean;
/**
 * 'Modernise' event names, from the old style `on[A-Z]` names to camelCase.
 * This is done to provide backwards compatibility with Editor 1.2- event names.
 * The names themselves were updated for consistency with DataTables.
 *
 * @param {string} Event name to modernise
 * @return {string} String with new event name structure
 * @private
 */
declare function _eventName(this: Editor, input: any): any;
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
declare function _eventFunc(this: Editor, fn: Function | undefined): EventFunction;
/**
 * Find a field from a DOM node. All children are searched.
 *
 * @param  {node} node DOM node to search for
 * @return {Field}     Field instance
 */
declare function _fieldFromNode(this: Editor, node: any): any;
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
declare function _fieldNames(this: Editor, fieldNames: any): any[];
/**
 * Focus on a field. Providing the logic to allow complex focus expressions
 *
 * @param {array} fields Array of Field instances or field names for the fields
 * that are shown
 * @param {null|string|integer} focus Field identifier to focus on
 * @private
 */
declare function _focus(this: Editor, fieldsIn: Array<string | Field>, focus: any): void;
/**
 * Form options - common function so all editing methods can provide the same
 * basic options, DRY.
 *
 * @param {object} opts Editing options. See model.formOptions
 * @private
 */
declare function _formOptions(this: Editor, opts: IFormOptions): string;
/**
 * Inline editing insertion of fields
 */
declare function _inline(this: Editor, editFields: any, opts: any, closeCb?: any): Editor;
/**
 * Add a triggering action for inline editing, with a return function that
 * will tidy up the events.
 *
 * @param  type Action
 * @param  opts Form options object
 * @param  insertPoint Insert point in the DOM
 * @private
 */
declare function _inputTrigger(this: Editor, type: 'submit' | 'cancel', opts: any, insertPoint: any): () => void;
/**
 * Update the field options from a JSON data source
 *
 * @param  {object} json JSON object from the server
 * @private
 */
declare function _optionsUpdate(this: Editor, json: any): void;
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
declare function _message(this: Editor, elIn: any, msg: any, title?: any, fn?: any): void;
/**
 * Update the multi-value information display to not show redundant information
 *
 * @private
 */
declare function _multiInfo(this: Editor): void;
/**
 * Close the current form, which can result in the display controller
 * hiding its display, or showing a form from a level up if nesting
 */
declare function _nestedClose(this: Editor, cb: () => void): void;
/**
 * Display a form, adding it to the display stack for nesting
 */
declare function _nestedOpen(this: Editor, cb: () => void, nest: boolean): void;
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
declare function _postopen(this: Editor, type: any, immediate: any): boolean;
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
declare function _preopen(this: Editor, type: any): boolean;
/**
 * Set the form into processing mode or take it out of processing mode. In
 * processing mode a processing indicator is shown and user interaction with the
 * form buttons is blocked
 *
 * @param {boolean} processing true if to go into processing mode and false if
 * to come out of processing mode
 * @private
 */
declare function _processing(this: Editor, processing: any): void;
/**
 * Check if any of the fields are processing for the submit to carry on. It
 * can recurse.
 *
 * @private
 */
declare function _noProcessing(this: Editor, args: any): boolean;
/**
 *
 * @param this Editor instance
 * @param items Items to be removed
 * @param argOpts Options from editing API arguments
 * @param editFields Edit fields object
 */
declare function _remove(this: Editor, items: any, argOpts: any, editFields: any): void;
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
declare function _submit(this: Editor, successCallback: any, errorCallback: any, formatdata: any, hide: any): void;
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
declare function _submitTable(this: Editor, data: any, success: any, error: any): void;
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
declare function _submitSuccess(this: Editor, json: any, notGood: any, submitParams: any, submitParamsLocal: any, action: any, editCount: any, hide: any, successCallback: any, errorCallback: any, xhr: any): void;
/**
 * Submit error callback function
 *
 * @private
 */
declare function _submitError(this: Editor, xhr: any, err: any, thrown: any, errorCallback: any, submitParams: any, action: any): void;
/**
 * Check to see if the form needs to be tidied before a new action can be performed.
 * This includes if the from is currently processing an old action and if it
 * is inline editing.
 *
 * @param {function} fn Callback function
 * @returns {boolean} `true` if was in inline mode, `false` otherwise
 * @private
 */
declare function _tidy(this: Editor, fn: any): boolean;
/**
 * Scan over each field and check if it is valid.
 *
 * @param this Editor
 * @returns false if any field is invalid
 */
declare function _validate(this: Editor): boolean;
/**
 * Same as indexOf but with weak type checking
 *
 * @param {any} name Value to look for in the array
 * @param {array} arr Array to scan through
 * @returns {number} -1 if not found, index otherwise
 */
declare function _weakInArray(this: Editor, name: any, arr: any): number;

declare function export_default(elm: string): string;

/**
 * Class names that are used by Editor for its various display components.
 * A copy of this object is taken when an Editor instance is initialised, thus
 * allowing different classes to be used in different instances if required.
 * Class name changes can be useful for easy integration with CSS frameworks,
 * for example Twitter Bootstrap.
 *
 * @namespace
 */
declare const _default: {
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
        create: string;
        /**
         * Editor is in 'edit' state
         */
        edit: string;
        /**
         * Editor is in 'remove' state
         */
        remove: string;
    };
    /**
     * Display body classes
     *
     * @namespace
     */
    body: {
        /**
         * Liner for the body content
         */
        content: string;
        /**
         * Container for the body elements
         */
        wrapper: string;
    };
    /**
     * Bubble editing classes - these are used to display the bubble editor
     *
     * @namespace
     */
    bubble: {
        /**
         * Fixed background
         */
        bg: string;
        /**
         * Close button
         */
        close: string;
        /**
         * Bubble content liner
         */
        liner: string;
        /**
         * Pointer shown which node is being edited
         */
        pointer: string;
        /**
         * Bubble table display wrapper, so the buttons and form can be shown
         * as table cells (via css)
         */
        table: string;
        /**
         * Bubble container element
         */
        wrapper: string;
    };
    /**
     * Field classes
     *
     * @namespace
     */
    field: {
        /**
         * Field is disabled
         */
        disabled: string;
        /**
         * Field error state (added to the field.wrapper element when in error state
         */
        error: string;
        /**
         * Field input container
         */
        input: string;
        /**
         * Input elements wrapper
         */
        inputControl: string;
        /**
         * Error class for the `input` element (whatever it might be)
         */
        inputError: string;
        /**
         * Field label
         */
        label: string;
        /**
         * Error information text
         */
        'msg-error': string;
        /**
         * General information text
         */
        'msg-info': string;
        /**
         * Label information text
         */
        'msg-label': string;
        /**
         * Live messaging (API) information text
         */
        'msg-message': string;
        /**
         * Multi-value information descriptive text
         */
        multiInfo: string;
        /**
         * Multi-value not editable (field.multiEditable)
         */
        multiNoEdit: string;
        /**
         * Multi-value information display
         */
        multiRestore: string;
        /**
         * Multi-value information display wrapper
         */
        multiValue: string;
        /**
         * Class prefix for the field name - field name is added to the end allowing
         * styling based on field name.
         */
        namePrefix: string;
        /**
         * Field's processing element
         */
        processing: string;
        /**
         * Class prefix for the field type - field type is added to the end allowing
         * styling based on field type.
         */
        typePrefix: string;
        /**
         * Container for each field
         */
        wrapper: string;
    };
    /**
     * Display footer classes
     *
     * @namespace
     */
    footer: {
        /**
         * Liner for the footer content
         */
        content: string;
        /**
         * Container for the footer elements
         */
        wrapper: string;
    };
    /**
     * Form classes
     *
     * @namespace
     */
    form: {
        /**
         * Button
         */
        button: string;
        buttonSubmit: string;
        /**
         * Button inside the form
         */
        buttonInternal: string;
        /**
         * Buttons container
         */
        buttons: string;
        /**
         * Liner for the form content
         */
        content: string;
        /**
         * Global error imformation
         */
        error: string;
        /**
         * Global form information
         */
        info: string;
        /**
         * Applied to the <form> tag
         */
        tag: string;
        /**
         * Container for the form elements
         */
        wrapper: string;
    };
    /**
     * Display header classes
     *
     * @namespace
     */
    header: {
        /**
         * Liner for the header content
         */
        content: string;
        /**
         * Title tag
         */
        title: {
            tag: any;
            class: string;
        };
        /**
         * Container for the header elements
         */
        wrapper: string;
    };
    /**
     * Inline editing classes - these are used to display the inline editor
     *
     * @namespace
     */
    inline: {
        buttons: string;
        liner: string;
        wrapper: string;
    };
    /**
     * Processing classes
     *
     * @namespace
     */
    processing: {
        /**
         * Added to the base element ("wrapper") when the form is "processing"
         */
        active: string;
        /**
         * Processing indicator element
         */
        indicator: string;
    };
    /**
     * Applied to the base DIV element that contains all other Editor elements
     */
    wrapper: string;
};

declare function safeDomId(id: any, prefix?: string): string;

declare class Editor {
    static fieldTypes: {
        [type: string]: IFieldType;
    };
    static files: {};
    static version: string;
    static classes: {
        actions: {
            create: string;
            edit: string;
            remove: string;
        };
        body: {
            content: string;
            wrapper: string;
        };
        bubble: {
            bg: string;
            close: string;
            liner: string;
            pointer: string;
            table: string;
            wrapper: string;
        };
        field: {
            disabled: string;
            error: string;
            input: string;
            inputControl: string;
            inputError: string;
            label: string;
            'msg-error': string;
            'msg-info': string;
            'msg-label': string;
            'msg-message': string;
            multiInfo: string;
            multiNoEdit: string;
            multiRestore: string;
            multiValue: string;
            namePrefix: string;
            processing: string;
            typePrefix: string;
            wrapper: string;
        };
        footer: {
            content: string;
            wrapper: string;
        };
        form: {
            button: string;
            buttonSubmit: string;
            buttonInternal: string;
            buttons: string;
            content: string;
            error: string;
            info: string;
            tag: string;
            wrapper: string;
        };
        header: {
            content: string;
            title: {
                tag: any;
                class: string;
            };
            wrapper: string;
        };
        inline: {
            buttons: string;
            liner: string;
            wrapper: string;
        };
        processing: {
            active: string;
            indicator: string;
        };
        wrapper: string;
    };
    static Field: typeof Field;
    static DateTime: any;
    static error: typeof error;
    static pairs: typeof pairs;
    static factory: typeof factory;
    static upload: typeof upload;
    static defaults: IEditorOptions;
    static models: {
        button: IButton;
        displayController: IDisplayController;
        fieldType: IFieldType;
        formOptions: IFormOptions;
        settings: ISettings;
    };
    static dataSources: {
        ajax: {
            commit(action: any, identifier: any, data: any, store: any): void;
            create(fields: any, data: any): void;
            edit(identifier: any, fields: any, data: any, store: any): void;
            fields(identifier: any): {};
            id(data: any): any;
            individual(identifier: any, fieldNames: any): {};
            mustReload(): boolean;
            prep(action: any, identifier: any, submit: any, json: any, store: any): void;
            refresh(): void;
            reload(ids: string[], data: any[]): void;
            remove(identifier: any, fields: any, store: any): void;
        };
        dataTable: {
            commit(action: any, identifier: any, data: any, store: any): void;
            create(fields: any, data: any): void;
            edit(identifier: any, fields: any, data: any, store: any): void;
            fakeRow(insertPoint: null | "start" | "end"): {
                0: {
                    attach: any[];
                    attachFields: any[];
                    displayFields: {};
                    fields: any;
                    type: string;
                };
            };
            fakeRowEnd(): void;
            fields(identifier: any): {};
            id(data: any): any;
            individual(identifier: any, fieldNames: string[]): {};
            mustReload(): boolean;
            prep(action: any, identifier: any, submit: any, json: any, store: any): void;
            refresh(): void;
            reload(ids: string[], data: any[]): void;
            remove(identifier: any, fields: any, store: any): void;
        };
        html: {
            create(fields: any, data: any): void;
            edit(identifier: any, fields: any, data: any): void;
            fields(identifier: any): {};
            id(data: any): any;
            individual(identifier: any, fieldNames: any): Record<string, any>;
            initField(cfg: any): void;
            mustReload(): boolean;
            remove(identifier: any, fields: any): void;
        };
    };
    static display: {
        envelope: IDisplayController;
        lightbox: IDisplayController;
        static: typeof export_default;
    };
    add: typeof add;
    ajax: typeof ajax;
    background: typeof background;
    blur: typeof blur;
    bubble: typeof bubble;
    bubbleLocation: typeof bubbleLocation;
    bubblePosition: typeof bubblePosition;
    buttons: typeof buttons;
    clear: typeof clear;
    close: typeof close;
    create: typeof create;
    undependent: typeof undependent;
    dependent: typeof dependent;
    destroy: typeof destroy;
    disable: typeof disable;
    display: typeof display;
    displayed: typeof displayed;
    displayNode: typeof displayNode;
    edit: typeof edit;
    enable: typeof enable;
    error: typeof error$1;
    field: typeof field;
    fields: typeof fields;
    file: typeof file;
    files: typeof files;
    get: typeof get;
    hide: typeof hide;
    i18n: typeof i18n;
    ids: typeof ids;
    inError: typeof inError;
    inline: typeof inline;
    inlineCreate: typeof inlineCreate;
    message: typeof message;
    mode: typeof mode;
    modifier: typeof modifier;
    multiGet: typeof multiGet;
    multiSet: typeof multiSet;
    node: typeof node;
    off: typeof off;
    on: typeof on;
    one: typeof one;
    open: typeof open;
    order: typeof order;
    refresh: typeof refresh;
    remove: typeof remove;
    set: typeof set;
    show: typeof show;
    submit: typeof submit;
    table: typeof table;
    template: typeof template;
    title: typeof title;
    val: typeof val;
    protected classes: typeof _default;
    protected c: Partial<IEditorOptions>;
    protected s: typeof settings;
    protected dom: {
        body: HTMLElement;
        bodyContent: HTMLElement;
        buttons: HTMLElement;
        event: Dom;
        footer: HTMLElement;
        form: HTMLElement;
        formContent: HTMLElement;
        formError: HTMLElement;
        formInfo: HTMLElement;
        header: HTMLElement;
        processing: HTMLElement;
        wrapper: HTMLElement;
    };
    protected _actionClass: typeof _actionClass;
    protected _ajax: typeof _ajax;
    protected _ajaxReplacements: typeof _ajaxReplacements;
    protected _assembleMain: typeof _assembleMain;
    protected _blur: typeof _blur;
    protected _clearDynamicInfo: typeof _clearDynamicInfo;
    protected _close: typeof _close;
    protected _closeReg: typeof _closeReg;
    protected _crudArgs: typeof _crudArgs;
    protected _dataSource: typeof _dataSource;
    protected _displayReorder: typeof _displayReorder;
    protected _drawTitle: typeof _drawTitle;
    protected _edit: typeof _edit;
    protected _editRefresh: typeof _editRefresh;
    protected _event: typeof _event;
    protected _eventName: typeof _eventName;
    protected _eventFunc: typeof _eventFunc;
    protected _fieldFromNode: typeof _fieldFromNode;
    protected _fieldNames: typeof _fieldNames;
    protected _focus: typeof _focus;
    protected _formOptions: typeof _formOptions;
    protected _inline: typeof _inline;
    protected _inputTrigger: typeof _inputTrigger;
    protected _optionsUpdate: typeof _optionsUpdate;
    protected _message: typeof _message;
    protected _multiInfo: typeof _multiInfo;
    protected _nestedClose: typeof _nestedClose;
    protected _nestedOpen: typeof _nestedOpen;
    protected _postopen: typeof _postopen;
    protected _preopen: typeof _preopen;
    protected _processing: typeof _processing;
    protected _noProcessing: typeof _noProcessing;
    protected _remove: typeof _remove;
    protected _submit: typeof _submit;
    protected _submitTable: typeof _submitTable;
    protected _submitSuccess: typeof _submitSuccess;
    protected _submitError: typeof _submitError;
    protected _tidy: typeof _tidy;
    protected _validate: typeof _validate;
    protected _weakInArray: typeof _weakInArray;
    /**
     * Create a new instance of DataTables Editor.
     *
     * @param init Editor configuration object
     * @returns Editor instance
     */
    constructor(init: Partial<IEditorOptions>);
    static safeId: typeof safeDomId;
    /** @internal */
    internalEvent(name: any, args: any): void;
    /** @internal */
    internalI18n(): {
        close: string;
        create: {
            button: string;
            submit: string;
            title: string;
        };
        datetime: {
            amPm: [string, string];
            hours: string;
            minutes: string;
            months: [string, string, string, string, string, string, string, string, string, string, string, string];
            next: string;
            previous: string;
            seconds: string;
            unknown: string;
            weekdays: [string, string, string, string, string, string, string];
        };
        edit: {
            button: string;
            submit: string;
            title: string;
        };
        error: {
            system: string;
        };
        field: {
            autocomplete: {
                noResults: string;
                placeholder: string;
            };
            errorText: string;
            tags: {
                addButton: string;
                inputPlaceholder: string;
                noResults: string;
                placeholder: string;
                removeIcon: string;
            };
            upload: {
                choose: string;
                clear: string;
                dragDrop: string;
                noFile: string;
                processing: string;
                uploading: string;
            };
            uploadMany: {
                choose: string;
                dragDrop: string;
                noFiles: string;
                processing: string;
                uploading: string;
            };
        };
        multi: {
            info: string;
            noMulti: string;
            restore: string;
            title: string;
        };
        remove: {
            button: string;
            confirm: {
                _: string;
                [num: number]: string;
            };
            submit: string;
            title: string;
        };
    };
    /** @internal */
    internalMultiInfo(): void;
    /** @internal */
    internalSettings(): ISettings;
}

type DeepPartial<T> = T extends object ? {
    [P in keyof T]?: DeepPartial<T[P]>;
} : T;
declare module 'datatables.net' {
    interface Language {
        /**
         * Editor language options
         */
        editor?: ConfigEditorLanguage;
    }
    interface Context {
        _editor: Editor;
    }
    interface Ext {
        editorFields: Record<string, IFieldType>;
    }
    interface Api<T> {
        /**
         * Get the Editor instance assigned to this DataTable
         */
        editor(): Editor;
        /**
         * Get information about a file
         */
        file: InstanceType<typeof Editor>['file'];
        /**
         * Get information about files
         */
        files: InstanceType<typeof Editor>['files'];
    }
    interface ApiRow<T> {
        /**
         * Create a new row
         */
        create: (opts?: ApiOptions) => Editor;
    }
    interface ApiRowMethods<T> {
        /**
         * Trigger editing on the selected row
         */
        edit: (opts?: ApiOptions) => Editor;
        /**
         * Delete the current row
         */
        delete: (opts?: ApiOptions) => Editor;
    }
    interface ApiRowsMethods<T> {
        /**
         * Trigger editing on the selected rows
         */
        edit: (opts?: ApiOptions) => Editor;
        /**
         * Delete the current rows
         */
        delete: (opts?: ApiOptions) => Editor;
    }
    interface ApiCellMethods<T> {
        /**
         * Trigger inline or bubble editing on the selected cell
         */
        edit: (type?: 'inline' | 'bubble', opts?: ApiOptions) => Editor;
    }
    interface ApiCellsMethods<T> {
        /**
         * Trigger bubble editing on the selected cells
         */
        edit: (opts?: ApiOptions) => Editor;
    }
    interface DataTablesStatic {
        /**
         * Editor class
         */
        Editor: typeof Editor;
    }
    interface Buttons {
        create: EditorButtonCreate;
        edit: EditorButtonEdit;
        editSingle: EditorButtonEditSingle;
        remove: EditorButtonRemove;
        removeSingle: EditorButtonRemoveSingle;
        createInline: {
            extend: 'createInline';
            position?: null | 'start' | 'end' | HTMLElement;
        };
    }
}
/** Create new row Button */
interface EditorButtonCreate extends EditorButtonConfig {
    extend: 'create';
}
/** Edit one or more rows Button */
interface EditorButtonEdit extends EditorButtonConfig {
    extend: 'edit';
}
/** Edit a single row Button (disabled when multiple selected) */
interface EditorButtonEditSingle extends EditorButtonConfig {
    extend: 'editSingle';
}
/** Delete one or more rows Button */
interface EditorButtonRemove extends EditorButtonConfig {
    extend: 'remove';
}
/** Delete a single row Button (disabled when multiple selected) */
interface EditorButtonRemoveSingle extends EditorButtonConfig {
    extend: 'removeSingle';
}
/** Common properties used by the buttons provided by Editor */
interface EditorButtonConfig {
    /** Editor instance to trigger button */
    editor: Editor;
    /** The form control buttons to show in the Editor form when activated */
    formButtons?: IButton | IButton[] | string;
    /** The message to show in the edit form */
    formMessage?: string;
    /** Form options to configure the behaviour of the form */
    formOptions?: IFormOptions;
    /** The title to give the edit form */
    formTitle?: string;
}
interface ApiOptions {
    buttons?: 'string';
    title?: 'string';
    message?: 'string';
}
interface ConfigEditorLanguage extends DeepPartial<typeof Editor.defaults.i18n> {
}

export { Editor as default };
export type { ApiOptions, EditorButtonConfig, EditorButtonCreate, EditorButtonEdit, EditorButtonEditSingle, EditorButtonRemove, EditorButtonRemoveSingle };
