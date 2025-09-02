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
    Alpine.store('modalStore', {
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
        },

        selectPatient(patient) {
            console.log('Selected patient:', patient);
            Alpine.store('patientData').selectPatient(patient);//Update the global store
        },

        async fetchList() {
            if (this.loading || this.allLoaded) return;
            this.loading = true;

            const res = await fetch(`/api/list/?offset=${this.offset}&limit=${this.limit}`);
            const data = await res.json();

            if (data.results.length === 0) {
                this.allLoaded = true;
            } else {
                this.list.push(...data.results);
                this.offset += this.limit;

                this.$nextTick(() => {
                    htmx.process(this.$el);
                });
            }

            this.loading = false;
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
            // Implement search logic here
        }
    }

    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    button.addEventListener('click', handleSearch);
});

function modalApp() {
    return {
        clearFilters() {
            // Clear all form inputs in the modal
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
            // Collect filter values and apply them
            // You can implement your filtering logic here
            console.log('Applying filters...');
            this.$store.modalStore.openModal = false;
        }
    }
}