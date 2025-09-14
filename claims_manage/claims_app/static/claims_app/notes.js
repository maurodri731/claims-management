function notesApp() {//controls the notes and flags in the details card
    return {
        noteText: '',
        charCount: 0,
        
        //Initialize noteText from store when component loads
        init() {
            //Set initial note text from store if it exists
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

        async toggleFlag() {//controls the flags state. handles it in the client and also makes server calls
            if (!this.$store.patientData.selectedPatient) return;
            
            const currentFlag = this.$store.patientData.selectedPatient.flag;
            const newFlag = !currentFlag;
            const claimId = this.$store.patientData.selectedPatient.id;
            const hasNote = this.hasExistingNote;
            const noteId = this.$store.patientData.additionalDetails.noteId;
            try {
                let response;
                
                if (newFlag) {
                    //Creating flag
                    if (!hasNote) {
                        //POST - creating first item
                        response = await fetch(`/api/notes-flags/`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRFToken': this.getCsrfToken(),
                            },
                            body: JSON.stringify({
                                claim: claimId,//claimId is the foreign key for the table, and so it is needed to make an instance of NotesAndFlags
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
                                flag: true//the server takes care of setting the timestamp for the flag when it receives it
                            })
                        });
                    }
                } else {
                    //Removing flag
                    if (hasNote) {
                        //PATCH - removing flag but keeping note, the note would still exist in this case, so DELETE wouldn't make sense
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
                        //DELETE - removing lone flag, the record is unnecessary if it isn't storing anything
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
                    //POST/PATCH - leverage the updated response body of these methods to update the timestamp of the flag
                    const data = await response.json();
                    console.log('Flag operation successful:', data);
                    
                    //Update selectedPatient flag
                    this.$store.patientData.selectedPatient.flag = data.flag;
                    
                    //Update additionalDetails with all fields from response
                    this.$store.patientData.additionalDetails = {
                        ...this.$store.patientData.additionalDetails,
                        noteId: data.id,
                        note: data.note || '',
                        flag: data.flag || false,
                        note_stamp: data.note_stamp || null,
                        flag_stamp: data.flag_stamp || null
                    };
                    
                    //Update local noteText to match server state
                    this.noteText = data.note || '';
                    this.updateCharCount();
                    
                } else if (response.status === 204) {//the flag would only be deleted if this status is returned, otherwise it would rollback
                    //DELETE - no response body, update optimistically
                    console.log('Flag deleted successfully');
                    
                    //Update selectedPatient flag
                    this.$store.patientData.selectedPatient.flag = false;
                    
                    //Clear flag and flag_stamp from additionalDetails
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
        
        updateCharCount() {//helper function for when a note is initially loaded into the DOM
            this.charCount = this.noteText.length;
        },
        
        async submitNote() {//controls submitting of the note, in client side and server calls, essentially mirrors what toggleFlag does (could definitely be refactored)
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
                    //POST - creating first item
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
                    //PATCH - updating existing or adding to existing flag
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
                
                //Update additionalDetails with all fields from response
                this.$store.patientData.additionalDetails = {
                    ...this.$store.patientData.additionalDetails,
                    noteId: data.id,
                    note: data.note || '',
                    flag: data.flag || false,
                    note_stamp: data.note_stamp || null,
                    flag_stamp: data.flag_stamp || null
                };
                
                //Update selectedPatient flag if it changed
                this.$store.patientData.selectedPatient.flag = data.flag;
                
                //Update local noteText to match server state
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
                    //PATCH - removing note but keeping flag
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
                    //DELETE - removing lone note
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
        
        //Method to clear the note
        async clearNote() {
            this.noteText = '';
            this.updateCharCount();
            await this.submitNote(); //This will submit empty note, server will set note_stamp to null
        }
    }
}