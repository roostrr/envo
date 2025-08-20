#!/usr/bin/env python3
"""Test script to verify enhanced clustering metrics"""

from ml_recruitment_service import recruitment_service

def test_clustering_metrics():
    """Test the enhanced clustering metrics"""
    print("Testing enhanced clustering metrics...")
    print("=" * 50)
    
    # Get model metrics
    metrics = recruitment_service.get_model_metrics()
    
    # Test clustering info
    clustering_info = metrics.get('clustering_info', {})
    print(f"Number of clusters: {clustering_info.get('num_clusters', 'N/A')}")
    print(f"Silhouette score: {clustering_info.get('silhouette_score', 'N/A')}")
    
    print("\nCluster distribution:")
    cluster_distribution = clustering_info.get('cluster_distribution', {})
    for cluster, info in cluster_distribution.items():
        print(f"  {cluster}: {info.get('description', 'N/A')} ({info.get('percentage', 0)}%)")
    
    # Test model performance
    model_performance = metrics.get('model_performance_summary', {})
    print(f"\nModel performance:")
    print(f"  Overall accuracy: {model_performance.get('overall_accuracy', 'N/A')}")
    print(f"  Model stability: {model_performance.get('model_stability', 'N/A')}")
    print(f"  Recommendation confidence: {model_performance.get('recommendation_confidence', 'N/A')}")
    
    # Test individual model accuracies
    all_models = metrics.get('all_models', {})
    print(f"\nIndividual model accuracies:")
    for model_name, model_info in all_models.items():
        print(f"  {model_name}: {model_info.get('accuracy', 'N/A')}")
    
    print("\n✅ Enhanced clustering metrics test completed!")

if __name__ == "__main__":
    test_clustering_metrics()
