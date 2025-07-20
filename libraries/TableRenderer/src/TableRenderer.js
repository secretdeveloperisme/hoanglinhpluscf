class TableRenderer {
    /**
     * @typedef {Object} ColumnConfig
     * @property {string} key - The data key to display in this column.
     * @property {string} label - The header text for this column.
     * @property {string} [type='text'] - The type of data (e.g., 'text', 'number', 'date').
     * @property {Function} [formatter] - Optional function to format the cell value.
     * @property {boolean} [sortable=true] - Whether the column is sortable.
     * @property {string} [width] - The CSS width for this column (e.g., '150px', '20%').
     */

    /**
     * @typedef {Object} TableConfig
     * @property {string} targetWrapperElementId - The ID of the HTML element where the wrapper table will be rendered.  
     * @property {string} targetElementId - The ID of the HTML element where the table will be rendered.  
     * @property {string} title - title of table
     * @property {string} idKeyName  - The key name for the unique identifier of each row.
     * @default 'id'
     * @property {ColumnConfig[]} columns - An array defining the table columns.
     * @property {Object} [pagination] - Pagination configuration.
     * @property {number} [pagination.itemsPerPage=10] - Number of items to display per page.
     * @property {Function} [customDataHandler] - Optional async function to override data loading.
     * Signature: `async (options: { page: number, itemsPerPage: number, sortColumn: string | null, sortDirection: 'asc' | 'desc' | null }) => Promise<{ data: Array<Object>, totalItems: number }>`
     * @property {Function} [deleteSingleRowHandler] - Optional async function to override row deletion.
     * Signature: `async (ids: Array<any>) => Promise<void>`
     * @property {Function} [addRowHandler] - Optional async function to override row addition
     * Signature `async (idToUpdate: number, updatedData: Object) => Promise<void>`
     * @property {Function} [updateRowHandler] - Optional async function to override row update.
     * Signature: `async (id: any, updatedData: Object) => Promise<void>`
     * Signature: `async (newRow: Object) => Promise<void>`
     * @property {Object} [styles] - Optional object for custom CSS class names.
     * @property {string} [styles.table='custom-table'] - Table classes.
     * @property {string} [styles.thead='table-header-group'] - Table header group classes.
     * @property {string} [styles.th='table-header-cell'] - Table header cell classes.
     * @property {string} [styles.tbody='table-body-group'] - Table body group classes.
     * @property {string} [styles.tr='table-row'] - Table row classes.
     * @property {string} [styles.td='table-data-cell'] - Table data cell classes.
     * @property {string} [styles.checkboxTd='table-data-cell checkbox-cell'] - Checkbox cell classes.
     * @property {string} [styles.checkboxInput='checkbox-input'] - Checkbox input classes.
     * @property {string} [styles.actionTd='table-data-cell action-cell'] - Action cell classes.
     * @property {string} [styles.actionButton='action-button'] - Action button classes.
     * @property {string} [styles.deleteRowButton='action-button delete-row-button'] - Delete row button classes.
     * @property {string} [styles.updateRowButton='action-button update-row-button'] - Update row button classes.
     */

    /**
     * Creates an instance of TableRenderer.
     * @param {TableConfig} config - The configuration object for the table.
     */
    constructor(config) {
        // Validate essential configuration properties
        if (!config.targetWrapperElementId) {
            throw new Error("TableRenderer: 'targetWrapperElementId' is required in the configuration.");
        }
        if (!Array.isArray(config.columns) || config.columns.length === 0) {
            throw new Error("TableRenderer: 'columns' array with at least one column definition is required.");
        }

        /** @private @type {TableConfig} */
        this.config = {
            targetElementId: config.targetElementId,
            targetWrapperElementId: config.targetWrapperElementId,
            title: config.title,
            idKeyName: config.idKeyName || 'id', // Default to 'id' if not provided
            columns: config.columns.map(col => ({ ...col, sortable: col.sortable !== false })), // Default sortable to true
            pagination: {
                itemsPerPage: config.pagination?.itemsPerPage || 10,
            },
            customDataHandler: config.customDataHandler, // Optional custom data loading handler
            deleteSingleRowHandler: config.deleteSingleRowHandler,   // Optional custom delete handler
            addRowHandler: config.addRowHandler,         // Optional custom add handler
            updateRowHandler: config.updateRowHandler,  // Optional custom update handler
            styles: {
                table: config.styles?.table || 'custom-table',
                thead: config.styles?.thead || 'table-header-group',
                th: config.styles?.th || 'table-header-cell',
                tbody: config.styles?.tbody || 'table-body-group',
                tr: config.styles?.tr || 'table-row',
                td: config.styles?.td || 'table-data-cell',
                checkboxTd: config.styles?.checkboxTd || 'table-data-cell checkbox-cell',
                checkboxInput: config.styles?.checkboxInput || 'checkbox-input',
                actionTd: config.styles?.actionTd || 'table-data-cell action-cell',
                actionButton: config.styles?.actionButton || 'action-button',
                deleteRowButton: config.styles?.deleteRowButton || 'action-button delete-row-button',
                updateRowButton: config.styles?.updateRowButton || 'action-button update-row-button',
                ...config.styles // Allow overriding default styles
            }
        };

        /** @private @type {HTMLElement | null} */
        this.targetWrapperElement = document.getElementById(this.config.targetWrapperElementId);
        /** @private @type {HTMLElement | null} */
        this.paginationControls = {};
        /** @private @type {HTMLElement | null} */
        this.deleteButton = {};
        /** @private @type {HTMLElement | null} */
        this.selectedCountSpan = {};
        /** @private @type {HTMLElement | null} */
        this.prevPageBtn = {};
        /** @private @type {HTMLElement | null} */
        this.nextPageBtn = {};
        /** @private @type {HTMLElement | null} */
        this.pageInfoSpan = {};
        /** @private @type {HTMLElement | null} */
        this.itemsPerPageSelect = {};
        /** @private @type {HTMLElement | null} */
        this.loadingIndicator = {};
        /** @private @type {HTMLElement | null} */
        this.errorMessage = {};

       
        if (!this.targetWrapperElement) {
            console.error(`TableRenderer: Target wrapper element with ID '${this.config.targetWrapperElementId}' not found.`);
            throw new Error(`TableRenderer: Target wrapper element with ID '${this.config.targetElementId}' not found.`);
        }

        this.renderTableContainer();

         if (!this.targetElement) {
            console.error(`TableRenderer: Target element with ID '${this.config.targetElementId}' not found.`);
            throw new Error(`TableRenderer: Target element with ID '${this.config.targetElementId}' not found.`);
        }

        /** @private @type {Array<Object>} - Stores the full dataset if no customDataHandler is used. */
        this._fullData = [];
        /** @private @type {Array<Object>} - Stores the currently displayed (paginated/sorted) data. */
        this._displayedData = [];
        /** @private @type {number} */
        this.currentPage = 1;
        /** @private @type {number} */
        this.itemsPerPage = this.config.pagination.itemsPerPage;
        /** @private @type {number} */
        this.totalItems = 0; // This will be updated by _fetchAndRenderData
        /** @private @type {number} */
        this.totalPages = 0; // This will be updated by _fetchAndRenderData
        /** @private @type {Set<any>} */
        this.selectedRowIds = new Set();
        /** @private @type {string | null} */
        this.sortColumn = null;
        /** @private @type {'asc' | 'desc' | null} */
        this.sortDirection = null;

        this._setupEventListeners();
    }

     
    renderTableContainer(){
        this.targetWrapperElement.className = 'table-renderer-container';
        this.targetWrapperElement.innerHTML = ''; 

        // Main Heading
        const heading = document.createElement('h1');
        heading.className = 'main-heading';
        heading.textContent = this.config.title || 'Table';
        this.targetWrapperElement.appendChild(heading);

        // Controls Section
        const controlsSection = document.createElement('div');
        controlsSection.className = 'controls-section';

        // Button Group
        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'button-group';

        // Add Button
        this.addButton = document.createElement('button');
        this.addButton.id = 'add-btn';
        this.addButton.className = 'table-btn add-button';
        this.addButton.textContent = 'Add';
        buttonGroup.appendChild(this.addButton);

        // Delete Button
        this.deleteButton = document.createElement('button');
        this.deleteButton.id = 'delete-selected-btn';
        this.deleteButton.className = 'delete-button';
        this.deleteButton.disabled = true;
        this.deleteButton.textContent = 'Delete Selected Rows (';
        this.selectedCountSpan = document.createElement('span');
        this.selectedCountSpan.id = 'selected-count';
        this.selectedCountSpan.textContent = '0';
        this.deleteButton.appendChild(this.selectedCountSpan);
        this.deleteButton.append(')');
        buttonGroup.appendChild(this.deleteButton);

        controlsSection.appendChild(buttonGroup);

        // Pagination Controls
        this.paginationControls = document.createElement('div');
        this.paginationControls.id = 'pagination-controls';
        this.paginationControls.className = 'pagination-controls';

        // Previous Page Button
        this.prevPageBtn = document.createElement('button');
        this.prevPageBtn.id = 'prev-page-btn';
        this.prevPageBtn.className = 'pagination-button';
        this.prevPageBtn.disabled = true;
        this.prevPageBtn.textContent = 'Previous';
        this.paginationControls.appendChild(this.prevPageBtn);

        // Page Info
        this.pageInfoSpan = document.createElement('span');
        this.pageInfoSpan.id = 'page-info';
        this.pageInfoSpan.className = 'page-info';
        this.pageInfoSpan.textContent = 'Page 1 of 1';
        this.paginationControls.appendChild(this.pageInfoSpan);

        // Next Page Button
        this.nextPageBtn = document.createElement('button');
        this.nextPageBtn.id = 'next-page-btn';
        this.nextPageBtn.className = 'pagination-button';
        this.nextPageBtn.disabled = true;
        this.nextPageBtn.textContent = 'Next';
        this.paginationControls.appendChild(this.nextPageBtn);

        // Items Per Page Select
        this.itemsPerPageSelect = document.createElement('select');
        this.itemsPerPageSelect.id = 'items-per-page-select';
        this.itemsPerPageSelect.className = 'items-per-page-select';
        const options = [
            { value: '5', text: '5 per page' },
            { value: '10', text: '10 per page' },
            { value: '20', text: '20 per page' },
            { value: '50', text: '50 per page' }
        ];
        options.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.text;
            this.itemsPerPageSelect.appendChild(option);
        });
        this.paginationControls.appendChild(this.itemsPerPageSelect);

        controlsSection.appendChild(this.paginationControls);
        this.targetWrapperElement.appendChild(controlsSection);

        // Table Container
        const tableContainer = document.createElement('div');
        tableContainer.id = 'table-container';
        tableContainer.className = 'table-wrapper';
        this.targetWrapperElement.appendChild(tableContainer);

        this.targetElement = tableContainer;

        // Loading Indicator
        this.loadingIndicator = document.createElement('div');
        this.loadingIndicator.id = 'loading-indicator';
        this.loadingIndicator.className = 'loading-indicator hidden';
        this.loadingIndicator.textContent = 'Loading data...';
        this.targetWrapperElement.appendChild(this.loadingIndicator);

        // Error Message
        this.errorMessage = document.createElement('div');
        this.errorMessage.id = 'error-message';
        this.errorMessage.className = 'error-message hidden';
        this.errorMessage.textContent = 'An error occurred while loading data.';
        this.targetWrapperElement.appendChild(this.errorMessage);
    }

    /**
     * Sets the initial full dataset for the table.
     * This method is used when no `customDataHandler` is provided in the config.
     * @param {Array<Object>} initialData - The complete dataset.
     */
    setInitialData(initialData) {
        if (this.config.customDataHandler) {
            console.warn("TableRenderer: 'setInitialData' is ignored because a 'customDataHandler' is provided.");
            return;
        }
        this._fullData = [...initialData]; // Create a shallow copy
        this._fetchAndRenderData(); // Trigger initial fetch and render
    }

    /**
     * Sets up event listeners for pagination controls, delete button, and update button.
     * @private
     */
    _setupEventListeners() {
        if (this.prevPageBtn) {
            this.prevPageBtn.addEventListener('click', () => this.prevPage());
        }
        if (this.nextPageBtn) {
            this.nextPageBtn.addEventListener('click', () => this.nextPage());
        }
        if (this.itemsPerPageSelect) {
            this.itemsPerPageSelect.value = this.itemsPerPage.toString(); // Set initial value
            this.itemsPerPageSelect.addEventListener('change', (e) => {
                this.setItemsPerPage(parseInt(e.target.value));
            });
        }
        if(this.addButton){  
            if (this.config.addRowHandler) {
                this.addButton.addEventListener('click', this.config.addRowHandler);
            }
        }
        if (this.deleteButton) {
            this.deleteButton.addEventListener('click', () => this.deleteSelectedRows());
        }
    }

    /**
     * Updates pagination state (total pages, current page info) and control button states.
     * @private
     */
    _updatePaginationControls() {
        this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);

        // Adjust current page if it's out of bounds after data changes
        if (this.currentPage > this.totalPages && this.totalPages > 0) {
            this.currentPage = this.totalPages;
        } else if (this.totalPages === 0) {
            this.currentPage = 0; // No pages if no data
        } else if (this.currentPage === 0 && this.totalPages > 0) {
            this.currentPage = 1; // If somehow 0, set to 1 if there are pages
        }

        if (this.pageInfoSpan) {
            this.pageInfoSpan.textContent = `Page ${this.currentPage || 0} of ${this.totalPages || 0}`;
        }
        if (this.prevPageBtn) {
            this.prevPageBtn.disabled = this.currentPage <= 1 || this.totalPages === 0;
        }
        if (this.nextPageBtn) {
            this.nextPageBtn.disabled = this.currentPage >= this.totalPages || this.totalPages === 0;
        }
    }

    /**
     * Navigates to a specific page.
     * @param {number} pageNumber - The page number to navigate to.
     */
    goToPage(pageNumber) {
        if (pageNumber > 0 && pageNumber <= this.totalPages) {
            this.currentPage = pageNumber;
            this._fetchAndRenderData();
        } else if (this.totalPages === 0 && pageNumber === 1) {
            // Allow going to page 1 if there's no data yet, but will be loaded
            this.currentPage = 1;
            this._fetchAndRenderData();
        }
    }

    /**
     * Navigates to the next page.
     */
    nextPage() {
        this.goToPage(this.currentPage + 1);
    }

    /**
     * Navigates to the previous page.
     */
    prevPage() {
        this.goToPage(this.currentPage - 1);
    }

    /**
     * Sets the number of items to display per page.
     * @param {number} count - The new number of items per page.
     */
    setItemsPerPage(count) {
        this.itemsPerPage = count;
        this.currentPage = 1; // Reset to first page when items per page changes
        this._fetchAndRenderData();
    }

    /**
     * Toggles the selection state of a row.
     * @param {any} id - The unique ID of the row.
     * @param {boolean} isSelected - True if the row is being selected, false if deselected.
     */
    toggleRowSelection(id, isSelected) {
        if (isSelected) {
            this.selectedRowIds.add(id);
        } else {
            this.selectedRowIds.delete(id);
        }
        this._updateDeleteButtonState();
    }

    /**
     * Toggles selection for all rows on the current page.
     * @param {boolean} isChecked - True to select all, false to deselect all.
     */
    toggleSelectAll(isChecked) {
        this._displayedData.forEach(rowData => {
            const rowId = rowData[this.config.idKeyName]; // Assuming 'id' is the unique key
            if (isChecked) {
                this.selectedRowIds.add(rowId);
            } else {
                this.selectedRowIds.delete(rowId);
            }
            // Update individual checkbox state in the DOM
            const checkbox = this.targetElement.querySelector(`input[type="checkbox"][data-row-id="${rowId}"]`);
            if (checkbox) {
                checkbox.checked = isChecked;
            }
        });
        this._updateDeleteButtonState();
    }

    /**
     * Updates the state of the delete button (enabled/disabled and count).
     * @private
     */
    _updateDeleteButtonState() {
        if (this.deleteButton && this.selectedCountSpan) {
            this.selectedCountSpan.textContent = this.selectedRowIds.size;
            this.deleteButton.disabled = this.selectedRowIds.size === 0;
        }
    }

    /**
     * Deletes a single row from the data and re-renders.
     * @param {any} idToDelete - The ID of the row to delete.
     */
    async deleteSingleRow(idToDelete) {
        this.loadingIndicator.classList.remove('hidden');
        this.errorMessage.classList.add('hidden');

        try {
            if (this.config.deleteSingleRowHandler) {
                await this.config.deleteSingleRowHandler(idToDelete);
            } else {
                this._fullData = this._fullData.filter(row => row.id !== idToDelete);
            }
            this.selectedRowIds.delete(idToDelete); // Ensure it's deselected if it was
            await this._fetchAndRenderData(); // Re-fetch data after deletion
        } catch (error) {
            console.error("Error deleting single row:", error);
            this.errorMessage.textContent = `Error deleting row: ${error.message}`;
            this.errorMessage.classList.remove('hidden');
        } finally {
            this.loadingIndicator.classList.add('hidden');
        }
    }


    /**
     * Deletes all currently selected rows from the data and re-renders.
     */
    async deleteSelectedRows() {
        if (this.selectedRowIds.size === 0) {
            return; // No rows selected
        }

        this.loadingIndicator.classList.remove('hidden');
        this.errorMessage.classList.add('hidden');

        try {
            const idsToDelete = Array.from(this.selectedRowIds);
            if (this.config.deleteSingleRowHandler) {
                await this.config.deleteSingleRowHandler(idsToDelete);
            } else {
                this._fullData = this._fullData.filter(row => !this.selectedRowIds.has(row.id));
            }
            this.selectedRowIds.clear(); // Clear selection after deletion
            await this._fetchAndRenderData(); // Re-fetch data after deletion
        } catch (error) {
            console.error("Error deleting selected rows:", error);
            this.errorMessage.textContent = `Error deleting selected rows: ${error.message}`;
            this.errorMessage.classList.remove('hidden');
        } finally {
            this.loadingIndicator.classList.add('hidden');
        }
    }
    /**
     * Handles the update action for a single row.
     * @param {any} idToUpdate - The ID of the row to update.
     * @param {Object} rowData - The data of the row to update.
     */
    async updateSingleRow(idToUpdate, rowData) {
        this.loadingIndicator.classList.remove('hidden');
        this.errorMessage.classList.add('hidden');

        try {
            if (this.config.updateRowHandler) {
                // In a real application, you'd likely open a modal or form here
                // to get updated data from the user before calling the handler.
                // For this example, we'll just log the intent.
                console.log(`Preparing to update row with ID: ${idToUpdate}`, rowData);
                // Example: Simulate updating the 'age' field for demonstration
                const updatedData = { ...rowData, age: rowData.age + 1 }; // Increment age for demo
                await this.config.updateRowHandler(idToUpdate, updatedData);
            } else {
                // If no custom handler, simulate internal update (e.g., increment age)
               console.info("Update row with ID:", idToUpdate, "with data:", rowData);
            }
            await this._fetchAndRenderData(); // Re-fetch data after update
        } catch (error) {
            console.error("Error updating single row:", error);
            this.errorMessage.textContent = `Error updating row: ${error.message}`;
            this.errorMessage.classList.remove('hidden');
        } finally {
            this.loadingIndicator.classList.add('hidden');
        }
    }

    /**
     * Sorts the data by a given column key and triggers a re-render.
     * @param {string} columnKey - The key of the column to sort by.
     */
    sortData(columnKey) {
        if (this.sortColumn === columnKey) {
            // Toggle sort direction if same column is clicked
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            // New column, default to ascending
            this.sortColumn = columnKey;
            this.sortDirection = 'asc';
        }

        this.currentPage = 1; // Reset to first page after sorting
        this._fetchAndRenderData(); // Re-fetch data with new sort parameters
    }

    /**
     * Fetches data (either via custom handler or internally) and then renders the table.
     * This is the central method for updating the table's content.
     * @private
     */
    async _fetchAndRenderData() {
        this.loadingIndicator.classList.remove('hidden');
        this.errorMessage.classList.add('hidden');

        try {
            if (this.config.customDataHandler) {
                // Use custom handler for data loading
                const { data, totalItems } = await this.config.customDataHandler({
                    page: this.currentPage,
                    itemsPerPage: this.itemsPerPage,
                    sortColumn: this.sortColumn,
                    sortDirection: this.sortDirection
                });
                this._displayedData = data;
                this.totalItems = totalItems;
            } else {
                // Internal data handling (sort and paginate _fullData)
                let dataToSort = [...this._fullData]; // Work on a copy

                if (this.sortColumn && this.sortDirection) {
                    dataToSort.sort((a, b) => {
                        const valA = a[this.sortColumn];
                        const valB = b[this.sortColumn];

                        if (typeof valA === 'string' && typeof valB === 'string') {
                            return this.sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
                        }
                        // For numbers or other comparable types
                        if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
                        if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
                        return 0;
                    });
                }

                const startIndex = (this.currentPage - 1) * this.itemsPerPage;
                const endIndex = startIndex + this.itemsPerPage;
                this._displayedData = dataToSort.slice(startIndex, endIndex);
                this.totalItems = this._fullData.length;
            }

            this._renderTableDOM(); // Render the table with the fetched/processed data
        } catch (error) {
            console.error("Error fetching or rendering data:", error);
            this.errorMessage.textContent = `Error loading data: ${error.message}`;
            this.errorMessage.classList.remove('hidden');
        } finally {
            this.loadingIndicator.classList.add('hidden');
        }
    }

    /**
     * Renders the HTML table structure into the DOM using _displayedData.
     * @private
     */
    _renderTableDOM() {
        if (!this.targetElement) {
            console.error("TableRenderer: Cannot render, target element is not available.");
            return;
        }

        // Clear any existing content in the target element
        this.targetElement.innerHTML = '';

        // Create table element
        const table = document.createElement('table');
        table.className = this.config.styles.table;

        // Create table header
        const thead = document.createElement('thead');
        thead.className = this.config.styles.thead;
        const headerRow = document.createElement('tr');

        // Create table colgroup
        const colgroup = document.createElement('colgroup');

        // Add Select All checkbox header
        const selectAllTh = document.createElement('th');
        selectAllTh.scope = 'col';
        selectAllTh.className = this.config.styles.th;
        const selectAllCheckbox = document.createElement('input');
        selectAllCheckbox.type = 'checkbox';
        selectAllCheckbox.id = 'select-all-checkbox';
        selectAllCheckbox.className = this.config.styles.checkboxInput;
        selectAllCheckbox.checked = this._displayedData.every(row => this.selectedRowIds.has(row.id)) && this._displayedData.length > 0;
        selectAllCheckbox.disabled = this._displayedData.length === 0; // Disable if no data to select
        selectAllCheckbox.addEventListener('change', (e) => this.toggleSelectAll(e.target.checked));
        selectAllTh.appendChild(selectAllCheckbox);

        const colSelect = document.createElement('col');
        colSelect.setAttribute('data-dt-column', 0);
        colgroup.appendChild(colSelect);
        headerRow.appendChild(selectAllTh);

        // Add regular column headers
        this.config.columns.forEach(col => {
            const th = document.createElement('th');
            th.scope = 'col';
            th.className = this.config.styles.th;

            const colElement = document.createElement('col');
            

            if(col.width){
                colElement.style.width = col.width;
            }

            if (col.sortable) {
                th.classList.add('sortable-header');
                th.addEventListener('click', () => this.sortData(col.key));
            }

            const headerContent = document.createElement('div');
            headerContent.className = 'flex items-center';
            headerContent.textContent = col.label;

            // Add sort indicator
            if (this.sortColumn === col.key) {
                const indicator = document.createElement('span');
                indicator.className = 'sort-indicator';
                indicator.innerHTML = this.sortDirection === 'asc' ? '&uarr;' : '&darr;'; // Up or down arrow
                headerContent.appendChild(indicator);
            }

            th.appendChild(headerContent);

            colgroup.appendChild(colElement);
            headerRow.appendChild(th);
        });


        // Add Actions header for single row actions (Update/Delete)
        const colAction = document.createElement('col');
        colAction.setAttribute('data-dt-column', this.config.columns.length);
        colgroup.appendChild(colAction);

        const actionsTh = document.createElement('th');
        actionsTh.scope = 'col';
        actionsTh.className = this.config.styles.th;
        actionsTh.textContent = 'Actions';
        headerRow.appendChild(actionsTh);

        thead.appendChild(headerRow);


        table.appendChild(colgroup);
        table.appendChild(thead);

        // Create table body
        const tbody = document.createElement('tbody');
        tbody.className = this.config.styles.tbody;

        if (this._displayedData.length === 0) {
            const noDataRow = document.createElement('tr');
            const noDataCell = document.createElement('td');
            noDataCell.colSpan = this.config.columns.length + 2; // +1 for checkbox, +1 for actions
            noDataCell.className = `${this.config.styles.td} text-center py-8`;
            noDataCell.textContent = "No data to display.";
            noDataRow.appendChild(noDataCell);
            tbody.appendChild(noDataRow);
        } else {
            this._displayedData.forEach(rowData => {
                const tr = document.createElement('tr');
                tr.className = this.config.styles.tr;

                // Add checkbox for row selection
                const checkboxTd = document.createElement('td');
                checkboxTd.className = this.config.styles.checkboxTd;
                const rowCheckbox = document.createElement('input');
                rowCheckbox.type = 'checkbox';
                rowCheckbox.className = this.config.styles.checkboxInput;
                rowCheckbox.setAttribute('data-row-id', rowData[this.config.idKeyName]); // Store row ID
                rowCheckbox.checked = this.selectedRowIds.has(rowData[this.config.idKeyName]);
                rowCheckbox.addEventListener('change', (e) =>
                    this.toggleRowSelection(rowData[this.config.idKeyName], e.target.checked)
                );
                checkboxTd.appendChild(rowCheckbox);
                tr.appendChild(checkboxTd);

                this.config.columns.forEach(col => {
                    const td = document.createElement('td');
                    td.className = this.config.styles.td;

                    // Get the raw value
                    let value = rowData[col.key];

                    // Apply formatter if provided
                    if (col.formatter && typeof col.formatter === 'function') {
                        value = col.formatter(value, rowData); // Pass raw value and full row for context
                    }

                    td.innerHTML = value !== undefined && value !== null ? value : ''; // Handle undefined/null
                    tr.appendChild(td);
                });

                // Add Actions cell for single row update and delete
                const actionsTd = document.createElement('td');
                actionsTd.className = this.config.styles.actionTd;

                const updateBtn = document.createElement('button');
                updateBtn.textContent = 'Update';
                updateBtn.className = `${this.config.styles.actionButton} ${this.config.styles.updateRowButton}`;
                updateBtn.addEventListener('click', () => this.updateSingleRow(rowData[this.config.idKeyName], rowData));
                actionsTd.appendChild(updateBtn);

                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = 'Delete';
                deleteBtn.className = `${this.config.styles.actionButton} ${this.config.styles.deleteRowButton}`;
                
                deleteBtn.addEventListener('click', () => this.deleteSingleRow(rowData[this.config.idKeyName]));
                actionsTd.appendChild(deleteBtn);
                tr.appendChild(actionsTd);

                tbody.appendChild(tr);
            });
        }

        table.appendChild(tbody);
        this.targetElement.appendChild(table);

        // Update pagination controls and delete button state after rendering
        this._updatePaginationControls();
        this._updateDeleteButtonState();
    }
}

export default TableRenderer;