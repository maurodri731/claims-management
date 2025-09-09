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
                
                //Handle additional details response
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
        buildAPIUrl(isSearch = false, searchTerm = '') {
            const baseUrl = '/api/list/';
            const params = new URLSearchParams();
            
            //Add search parameters if in search mode
            if (isSearch && searchTerm) {
                params.append('patient_name__icontains', searchTerm);
            } else if (!isSearch) {
                //Add pagination for normal list view
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

        async fetchList() {
            if (this.loading || this.allLoaded || this.isSearchMode) return;
            this.loading = true;

            try {
                const url = this.buildAPIUrl();
                console.log('Fetching list from:', url);
                
                const res = await fetch(url);
                const data = await res.json();

                if (data.results.length === 0) {
                    this.allLoaded = true;
                } else {
                    this.list.push(...data.results);
                    this.offset += this.limit;
                }
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

            try {
                //Try exact search first
                let url = this.buildAPIUrl(true, searchTerm);
                url = url.replace('patient_name__icontains', 'patient_name'); // Exact search
                
                let res = await fetch(url);
                let data = await res.json();
                
                if (data.results.length === 0) {
                    //Fall back to partial search
                    url = this.buildAPIUrl(true, searchTerm);
                    res = await fetch(url);
                    data = await res.json();
                }
                
                this.list = data.results || [];
                console.log(`Search completed for "${searchTerm}": ${this.list.length} results found`);
            } catch (error) {
                console.error('Search error:', error);
                this.list = [];
            }

            this.loading = false;
        },

        clearSearch() {
            this.isSearchMode = false;
            this.searchTerm = '';
            this.resetList();
        },

        //Apply filters, might also be called when user presses ENTER??
        async applyFilters() {
            console.log('Applying filters:', this.$store.modalStore.filters);
            
            //Update URL for persistence
            this.$store.modalStore.updateURL();
            
            // Reset list and fetch with filters
            this.resetList();
            await this.fetchList();
        },

        //Clear all filters
        async clearFilters() {
            console.log('Clearing all filters');
            
            //Clear filters in store
            this.$store.modalStore.clearAllFilters();
            
            //Update URL
            this.$store.modalStore.updateURL();
            
            //Reset and reload list
            this.resetList();
            await this.fetchList();
        },

        //Reset list state
        resetList() {
            this.list = [];
            this.offset = 0;
            this.allLoaded = false;
            if (!this.isSearchMode) {
                this.loading = false;
            }
        },

        //Method to check if we should show the infinite scroll loader
        shouldShowLoader() {
            return !this.allLoaded && !this.isSearchMode;
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