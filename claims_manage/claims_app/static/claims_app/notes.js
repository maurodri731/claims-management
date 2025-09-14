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