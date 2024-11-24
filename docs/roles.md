# Read and write authorization by roles

### Organization member

* no identifier
* can read, but not write the organization document
* can read and write his own user document and all documents referenced from it

### Organization admin

* identifier: `admin`
* can read and write every document
* can create new team with corresponding roles

### Team admin

* identifier: `team.<teamDocId>.admin`
* can read and write the team document
* can read and write all documents referenced transitively from the team document

### Team member

* identifier: `team.<teamDocId>.member`
* can read, but not write the team document
* can read and write all documents referenced transitively from the team document
