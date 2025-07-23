#!/bin/bash

# Install RAG Optimization Dependencies
# This script installs additional packages required for enhanced chunking strategies

set -e

echo "🚀 Installing RAG Optimization Dependencies..."

# Check if we're in a virtual environment
if [[ "$VIRTUAL_ENV" == "" ]]; then
    echo "⚠️  Warning: Not in a virtual environment. Consider activating one first."
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Install core dependencies first
echo "📦 Installing core dependencies..."
pip install --upgrade pip

# Install PyTorch (CPU version by default)
echo "🔥 Installing PyTorch (CPU version)..."
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

# Install transformers and related packages
echo "🤖 Installing transformers and NLP packages..."
pip install transformers>=4.0.0
pip install sentence-transformers>=2.0.0
pip install scikit-learn>=1.0.0

# Install document processing packages
echo "📄 Installing document processing packages..."
pip install markdown>=3.0.0
pip install beautifulsoup4>=4.0.0
pip install lxml>=4.0.0
pip install python-magic>=0.4.0

# Install text analysis packages
echo "📊 Installing text analysis packages..."
pip install nltk>=3.8.0
pip install textstat>=0.7.0

# Install monitoring packages
echo "📈 Installing monitoring packages..."
pip install psutil>=5.0.0
pip install memory-profiler>=0.60.0

# Try to install chonkie (might not be available in all environments)
echo "🧩 Installing chonkie (if available)..."
pip install chonkie>=0.1.0 || echo "⚠️  chonkie not available, will use alternative chunking methods"

# Download NLTK data
echo "📚 Downloading NLTK data..."
python -c "
import nltk
try:
    nltk.download('punkt', quiet=True)
    nltk.download('stopwords', quiet=True)
    nltk.download('averaged_perceptron_tagger', quiet=True)
    print('✅ NLTK data downloaded successfully')
except Exception as e:
    print(f'⚠️  NLTK data download failed: {e}')
"

# Optional: Download spaCy model
echo "🔤 Installing spaCy English model (optional)..."
pip install spacy>=3.0.0
python -m spacy download en_core_web_sm || echo "⚠️  spaCy model download failed, will use basic processing"

echo "✅ RAG Optimization dependencies installed successfully!"
echo ""
echo "📋 Summary of installed packages:"
echo "  - PyTorch (CPU version)"
echo "  - Transformers & Sentence Transformers"
echo "  - Document processing tools"
echo "  - Text analysis libraries"
echo "  - Performance monitoring tools"
echo ""
echo "🎯 Next steps:"
echo "  1. Update your .env file with API keys"
echo "  2. Run database migrations: python migrations/run_migrations.py"
echo "  3. Test the new chunking strategies"
echo ""
echo "🔧 For GPU support, manually install:"
echo "  pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118"
