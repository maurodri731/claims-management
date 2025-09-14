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

// Add this formatTimestamp function globally (put this before your notesApp function)
function formatTimestamp(timestamp) {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function notesApp() {
    return {
        noteText: '',
        charCount: 0,
        
        // Initialize noteText from store when component loads
        init() {
            // Set initial note text from store if it exists
            if (this.$store.patientData.additionalDetails?.note) {
                this.noteText = this.$store.patientData.additionalDetails.note;
                this.updateCharCount();
            }
        },
        
        get isFlagged() {
            return this.$store.patientData.selectedPatient?.flag || false;
        },

        get hasExistingNote() {
            return this.$store.patientData.additionalDetails?.note && this.$store.patientData.additionalDetails.note.trim().length > 0;
        },

        getCsrfToken(){
            return document.querySelector('meta[name="csrf-token"]').content;
        },

        async toggleFlag() {
            if (!this.$store.patientData.selectedPatient) return;
            
            const currentFlag = this.$store.patientData.selectedPatient.flag;
            const newFlag = !currentFlag;
            const claimId = this.$store.patientData.selectedPatient.id;
            
            // Optimistically update UI
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
                
                // Sync with server response if needed
                if (data.flag !== undefined) {
                    this.$store.patientData.selectedPatient.flag = data.flag;
                }
                
                // Refresh additional details to get updated flag_stamp
                await this.refreshAdditionalDetails();
                
            } catch (error) {
                console.error('Error updating flag:', error);
                // Revert UI change on error
                this.$store.patientData.selectedPatient.flag = currentFlag;
                alert('Failed to update flag. Please try again.');
            }
        },
        
        updateCharCount() {
            this.charCount = this.noteText.length;
        },
        
        async submitNote() {
            if (!this.$store.patientData.selectedPatient) {
                alert('No claim selected');
                return;
            }
            
            const noteText = this.noteText.trim();
            const claimId = this.$store.patientData.additionalDetails?.id;
            
            if (!claimId) {
                alert('No claim ID available');
                return;
            }
            
            try {
                const response = await fetch(`/api/details/${claimId}/`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': this.getCsrfToken(),
                    },
                    body: JSON.stringify({
                        note: noteText // Empty string if cleared, actual note if provided
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                console.log('Note submitted successfully:', data);
                
                // Update additionalDetails directly from server response
                this.$store.patientData.additionalDetails = {
                    ...this.$store.patientData.additionalDetails,
                    note: data.note || '',
                    note_stamp: data.note_stamp || null,
                    // Preserve any other fields that might not be in the response
                    flag_stamp: data.flag_stamp || this.$store.patientData.additionalDetails.flag_stamp
                };
                
                // Update local noteText to match server state
                this.noteText = data.note || '';
                this.updateCharCount();
                
                console.log('Note submitted:', noteText || 'Note cleared');
                
            } catch (error) {
                console.error('Error submitting note:', error);
                alert('Failed to submit note. Please try again.');
            }
        },

        async deleteNote() {
            if (!this.$store.patientData.selectedPatient) {
                alert('No claim selected');
                return;
            }
            
            const claimId = this.$store.patientData.additionalDetails?.id;
            
            if (!claimId) {
                alert('No claim ID available');
                return;
            }
            
            try {
                const response = await fetch(`/api/details/${claimId}/`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': this.getCsrfToken(),
                    },
                    body: JSON.stringify({
                        note: '' // Empty string to delete the note
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                console.log('Note deleted successfully:', data);
                
                // Update additionalDetails directly from server response
                this.$store.patientData.additionalDetails = {
                    ...this.$store.patientData.additionalDetails,
                    note: data.note || '',
                    note_stamp: data.note_stamp || null,
                    // Preserve any other fields that might not be in the response
                    flag_stamp: data.flag_stamp || this.$store.patientData.additionalDetails.flag_stamp
                };
                
                // Clear the local noteText to match server state
                this.noteText = data.note || '';
                this.updateCharCount();
                
                console.log('Note deleted');
                
            } catch (error) {
                console.error('Error deleting note:', error);
                alert('Failed to delete note. Please try again.');
            }
        },
        
        // Helper method to refresh additional details and get updated timestamps
        async refreshAdditionalDetails() {
            if (!this.$store.patientData.selectedPatient?.id) return;
            
            const claimId = this.$store.patientData.additionalDetails.id;
            
            try {
                // You'll need to create this endpoint or modify existing one
                console.log(claimId);
                const response = await fetch(`/api/details/${claimId}/`);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                console.log(data)
                // Update additional details with fresh data including timestamps
                this.$store.patientData.additionalDetails = {
                    ...this.$store.patientData.additionalDetails,
                    ...data,
                    flag_stamp: data.flag_stamp || null,
                    note: data.note || '',
                    note_stamp: data.note_stamp || null
                };
                
                // Update noteText to match server state
                this.noteText = data.note || '';
                this.updateCharCount();
                
            } catch (error) {
                console.error('Error refreshing additional details:', error);
                // Don't show alert for this as it's a background refresh
            }
        },
        
        // Method to clear the note
        async clearNote() {
            this.noteText = '';
            this.updateCharCount();
            await this.submitNote(); // This will submit empty note, server will set note_stamp to null
        }
    }
}