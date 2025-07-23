FROM ghcr.io/br3ndonland/inboard:fastapi-0.51-python3.11

# Use file.name* in case it doesn't exist in the repo
COPY ./app/ /app/
WORKDIR /app/
ENV HATCH_ENV_TYPE_VIRTUAL_PATH=.venv
RUN hatch env prune && hatch env create production && pip install --upgrade setuptools

# /start Project-specific dependencies for RAG Optimization
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libmagic1 \
    libmagic-dev \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Install RAG optimization dependencies
COPY requirements-rag.txt /app/requirements-rag.txt
RUN pip install --no-cache-dir -r requirements-rag.txt

# Install PyTorch CPU version for semantic chunking
RUN pip install --no-cache-dir torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

# Download NLTK data
RUN python -c "import nltk; nltk.download('punkt', quiet=True); nltk.download('stopwords', quiet=True); nltk.download('averaged_perceptron_tagger', quiet=True)"

# Download spaCy model (optional, with error handling)
RUN pip install spacy && python -m spacy download en_core_web_sm || echo "spaCy model download failed, will use basic processing"

WORKDIR /app/
# /end Project-specific dependencies

# For development, Jupyter remote kernel
# Using inside the container:
# jupyter lab --ip=0.0.0.0 --allow-root --NotebookApp.custom_display_url=http://127.0.0.1:8888
ARG INSTALL_JUPYTER=false
RUN bash -c "if [ $INSTALL_JUPYTER == 'true' ] ; then pip install jupyterlab ; fi"

ARG BACKEND_APP_MODULE=app.main:app
ARG BACKEND_PRE_START_PATH=/app/prestart.sh
ARG BACKEND_PROCESS_MANAGER=gunicorn
ARG BACKEND_WITH_RELOAD=false
ENV APP_MODULE=${BACKEND_APP_MODULE} PRE_START_PATH=${BACKEND_PRE_START_PATH} PROCESS_MANAGER=${BACKEND_PROCESS_MANAGER} WITH_RELOAD=${BACKEND_WITH_RELOAD}