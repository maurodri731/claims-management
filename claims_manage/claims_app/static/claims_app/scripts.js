//Enhanced modal functionality
function modalApp() {
    return {
        init() {
            //Initialize form values with stored filters
            this.loadFormValues();
            
            // NEW FIX: Listen for external filter clearing
            document.addEventListener('filtersStoreCleared', () => {
                this.clearFormInputs();
            });
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

        // NEW METHOD: Clear form inputs without affecting store
        clearFormInputs() {
            const modal = this.$el.closest('.modal-overlay');
            if (!modal) return;
            
            const inputs = modal.querySelectorAll('input, select');
            inputs.forEach(input => {
                if (input.type === 'checkbox' || input.type === 'radio') {
                    input.checked = false;
                } else {
                    input.value = '';
                }
            });
            
            console.log('Modal form inputs cleared due to external filter clear');
        },

        clearFilters() {
            //Clear all form inputs in the modal
            this.clearFormInputs();
            
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

window.formatCurrency = function(value) {
    if (!value && value !== 0) return '';
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return '$' + num.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

function notesApp() {
    return {
        noteText: '',
        charCount: 0,
        
        get isFlagged() {
            return this.$store.patientData.selectedPatient?.flag || false;
        },

        getCsrfToken(){
            return document.querySelector('meta[name="csrf-token"]').content;
        },

        async toggleFlag() {
            if (!this.$store.patientData.selectedPatient) return;
            
            const currentFlag = this.$store.patientData.selectedPatient.flag;
            const newFlag = !currentFlag;
            const claimId = this.$store.patientData.selectedPatient.id;
            
            //Optimistically update UI
            this.$store.patientData.selectedPatient.flag = newFlag;
            
            try {
                const response = await fetch(`/api/list/${claimId}/`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': this.getCsrfToken(),
                    },
                    body: JSON.stringify({
                        flag: newFlag
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                console.log('Flag updated successfully:', data);
                
                //Sync with server response if needed
                if (data.flag !== undefined) {
                    this.$store.patientData.selectedPatient.flag = data.flag;
                }
                
            } catch (error) {
                console.error('Error updating flag:', error);
                //Revert UI change on error
                this.$store.patientData.selectedPatient.flag = currentFlag;
                alert('Failed to update flag. Please try again.');
            }
        },
        
        updateCharCount() {
            this.charCount = this.noteText.length;
        },
        
        submitNote() {
            if (this.noteText.trim().length > 0) {
                console.log('Note submitted:', this.noteText);
                alert('Note submitted: ' + this.noteText);
                this.noteText = '';
                this.charCount = 0;
            }
        }
    }
}