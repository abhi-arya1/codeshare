#!/bin/bash

sudo apt-get -y update && sudo apt-get -y upgrade
sudo apt-get install certbot python3-certbot-nginx
sudo apt install -y python3-dev python3-venv python3-pip gcc nginx openssl podman-docker

# docker pull docker.io/python:latest
# docker pull docker.io/gcc:latest 
# docker pull docker.io/node:latest
# docker pull docker.io/rust:latest

python3 -m venv .venv
source venv/bin/activate
pip install --upgrade pip
pip install -r "requirements.txt"
echo "Don't forget to copy over .env and the API keys :)"


# For SSL Certificates (AWS)
# https://lcalcagni.medium.com/deploy-your-fastapi-to-aws-ec2-using-nginx-aa8aa0d85ec7#:~:text=Add%20a%20self%2Dsigned%20SSL%20certificate%20using%20OpenSSL.,Firefox)%20may%20display%20a%20warning%20like%20this:
# sudo openssl req -batch -x509 -nodes -days 365 \
# -newkey rsa:2048 \
# -keyout /etc/nginx/ssl/server.key \
# -out /etc/nginx/ssl/server.crt