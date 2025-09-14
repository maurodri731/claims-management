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

        get hasExistingFlag() {
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
            const hasNote = this.hasExistingNote;
            const noteId = this.$store.patientData.additionalDetails.noteId;
            try {
                let response;
                
                if (newFlag) {
                    // Creating flag
                    if (!hasNote) {
                        // POST - creating first item
                        response = await fetch(`/api/notes-flags/`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRFToken': this.getCsrfToken(),
                            },
                            body: JSON.stringify({
                                claim: claimId,
                                flag: true
                            })
                        });
                    } else {
                        // PATCH - adding flag to existing note
                        response = await fetch(`/api/notes-flags/${noteId}/`, {
                            method: 'PATCH',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRFToken': this.getCsrfToken(),
                            },
                            body: JSON.stringify({
                                flag: true
                            })
                        });
                    }
                } else {
                    // Removing flag
                    if (hasNote) {
                        // PATCH - removing flag but keeping note
                        response = await fetch(`/api/notes-flags/${noteId}/`, {
                            method: 'PATCH',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRFToken': this.getCsrfToken(),
                            },
                            body: JSON.stringify({
                                flag: false
                            })
                        });
                    } else {
                        // DELETE - removing lone flag
                        response = await fetch(`/api/notes-flags/${noteId}/`, {
                            method: 'DELETE',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRFToken': this.getCsrfToken(),
                            },
                            body: JSON.stringify({
                            })
                        });
                    }
                }
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                if (response.status === 200 || response.status === 201) {
                    // POST/PATCH - has response body
                    const data = await response.json();
                    console.log('Flag operation successful:', data);
                    
                    // Update selectedPatient flag
                    this.$store.patientData.selectedPatient.flag = data.flag;
                    
                    // Update additionalDetails with all fields from response
                    this.$store.patientData.additionalDetails = {
                        ...this.$store.patientData.additionalDetails,
                        noteId: data.id,
                        note: data.note || '',
                        flag: data.flag || false,
                        note_stamp: data.note_stamp || null,
                        flag_stamp: data.flag_stamp || null
                    };
                    
                    // Update local noteText to match server state
                    this.noteText = data.note || '';
                    this.updateCharCount();
                    
                } else if (response.status === 204) {
                    // DELETE - no response body, update optimistically
                    console.log('Flag deleted successfully');
                    
                    // Update selectedPatient flag
                    this.$store.patientData.selectedPatient.flag = false;
                    
                    // Clear flag and flag_stamp from additionalDetails
                    this.$store.patientData.additionalDetails = {
                        ...this.$store.patientData.additionalDetails,
                        noteId: null,
                        flag: false,
                        flag_stamp: null
                    };
                }
                
            } catch (error) {
                console.error('Error updating flag:', error);
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
            const claimId = this.$store.patientData.selectedPatient.id;
            const hasFlag = this.hasExistingFlag;
            const noteId = this.$store.patientData.additionalDetails?.noteId;
            
            if (noteText.length === 0) {
                alert('Note cannot be empty');
                return;
            }
            
            try {
                let response;
                
                if (!this.hasExistingNote && !hasFlag) {
                    // POST - creating first item
                    response = await fetch(`/api/notes-flags/`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': this.getCsrfToken(),
                        },
                        body: JSON.stringify({
                            claim: claimId,
                            note: noteText
                        })
                    });
                } else {
                    // PATCH - updating existing or adding to existing flag
                    response = await fetch(`/api/notes-flags/${noteId}/`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': this.getCsrfToken(),
                        },
                        body: JSON.stringify({
                            note: noteText
                        })
                    });
                }
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                console.log('Note submitted successfully:', data);
                
                // Update additionalDetails with all fields from response
                this.$store.patientData.additionalDetails = {
                    ...this.$store.patientData.additionalDetails,
                    noteId: data.id,
                    note: data.note || '',
                    flag: data.flag || false,
                    note_stamp: data.note_stamp || null,
                    flag_stamp: data.flag_stamp || null
                };
                
                // Update selectedPatient flag if it changed
                this.$store.patientData.selectedPatient.flag = data.flag;
                
                // Update local noteText to match server state
                this.noteText = data.note || '';
                this.updateCharCount();
                
                console.log('Note submitted:', noteText);
                
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
            
            const claimId = this.$store.patientData.selectedPatient.id;
            const hasFlag = this.hasExistingFlag;
            const noteId = this.$store.patientData.additionalDetails?.noteId;
            
            if (!noteId) {
                alert('Unable to delete note: missing record ID');
                return;
            }
            
            try {
                let response;
                
                if (hasFlag) {
                    // PATCH - removing note but keeping flag
                    response = await fetch(`/api/notes-flags/${noteId}/`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': this.getCsrfToken(),
                        },
                        body: JSON.stringify({
                            note: ''
                        })
                    });
                } else {
                    // DELETE - removing lone note
                    response = await fetch(`/api/notes-flags/${noteId}/`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': this.getCsrfToken(),
                        },
                        body: JSON.stringify({
                        })
                    });
                }
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                if (response.status === 200) {
                    // PATCH - has response body
                    const data = await response.json();
                    console.log('Note deleted successfully:', data);
                    
                    // Update additionalDetails with all fields from response including noteId
                    this.$store.patientData.additionalDetails = {
                        ...this.$store.patientData.additionalDetails,
                        noteId: data.id,
                        note: data.note || '',
                        flag: data.flag || false,
                        note_stamp: data.note_stamp || null,
                        flag_stamp: data.flag_stamp || null
                    };
                    
                    // Update selectedPatient flag if it changed
                    this.$store.patientData.selectedPatient.flag = data.flag;
                    
                    // Update local noteText to match server state
                    this.noteText = data.note || '';
                    this.updateCharCount();
                    
                } else if (response.status === 204) {
                    // DELETE - no response body, wait for OK then update optimistically
                    console.log('Note deleted successfully');
                    
                    // Clear note, note_stamp, and noteId from additionalDetails
                    this.$store.patientData.additionalDetails = {
                        ...this.$store.patientData.additionalDetails,
                        noteId: null,
                        note: '',
                        note_stamp: null
                    };
                    
                    // Clear local noteText
                    this.noteText = '';
                    this.updateCharCount();
                }
                
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