import { PlagiarismSource } from '../utils/plagiarism';

export const MOCK_CORPUS: PlagiarismSource[] = [
  {
    id: 'src-101',
    title: 'Decentralized Consensus in Modern Distributed Systems',
    author: 'Prof. Satoshi Nakamoto & Dr. Leslie Lamport',
    year: '2021',
    category: 'Computer Science & Cryptography',
    content: `Decentralized consensus algorithms ensure state machine replication across untrusted nodes without a central authority. In practical Byzantine fault tolerance mechanisms, nodes exchange cryptographically signed vote rounds to agree on total transaction order. Proof-of-Stake and Proof-of-Work represent orthogonal paradigms in civil resistance. When network latency fluctuates, synchronous assumptions degrade, prompting asynchronous consensus models that guarantee safety over liveness under partitions.`
  },
  {
    id: 'src-102',
    title: 'Attention Mechanisms and Transformer Architectures for Sequence Modeling',
    author: 'Dr. Ashish Vaswani & Dr. Noam Shazeer',
    year: '2022',
    category: 'Artificial Intelligence & NLP',
    content: `The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The Transformer relies entirely on an attention mechanism to draw global dependencies between input and output without relying on recurrence. Multi-head self-attention allows the model to jointly attend to information from different representation subspaces at different positions.`
  },
  {
    id: 'src-103',
    title: 'Zero-Knowledge Proofs and Succinct Non-Interactive Arguments of Knowledge',
    author: 'Prof. Shafi Goldwasser & Dr. Eli Ben-Sasson',
    year: '2023',
    category: 'Applied Cryptography',
    content: `Zero-knowledge proofs enable a prover to convince a verifier that a computational assertion is true without revealing any auxiliary witness data. Modern zk-SNARKs and zk-STARKs compress complex algebraic arithmetic circuits into succinct cryptographic commitments that can be verified on-chain in constant gas overhead.`
  },
  {
    id: 'src-104',
    title: 'Renewable Microgrids: Distributed Battery Storage and Grid Synchronization',
    author: 'Dr. Elena Rostova & Dr. Marcus Chen',
    year: '2023',
    category: 'Energy Systems & Smart Grids',
    content: `Distributed microgrids integrate solar photovoltaic arrays, wind micro-turbines, and lithium-iron phosphate battery storage buffers. Islanding detection protocols decouple local sub-networks during grid frequency fluctuations to prevent reverse current surges. Machine learning dispatch algorithms forecast solar irradiance profiles 24 hours ahead to balance load peaks.`
  },
  {
    id: 'src-105',
    title: 'Quantum Key Distribution and Post-Quantum Lattice Cryptography',
    author: 'Prof. Charles Bennett & Dr. Gilles Brassard',
    year: '2024',
    category: 'Quantum Computing & Security',
    content: `Quantum key distribution protocols leverage the Heisenberg uncertainty principle and quantum no-cloning theorem to transmit photon polarization states. Any eavesdropping attempt perturbs quantum states, inducing detectable bit-error rates. Post-quantum cryptographic standards rely on the hardness of learning-with-errors (LWE) across multi-dimensional Euclidean lattices.`
  }
];

export interface SampleDocumentPreset {
  id: string;
  name: string;
  description: string;
  expectedRisk: 'Clean' | 'Moderate' | 'High';
  title: string;
  author: string;
  department: string;
  text: string;
}

export const SAMPLE_DOCUMENTS: SampleDocumentPreset[] = [
  {
    id: 'preset-clean',
    name: 'Original Paper: Autonomous Drone Navigation',
    description: 'Completely unique manuscript with original phrasing and research data (< 8% similarity).',
    expectedRisk: 'Clean',
    title: 'Visual Inertial Odometry in GPS-Denied Subterranean Caves',
    author: 'David Kim',
    department: 'Robotics Institute',
    text: `Autonomous aerial drones operating inside subterranean cavern systems face extreme optical sensor degradation. Standard satellite positioning signals cannot penetrate rock layers deeper than five meters. We introduce a bio-inspired optical flow sensor array combined with dual ultra-wideband transceivers. Our experimental flight runs demonstrated stable hovering with an average positional drift of under twelve centimeters across thirty minutes of unassisted operation.`
  },
  {
    id: 'preset-moderate',
    name: 'Paraphrased Paper: NLP Attention Survey',
    description: 'Contains paraphrased citations and partial structural borrowing (~28% similarity).',
    expectedRisk: 'Moderate',
    title: 'Comparative Analysis of Sequence Modeling Architectures',
    author: 'Maya Lin',
    department: 'Artificial Intelligence Lab',
    text: `Sequence modeling has evolved significantly from classic recurrent networks. The Transformer relies entirely on an attention mechanism to draw global dependencies between input and output without relying on recurrence. Moreover, multi-head self-attention allows the model to jointly attend to information from different representation subspaces. In our benchmark, we explored training stability under low-precision floating point parameters across bilingual speech datasets.`
  },
  {
    id: 'preset-high',
    name: 'Flagged Paper: Verbatim Consensus Copy',
    description: 'Heavy verbatim copying from published consensus literature (> 65% similarity).',
    expectedRisk: 'High',
    title: 'Distributed Consensus and Ledger Safety Protocols',
    author: 'Robert Vance',
    department: 'Distributed Systems Group',
    text: `Decentralized consensus algorithms ensure state machine replication across untrusted nodes without a central authority. In practical Byzantine fault tolerance mechanisms, nodes exchange cryptographically signed vote rounds to agree on total transaction order. Proof-of-Stake and Proof-of-Work represent orthogonal paradigms in civil resistance. When network latency fluctuates, synchronous assumptions degrade, prompting asynchronous consensus models that guarantee safety over liveness under partitions.`
  }
];
