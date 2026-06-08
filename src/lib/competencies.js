export const COMPETENCY_GRAPHS = {
  'AI/ML Engineer': {
    'Mathematics': {
      'Beginner': ['Matrix Operations', 'Eigenvalues & Eigenvectors', 'Vector Spaces'],
      'Intermediate': ['Multivariate Gradients', 'Jacobian & Hessian Matrices', 'Probability Distributions'],
      'Advanced': ['Convex Optimization', 'Lagrange Multipliers', 'Stochastic Gradient Descent Math']
    },
    'Statistics': {
      'Beginner': ['Mean, Median, Mode', 'Standard Deviation & Variance', 'Central Limit Theorem'],
      'Intermediate': ['Hypothesis Testing & P-values', 'Maximum Likelihood Estimation', 'A/B Testing math'],
      'Advanced': ['Bayesian Inference', 'Markov Chains', 'Stochastic Processes']
    },
    'Machine Learning': {
      'Beginner': ['Linear Regression', 'Logistic Regression', 'Decision Trees', 'KNN'],
      'Intermediate': ['Random Forests', 'Gradient Boosting (XGBoost)', 'Support Vector Machines (SVM)'],
      'Advanced': ['Ensemble Mathematics', 'Dimensionality Reduction (PCA, t-SNE)', 'Bias-Variance Mathematical Derivation']
    },
    'Deep Learning': {
      'Beginner': ['Multi-Layer Perceptrons', 'Activation Functions (ReLU, Sigmoid)', 'Loss Functions'],
      'Intermediate': ['Backpropagation Math', 'Convolutional Neural Networks (CNNs)', 'Recurrent Neural Networks (RNNs & LSTMs)'],
      'Advanced': ['Transformer Architecture', 'Self-Attention Formula', 'Layer Normalization vs Batch Normalization']
    },
    'Computer Vision': {
      'Beginner': ['Image Kernels & Filters', 'Edge Detection', 'Color Space Transformations'],
      'Intermediate': ['Object Detection (YOLO, SSD)', 'Semantic Segmentation (U-Net)', 'ResNet Architecture'],
      'Advanced': ['Generative Adversarial Networks (GANs)', 'Diffusion Models & Latent Spaces', 'Vision Transformers (ViT)']
    },
    'NLP': {
      'Beginner': ['Tokenization', 'Bag-of-Words & TF-IDF', 'Stemming & Lemmatization'],
      'Intermediate': ['Word Embeddings (Word2Vec, GloVe)', 'Sequence-to-Sequence Models', 'Encoder-Decoder Architecture'],
      'Advanced': ['LLM Pre-training & Fine-tuning', 'LoRA & Parameter-Efficient Fine-Tuning', 'RLHF (Reinforcement Learning from Human Feedback)']
    },
    'Model Evaluation': {
      'Beginner': ['Accuracy', 'Precision', 'Recall', 'F1-Score'],
      'Intermediate': ['ROC-AUC Curve', 'Confusion Matrix Interpretation', 'K-Fold Cross-Validation'],
      'Advanced': ['Evaluation under extreme class imbalance', 'Model Drift & Concept Drift', 'Calibration Curves']
    },
    'Deployment & MLOps': {
      'Beginner': ['Model Serialization (Pickle/Joblib)', 'FastAPI Model Serving', 'Requirements Management'],
      'Intermediate': ['Dockerizing ML services', 'Model Quantization & ONNX Export', 'TensorRT Optimization'],
      'Advanced': ['Distributed Training (DDP)', 'GPU Resource Scheduling', 'Kubernetes ML pipelines (Kubeflow)']
    }
  },
  'Backend Engineer': {
    'APIs': {
      'Beginner': ['HTTP Request Methods', 'HTTP Status Codes', 'RESTful API Conventions'],
      'Intermediate': ['GraphQL Schema Design', 'gRPC & Protocol Buffers', 'WebSocket Real-time Communication'],
      'Advanced': ['API Gateway Architecture', 'Token Bucket Rate Limiting', 'Idempotency Keys Implementation']
    },
    'Databases': {
      'Beginner': ['SQL CRUD Operations', 'Table Joins', 'Database Indexes (B-Tree)'],
      'Intermediate': ['ACID Transactions', 'SQL vs NoSQL tradeoffs', 'Database Replication (Primary-Replica)'],
      'Advanced': ['Database Sharding & Partitioning', 'CAP Theorem Analysis', 'Distributed Consensus (Raft/Paxos)']
    },
    'Authentication': {
      'Beginner': ['Session-based Authentication', 'Cookie security', 'Password Hashing (bcrypt/argon2)'],
      'Intermediate': ['JWT Token Authentication & Verification', 'OAuth 2.0 Flow', 'HTTPS & SSL/TLS handshake'],
      'Advanced': ['Role-Based Access Control (RBAC)', 'Zero Trust Architecture', 'OAuth Security (PKCE flow)']
    },
    'Caching': {
      'Beginner': ['In-memory local caching', 'Cache Hit vs Cache Miss'],
      'Intermediate': ['Redis Integration', 'Cache-Aside & Write-Through patterns', 'Cache Eviction Policies (LRU, LFU)'],
      'Advanced': ['Cache Invalidation at scale', 'Cache Stampede Mitigation', 'Redis Cluster Partitioning']
    },
    'Scalability': {
      'Beginner': ['Vertical vs Horizontal Scaling', 'Load Balancer Algorithms'],
      'Intermediate': ['Message Queues (RabbitMQ, Kafka)', 'Microservices Architecture', 'Database Connection Pooling'],
      'Advanced': ['Event-Driven Architectures', 'Saga Pattern for Distributed Transactions', 'Backpressure & Circuit Breakers']
    },
    'System Design': {
      'Beginner': ['Monolithic System Layout', 'Three-Tier Architecture'],
      'Intermediate': ['CDN Content Distribution', 'DNS Routing & Failover', 'Read-Heavy vs Write-Heavy systems'],
      'Advanced': ['Distributed ID Generation (Snowflake)', 'Consistent Hashing', 'Real-Time Streaming Systems']
    },
    'Cloud': {
      'Beginner': ['Virtual Machine Deploy (EC2/Droplet)', 'Static Website Hosting (S3)'],
      'Intermediate': ['Container Orchestration (Docker Compose)', 'Serverless Functions (AWS Lambda)', 'Cloud Storage Integrations'],
      'Advanced': ['Infrastructure as Code (Terraform)', 'Virtual Private Cloud (VPC) design', 'Multi-Region High Availability']
    },
    'Deployment': {
      'Beginner': ['Manual Deployment via Git Pull', 'Environment Variables Management'],
      'Intermediate': ['CI/CD Pipelines (GitHub Actions)', 'Blue-Green & Canary Deployments', 'Zero-Downtime rollouts'],
      'Advanced': ['Kubernetes deployments', 'Helm Charts configuration', 'GitOps deployment workflows (ArgoCD)']
    }
  }
};
