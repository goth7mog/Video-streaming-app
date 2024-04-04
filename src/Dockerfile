FROM node:16 as debug

RUN apt-get update -y
RUN apt-get upgrade -y
RUN apt-get install ffmpeg -y

WORKDIR /usr/src/app
ENV HOST 0.0.0.0
COPY package.json ./
RUN npm install
RUN npm install -g nodemon

COPY . .
RUN chown -R node /usr/src/app
USER node

ENTRYPOINT [ "nodemon", "server.js" ]
# ENTRYPOINT [ "npm", "start" ]
# Making the node command a top-level process (to avoid errors when Docker shuts down)




FROM node:16 as prod

RUN apt-get update -y
RUN apt-get upgrade -y
RUN apt-get install ffmpeg -y

WORKDIR /usr/src/app
ENV HOST 0.0.0.0
COPY package.json ./
RUN npm install

COPY . .
RUN chown -R node /usr/src/app
USER node

CMD [ "node", "server.js" ]