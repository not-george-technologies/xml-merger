# XML Merger Tool - Project Specification

## Overview
The XML Merger Tool is a web-based application designed to merge multiple XML files based on common identifiers (`g:id`). It provides a modern, user-friendly interface for combining XML data from various sources while preserving the complete structure and content from all input files.

## Purpose
This tool solves the problem of merging XML feeds where items with the same identifier (`g:id`) need to be combined into single entries containing all data from multiple sources. It's particularly useful for e-commerce feeds, product catalogs, and data aggregation scenarios.

## Core Features

### 1. Dual Input Methods
- **URL Input**: Fetch XML files directly from web URLs
- **File Upload**: Upload local XML files from the user's device
- **Mixed Sources**: Combine both URL and file inputs in a single merge operation
- **Dynamic Input Management**: Add/remove input sources as needed (minimum 2 required)

### 2. XML Merging Logic
- **ID-Based Grouping**: Groups items by `g:id` elements across all source files
- **Complete Structure Preservation**: Maintains all XML elements, attributes, and nested content
- **Multi-Element Support**: Preserves multiple elements with the same tag name (e.g., multiple `<video>` tags)
- **Namespace Handling**: Properly handles XML namespaces (e.g., `xmlns:g="http://base.google.com/ns/1.0"`)

### 3. Output Features
- **Formatted XML**: Properly indented, human-readable XML output
- **Custom Filename**: User-configurable output filename
- **Instant Download**: One-click download of merged XML file
- **Preview Display**: Shows truncated preview of the merged XML content

### 4. User Interface
- **Modern Design**: Clean, professional interface with Tailwind CSS
- **Gradient Background**: Pink-to-blue gradient for visual appeal
- **Responsive Layout**: Works on desktop and mobile devices
- **Progress Indicators**: Visual feedback during processing
- **Auto-scroll**: Automatically scrolls to results when merging is complete

### 5. Technical Features
- **Real-time Processing**: Client-side XML parsing and merging
- **CORS Proxy**: Built-in proxy for fetching XML from external URLs
- **Error Handling**: Comprehensive error messages and validation
- **Performance Stats**: Shows file statistics and merge results

## Technical Stack

### Frontend
- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: React functional components with hooks
- **State Management**: React useState and useRef

### Backend
- **API Route**: Next.js API route for CORS proxy functionality
- **Runtime**: Node.js (serverless functions)

### Build Tools
- **Package Manager**: npm
- **Bundler**: Next.js built-in Webpack
- **CSS Processing**: PostCSS with Tailwind

## Architecture

### Component Structure
```
src/app/
├── page.tsx          # Main application component
├── layout.tsx        # Root layout with metadata
├── globals.css       # Global styles
└── api/
    └── proxy/
        └── route.ts  # CORS proxy for external XML fetching
```

### Data Flow
1. User inputs XML sources (URLs/files)
2. Application validates inputs
3. XML data is fetched/read from sources
4. DOM parser processes XML into Document objects
5. Items are extracted and grouped by `g:id`
6. Merged XML document is constructed
7. Output is formatted and made available for download

## File Processing Logic

### Input Validation
- Minimum 2 XML sources required
- URL validation for web sources
- File type validation (.xml, application/xml, text/xml)

### XML Parsing
- Uses browser's native DOMParser
- Extracts `<item>` elements from each source
- Identifies items by `g:id` element content

### Merging Algorithm
1. Create Map with `g:id` as key, array of items as value
2. For each unique `g:id`:
   - Create new merged item
   - Add `g:id` element first
   - Append all other elements from all source items
   - Preserve complete element structure including children

### Output Generation
- Creates valid RSS XML structure
- Adds proper XML declaration
- Formats with consistent indentation
- Maintains namespace declarations

## User Experience Flow

### Step 1: Input Configuration
- User sees two default input rows (URL type)
- Can switch between URL and file upload for each row
- Can add more input rows using "Add Another XML Source"
- Can remove rows (minimum 2 must remain)

### Step 2: Processing
- Click "Merge XML Files" button
- Application validates all inputs
- Shows "Processing..." state during merge
- Displays error alerts if issues occur

### Step 3: Results
- Statistics table shows file information
- Merged XML preview appears
- Auto-scroll to results section
- Download interface with custom filename option

## Configuration Options

### Input Settings
- **Source Type**: Radio buttons for URL vs File Upload
- **Dynamic Sources**: Add/remove input rows as needed
- **File Validation**: Automatic XML file type checking

### Output Settings
- **Filename**: Custom output filename (defaults to "merged-xml")
- **Format**: Automatically formatted XML with proper indentation
- **Download**: Instant browser download as .xml file

## Error Handling

### Input Validation Errors
- Insufficient sources (< 2)
- Invalid URLs
- Unsupported file types
- Network errors for URL fetching

### Processing Errors
- Malformed XML content
- Missing `g:id` elements
- Parsing failures
- Memory limitations for large files

### User Feedback
- Alert dialogs for critical errors
- Console logging for debugging
- Graceful degradation for non-critical issues

## Performance Considerations

### Client-Side Processing
- All XML processing happens in the browser
- No server-side data storage or processing
- Efficient DOM manipulation and memory usage

### File Size Limitations
- Limited by browser memory constraints
- Optimized for typical XML feed sizes
- Streaming not implemented (loads entire files)

## Security Features

### CORS Handling
- Built-in proxy route for external URL fetching
- Prevents direct cross-origin requests from browser
- URL encoding for safe parameter passing

### Data Privacy
- No server-side storage of XML content
- All processing happens client-side
- Files never leave user's browser except for URL fetching

## Browser Compatibility

### Supported Browsers
- Modern Chrome, Firefox, Safari, Edge
- Requires ES6+ support
- DOMParser and XMLSerializer APIs required

### Features Used
- File API for local file reading
- Fetch API for URL requests
- Modern DOM manipulation methods

## Deployment

### Static Hosting
- Can be deployed as static site
- API routes require serverless function support
- Compatible with Vercel, Netlify, etc.

### Environment Requirements
- Node.js for API proxy route
- No database or external dependencies
- Minimal server resources needed

## Future Enhancement Opportunities

### Functionality
- Support for different merge strategies
- Custom namespace handling
- Batch processing for multiple output files
- XML validation and schema checking

### User Experience
- Drag-and-drop file uploads
- Progress bars for large file processing
- Undo/redo functionality
- Save/load merge configurations

### Technical
- Web Workers for background processing
- Streaming support for large files
- Advanced error recovery
- Offline functionality with service workers

## Brand Identity
- **Company**: Not George Technologies
- **Copyright**: © 2024 Not George Technologies
- **Favicon**: Custom SVG with document and merge arrow
- **Color Scheme**: Pink-to-blue gradient with professional gray accents

This specification serves as the complete technical and functional documentation for the XML Merger Tool project.