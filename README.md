# Doubt Video Resolver: Personalized Educational Video Platform (Prototype)

## Core Concept
A web application that creates personalized explanation videos for students based on their specific doubts and learning patterns. The system generates videos with teacher avatars explaining concepts through AI-generated responses.

## Implemented Features
- Doubt submission interface with student context options
- AI-powered answer generation using Google's Gemini model
- Text-to-speech conversion with ElevenLabs API
- Video lip-syncing using Wav2Lip technology
- Video and audio delivery system

## Technical Components

1. **Frontend**
   - React-based doubt submission form with student context fields
   - Video/audio player for viewing responses
   - Grade level, subject, learning style customization

2. **Backend**
   - Express.js server for API endpoints
   - Video generation pipeline using Wav2Lip
   - File storage system for generated content

3. **AI Components**
   - Gemini API for natural language understanding and response generation
   - ElevenLabs API for voice synthesis
   - Wav2Lip for realistic lip synchronization

## Implementation Status

### Setup Phase
- [x] Create project structure (frontend/backend directories)
- [x] Set up version control
- [x] Select tech stack (Node.js/Express, React, Gemini, ElevenLabs, Wav2Lip)
- [x] Configure development environment

### Backend Development
- [ ] Design simplified database schema for doubts
- [x] Create API endpoint for doubt submission
- [x] Set up video generation service (Wav2Lip integration)
- [x] Implement content storage and delivery

### AI Components
- [x] Integrate NLP for doubt understanding via Gemini
- [x] Create explanation script generator with Gemini
- [ ] Set up predefined teacher avatar options
- [x] Implement voice synthesis with ElevenLabs

### Frontend Development
- [x] Create functional UI with React
- [x] Build doubt submission form with student context
- [x] Develop video player for responses
- [ ] Implement feedback button

### Integration
- [x] Connect frontend to backend API
- [x] Integrate AI pipeline with video generation
- [x] Set up Wav2Lip configuration

### Testing & Deployment
- [ ] Test core functionality
- [ ] Deploy prototype to hosting platform
- [ ] Gather initial feedback 

## How It Works
1. Students submit their doubts along with context (grade level, subject, etc.)
2. The backend processes the request and sends it to Gemini AI
3. Gemini generates a personalized explanation based on the doubt and context
4. ElevenLabs converts the text response to natural-sounding speech
5. Wav2Lip synchronizes the audio with a teacher video, creating a talking-head effect
6. The final video and audio are served back to the student 