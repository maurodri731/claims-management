document.addEventListener('alpine:init', () => {
    //Handles all of patient state
    Alpine.store('patientData', {
        selectedPatient: null,
        additionalDetails: null,
        loadingDetails: false,
        
        selectPatient(patient) {
            console.log('Store: selecting patient', patient);
            this.selectedPatient = patient;
            this.additionalDetails = null;
            this.loadingDetails = true;
        },
        
        setAdditionalDetails(details) {
            console.log('Store: setting additional details', details);
            this.additionalDetails = details;
            this.loadingDetails = false;
        },
        
        clearSelection() {
            this.selectedPatient = null;
            this.additionalDetails = null;
            this.loadingDetails = false;
        }
    });

    //modal store with filter persistence
    Alpine.store('modalStore', {
        openModal: false,
        filters: {
            status: '',
            insurer: '',
            dateFrom: '',
            dateTo: '',
            paidMin: '',
            paidMax: '', 
            amountMin: '',
            amountMax: ''
        },
        
        //Check if any filters are active
        hasActiveFilters() {
            return Object.values(this.filters).some(value => value !== '');
        },
        
        //Clear all filters
        clearAllFilters() {
            this.filters = {
                status: '',
                insurer: '',
                dateFrom: '',
                dateTo: '',
                paidMin: '',
                paidMax: '',
                amountMin: '',
                amountMax: ''
            };
        },
        
        //Build query string from active filters
        buildFilterQuery() {
            const params = new URLSearchParams();
            
            if (this.filters.status) params.append('status', this.filters.status);
            if (this.filters.insurer) params.append('insurer_name', this.filters.insurer);
            if (this.filters.dateFrom) params.append('discharge_date__gte', this.filters.dateFrom);
            if (this.filters.dateTo) params.append('discharge_date__lte', this.filters.dateTo);
            if (this.filters.paidMin) params.append('paid_amount__gte', this.filters.paidMin);
            if (this.filters.paidMax) params.append('paid_amount__lte', this.filters.paidMax);
            if (this.filters.amountMin) params.append('billed_amount__gte', this.filters.amountMin);
            if (this.filters.amountMax) params.append('billed_amount__lte', this.filters.amountMax);
            
            return params.toString();
        },
        
        //Load filters from URL parameters (for persistence)
        loadFiltersFromURL() {
            const urlParams = new URLSearchParams(window.location.search);
            
            this.filters.status = urlParams.get('status') || '';
            this.filters.insurer = urlParams.get('insurer_name') || '';
            this.filters.dateFrom = urlParams.get('discharge_date__gte') || '';
            this.filters.dateTo = urlParams.get('discharge_date__lte') || '';
            this.filters.paidMin = urlParams.get('paid_amount__gte') || '';
            this.filters.paidMax = urlParams.get('paid_amount__lte') || '';
            this.filters.amountMin = urlParams.get('billed_amount__gte') || '';
            this.filters.amountMax = urlParams.get('billed_amount__lte') || '';
        },
        
        //Update URL with current filters (for persistence)
        updateURL() {
            const queryString = this.buildFilterQuery();
            const newURL = queryString ? 
                `${window.location.pathname}?${queryString}` : 
                window.location.pathname;
            
            window.history.replaceState({}, '', newURL);
        }
    });
});

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

//Search functionality remains the same
document.addEventListener('DOMContentLoaded', function () {
    const input = document.querySelector('.search-animated input');
    const button = document.querySelector('.search-animated button');

    function handleSearch() {
        const searchTerm = input.value.trim();
        if (searchTerm) {
            console.log(`Searching for: "${searchTerm}"`);
            document.dispatchEvent(new CustomEvent('searchPatient', {
                detail: { searchTerm: searchTerm }
            }));
        } else {
            document.dispatchEvent(new CustomEvent('clearSearch'));
        }
    }

    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    button.addEventListener('click', handleSearch);

    input.addEventListener('input', function(e) {
        if (!e.target.value.trim()) {
            document.dispatchEvent(new CustomEvent('clearSearch'));
        }
    });
});

//Enhanced modal functionality
function modalApp() {
    return {
        init() {
            //Initialize form values with stored filters
            this.loadFormValues();
        },

        loadFormValues() {
            //Load current filter values into form fields
            this.$nextTick(() => {
                const modal = this.$el;
                const filters = this.$store.modalStore.filters;
                
                //Set select values
                const statusSelect = modal.querySelector('select[name="status"]') || 
                                   modal.querySelectorAll('select')[0];
                const insurerSelect = modal.querySelector('select[name="insurer"]') || 
                                    modal.querySelectorAll('select')[1];
                
                if (statusSelect) statusSelect.value = filters.status;
                if (insurerSelect) insurerSelect.value = filters.insurer;
                
                //Set date inputs
                const dateInputs = modal.querySelectorAll('input[type="date"]');
                if (dateInputs[0]) dateInputs[0].value = filters.dateFrom;
                if (dateInputs[1]) dateInputs[1].value = filters.dateTo;
                
                //Set paid inputs
                const paidInputs = modal.querySelectorAll('input[name="paid"]');
                if (paidInputs[0]) paidInputs[0].value = filters.paidMin;
                if (paidInputs[1]) paidInputs[1].value = filters.paidMax;
                
                //Set billed inputs
                const amountInputs = modal.querySelectorAll('input[name="billed"]');
                if (amountInputs[0]) amountInputs[0].value = filters.amountMin;
                if (amountInputs[1]) amountInputs[1].value = filters.amountMax;
            });
        },

        clearFilters() {
            //Clear all form inputs in the modal
            const modal = this.$el.closest('.modal-overlay');
            const inputs = modal.querySelectorAll('input, select');
            inputs.forEach(input => {
                if (input.type === 'checkbox' || input.type === 'radio') {
                    input.checked = false;
                } else {
                    input.value = '';
                }
            });
            
            //Also clear the store
            this.$store.modalStore.clearAllFilters();
        },

        applyFilters() {
            //Collect filter values from form
            const modal = this.$el.closest('.modal-overlay');
            
            //Get select values
            const selects = modal.querySelectorAll('select');
            this.$store.modalStore.filters.status = selects[0]?.value || '';
            this.$store.modalStore.filters.insurer = selects[1]?.value || '';
            
            //Get date values
            const dateInputs = modal.querySelectorAll('input[type="date"]');
            this.$store.modalStore.filters.dateFrom = dateInputs[0]?.value || '';
            this.$store.modalStore.filters.dateTo = dateInputs[1]?.value || '';

            const paidInputs = modal.querySelectorAll('input[name="paid"]');
            this.$store.modalStore.filters.paidMin = paidInputs[0]?.value || '';
            this.$store.modalStore.filters.paidMax = paidInputs[1]?.value || '';
            
            //Get amount values
            const amountInputs = modal.querySelectorAll('input[name="billed"]');
            this.$store.modalStore.filters.amountMin = amountInputs[0]?.value || '';
            this.$store.modalStore.filters.amountMax = amountInputs[1]?.value || '';
            
            console.log('Collected filters:', this.$store.modalStore.filters);
            
            //Close modal
            this.$store.modalStore.openModal = false;
            
            //Dispatch event to apply filters
            document.dispatchEvent(new CustomEvent('filtersApplied'));
        }
    }
}