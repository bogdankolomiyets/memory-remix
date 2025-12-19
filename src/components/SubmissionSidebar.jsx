import React, { useState, useEffect } from 'react';
import { useSubmission } from '../hooks/useSubmission';

const SubmissionSidebar = ({ isOpen, onClose, audioBlob }) => {
   const [formData, setFormData] = useState({
      name: '',
      email: '',
      title: ''
   });
   const { submitMemory, isSubmitting, error, success } = useSubmission();

   const handleChange = (e) => {
      setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
   };

   const handleSubmit = async () => {
      if (!audioBlob) return;

      const result = await submitMemory({
         audioBlob,
         name: formData.name,
         email: formData.email,
         title: formData.title
      });

      if (result) {
         // Optionally close or show success state
         // For now, styling success message inside.
      }
   };

   // Reset form when opened with new blob
   useEffect(() => {
      if (isOpen) {
         // Reset optional?
      }
   }, [isOpen]);

   return (
      <>
         {/* Backdrop */}
         <div
            className={`sidebar-backdrop ${isOpen ? 'open' : ''}`}
            onClick={onClose}
         />

         {/* Sidebar */}
         <div className={`submission-sidebar ${isOpen ? 'open' : ''}`}>

            {/* Header / Collapse */}
            <div className="sidebar-header">
               <button className="collapse-btn" onClick={onClose}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                     <polyline points="13 17 18 12 13 7" />
                     <polyline points="6 17 11 12 6 7" />
                  </svg>
               </button>
            </div>

            {/* Success State */}
            {success ? (
               <div className="sidebar-content success-content">
                  <div className="success-message">
                     <h2>Thank you!</h2>
                     <h2>Your submission is pending approval.</h2>
                     <h2>Please check back in 10 business days.</h2>
                  </div>

                  <div className="faq-section">
                     <h3 className="faq-header">GENERAL QUESTIONS</h3>

                     <div className="faq-item">
                        <h4>Why are you collecting these recordings?</h4>
                        <p>To build a living archive where voices, memories, and sounds can be transformed into new forms of memories. By sharing and honoring the memories of others, we hope that healing can occur.</p>
                     </div>

                     <div className="faq-item">
                        <h4>Do I have to identify myself?</h4>
                        <p>No. Submissions can remain anonymous. If you'd like your name associated with your contribution, you can choose to include it.</p>
                     </div>

                     <div className="faq-item">
                        <h4>Will my recording be edited?</h4>
                        <p>No, it will only be visualized.</p>
                     </div>

                     <div className="faq-item">
                        <h4>How long will my submission live here?</h4>
                        <p>Indefinitely, unless you ask us to remove it. You can email info@memoryremix</p>
                     </div>
                  </div>
               </div>
            ) : (
               /* Form Content */
               <div className="sidebar-content">

                  {/* 1. Name */}
                  <div className="form-group">
                     <label>Name</label>
                     <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Your Name"
                     />
                  </div>

                  {/* 2. Email */}
                  <div className="form-group">
                     <label>Email</label>
                     <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="you@email.com"
                     />
                  </div>

                  {/* 3. Memory Name */}
                  <div className="form-group">
                     <label>Your Memory's Name</label>
                     <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="My Summer Memory"
                     />
                  </div>

                  {/* 4. Drop Zone (Visual Only as per mix logic) */}
                  <div className="file-drop-zone">
                     <h3>Drop Your File Here</h3>
                     <p>.MP3 OR .WAV ONLY</p>
                     <p className="file-status">
                        {audioBlob ? "Mixed Audio Ready" : "No Audio Generated"}
                     </p>
                  </div>

                  {/* 5. Submit Button */}
                  <button
                     className="transform-btn"
                     onClick={handleSubmit}
                     disabled={isSubmitting || !audioBlob}
                  >
                     {isSubmitting ? 'Transforming...' : 'Transform a Memory'}
                  </button>

                  {/* 6. Legal Text */}
                  <ul className="legal-text">
                     <li>Only share recordings you created or have permission to use.</li>
                     <li>Submissions can include your voice, stories, or sounds that carry personal meaning related to loss.</li>
                     <li>Do not share copyrighted music, recordings of others without their consent, or anything offensive or illegal.</li>
                     <li>Submissions become part of a public artwork and archive. By submitting, you agree that we can analyze, visualize, and share your contribution.</li>
                     <li>If you later change your mind, email us at info@memoryremix.com</li>
                  </ul>

                  {error && <p className="error-msg">{error}</p>}
               </div>
            )}
         </div>
      </>
   );
};

export default SubmissionSidebar;
