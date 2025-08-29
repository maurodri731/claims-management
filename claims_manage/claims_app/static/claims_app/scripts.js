document.addEventListener('alpine:init', () => {
    Alpine.store('patientData', {
        selectedPatient: null,
        additionalDetails: null,

        selectPatient(patient) {
            console.log('Store: selecting patient', patient);
            this.selectedPatient = patient;
        },

        setAdditionalDetails(details) {
            console.log('Store: additional detials', details)
            this.additionalDetails = details;
            this.loadingDetails = false;
        }
    });
});

document.addEventListener('htmx:afterRequest', (event) => {
    if (event.detail.xhr?.responseURL.includes('/api/details/')) {
        const response = JSON.parse(event.detail.xhr.response);
        Alpine.store('patientData').setAdditionalDetails(response);
        console.log('Additional patient data', response);
    }
});

function listApp() {
    return {
        list: [],
        loading: false,
        offset: 0,
        limit: 100,
        allLoaded: false,
        selectedClaim: null,
        //Does HTMX need to recognize the rows on init()???

        init() {
            this.fetchList();
            
            // Debug HTMX events
            document.addEventListener('htmx:beforeRequest', (e) => {
                console.log('HTMX Request starting:', e.detail);
            });
            
            document.addEventListener('htmx:afterRequest', (e) => {
                console.log('HTMX Request completed:', e.detail);
            });
            
            document.addEventListener('htmx:responseError', (e) => {
                console.error('HTMX Response error:', e.detail);
            });
        },

        selectPatient(patient) {
            console.log('Selected patient:', patient);
            
            // Send basic patient info immediately for instant display
            const basicInfo = {
                id: patient.id,
                patient_name: patient.patient_name,
                billed_amount: patient.billed_amount,
                paid_amount: patient.paid_amount,
                status: patient.status,
                insurer_name: patient.insurer_name,
                discharge_date: patient.discharge_date
            };
            
            this.$dispatch('patient-selected', basicInfo);
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

                this.$nextTick(() => {//so that HTMX recognizes the dynamically created rows
                    htmx.process(this.$el);
                });
            }

            this.loading = false;
        }
    }
}

/*function detailsHandler() {
    return {
        selectedPatient: null,
        additionalDetails: null,
        loadingDetails: false,
        
        init() {
            // Listen for basic patient selection events
            console.log('Details handler initialized');
            this.$el.addEventListener('patient-selected', (event) => {
                console.log('Event received in details handler:', event.detail);
                this.selectedPatient = event.detail;
                this.additionalDetails = null; // Reset additional details
                this.loadingDetails = true; // Show loading state
                console.log('selectedPatient set to:', this.selectedPatient);
            });
            
            // Also listen on document level in case event bubbling is an issue
            document.addEventListener('patient-selected', (event) => {
                console.log('Document level event received:', event.detail);
                this.selectedPatient = event.detail;
                this.additionalDetails = null;
                this.loadingDetails = true;
            });
            
            // Listen for HTMX additional details
            document.addEventListener('htmx:afterRequest', (event) => {
                if (event.detail.xhr?.responseURL.includes('/api/details/')) {
                    try {
                        /*const response = JSON.parse(event.detail.xhr.response);
                        console.log('Received additional details:', response);
                        this.additionalDetails = response;
                        this.loadingDetails = false;
                        const response = JSON.parse(event.detail.xhr.response);
                        Alpine.store('patientData').setAdditionalDetails(response);
                        console.log('Additional patient data', response);
                    } catch (error) {
                        console.error('Error parsing additional details:', error);
                        this.loadingDetails = false;
                    }
                }
            });
            
            document.addEventListener('htmx:responseError', (event) => {
                console.error('HTMX error:', event.detail);
                this.loadingDetails = false;
            });
        }
    }
}*/

//Animations for the search bar
document.addEventListener('DOMContentLoaded' , function () {
    const input = document.querySelector('.search-animated input');
    const button = document.querySelector('.search-animated button');

    function handleSearch() {
        const searchTerm = input.value.trim();
        if (searchTerm) {
            console.log(`Searching for: "${searchTerm}"`);
            // Implement your search logic here
        }
    }

    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    button.addEventListener('click', handleSearch);
});