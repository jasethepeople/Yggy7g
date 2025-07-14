# Crochet Pattern Generator

## Overview

This is a production-ready full-stack web application that generates crochet patterns using AI. Users can create patterns by describing them in text or uploading images, and the system generates detailed crochet instructions with visual representations including 2D, 3D visualization, interactive pattern grids, and comprehensive written instructions. The application features a modern React frontend with Express.js backend, PostgreSQL database, and OpenAI AI services.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (January 2025)

✓ **Database Integration**: Switched from in-memory storage to PostgreSQL with Drizzle ORM
✓ **Production Backend**: Complete API implementation with image upload, pattern generation, and validation
✓ **AI Services**: Full OpenAI integration for image generation, analysis, and instruction creation
✓ **Frontend Components**: Complete UI with pattern canvas, controls, properties panel, and multiple view modes
✓ **Type Safety**: Comprehensive TypeScript integration across frontend and backend
✓ **Error Handling**: Robust error handling and validation throughout the application
✓ **Download & Print Features**: PDF export, pattern chart downloads, and print-optimized views using jsPDF and html2canvas
✓ **Material Customization**: Support for yarn weights, fiber types, and alternative materials (string, rope, thread)
✓ **Interactive Color Viewer**: Real-time color preview and customization with multiple palette options
✓ **Complex Pattern Breakdown**: Automatic component breakdown for large patterns with assembly instructions
✓ **Complete CRUD API**: Full pattern management with create, read, update, delete operations
✓ **Production Testing**: Comprehensive test suite with 100% pass rate covering all functionality
✓ **3-Column Layout**: Enhanced UI layout with integrated color viewer and pattern breakdown components

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent design
- **State Management**: React Query (TanStack Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Radix UI primitives with custom styling via shadcn/ui

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **File Upload**: Multer for handling image uploads
- **Development**: tsx for TypeScript execution and hot reloading

### Database Design
- **Database**: PostgreSQL (configured for Neon serverless)
- **Schema**: Single `patterns` table storing pattern metadata, generated images, pattern data as JSON, and calculated metrics
- **ORM**: Drizzle with schema validation using Zod

## Key Components

### Pattern Generation Service
- **Text-to-Pattern**: Uses OpenAI DALL-E 3 to generate images from text descriptions
- **Image Analysis**: GPT-4 Vision analyzes images to extract crochet-relevant information
- **Pattern Grid Generation**: Custom PatternGenerator class creates stitch-by-stitch patterns
- **Instruction Generation**: AI-powered creation of written crochet instructions

### Frontend Components
- **PatternCanvas**: Main visualization area supporting 2D image view, 3D preview, pattern grid, and written instructions
- **PatternControls**: Input forms for text descriptions and image uploads with material type selection
- **PropertiesPanel**: Pattern metadata display and editing capabilities with export functions
- **PatternGrid**: Interactive grid showing individual stitches with hover tooltips
- **ColorViewer**: Interactive color picker with real-time preview and preset palettes
- **PatternBreakdown**: Component breakdown viewer for complex patterns with assembly tracking

### Data Models
- **Pattern**: Complete pattern with metadata, images, stitch data, calculated metrics, and material specifications
- **PatternCell**: Individual stitch representation with position, type, and color
- **StitchType**: Enumerated crochet stitch types (sc, dc, hdc, tc, ch, sl, inc, dec)
- **MaterialType**: Support for yarn, thread, string, rope, fabric strips, wire, and plastic materials
- **YarnWeight**: Standard yarn weights from lace (0) to jumbo (7)
- **FiberType**: Various fiber types including natural and synthetic options

## Data Flow

1. **Pattern Creation**: User provides text description or uploads image
2. **AI Processing**: OpenAI generates visual representation and analyzes for crochet characteristics
3. **Pattern Generation**: System creates detailed stitch-by-stitch pattern grid
4. **Metrics Calculation**: Automatic calculation of stitch counts, estimated time, and yarn usage
5. **Storage**: Complete pattern saved to PostgreSQL with JSON pattern data
6. **Visualization**: Multiple view modes render the pattern for user interaction

## External Dependencies

### AI Services
- **OpenAI API**: DALL-E 3 for image generation, GPT-4 for pattern analysis and instruction generation
- **Configuration**: Expects OPENAI_API_KEY environment variable

### Database
- **Neon PostgreSQL**: Serverless PostgreSQL database
- **Configuration**: Requires DATABASE_URL environment variable
- **Connection**: @neondatabase/serverless for optimized serverless connections

### Development Tools
- **Replit Integration**: Special handling for Replit development environment
- **Vite Plugins**: Runtime error overlay and cartographer for enhanced development experience

## Deployment Strategy

### Development
- **Hot Reloading**: Vite dev server with Express middleware integration
- **Type Checking**: Continuous TypeScript checking without emission
- **Database**: Drizzle push for schema synchronization

### Production Build
- **Frontend**: Vite builds optimized React bundle to `dist/public`
- **Backend**: esbuild bundles Express server to `dist/index.js`
- **Assets**: Static file serving from build output
- **Environment**: Production mode disables development tools and optimizes performance

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (required)
- `OPENAI_API_KEY`: OpenAI API access key (required)
- `NODE_ENV`: Environment mode (development/production)
- `REPL_ID`: Replit-specific identifier for development features

The architecture supports both standalone deployment and Replit-hosted development with appropriate environment detection and configuration.