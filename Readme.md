# Editor for DataTables 

This is the distribution package for the [Editor extension](https://datatables.net/extensions/editor) for [DataTables](https://datatables.net/). Only the core software for this library is contained in this package - to be correctly styled, a styling package for Editor must also be included. Please see the [npm installation documentation on the DataTables site](https://datatables.net/manual/installation#Node.js-/-NPM) for full details.

Editor is a comprehensive editing extension for DataTables that provides the ability to easily add, edit and delete rows on a database that is displayed by a DataTable. Editor provides a clean and responsive interface for end user manipulation of data, an expressive API for complete control and a well defined server communications protocol for data submission.


## Installation

### Browser

To use DataTables with a simple `<script>` tag, rather than using this package, it is recommended that you use the [DataTables download builder](//datatables.net/download) which can create CDN or locally hosted packages for you, will all dependencies satisfied.

### npm

For installation via npm, yarn and other similar package managers, install this package with your package manager - e.g.:

```js
npm install datatables.net
npm install datatables.net-editor
```

Then, to load and initialise DataTables and Editor in your code use:

```js
import DataTable from 'datatables.net';
import 'datatables.net-editor';

// Register DataTables Plus license key
DataTable.key('plus_....');

new DataTable('#myTable', {
    // initialisation options
});
```


## Documentation

Full documentation and examples for Editor can be found [on the DataTables website](https://datatables.net/extensions/editor).

## Bug / Support

Support for DataTables is available through the [DataTables forums](//datatables.net/forums) and [commercial support options](//datatables.net/support) are available.


## License

This software is released under the [DataTables Plus License](https://datatables.net/license/plus). To use the software a license key must be applied - see [DataTables Plus](https://datatables.net/plus).
