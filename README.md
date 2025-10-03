# Singapore Bus Arrival App 🚌

A real-time bus arrival tracking application for Singapore, showing live bus timings, crowd levels, and bus types (single/double decker) for any bus stop in Singapore.

## About This App

This application was **created entirely by Dyad AI** using my personal Claude API key. The entire codebase, from the React frontend to the Supabase edge functions, was generated through AI-powered development conversations.

## Tech Stack & Hosting

- **Frontend**: React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Supabase Edge Functions (Deno)
- **Database**: Supabase (PostgreSQL)
- **Hosting**: 
  - Frontend: Vercel
  - Backend: Supabase Edge Functions
- **Data Source**: LTA DataMall API (Singapore's official transport data)

## Features

✅ **Real-time Bus Arrivals**: Live timing data from LTA DataMall  
✅ **Bus Type Information**: Shows single decker, double decker, or bendy bus  
✅ **Crowd Levels**: Displays low, medium, or high occupancy  
✅ **Wheelchair Accessibility**: Shows which buses are wheelchair accessible  
✅ **Location-based Search**: Find nearby bus stops using GPS  
✅ **Favorites System**: Save frequently used bus stops  
✅ **Service Filtering**: Filter by specific bus numbers  
✅ **Auto-refresh**: Automatic updates every 30 seconds  
✅ **Responsive Design**: Works on mobile and desktop  

## How It Works

1. **Search**: Find bus stops by name, code, or location
2. **Select**: Add bus stops to your tracking list
3. **Monitor**: View real-time arrivals with detailed bus information
4. **Filter**: Focus on specific bus services you need

## Data Source

This app uses Singapore's **LTA DataMall API** to provide:
- Real-time bus arrival predictions
- Bus stop locations and information
- Vehicle type and accessibility data
- Crowd level estimates

## Development

This project showcases the power of AI-assisted development:
- **100% AI Generated**: All code written by Dyad AI
- **Rapid Development**: Full-featured app created in hours, not days
- **Best Practices**: Clean, maintainable code following React/TypeScript standards
- **Modern Stack**: Uses latest web technologies and patterns

## Setup (For Developers)

If you want to run this locally:

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up Supabase project and add your LTA API key to Edge Functions secrets
4. Deploy the edge functions to Supabase
5. Update the Supabase client configuration
6. Run locally: `npm run dev`

## API Requirements

To use this app, you need:
- **LTA DataMall API Key**: Free registration at [LTA DataMall](https://datamall.lta.gov.sg/)
- **Supabase Project**: For hosting the edge functions and database

## Credits

- **Created by**: Dyad AI (AI-powered development platform)
- **API Provider**: Claude (Anthropic)
- **Data Source**: LTA DataMall (Singapore Land Transport Authority)
- **Hosting**: Supabase + Vercel
- **UI Components**: shadcn/ui

---

*This app demonstrates the capabilities of modern AI-assisted development, where complex, full-featured applications can be created through natural language conversations with AI.*