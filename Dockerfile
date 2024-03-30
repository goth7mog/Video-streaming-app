FROM node:16
# FROM opencoconut/ffmpeg

RUN apt-get update -y
RUN apt-get upgrade -y
RUN apt-get install ffmpeg -y

# Start the app
WORKDIR /usr/src/app
ENV HOST 0.0.0.0
# COPY ["package.json", "package-lock.json*", "./"]
# COPY . .
COPY package.json ./
# ENV PORT 8081
# ENV HOST 0.0.0.0

RUN npm install
RUN npm install -g nodemon
# RUN yarn install

# ENV TZ=Europe/London

# EXPOSE 8081
COPY . .


CMD [ "npm", "start" ]
# CMD [ "node", "server.js" ] 
# Making the node command a top-level process (to avoid errors when Docker shuts down)