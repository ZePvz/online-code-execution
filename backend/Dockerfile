FROM ubuntu:22.04

RUN apt-get update && apt-get install -y \
    g++ \
    python3 \
    default-jdk \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN useradd -m coderunner

USER coderunner

WORKDIR /home/coderunner/app