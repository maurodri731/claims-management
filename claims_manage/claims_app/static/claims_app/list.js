function listApp() {
    return {
        list: [],
        loading: false,
        offset: 0,
        limit: 100,
        allLoaded: false,
        isSearchMode: false,
        searchTerm: '',

        init() {
            //Load filters from URL on page load
            this.$store.modalStore.loadFiltersFromURL();
            
            this.fetchList();
            
            //Debug HTMX events
            document.addEventListener('htmx:beforeRequest', (e) => {
                console.log('HTMX Request starting:', e.detail);
            });
            
            document.addEventListener('htmx:afterRequest', (e) => {
                console.log('HTMX Request completed:', e.detail);
                
                //Handle additional details response, catches the hx-get in the table rows
                if (e.detail.xhr && e.detail.xhr.responseURL.includes('/api/details/')) {
                    try {
                        const response = JSON.parse(e.detail.xhr.response);
                        console.log('Additional details response:', response);
                        const details = response.results && response.results.length > 0 ? response.results[0] : null;
                        console.log('Extracted details:', details);
                        Alpine.store('patientData').setAdditionalDetails(details);
                        console.log('Store after update:', Alpine.store('patientData'));
                    } catch (error) {
                        console.error('Error parsing additional details:', error);
                        Alpine.store('patientData').loadingDetails = false;
                    }
                }
            });
            
            document.addEventListener('htmx:responseError', (e) => {
                console.error('HTMX Response error:', e.detail);
                Alpine.store('patientData').loadingDetails = false;
            });

            //Listen for search events from the search component
            document.addEventListener('searchPatient', (e) => {
                this.handleSearch(e.detail.searchTerm);
            });

            //Listen for clear search events
            document.addEventListener('clearSearch', () => {
                this.clearSearch();
            });

            //Listen for filter apply events
            document.addEventListener('filtersApplied', () => {
                this.applyFilters();
            });

            //Listen for filter clear events
            document.addEventListener('filtersCleared', () => {
                this.clearFilters();
            });
        },

        selectPatient(patient) {
            console.log('Selected patient:', patient);
            Alpine.store('patientData').selectPatient(patient);
        },

        //Build the API URL with current filters and pagination
        buildAPIUrl(isSearch = false, searchTerm = '', includePagination = true) {
            const baseUrl = '/api/list/';
            const params = new URLSearchParams();
            
            //Add search parameters if in search mode
            if (isSearch && searchTerm) {
                params.append('patient_name__icontains', searchTerm);
            }
            
            //Add pagination parameters when needed
            if (includePagination) {
                params.append('offset', this.offset);
                params.append('limit', this.limit);
            }
            
            //Add active filters
            const filterQuery = this.$store.modalStore.buildFilterQuery();
            if (filterQuery) {
                //Merge filter params with existing params
                const filterParams = new URLSearchParams(filterQuery);
                for (const [key, value] of filterParams) {
                    params.append(key, value);
                }
            }
            
            const queryString = params.toString();
            return queryString ? `${baseUrl}?${queryString}` : baseUrl;
        },

        async fetchList() {//all of the searches, whether with filters or without, pass through here
            if (this.loading || this.allLoaded) return;
            this.loading = true;

            try {
                const url = this.isSearchMode ? 
                    this.buildAPIUrl(true, this.searchTerm, true) : 
                    this.buildAPIUrl(false, '', true);
                console.log('Fetching list from:', url);
                
                const res = await fetch(url);
                const data = await res.json();

                if (data.results.length === 0 || data.results.length < this.limit) {
                    this.allLoaded = true;
                }
                
                if (data.results.length > 0) {
                    this.list.push(...data.results);
                    this.offset += data.results.length;//Use actual returned count instead of limit
                }
                
                console.log(`Loaded ${data.results.length} items, total: ${this.list.length}, allLoaded: ${this.allLoaded}`);
            } catch (error) {
                console.error('Error fetching list:', error);
            }
            
            this.loading = false;
        },

        async handleSearch(searchTerm) {
            if (!searchTerm.trim()) {
                this.clearSearch();
                return;
            }

            this.loading = true;
            this.isSearchMode = true;
            this.searchTerm = searchTerm;
            
            // Reset pagination for new search
            this.resetList();

            try {//it is possible to do partial searches, like for "Virginia" instead of "Virginia Rhodes"
                //Try exact search first
                let url = this.buildAPIUrl(true, searchTerm, false); // Don't include pagination for initial exact search
                url = url.replace('patient_name__icontains', 'patient_name'); //Exact search
                
                let res = await fetch(url);
                let data = await res.json();
                
                if (data.results.length === 0) {
                    //Fall back to partial search with pagination
                    url = this.buildAPIUrl(true, searchTerm, true);
                    res = await fetch(url);
                    data = await res.json();
                }
                
                this.list = data.results || [];
                
                // Update pagination state based on results
                if (data.results.length > 0) {
                    this.offset += data.results.length;
                    if (data.results.length < this.limit) {
                        this.allLoaded = true;
                    }
                } else {
                    this.allLoaded = true;
                }
                
                console.log(`Search completed for "${searchTerm}": ${this.list.length} results found`);
            } catch (error) {
                console.error('Search error:', error);
                this.list = [];
            }

            this.loading = false;
        },

        clearSearch() {
            console.log('Clearing search, isSearchMode was:', this.isSearchMode);
            this.isSearchMode = false;
            this.searchTerm = '';
            
            // Clear the search input field
            const searchInput = document.querySelector('.search-animated input');
            if (searchInput) {
                searchInput.value = '';
            }
            
            this.resetList();
            
            // FIX 2: Always reload data after clearing search
            this.$nextTick(() => {
                this.fetchList();
            });
        },

        //Apply filters, might also be called when user presses ENTER??
        async applyFilters() {
            console.log('Applying filters:', this.$store.modalStore.filters);
            console.log('Current search state - isSearchMode:', this.isSearchMode, 'searchTerm:', this.searchTerm);
            
            //Update URL for persistence
            this.$store.modalStore.updateURL();
            
            if (this.isSearchMode && this.searchTerm) {
                console.log('Applying filters while preserving search for:', this.searchTerm);
                //Keep search mode active and re-run search with new filters
                await this.handleSearch(this.searchTerm);
            } else {
                //Normal case: reset and fetch with just filters
                this.resetList();
                await this.fetchList();
            }
        },

        //Clear all filters
        async clearFilters() {
            console.log('Clearing all filters, isSearchMode:', this.isSearchMode);
            
            //Clear filters in store
            this.$store.modalStore.clearAllFilters();
            
            //Update URL
            this.$store.modalStore.updateURL();
            
            document.dispatchEvent(new CustomEvent('filtersStoreCleared'));
            
            if (this.isSearchMode && this.searchTerm) {
                //If there is an active search, re-run the search without filters
                console.log('Re-running search without filters for:', this.searchTerm);
                await this.handleSearch(this.searchTerm);
            } else {
                //Normal case: reset and reload list
                this.resetList();
                await this.fetchList();
            }
        },

        //Reset list state
        resetList() {//No filters, no search term
            this.list = [];
            this.offset = 0;
            this.allLoaded = false; //Always reset allloaded when resetting list
            if (!this.isSearchMode) {
                this.loading = false;
            }
        },

        //Method to check if we should show the infinite scroll loader
        shouldShowLoader() {
            return !this.allLoaded && !this.loading;
        },

        //Get active filters count for UI display
        getActiveFiltersCount() {
            return Object.values(this.$store.modalStore.filters).filter(value => value !== '').length;
        },

        //Check if filters are active
        hasActiveFilters() {
            return this.$store.modalStore.hasActiveFilters();
        }
    }
}