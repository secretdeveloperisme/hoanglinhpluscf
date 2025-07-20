class y {
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
  constructor(e) {
    if (!e.targetWrapperElementId)
      throw new Error("TableRenderer: 'targetWrapperElementId' is required in the configuration.");
    if (!Array.isArray(e.columns) || e.columns.length === 0)
      throw new Error("TableRenderer: 'columns' array with at least one column definition is required.");
    if (this.config = {
      targetElementId: e.targetElementId,
      targetWrapperElementId: e.targetWrapperElementId,
      title: e.title,
      idKeyName: e.idKeyName || "id",
      // Default to 'id' if not provided
      columns: e.columns.map((t) => ({ ...t, sortable: t.sortable !== !1 })),
      // Default sortable to true
      pagination: {
        itemsPerPage: e.pagination?.itemsPerPage || 10
      },
      customDataHandler: e.customDataHandler,
      // Optional custom data loading handler
      deleteSingleRowHandler: e.deleteSingleRowHandler,
      // Optional custom delete handler
      addRowHandler: e.addRowHandler,
      // Optional custom add handler
      updateRowHandler: e.updateRowHandler,
      // Optional custom update handler
      styles: {
        table: e.styles?.table || "custom-table",
        thead: e.styles?.thead || "table-header-group",
        th: e.styles?.th || "table-header-cell",
        tbody: e.styles?.tbody || "table-body-group",
        tr: e.styles?.tr || "table-row",
        td: e.styles?.td || "table-data-cell",
        checkboxTd: e.styles?.checkboxTd || "table-data-cell checkbox-cell",
        checkboxInput: e.styles?.checkboxInput || "checkbox-input",
        actionTd: e.styles?.actionTd || "table-data-cell action-cell",
        actionButton: e.styles?.actionButton || "action-button",
        deleteRowButton: e.styles?.deleteRowButton || "action-button delete-row-button",
        updateRowButton: e.styles?.updateRowButton || "action-button update-row-button",
        ...e.styles
        // Allow overriding default styles
      }
    }, this.targetWrapperElement = document.getElementById(this.config.targetWrapperElementId), this.paginationControls = {}, this.deleteButton = {}, this.selectedCountSpan = {}, this.prevPageBtn = {}, this.nextPageBtn = {}, this.pageInfoSpan = {}, this.itemsPerPageSelect = {}, this.loadingIndicator = {}, this.errorMessage = {}, !this.targetWrapperElement)
      throw console.error(`TableRenderer: Target wrapper element with ID '${this.config.targetWrapperElementId}' not found.`), new Error(`TableRenderer: Target wrapper element with ID '${this.config.targetElementId}' not found.`);
    if (this.renderTableContainer(), !this.targetElement)
      throw console.error(`TableRenderer: Target element with ID '${this.config.targetElementId}' not found.`), new Error(`TableRenderer: Target element with ID '${this.config.targetElementId}' not found.`);
    this._fullData = [], this._displayedData = [], this.currentPage = 1, this.itemsPerPage = this.config.pagination.itemsPerPage, this.totalItems = 0, this.totalPages = 0, this.selectedRowIds = /* @__PURE__ */ new Set(), this.sortColumn = null, this.sortDirection = null, this._setupEventListeners();
  }
  renderTableContainer() {
    this.targetWrapperElement.className = "table-renderer-container", this.targetWrapperElement.innerHTML = "";
    const e = document.createElement("h1");
    e.className = "main-heading", e.textContent = this.config.title || "Table", this.targetWrapperElement.appendChild(e);
    const t = document.createElement("div");
    t.className = "controls-section";
    const a = document.createElement("div");
    a.className = "button-group", this.addButton = document.createElement("button"), this.addButton.id = "add-btn", this.addButton.className = "table-btn add-button", this.addButton.textContent = "Add", a.appendChild(this.addButton), this.deleteButton = document.createElement("button"), this.deleteButton.id = "delete-selected-btn", this.deleteButton.className = "delete-button", this.deleteButton.disabled = !0, this.deleteButton.textContent = "Delete Selected Rows (", this.selectedCountSpan = document.createElement("span"), this.selectedCountSpan.id = "selected-count", this.selectedCountSpan.textContent = "0", this.deleteButton.appendChild(this.selectedCountSpan), this.deleteButton.append(")"), a.appendChild(this.deleteButton), t.appendChild(a), this.paginationControls = document.createElement("div"), this.paginationControls.id = "pagination-controls", this.paginationControls.className = "pagination-controls", this.prevPageBtn = document.createElement("button"), this.prevPageBtn.id = "prev-page-btn", this.prevPageBtn.className = "pagination-button", this.prevPageBtn.disabled = !0, this.prevPageBtn.textContent = "Previous", this.paginationControls.appendChild(this.prevPageBtn), this.pageInfoSpan = document.createElement("span"), this.pageInfoSpan.id = "page-info", this.pageInfoSpan.className = "page-info", this.pageInfoSpan.textContent = "Page 1 of 1", this.paginationControls.appendChild(this.pageInfoSpan), this.nextPageBtn = document.createElement("button"), this.nextPageBtn.id = "next-page-btn", this.nextPageBtn.className = "pagination-button", this.nextPageBtn.disabled = !0, this.nextPageBtn.textContent = "Next", this.paginationControls.appendChild(this.nextPageBtn), this.itemsPerPageSelect = document.createElement("select"), this.itemsPerPageSelect.id = "items-per-page-select", this.itemsPerPageSelect.className = "items-per-page-select", [
      { value: "5", text: "5 per page" },
      { value: "10", text: "10 per page" },
      { value: "20", text: "20 per page" },
      { value: "50", text: "50 per page" }
    ].forEach((i) => {
      const o = document.createElement("option");
      o.value = i.value, o.textContent = i.text, this.itemsPerPageSelect.appendChild(o);
    }), this.paginationControls.appendChild(this.itemsPerPageSelect), t.appendChild(this.paginationControls), this.targetWrapperElement.appendChild(t);
    const r = document.createElement("div");
    r.id = "table-container", r.className = "table-wrapper", this.targetWrapperElement.appendChild(r), this.targetElement = r, this.loadingIndicator = document.createElement("div"), this.loadingIndicator.id = "loading-indicator", this.loadingIndicator.className = "loading-indicator hidden", this.loadingIndicator.textContent = "Loading data...", this.targetWrapperElement.appendChild(this.loadingIndicator), this.errorMessage = document.createElement("div"), this.errorMessage.id = "error-message", this.errorMessage.className = "error-message hidden", this.errorMessage.textContent = "An error occurred while loading data.", this.targetWrapperElement.appendChild(this.errorMessage);
  }
  /**
   * Sets the initial full dataset for the table.
   * This method is used when no `customDataHandler` is provided in the config.
   * @param {Array<Object>} initialData - The complete dataset.
   */
  setInitialData(e) {
    if (this.config.customDataHandler) {
      console.warn("TableRenderer: 'setInitialData' is ignored because a 'customDataHandler' is provided.");
      return;
    }
    this._fullData = [...e], this._fetchAndRenderData();
  }
  /**
   * Sets up event listeners for pagination controls, delete button, and update button.
   * @private
   */
  _setupEventListeners() {
    this.prevPageBtn && this.prevPageBtn.addEventListener("click", () => this.prevPage()), this.nextPageBtn && this.nextPageBtn.addEventListener("click", () => this.nextPage()), this.itemsPerPageSelect && (this.itemsPerPageSelect.value = this.itemsPerPage.toString(), this.itemsPerPageSelect.addEventListener("change", (e) => {
      this.setItemsPerPage(parseInt(e.target.value));
    })), this.addButton && this.config.addRowHandler && this.addButton.addEventListener("click", this.config.addRowHandler), this.deleteButton && this.deleteButton.addEventListener("click", () => this.deleteSelectedRows());
  }
  /**
   * Updates pagination state (total pages, current page info) and control button states.
   * @private
   */
  _updatePaginationControls() {
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage), this.currentPage > this.totalPages && this.totalPages > 0 ? this.currentPage = this.totalPages : this.totalPages === 0 ? this.currentPage = 0 : this.currentPage === 0 && this.totalPages > 0 && (this.currentPage = 1), this.pageInfoSpan && (this.pageInfoSpan.textContent = `Page ${this.currentPage || 0} of ${this.totalPages || 0}`), this.prevPageBtn && (this.prevPageBtn.disabled = this.currentPage <= 1 || this.totalPages === 0), this.nextPageBtn && (this.nextPageBtn.disabled = this.currentPage >= this.totalPages || this.totalPages === 0);
  }
  /**
   * Navigates to a specific page.
   * @param {number} pageNumber - The page number to navigate to.
   */
  goToPage(e) {
    e > 0 && e <= this.totalPages ? (this.currentPage = e, this._fetchAndRenderData()) : this.totalPages === 0 && e === 1 && (this.currentPage = 1, this._fetchAndRenderData());
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
  setItemsPerPage(e) {
    this.itemsPerPage = e, this.currentPage = 1, this._fetchAndRenderData();
  }
  /**
   * Toggles the selection state of a row.
   * @param {any} id - The unique ID of the row.
   * @param {boolean} isSelected - True if the row is being selected, false if deselected.
   */
  toggleRowSelection(e, t) {
    t ? this.selectedRowIds.add(e) : this.selectedRowIds.delete(e), this._updateDeleteButtonState();
  }
  /**
   * Toggles selection for all rows on the current page.
   * @param {boolean} isChecked - True to select all, false to deselect all.
   */
  toggleSelectAll(e) {
    this._displayedData.forEach((t) => {
      const a = t[this.config.idKeyName];
      e ? this.selectedRowIds.add(a) : this.selectedRowIds.delete(a);
      const d = this.targetElement.querySelector(`input[type="checkbox"][data-row-id="${a}"]`);
      d && (d.checked = e);
    }), this._updateDeleteButtonState();
  }
  /**
   * Updates the state of the delete button (enabled/disabled and count).
   * @private
   */
  _updateDeleteButtonState() {
    this.deleteButton && this.selectedCountSpan && (this.selectedCountSpan.textContent = this.selectedRowIds.size, this.deleteButton.disabled = this.selectedRowIds.size === 0);
  }
  /**
   * Deletes a single row from the data and re-renders.
   * @param {any} idToDelete - The ID of the row to delete.
   */
  async deleteSingleRow(e) {
    this.loadingIndicator.classList.remove("hidden"), this.errorMessage.classList.add("hidden");
    try {
      this.config.deleteSingleRowHandler ? await this.config.deleteSingleRowHandler(e) : this._fullData = this._fullData.filter((t) => t.id !== e), this.selectedRowIds.delete(e), await this._fetchAndRenderData();
    } catch (t) {
      console.error("Error deleting single row:", t), this.errorMessage.textContent = `Error deleting row: ${t.message}`, this.errorMessage.classList.remove("hidden");
    } finally {
      this.loadingIndicator.classList.add("hidden");
    }
  }
  /**
   * Deletes all currently selected rows from the data and re-renders.
   */
  async deleteSelectedRows() {
    if (this.selectedRowIds.size !== 0) {
      this.loadingIndicator.classList.remove("hidden"), this.errorMessage.classList.add("hidden");
      try {
        const e = Array.from(this.selectedRowIds);
        this.config.deleteSingleRowHandler ? await this.config.deleteSingleRowHandler(e) : this._fullData = this._fullData.filter((t) => !this.selectedRowIds.has(t.id)), this.selectedRowIds.clear(), await this._fetchAndRenderData();
      } catch (e) {
        console.error("Error deleting selected rows:", e), this.errorMessage.textContent = `Error deleting selected rows: ${e.message}`, this.errorMessage.classList.remove("hidden");
      } finally {
        this.loadingIndicator.classList.add("hidden");
      }
    }
  }
  /**
   * Handles the update action for a single row.
   * @param {any} idToUpdate - The ID of the row to update.
   * @param {Object} rowData - The data of the row to update.
   */
  async updateSingleRow(e, t) {
    this.loadingIndicator.classList.remove("hidden"), this.errorMessage.classList.add("hidden");
    try {
      if (this.config.updateRowHandler) {
        console.log(`Preparing to update row with ID: ${e}`, t);
        const a = { ...t, age: t.age + 1 };
        await this.config.updateRowHandler(e, a);
      } else
        console.info("Update row with ID:", e, "with data:", t);
      await this._fetchAndRenderData();
    } catch (a) {
      console.error("Error updating single row:", a), this.errorMessage.textContent = `Error updating row: ${a.message}`, this.errorMessage.classList.remove("hidden");
    } finally {
      this.loadingIndicator.classList.add("hidden");
    }
  }
  /**
   * Sorts the data by a given column key and triggers a re-render.
   * @param {string} columnKey - The key of the column to sort by.
   */
  sortData(e) {
    this.sortColumn === e ? this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc" : (this.sortColumn = e, this.sortDirection = "asc"), this.currentPage = 1, this._fetchAndRenderData();
  }
  /**
   * Fetches data (either via custom handler or internally) and then renders the table.
   * This is the central method for updating the table's content.
   * @private
   */
  async _fetchAndRenderData() {
    this.loadingIndicator.classList.remove("hidden"), this.errorMessage.classList.add("hidden");
    try {
      if (this.config.customDataHandler) {
        const { data: e, totalItems: t } = await this.config.customDataHandler({
          page: this.currentPage,
          itemsPerPage: this.itemsPerPage,
          sortColumn: this.sortColumn,
          sortDirection: this.sortDirection
        });
        this._displayedData = e, this.totalItems = t;
      } else {
        let e = [...this._fullData];
        this.sortColumn && this.sortDirection && e.sort((d, r) => {
          const i = d[this.sortColumn], o = r[this.sortColumn];
          return typeof i == "string" && typeof o == "string" ? this.sortDirection === "asc" ? i.localeCompare(o) : o.localeCompare(i) : i < o ? this.sortDirection === "asc" ? -1 : 1 : i > o ? this.sortDirection === "asc" ? 1 : -1 : 0;
        });
        const t = (this.currentPage - 1) * this.itemsPerPage, a = t + this.itemsPerPage;
        this._displayedData = e.slice(t, a), this.totalItems = this._fullData.length;
      }
      this._renderTableDOM();
    } catch (e) {
      console.error("Error fetching or rendering data:", e), this.errorMessage.textContent = `Error loading data: ${e.message}`, this.errorMessage.classList.remove("hidden");
    } finally {
      this.loadingIndicator.classList.add("hidden");
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
    this.targetElement.innerHTML = "";
    const e = document.createElement("table");
    e.className = this.config.styles.table;
    const t = document.createElement("thead");
    t.className = this.config.styles.thead;
    const a = document.createElement("tr"), d = document.createElement("colgroup"), r = document.createElement("th");
    r.scope = "col", r.className = this.config.styles.th;
    const i = document.createElement("input");
    i.type = "checkbox", i.id = "select-all-checkbox", i.className = this.config.styles.checkboxInput, i.checked = this._displayedData.every((s) => this.selectedRowIds.has(s.id)) && this._displayedData.length > 0, i.disabled = this._displayedData.length === 0, i.addEventListener("change", (s) => this.toggleSelectAll(s.target.checked)), r.appendChild(i);
    const o = document.createElement("col");
    o.setAttribute("data-dt-column", 0), d.appendChild(o), a.appendChild(r), this.config.columns.forEach((s) => {
      const n = document.createElement("th");
      n.scope = "col", n.className = this.config.styles.th;
      const h = document.createElement("col");
      s.width && (h.style.width = s.width), s.sortable && (n.classList.add("sortable-header"), n.addEventListener("click", () => this.sortData(s.key)));
      const l = document.createElement("div");
      if (l.className = "flex items-center", l.textContent = s.label, this.sortColumn === s.key) {
        const c = document.createElement("span");
        c.className = "sort-indicator", c.innerHTML = this.sortDirection === "asc" ? "&uarr;" : "&darr;", l.appendChild(c);
      }
      n.appendChild(l), d.appendChild(h), a.appendChild(n);
    });
    const E = document.createElement("col");
    E.setAttribute("data-dt-column", this.config.columns.length), d.appendChild(E);
    const m = document.createElement("th");
    m.scope = "col", m.className = this.config.styles.th, m.textContent = "Actions", a.appendChild(m), t.appendChild(a), e.appendChild(d), e.appendChild(t);
    const u = document.createElement("tbody");
    if (u.className = this.config.styles.tbody, this._displayedData.length === 0) {
      const s = document.createElement("tr"), n = document.createElement("td");
      n.colSpan = this.config.columns.length + 2, n.className = `${this.config.styles.td} text-center py-8`, n.textContent = "No data to display.", s.appendChild(n), u.appendChild(s);
    } else
      this._displayedData.forEach((s) => {
        const n = document.createElement("tr");
        n.className = this.config.styles.tr;
        const h = document.createElement("td");
        h.className = this.config.styles.checkboxTd;
        const l = document.createElement("input");
        l.type = "checkbox", l.className = this.config.styles.checkboxInput, l.setAttribute("data-row-id", s[this.config.idKeyName]), l.checked = this.selectedRowIds.has(s[this.config.idKeyName]), l.addEventListener(
          "change",
          (g) => this.toggleRowSelection(s[this.config.idKeyName], g.target.checked)
        ), h.appendChild(l), n.appendChild(h), this.config.columns.forEach((g) => {
          const C = document.createElement("td");
          C.className = this.config.styles.td;
          let p = s[g.key];
          g.formatter && typeof g.formatter == "function" && (p = g.formatter(p, s)), C.innerHTML = p ?? "", n.appendChild(C);
        });
        const c = document.createElement("td");
        c.className = this.config.styles.actionTd;
        const f = document.createElement("button");
        f.textContent = "Update", f.className = `${this.config.styles.actionButton} ${this.config.styles.updateRowButton}`, f.addEventListener("click", () => this.updateSingleRow(s[this.config.idKeyName], s)), c.appendChild(f);
        const P = document.createElement("button");
        P.textContent = "Delete", P.className = `${this.config.styles.actionButton} ${this.config.styles.deleteRowButton}`, P.addEventListener("click", () => this.deleteSingleRow(s[this.config.idKeyName])), c.appendChild(P), n.appendChild(c), u.appendChild(n);
      });
    e.appendChild(u), this.targetElement.appendChild(e), this._updatePaginationControls(), this._updateDeleteButtonState();
  }
}
export {
  y as TableRenderer
};
