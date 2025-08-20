import graphviz
import os

def create_envo_methodology_flowchart():
    """Create the ENVO methodology flowchart using Graphviz"""
    
    # Create a new directed graph
    dot = graphviz.Digraph('ENVO_Methodology', comment='ENVO Platform Methodology Flowchart')
    dot.attr(rankdir='LR')  # Left to right layout
    dot.attr('node', shape='box', style='filled', fontname='Arial', fontsize='12')
    
    # Set graph attributes
    dot.attr(bgcolor='#1a1a1a')  # Dark background
    dot.attr(fontcolor='white')
    dot.attr(fontname='Arial')
    dot.attr(fontsize='14')
    
    # Create subgraphs for better organization
    with dot.subgraph(name='cluster_infrastructure') as infra:
        infra.attr(label='Infrastructure', style='filled', color='lightgray', fontcolor='black')
        infra.attr('node', shape='box', style='filled', fillcolor='#666666', fontcolor='white')
        
        infra.node('frontend', 'Frontend\n(Netlify)')
        infra.node('backend', 'Backend\n(Render)')
    
    with dot.subgraph(name='cluster_categories') as cat:
        cat.attr(label='Categories', style='filled', color='lightblue', fontcolor='black')
        cat.attr('node', shape='box', style='filled', fillcolor='#60a5fa', fontcolor='white')
        
        cat.node('main_features', 'Main Features')
        cat.node('analytics', 'Analytics')
        cat.node('output', 'Output')
    
    # ENVO Chat Agent Flow
    with dot.subgraph(name='cluster_chat_agent') as chat:
        chat.attr(label='ENVO Chat Agent', style='filled', color='lightblue', fontcolor='black')
        chat.attr('node', shape='box', style='filled', fillcolor='#60a5fa', fontcolor='white')
        
        # Add logo nodes (small circles)
        chat.node('doe_logo', 'DOE', shape='circle', style='filled', fillcolor='white', fontcolor='black', width='0.3')
        chat.node('su_logo', 'SU', shape='circle', style='filled', fillcolor='white', fontcolor='black', width='0.3')
        
        chat.node('chat_agent', 'ENVO Chat Agent')
        chat.node('clustering', 'Clustering')
        chat.node('chat_output', '• Academic Recommendations\n• Recruitment predictions')
        
        # Connect logos to main feature
        chat.edge('doe_logo', 'chat_agent')
        chat.edge('su_logo', 'chat_agent')
        
        # Connect main flow
        chat.edge('chat_agent', 'clustering')
        chat.edge('clustering', 'chat_output')
    
    # Career Forecasting Flow
    with dot.subgraph(name='cluster_forecasting') as forecast:
        forecast.attr(label='Career Forecasting', style='filled', color='lightblue', fontcolor='black')
        forecast.attr('node', shape='box', style='filled', fillcolor='#60a5fa', fontcolor='white')
        
        # Add logo nodes
        forecast.node('tm_logo', 'TM', shape='circle', style='filled', fillcolor='white', fontcolor='black', width='0.3')
        forecast.node('bls_logo', 'BLS', shape='circle', style='filled', fillcolor='white', fontcolor='black', width='0.3')
        
        forecast.node('career_forecast', 'Career Forecasting')
        forecast.node('forecasting_analytics', 'Forecasting')
        forecast.node('forecast_output', '• Industry Demand Forecasts\n• Career Growth Trends\n• Salary Projections')
        
        # Connect logos to main feature
        forecast.edge('tm_logo', 'career_forecast')
        forecast.edge('bls_logo', 'career_forecast')
        
        # Connect main flow
        forecast.edge('career_forecast', 'forecasting_analytics')
        forecast.edge('forecasting_analytics', 'forecast_output')
    
    # ENVO Learn Flow
    with dot.subgraph(name='cluster_learn') as learn:
        learn.attr(label='ENVO Learn', style='filled', color='lightblue', fontcolor='black')
        learn.attr('node', shape='box', style='filled', fillcolor='#60a5fa', fontcolor='white')
        
        # Add logo nodes
        learn.node('yt_logo', 'YT', shape='circle', style='filled', fillcolor='white', fontcolor='black', width='0.3')
        learn.node('ra_logo', 'RA', shape='circle', style='filled', fillcolor='white', fontcolor='black', width='0.3')
        
        learn.node('envo_learn', 'ENVO Learn')
        learn.node('youtube_api', 'YouTube API')
        learn.node('learn_output', '• Learning Path\n• Educational Video\nRecommendations')
        
        # Connect logos to main feature
        learn.edge('yt_logo', 'envo_learn')
        learn.edge('ra_logo', 'envo_learn')
        
        # Connect main flow
        learn.edge('envo_learn', 'youtube_api')
        learn.edge('youtube_api', 'learn_output')
    
    # Align categories with their corresponding flows
    dot.edge('main_features', 'chat_agent', style='invis')
    dot.edge('analytics', 'clustering', style='invis')
    dot.edge('output', 'chat_output', style='invis')
    
    dot.edge('main_features', 'career_forecast', style='invis')
    dot.edge('analytics', 'forecasting_analytics', style='invis')
    dot.edge('output', 'forecast_output', style='invis')
    
    dot.edge('main_features', 'envo_learn', style='invis')
    dot.edge('analytics', 'youtube_api', style='invis')
    dot.edge('output', 'learn_output', style='invis')
    
    return dot

def generate_flowchart_images():
    """Generate the flowchart in multiple formats"""
    
    # Create the flowchart
    dot = create_envo_methodology_flowchart()
    
    # Create output directory if it doesn't exist
    output_dir = 'static/images'
    os.makedirs(output_dir, exist_ok=True)
    
    # Generate different formats
    formats = ['png', 'svg', 'pdf']
    
    for fmt in formats:
        try:
            output_path = os.path.join(output_dir, f'envo_methodology_flowchart.{fmt}')
            dot.render(output_path, format=fmt, cleanup=True)
            print(f"Generated {output_path}")
        except Exception as e:
            print(f"Error generating {fmt} format: {e}")
    
    # Also save the DOT source file
    dot_source_path = os.path.join(output_dir, 'envo_methodology_flowchart.dot')
    with open(dot_source_path, 'w') as f:
        f.write(dot.source)
    print(f"Generated DOT source: {dot_source_path}")

if __name__ == "__main__":
    generate_flowchart_images()
