FROM mcr.microsoft.com/devcontainers/base:0-debian-11

# Install system dependencies
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
        git \
        curl \
        bash-completion \
        zsh \
        vim \
        jq \
        unzip \
        zip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*
