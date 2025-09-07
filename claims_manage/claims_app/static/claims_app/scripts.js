document.addEventListener('alpine:init', () => { //handles all of patient state
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
    Alpine.store('modalStore', {//handle the modal's state, will make it so that filters persist if there are any 
        openModal: false
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
                        //Extract the actual details from the paginated response
                        const details = response.results && response.results.length > 0 ? response.results[0] : null;
                        console.log('Extracted details:', details);
                        //Update the global store with the first result
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

            // Listen for search events from the search component
            document.addEventListener('searchPatient', (e) => {
                this.handleSearch(e.detail.searchTerm);
            });

            // Listen for clear search events
            document.addEventListener('clearSearch', () => {
                this.clearSearch();
            });
        },

        selectPatient(patient) {
            console.log('Selected patient:', patient);
            Alpine.store('patientData').selectPatient(patient);//Update the global store
        },

        async fetchList() {
            if (this.loading || this.allLoaded || this.isSearchMode) return;
            this.loading = true;

            const res = await fetch(`/api/list/?offset=${this.offset}&limit=${this.limit}`);
            const data = await res.json();

            if (data.results.length === 0) {
                this.allLoaded = true;
            } else {
                this.list.push(...data.results);
                this.offset += this.limit;
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
                let res = await fetch(`/api/list/?patient_name=${encodeURIComponent(searchTerm)}`);//exact search
                let data = await res.json();
                if(data.results.length === 0){//even when nothing is found using the exact search, the server DOES return an object, NOT 404, so response.ok isn't needed
                    res = await fetch(`/api/list/?patient_name__icontains=${encodeURIComponent(searchTerm)}`)
                    data = await res.json()
                }
                // Replace the list with search results
                this.list = data.results || [];//keep the results wrapped inside a paginated object to accomodate for exact and inexact search at the same time

                console.log(`Search completed for "${searchTerm}": ${this.list.length} results found`);
            } catch (error) {
                console.error('Search error:', error);
                this.list = [];
            }

            this.loading = false
        },

        clearSearch() {
            this.isSearchMode = false;
            this.searchTerm = '';
            this.list = [];
            this.offset = 0;
            this.allLoaded = false;
            this.fetchList();//Reload the original list
        },

        //Method to check if we should show the infinite scroll loader
        shouldShowLoader() {
            return !this.allLoaded && !this.isSearchMode;
        }
    }
}


document.addEventListener('DOMContentLoaded', function () {
    const input = document.querySelector('.search-animated input');
    const button = document.querySelector('.search-animated button');

    function handleSearch() {
        const searchTerm = input.value.trim();
        if (searchTerm) {
            console.log(`Searching for: "${searchTerm}"`);
            //Dispatch custom event to the list component
            document.dispatchEvent(new CustomEvent('searchPatient', {
                detail: { searchTerm: searchTerm }
            }));
        } else {
            //If search term is empty, clear the search
            document.dispatchEvent(new CustomEvent('clearSearch'));
        }
    }

    //Handle Enter key press
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    //Handle search button click
    button.addEventListener('click', handleSearch);

    //Handle input clearing (when user deletes all text)
    input.addEventListener('input', function(e) {
        if (!e.target.value.trim()) {
            document.dispatchEvent(new CustomEvent('clearSearch'));
        }
    });
});

function modalApp() {
    return {
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
        },
        applyFilters() {
            //Collect filter values and apply them
            //You can implement your filtering logic here
            console.log('Applying filters...');
            this.$store.modalStore.openModal = false;
        }
    }
}