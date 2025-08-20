import { useEffect, useRef } from 'react';

// You'll need to install mermaid: npm install mermaid
// import mermaid from 'mermaid';

const MermaidFlowchart = () => {
  const mermaidRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize mermaid when component mounts
    const initMermaid = async () => {
      try {
        // Dynamic import to avoid SSR issues
        const mermaid = await import('mermaid');
        
        mermaid.default.initialize({
          startOnLoad: true,
          theme: 'dark',
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
            curve: 'basis'
          },
          themeVariables: {
            darkMode: true,
            background: '#1a1a1a',
            primaryColor: '#60a5fa',
            primaryTextColor: '#ffffff',
            primaryBorderColor: '#60a5fa',
            lineColor: '#ffffff',
            secondaryColor: '#666666',
            tertiaryColor: '#ffffff'
          }
        });

        // Define the flowchart
        const graphDefinition = `
          graph LR
            subgraph Infrastructure
              Frontend[Frontend<br/>Netlify]
              Backend[Backend<br/>Render]
            end
            
            subgraph Categories
              MainFeatures[Main Features]
              Analytics[Analytics]
              Output[Output]
            end
            
            subgraph "ENVO Chat Agent"
              DOE[DOE]
              SU[SU]
              ChatAgent[ENVO Chat Agent]
              Clustering[Clustering]
              ChatOutput[• Academic Recommendations<br/>• Recruitment predictions]
              
              DOE --> ChatAgent
              SU --> ChatAgent
              ChatAgent --> Clustering
              Clustering --> ChatOutput
            end
            
            subgraph "Career Forecasting"
              TM[TM]
              BLS[BLS]
              CareerForecast[Career Forecasting]
              Forecasting[Forecasting]
              ForecastOutput[• Industry Demand Forecasts<br/>• Career Growth Trends<br/>• Salary Projections]
              
              TM --> CareerForecast
              BLS --> CareerForecast
              CareerForecast --> Forecasting
              Forecasting --> ForecastOutput
            end
            
            subgraph "ENVO Learn"
              YT[YT]
              RA[RA]
              EnvoLearn[ENVO Learn]
              YouTubeAPI[YouTube API]
              LearnOutput[• Learning Path<br/>• Educational Video<br/>Recommendations]
              
              YT --> EnvoLearn
              RA --> EnvoLearn
              EnvoLearn --> YouTubeAPI
              YouTubeAPI --> LearnOutput
            end
            
            %% Align categories with flows (invisible edges)
            MainFeatures -.-> ChatAgent
            Analytics -.-> Clustering
            Output -.-> ChatOutput
            
            MainFeatures -.-> CareerForecast
            Analytics -.-> Forecasting
            Output -.-> ForecastOutput
            
            MainFeatures -.-> EnvoLearn
            Analytics -.-> YouTubeAPI
            Output -.-> LearnOutput
            
            %% Styling
            classDef infrastructure fill:#666666,stroke:#ffffff,stroke-width:2px,color:#ffffff
            classDef category fill:#60a5fa,stroke:#ffffff,stroke-width:2px,color:#ffffff
            classDef feature fill:#60a5fa,stroke:#ffffff,stroke-width:2px,color:#ffffff
            classDef logo fill:#ffffff,stroke:#000000,stroke-width:1px,color:#000000
            classDef output fill:#60a5fa,stroke:#ffffff,stroke-width:2px,color:#ffffff
            
            class Frontend,Backend infrastructure
            class MainFeatures,Analytics,Output category
            class ChatAgent,Clustering,CareerForecast,Forecasting,EnvoLearn,YouTubeAPI feature
            class DOE,SU,TM,BLS,YT,RA logo
            class ChatOutput,ForecastOutput,LearnOutput output
        `;

        if (mermaidRef.current) {
          mermaidRef.current.innerHTML = graphDefinition;
          mermaid.default.init(undefined, mermaidRef.current);
        }
      } catch (error) {
        console.error('Error loading mermaid:', error);
      }
    };

    initMermaid();
  }, []);

  return (
    <div className="bg-dark-800 rounded-lg p-6">
      <h3 className="text-xl font-bold text-white mb-4 text-center">ENVO METHODOLOGY</h3>
      
      <div className="bg-dark-700 rounded-lg p-6">
        <div ref={mermaidRef} className="mermaid">
          {/* Mermaid will render the flowchart here */}
        </div>
      </div>
      
      {/* Fallback if Mermaid fails to load */}
      <div className="text-center mt-4">
        <p className="text-gray-400 text-sm">
          If the flowchart doesn't load, please ensure Mermaid.js is installed:
        </p>
        <code className="text-neon-blue text-xs bg-dark-600 px-2 py-1 rounded">
          npm install mermaid
        </code>
      </div>
    </div>
  );
};

export default MermaidFlowchart;
