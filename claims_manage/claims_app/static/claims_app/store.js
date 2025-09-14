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
            if(details.nf_details.length > 0){
                details.note = details.nf_details[0].note;
                details.note_stamp = details.nf_details[0].note_stamp;
                details.flag_stamp = details.nf_details[0].flag_stamp;
            }
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