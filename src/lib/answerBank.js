/**
 * Expected-answer rubrics for interview questions.
 * Matched by role + competency + question signature (normalized substring).
 */

export const ANSWER_BANK = [
  // —— AI/ML Engineer ——
  {
    id: 'ml-math-jacobian',
    role: 'AI/ML Engineer',
    competency: 'Mathematics',
    signatures: ['jacobian matrix', 'backpropagation', 'chain rule', 'shape matching'],
    expectedKeywords: [
      'jacobian', 'chain rule', 'gradient', 'partial', 'derivative', 'matrix',
      'shape', 'dimension', 'layer', 'backprop', 'multivariate',
    ],
    conceptPhrases: [
      'chain rule',
      'partial derivative',
      'matrix multiplication',
      'shape match',
      'gradient flow',
    ],
    minKeywordsForPartial: 2,
  },
  {
    id: 'ml-math-sgd-convex',
    role: 'AI/ML Engineer',
    competency: 'Mathematics',
    signatures: ['convex optimization', 'stochastic gradient descent', 'global convergence'],
    expectedKeywords: [
      'convex', 'gradient', 'descent', 'global minimum', 'local minimum',
      'learning rate', 'convergence', 'hessian', 'objective', 'sgd',
    ],
    conceptPhrases: [
      'convex function',
      'global optimum',
      'learning rate',
      'convergence',
    ],
    minKeywordsForPartial: 2,
  },
  {
    id: 'ml-stats-hypothesis',
    role: 'AI/ML Engineer',
    competency: 'Statistics',
    signatures: ['type i', 'type ii', 'hypothesis testing', 'p-value', 'significance level'],
    expectedKeywords: [
      'type i', 'type ii', 'null hypothesis', 'p-value', 'alpha', 'significance',
      'false positive', 'false negative', 'reject', 'error',
    ],
    conceptPhrases: [
      'false positive',
      'false negative',
      'reject the null',
    ],
    minKeywordsForPartial: 2,
  },
  {
    id: 'ml-stats-mle-map',
    role: 'AI/ML Engineer',
    competency: 'Statistics',
    signatures: ['maximum likelihood', 'maximum a posteriori', 'mle', 'map estimation'],
    expectedKeywords: [
      'likelihood', 'prior', 'posterior', 'bayes', 'mle', 'map', 'parameter',
      'probability', 'log-likelihood', 'estimate', 'distribution',
    ],
    conceptPhrases: [
      'maximum likelihood',
      'prior distribution',
      'posterior',
      'bayes theorem',
    ],
    minKeywordsForPartial: 2,
  },
  {
    id: 'ml-dl-layernorm',
    role: 'AI/ML Engineer',
    competency: 'Deep Learning',
    signatures: ['layer normalization', 'batch normalization', 'layernorm', 'batchnorm'],
    expectedKeywords: [
      'normalization', 'batch', 'layer', 'transformer', 'mean', 'variance',
      'mini-batch', 'sequence', 'activation', 'statistics',
    ],
    conceptPhrases: [
      'across features',
      'across batch',
      'transformer',
      'sequence length',
    ],
    minKeywordsForPartial: 2,
  },
  {
    id: 'ml-dl-attention',
    role: 'AI/ML Engineer',
    competency: 'Deep Learning',
    signatures: ['self-attention', 'scaling factor', 'square root', 'query', 'key', 'value'],
    expectedKeywords: [
      'attention', 'query', 'key', 'value', 'softmax', 'sqrt', 'scale',
      'transformer', 'dot product', 'gradient', 'dimension',
    ],
    conceptPhrases: [
      'scaled dot-product',
      'softmax',
      'query key value',
      'sqrt d_k',
    ],
    minKeywordsForPartial: 2,
  },
  {
    id: 'ml-ml-random-forest',
    role: 'AI/ML Engineer',
    competency: 'Machine Learning',
    signatures: ['random forest', 'bagging', 'feature bootstrapping', 'variance'],
    expectedKeywords: [
      'ensemble', 'bagging', 'bootstrap', 'variance', 'decision tree', 'correlation',
      'aggregate', 'vote', 'random', 'subset',
    ],
    conceptPhrases: [
      'reduce variance',
      'bootstrap sample',
      'decorrelate trees',
    ],
    minKeywordsForPartial: 2,
  },
  {
    id: 'ml-nlp-lora',
    role: 'AI/ML Engineer',
    competency: 'NLP',
    signatures: ['lora', 'parameter-efficient', 'low-rank', 'peft'],
    expectedKeywords: [
      'lora', 'low-rank', 'matrix', 'decomposition', 'fine-tun', 'adapter',
      'weight', 'trainable', 'memory', 'rank', 'peft',
    ],
    conceptPhrases: [
      'low-rank',
      'fewer parameters',
      'weight update',
    ],
    minKeywordsForPartial: 2,
  },
  {
    id: 'ml-cv-general',
    role: 'AI/ML Engineer',
    competency: 'Computer Vision',
    signatures: ['convolution', 'cnn', 'image', 'segmentation', 'detection'],
    expectedKeywords: [
      'convolution', 'filter', 'kernel', 'feature map', 'pooling', 'cnn',
      'image', 'pixel', 'architecture',
    ],
    conceptPhrases: ['feature extraction', 'spatial', 'convolutional layer'],
    minKeywordsForPartial: 2,
  },
  // —— Backend Engineer ——
  {
    id: 'be-api-rate-limit',
    role: 'Backend Engineer',
    competency: 'APIs',
    signatures: ['rate limiter', 'sliding-window', 'redis'],
    expectedKeywords: [
      'redis', 'rate limit', 'window', 'token', 'bucket', 'counter', 'ttl',
      'sorted set', 'zset', 'timestamp', 'request', 'throttle',
    ],
    conceptPhrases: [
      'sliding window',
      'token bucket',
      'sorted set',
    ],
    minKeywordsForPartial: 2,
  },
  {
    id: 'be-api-rest-grpc',
    role: 'Backend Engineer',
    competency: 'APIs',
    signatures: ['rest', 'grpc', 'protocol buffers'],
    expectedKeywords: [
      'http', 'rest', 'grpc', 'protobuf', 'binary', 'latency', 'streaming',
      'json', 'contract', 'microservice', 'idl',
    ],
    conceptPhrases: [
      'binary protocol',
      'http/2',
      'strong typing',
    ],
    minKeywordsForPartial: 2,
  },
  {
    id: 'be-db-btree',
    role: 'Backend Engineer',
    competency: 'Databases',
    signatures: ['b-tree', 'b tree', 'clustered index', 'non-clustered'],
    expectedKeywords: [
      'b-tree', 'index', 'leaf', 'node', 'seek', 'clustered', 'postgres',
      'range query', 'pointer', 'disk', 'page',
    ],
    conceptPhrases: [
      'logarithmic lookup',
      'clustered index',
      'leaf node',
    ],
    minKeywordsForPartial: 2,
  },
  {
    id: 'be-db-acid-cap',
    role: 'Backend Engineer',
    competency: 'Databases',
    signatures: ['acid', 'cap theorem', 'consistency', 'availability'],
    expectedKeywords: [
      'acid', 'atomic', 'consistent', 'isolated', 'durable', 'cap',
      'partition', 'availability', 'consistency', 'distributed',
    ],
    conceptPhrases: [
      'partition tolerance',
      'trade-off',
      'two of three',
    ],
    minKeywordsForPartial: 2,
  },
  {
    id: 'be-cache-patterns',
    role: 'Backend Engineer',
    competency: 'Caching',
    signatures: ['cache-aside', 'write-through', 'cache stampede', 'thundering herd'],
    expectedKeywords: [
      'cache', 'redis', 'invalidation', 'ttl', 'stampede', 'lock', 'mutex',
      'write-through', 'read-through', 'aside', 'expire',
    ],
    conceptPhrases: [
      'cache aside',
      'thundering herd',
      'stampede',
    ],
    minKeywordsForPartial: 2,
  },
  {
    id: 'be-scale-saga',
    role: 'Backend Engineer',
    competency: 'Scalability',
    signatures: ['saga pattern', 'two-phase commit', '2pc', 'distributed transaction'],
    expectedKeywords: [
      'saga', 'compensat', 'transaction', 'microservice', 'event', 'choreograph',
      'orchestrat', '2pc', 'rollback', 'consistency',
    ],
    conceptPhrases: [
      'compensating transaction',
      'eventual consistency',
      'saga step',
    ],
    minKeywordsForPartial: 2,
  },
];

/** Fallback rubric when no specific question match */
export const COMPETENCY_FALLBACK_RUBRICS = {
  'AI/ML Engineer': {
    Mathematics: {
      expectedKeywords: ['gradient', 'matrix', 'derivative', 'optimization', 'vector'],
      conceptPhrases: ['because', 'therefore', 'which means'],
    },
    Statistics: {
      expectedKeywords: ['probability', 'distribution', 'estimate', 'variance', 'hypothesis'],
      conceptPhrases: ['likelihood', 'sample', 'inference'],
    },
    'Machine Learning': {
      expectedKeywords: ['model', 'train', 'feature', 'loss', 'overfit', 'bias', 'variance'],
      conceptPhrases: ['ensemble', 'generalization'],
    },
    'Deep Learning': {
      expectedKeywords: ['neural', 'layer', 'weight', 'activation', 'backprop', 'tensor'],
      conceptPhrases: ['forward pass', 'gradient'],
    },
    'Computer Vision': {
      expectedKeywords: ['image', 'convolution', 'pixel', 'filter', 'cnn'],
      conceptPhrases: ['feature map'],
    },
    NLP: {
      expectedKeywords: ['token', 'embedding', 'transformer', 'attention', 'language'],
      conceptPhrases: ['sequence', 'context'],
    },
  },
  'Backend Engineer': {
    APIs: {
      expectedKeywords: ['endpoint', 'request', 'response', 'http', 'api', 'latency'],
      conceptPhrases: ['client', 'server'],
    },
    Databases: {
      expectedKeywords: ['query', 'index', 'transaction', 'sql', 'schema', 'row'],
      conceptPhrases: ['consistency', 'replication'],
    },
    Caching: {
      expectedKeywords: ['cache', 'hit', 'miss', 'redis', 'ttl', 'memory'],
      conceptPhrases: ['invalidate'],
    },
    Scalability: {
      expectedKeywords: ['scale', 'load', 'shard', 'queue', 'service', 'distributed'],
      conceptPhrases: ['horizontal', 'bottleneck'],
    },
  },
};

export function normalizeQuestionText(text = '') {
  return text
    .toLowerCase()
    .replace(/focus specifically on.*$/i, '')
    .replace(/how does this relate to safety.*$/i, '')
    .replace(/think about how this impacts gpu.*$/i, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Find best rubric for a question.
 */
export function findAnswerRubric(questionText, role, competency) {
  const normalized = normalizeQuestionText(questionText);

  let best = null;
  let bestHits = 0;

  for (const entry of ANSWER_BANK) {
    if (entry.role !== role) continue;
    if (entry.competency !== competency) continue;

    const hits = entry.signatures.filter((sig) => normalized.includes(sig.toLowerCase())).length;
    if (hits > bestHits) {
      bestHits = hits;
      best = entry;
    }
  }

  if (best && bestHits > 0) return best;

  const fallback = COMPETENCY_FALLBACK_RUBRICS[role]?.[competency];
  if (fallback) {
    return {
      id: `fallback-${role}-${competency}`,
      role,
      competency,
      signatures: [],
      ...fallback,
      minKeywordsForPartial: 2,
    };
  }

  return {
    id: 'generic',
    role,
    competency,
    signatures: [],
    expectedKeywords: [],
    conceptPhrases: [],
    minKeywordsForPartial: 2,
  };
}
