# OREN - Optimized Research Engine for Novel Target Pairs

OREN is an AI-powered platform for systematic identification, ranking, and validation of molecular target combinations for multi-specific biologic drugs.

## Overview

OREN combines Graph Neural Networks (GNN), Reinforcement Learning (RL), and metabolic modeling to identify optimal drug target pairs for complex diseases. The platform focuses on:

- Target pair ranking based on therapeutic synergy
- Mechanistic explanation generation
- Biomarker prediction
- On-target adverse reaction assessment
- Validation strategy proposal

## Features

- **Target Pair Ranking**: Generate ranked lists of potential target pairs based on indication, patient population, and desired clinical phenotype
- **Mechanistic Analysis**: Provide detailed scientific rationale for target combinations
- **Biomarker Prediction**: Identify downstream biomarkers for patient selection
- **Toxicity Assessment**: Evaluate potential adverse reactions
- **Validation Planning**: Propose functional validation strategies

## Installation

```bash
# Clone the repository
git clone https://github.com/gavrielhan/AION_MVP.git
cd AION_MVP

# Create a virtual environment
conda create -n AION python=3.9 -y
conda activate AION

# Install dependencies
pip install -r requirements.txt
```

## Project Structure

```
oren/
├── data/               # Data storage and processing
├── models/            # AI models (GNN, RL)
├── analysis/          # Analysis tools
├── validation/        # Validation strategies
├── api/              # API endpoints
└── utils/            # Utility functions
```

## Usage

[Documentation to be added]

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting pull requests.
